import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import type { AuthTokenResponse, User } from "@pulse/types";
import { loadEnv } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { hashPassword, verifyPassword } from "../../lib/hash.js";
import { signAccessToken } from "../../lib/jwt.js";
import { generateOpaqueToken, hashToken } from "../../lib/crypto.js";
import { ConflictError, UnauthorizedError } from "../../lib/errors.js";
import { UserModel, type UserDocument } from "./user.model.js";
import { RefreshTokenModel } from "./refresh-token.model.js";

const LOCK_THRESHOLD = 10; // failed attempts...
const LOCK_WINDOW_MS = 15 * 60 * 1000; // ...within 15 min...
const LOCK_DURATION_MS = 15 * 60 * 1000; // ...→ 15 min lock

/**
 * A constant Argon2id hash of a random string, used to equalize verification
 * timing when the email doesn't exist — defeats user-enumeration via timing.
 */
let dummyHashPromise: Promise<string> | null = null;
function dummyHash(): Promise<string> {
  return (dummyHashPromise ??= hashPassword(randomUUID()));
}

export interface IssuedTokens extends AuthTokenResponse {
  /** Raw opaque refresh token — set as an httpOnly cookie by the controller. */
  refreshToken: string;
  refreshTokenTtlMs: number;
}

function refreshTtlMs(): number {
  return loadEnv().REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
}

