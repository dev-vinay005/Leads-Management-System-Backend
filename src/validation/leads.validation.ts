import { z } from "zod";

export const leadInfoSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),

  lastName: z
    .string()
    .trim()
    .max(50, "Last name cannot exceed 50 characters")
    .optional(),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(10, "Phone number cannot exceed 10 digits"),

  email: z.string().trim().email("Invalid email address").optional(),
  address: z.string().trim().optional(),
  company: z
    .string()
    .trim()
    .max(100, "Company name cannot exceed 100 characters")
    .optional(),
});

export const createLeadSchema = z.object({
  leadInfo: leadInfoSchema,

  statusId: z.string().trim().min(1, "Status is required"),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional(),
});

export const updateLeadSchema = z
  .object({
    leadInfo: leadInfoSchema.partial().optional(),

    statusId: z.string().trim().min(1).optional(),

    notes: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) =>
      data.leadInfo !== undefined ||
      data.statusId !== undefined ||
      data.notes !== undefined,
    {
      message: "At least one field is required to update the lead.",
    },
  );

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
