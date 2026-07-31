import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const memberParamSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const optionalBooleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true, message: "Use an ISO timestamp with a timezone." });

export const nullableUrlSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().url().max(2048).nullable(),
);
