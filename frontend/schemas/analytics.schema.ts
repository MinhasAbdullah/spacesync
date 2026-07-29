import { z } from "zod";

import { isoDateTimeSchema } from "@/schemas/common.schema";

export const analyticsQuerySchema = z
  .object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
  })
  .superRefine((value, context) => {
    if (new Date(value.to) <= new Date(value.from)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "To must be after from.",
      });
    }
  });
