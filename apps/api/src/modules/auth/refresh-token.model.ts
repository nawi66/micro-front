import { Schema, model, type HydratedDocument, type Model } from "mongoose";

export interface RefreshTokenAttrs {
  /** HMAC-SHA256(token, pepper). The plaintext token is never stored. */
  tokenHash: string;
  userId: Schema.Types.ObjectId;
  /** Session family — all tokens minted from one login share a familyId. */
  familyId: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  /** Set when this token was rotated; points at its replacement (audit trail). */
  replacedByHash?: string | null;
}

export type RefreshTokenDocument = HydratedDocument<RefreshTokenAttrs>;
type RefreshTokenModelType = Model<RefreshTokenAttrs>;

const refreshTokenSchema = new Schema<RefreshTokenAttrs, RefreshTokenModelType>(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
  },
  { timestamps: true, strict: "throw" },
);

// tokenHash uniqueness is declared via `unique: true` on the field above.
// TTL index — expired tokens self-delete (§9.8).
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<RefreshTokenAttrs, RefreshTokenModelType>(
  "RefreshToken",
  refreshTokenSchema,
  "refresh_tokens",
);
