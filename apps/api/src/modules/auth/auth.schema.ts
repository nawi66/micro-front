import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(200);

export const registerSchema = z
  .object({
    email,
    password,
    name: z.string().trim().min(1).max(120),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1).max(200),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
