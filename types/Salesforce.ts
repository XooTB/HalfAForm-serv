import { z } from "zod";

export const duplicateRuleSchema = z
  .object({
    duplicateRule: z.string(),
    duplicateRuleEntityType: z.string(),
    matchResults: z.array(
      z.object({
        entityType: z.string(),
        matchRecords: z.array(
          z.object({
            record: z.any(),
          })
        ),
      })
    ),
  })
  .optional();

export const contactSchema = z.object({
  AccountId: z.string(),
  FirstName: z.string(),
  LastName: z.string(),
  Title: z.string().optional(),
  Email: z.string(),
  Phone: z.string().optional(),
  MobilePhone: z.string().optional(),
  Description: z.string().optional(),
  DuplicateRule: duplicateRuleSchema,
});

export const accountSchema = z.object({
  Name: z.string(),
  Description: z.string().optional(),
  Site: z.string().optional(),
  Phone: z.string().optional(),
  Website: z.string().optional(),
  Type: z
    .enum([
      "Customer - Direct",
      "Prospect",
      "Competitor",
      "Customer - Channel",
      "Technology Partner",
      "Other",
    ])
    .optional(),
});

export type Contact = z.infer<typeof contactSchema>;
export type Account = z.infer<typeof accountSchema>;
