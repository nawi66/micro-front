import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import type { User } from "@pulse/types";

export interface UserAttrs {
  email: string;
  name: string;
  passwordHash: string;
  emailVerified: boolean;

  // Account lockout (§9.1). Reset on successful login.
  failedLoginAttempts: number;
  firstFailedAt?: Date | null;
  lockedUntil?: Date | null;

  // Password reset — HMAC-hashed token, single use.
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: Date | null;

  // 2FA (TOTP) — schema-ready, enforcement is a follow-up.
  totpSecret?: string | null;
  totpEnabled: boolean;
}

export interface UserMethods {
  toDTO(): User;
}

export type UserDocument = HydratedDocument<UserAttrs, UserMethods>;
type UserModelType = Model<UserAttrs, Record<string, never>, UserMethods>;

const userSchema = new Schema<UserAttrs, UserModelType, UserMethods>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, required: true, default: false },

    failedLoginAttempts: { type: Number, required: true, default: 0 },
    firstFailedAt: { type: Date, default: null },
    lockedUntil: { type: Date, default: null },

    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },

    totpSecret: { type: String, default: null },
    totpEnabled: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    strict: "throw", // unknown fields on writes throw, not silently drop
    minimize: false,
  },
);

// unique index on email is declared via `unique: true` on the field above (§9.8).

// Never res.json a raw doc — strip hashes/secrets/internal fields.
userSchema.method("toDTO", function toDTO(this: UserDocument): User {
  return {
    id: this.id,
    email: this.email,
    name: this.name,
    emailVerified: this.emailVerified,
    createdAt: this.get("createdAt").toISOString(),
    updatedAt: this.get("updatedAt").toISOString(),
  };
});

export const UserModel = model<UserAttrs, UserModelType>("User", userSchema);
