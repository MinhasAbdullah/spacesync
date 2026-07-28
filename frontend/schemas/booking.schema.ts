import { z } from "zod";

import {
  isoDateTimeSchema,
  optionalBooleanQuerySchema,
  paginationSchema,
  uuidSchema,
} from "@/schemas/common.schema";

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "denied",
  "no_show",
]);

const bookingObjectSchema = z.object({
  resource_id: uuidSchema,
  title: z.string().trim().min(2).max(200),
  attendee_count: z.number().int().min(1).max(100_000).default(1),
  notes: z.string().trim().max(5_000).nullable().optional(),
  start_time: isoDateTimeSchema,
  end_time: isoDateTimeSchema,
  rrule: z.string().trim().max(2_000).nullable().optional(),
});

function validateBookingTimes(
  value: { start_time: string; end_time: string },
  context: z.RefinementCtx,
) {
  const start = new Date(value.start_time);
  const end = new Date(value.end_time);

  if (end <= start) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["end_time"],
      message: "End time must be after start time.",
    });
  }

  const maximumDurationMs = 14 * 24 * 60 * 60 * 1_000;
  if (end.getTime() - start.getTime() > maximumDurationMs) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["end_time"],
      message: "A single booking cannot be longer than 14 days.",
    });
  }
}

export const createBookingSchema =
  bookingObjectSchema.superRefine(validateBookingTimes);

export const createRecurringBookingSchema = bookingObjectSchema
  .omit({ rrule: true })
  .extend({
    rrule: z.string().trim().min(5).max(2_000),
    max_occurrences: z.number().int().min(1).max(100).default(50),
    horizon_days: z.number().int().min(1).max(366).default(365),
  })
  .superRefine(validateBookingTimes);

export const updateBookingSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    attendee_count: z.number().int().min(1).max(100_000).optional(),
    notes: z.string().trim().max(5_000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const bookingListQuerySchema = paginationSchema
  .extend({
    resource_id: uuidSchema.optional(),
    status: bookingStatusSchema.optional(),
    mine: optionalBooleanQuerySchema,
    from: isoDateTimeSchema.optional(),
    to: isoDateTimeSchema.optional(),
    series_id: uuidSchema.optional(),
  })
  .superRefine((value, context) => {
    if ((value.from && !value.to) || (!value.from && value.to)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "Provide both from and to, or omit both.",
      });
    }

    if (value.from && value.to && new Date(value.to) <= new Date(value.from)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "To must be after from.",
      });
    }
  });

export const availabilityQuerySchema = z
  .object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    duration_minutes: z.coerce.number().int().min(5).max(14 * 24 * 60),
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

export const reviewBookingSchema = z.object({
  reason: z.string().trim().max(1_000).nullable().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateRecurringBookingInput = z.infer<
  typeof createRecurringBookingSchema
>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
