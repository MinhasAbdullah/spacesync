import { z } from "zod";

import { paginationSchema, uuidSchema } from "@/schemas/common.schema";

export const notificationListQuerySchema = paginationSchema.extend({
  booking_id: uuidSchema.optional(),
  type: z.string().trim().min(1).max(120).optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
