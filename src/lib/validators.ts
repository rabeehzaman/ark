import { z } from "zod";

export const partySchema = z.object({
  name: z.string().min(1, "Party name is required").max(100),
  isActive: z.boolean().default(true),
});

export const chequeSchema = z.object({
  date: z.string().nullable().optional(),
  chequeNumber: z.string().min(1, "Cheque number is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a positive number"
  ),
  status: z.enum(["PENDING", "CLEARED", "BOUNCED"]).default("PENDING"),
  remarks: z.string().nullable().optional(),
  partyId: z.string().min(1, "Party is required"),
});

export type PartyFormData = z.infer<typeof partySchema>;
export type ChequeFormData = z.infer<typeof chequeSchema>;
