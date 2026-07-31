import { z } from "zod";

import { paginationSchema } from "@/schemas/common.schema";

export const appRoleSchema = z.enum([
  "super_admin",
  "space_admin",
  "member",
]);

export const updateMyProfileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120).nullable().optional(),
    avatar_url: z
      .preprocess(
        (value) => (value === "" ? null : value),
        z.string().url().max(2048).nullable(),
      )
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const updateProfileRoleSchema = z.object({
  role: appRoleSchema,
});

export const profileListQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  role: appRoleSchema.optional(),
});

export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;
export type UpdateProfileRoleInput = z.infer<typeof updateProfileRoleSchema>;