/** Mint a new refresh token in a family and persist its hash. */
async function issueRefreshToken(
  userId: mongoose.Types.ObjectId,
  familyId: string,
  session?: mongoose.ClientSession,
): Promise<{ raw: string; ttlMs: number }> {
  const raw = generateOpaqueToken(32);
  const ttlMs = refreshTtlMs();
  await RefreshTokenModel.create(
    [
      {
        tokenHash: hashToken(raw),
        userId,
        familyId,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    ],
    session ? { session } : {},
  );
  return { raw, ttlMs };
}

function issueForUser(user: UserDocument): { accessToken: string; expiresIn: number; user: User } {
  const { token, expiresIn } = signAccessToken({ sub: user.id, email: user.email });
  return { accessToken: token, expiresIn, user: user.toDTO() };
}

export const authService = {
  /** Create an account. Fails generically on duplicate email. */
  async register(input: { email: string; password: string; name: string }): Promise<User> {
    const existing = await UserModel.findOne({ email: input.email }).lean();
    if (existing) {
      // Same shape as success would use downstream; do not leak which field clashed.
      throw new ConflictError("Email already registered");
    }
    const passwordHash = await hashPassword(input.password);
    const user = await UserModel.create({
      email: input.email,
      name: input.name,
      passwordHash,
      emailVerified: loadEnv().NODE_ENV !== "production", // auto-verify outside prod
    });
    logger.info({ event: "user_registered", userId: user.id }, "user registered");
    return user.toDTO();
  },

  /**
   * Verify credentials and issue tokens. The response is generic for both
   * bad-credentials and locked-account states — the lock is never revealed.
   */
  async login(input: { email: string; password: string }): Promise<IssuedTokens> {
    const invalid = new UnauthorizedError("Invalid email or password");
    const user = await UserModel.findOne({ email: input.email });

    if (!user) {
      await verifyPassword(await dummyHash(), input.password); // equalize timing
      logger.info({ event: "login_failed", reason: "no_user" }, "login failed");
      throw invalid;
    }

    const now = Date.now();
    const locked = user.lockedUntil && user.lockedUntil.getTime() > now;
    if (locked) {
      logger.info({ event: "login_failed", reason: "locked", userId: user.id }, "login failed");
      throw invalid; // generic — never reveal the lock
    }

    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) {
      await this.registerFailedAttempt(user);
      logger.info({ event: "login_failed", reason: "bad_password", userId: user.id }, "login failed");
      throw invalid;
    }

    if (loadEnv().NODE_ENV === "production" && !user.emailVerified) {
      logger.info({ event: "login_failed", reason: "unverified", userId: user.id }, "login failed");
      throw new UnauthorizedError("Email not verified");
    }

    // Success — clear lockout state and open a fresh session family.
    user.failedLoginAttempts = 0;
    user.firstFailedAt = null;
    user.lockedUntil = null;
    await user.save();

    const familyId = randomUUID();
    const { raw, ttlMs } = await issueRefreshToken(user._id, familyId);
    logger.info({ event: "login_success", userId: user.id }, "login success");

    return { ...issueForUser(user), refreshToken: raw, refreshTokenTtlMs: ttlMs };
  },

  /** Track a failed login; lock the account past the threshold within the window. */
  async registerFailedAttempt(user: UserDocument): Promise<void> {
    const now = Date.now();
    const windowStart = user.firstFailedAt?.getTime() ?? 0;
    if (!user.firstFailedAt || now - windowStart > LOCK_WINDOW_MS) {
      user.firstFailedAt = new Date(now);
      user.failedLoginAttempts = 1;
    } else {
      user.failedLoginAttempts += 1;
    }
    if (user.failedLoginAttempts >= LOCK_THRESHOLD) {
      user.lockedUntil = new Date(now + LOCK_DURATION_MS);
    }
    await user.save();
  },

  /**
   * Rotate a refresh token. Reuse of an already-revoked token means it was
   * stolen and replayed after rotation → the whole family is revoked (§9.1).
   */
  async refresh(rawToken: string): Promise<IssuedTokens> {
    const invalid = new UnauthorizedError("Invalid refresh token");
    const tokenHash = hashToken(rawToken);
    const current = await RefreshTokenModel.findOne({ tokenHash });

    if (!current) throw invalid;

    if (current.revokedAt) {
      // Reuse detected — kill every session in the family.
      await RefreshTokenModel.updateMany(
        { familyId: current.familyId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      logger.warn(
        { event: "refresh_reuse_detected", userId: current.userId.toString(), familyId: current.familyId },
        "refresh token reuse detected — family revoked",
      );
      throw invalid;
    }

    if (current.expiresAt.getTime() <= Date.now()) throw invalid;

    const user = await UserModel.findById(current.userId);
    if (!user) throw invalid;

    const session = await mongoose.startSession();
    try {
      let raw = "";
      let ttlMs = 0;
      await session.withTransaction(async () => {
        const issued = await issueRefreshToken(user._id, current.familyId, session);
        raw = issued.raw;
        ttlMs = issued.ttlMs;
        current.revokedAt = new Date();
        current.replacedByHash = hashToken(raw);
        await current.save({ session });
      });
      logger.info({ event: "refresh_rotated", userId: user.id }, "refresh rotated");
      return { ...issueForUser(user), refreshToken: raw, refreshTokenTtlMs: ttlMs };
    } finally {
      await session.endSession();
    }
  },

  /** Fetch the current user's DTO for GET /auth/me. */
  async getUserById(id: string): Promise<User> {
    const user = await UserModel.findById(id);
    if (!user) throw new UnauthorizedError();
    return user.toDTO();
  },

  /** Resolve a user DTO by email. Other modules use this instead of the model. */
  async findUserByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? user.toDTO() : null;
  },

  /** Resolve many user DTOs by id. Other modules use this instead of the model. */
  async findUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    // ids are server-derived (from memberships); mark the operator trusted so
    // sanitizeFilter does not rewrite $in into $eq (see workspaces.service).
    const users = await UserModel.find({ _id: mongoose.trusted({ $in: objectIds }) });
    return users.map((u) => u.toDTO());
  },

  /** Update the current user's mutable profile fields. */
  async updateProfile(userId: string, input: { name?: string }): Promise<User> {
    const user = await UserModel.findById(userId);
    if (!user) throw new UnauthorizedError();
    if (input.name !== undefined) user.name = input.name;
    await user.save();
    logger.info({ event: "profile_updated", userId }, "profile updated");
    return user.toDTO();
  },

  /**
   * Change the current user's password. Requires the current password. On
   * success every active session is revoked (§9.1) — the user re-authenticates.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) throw new UnauthorizedError();

    const ok = await verifyPassword(user.passwordHash, currentPassword);
    if (!ok) throw new UnauthorizedError("Current password is incorrect");

    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    await this.revokeAllSessions(userId);
    logger.info({ event: "password_changed", userId }, "password changed");
  },

  /** Revoke every non-revoked refresh token for a user (all devices). */
  async revokeAllSessions(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  },

  /** Revoke the presented refresh token (idempotent). */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await RefreshTokenModel.updateOne(
      { tokenHash: hashToken(rawToken), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  },
};
