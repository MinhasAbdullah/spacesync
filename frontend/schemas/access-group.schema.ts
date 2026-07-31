import { z } from "zod";

import { paginationSchema, uuidSchema } from "@/schemas/common.schema";

export const createAccessGroupSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const updateAccessGroupSchema = createAccessGroupSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Provide at least one field to update." },
);

export const addAccessGroupMemberSchema = z.object({
  user_id: uuidSchema,
});

export const accessGroupListQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
});

export type CreateAccessGroupInput = z.infer<typeof createAccessGroupSchema>;
export type UpdateAccessGroupInput = z.infer<typeof updateAccessGroupSchema>;
