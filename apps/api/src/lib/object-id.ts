import { isValidObjectId } from "mongoose";
import { z } from "zod";

/** Zod schema for a path/body param that must be a valid Mongo ObjectId string. */
export const objectIdString = z
  .string()
  .refine((v) => isValidObjectId(v), { message: "Invalid id" });
