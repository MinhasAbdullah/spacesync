import { z } from "zod";

import {
  nullableUrlSchema,
  optionalBooleanQuerySchema,
  paginationSchema,
  uuidSchema,
} from "@/schemas/common.schema";

export const resourceTypeSchema = z.enum([
  "room",
  "desk",
  "equipment",
  "vehicle",
  "court",
  "other",
]);

export const createResourceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: resourceTypeSchema.default("room"),
  location: z.string().trim().max(240).nullable().optional(),
  capacity: z.number().int().min(1).max(100_000).nullable().optional(),
  photo_url: nullableUrlSchema.optional(),
  amenities: z
    .array(z.string().trim().min(1).max(80))
    .max(100)
    .default([]),
  requires_approval: z.boolean().default(false),
  buffer_minutes: z.number().int().min(0).max(1_440).default(0),
  access_group_id: uuidSchema.nullable().optional(),
  is_active: z.boolean().default(true),
});

export const updateResourceSchema = createResourceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const resourceListQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  type: resourceTypeSchema.optional(),
  location: z.string().trim().max(240).optional(),
  is_active: optionalBooleanQuerySchema,
  access_group_id: uuidSchema.optional(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
