import { z } from "zod";

const TemplateBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["short", "paragraph", "multipleChoice"]),
  question: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
  optionsType: z.enum(["checkbox", "radio", "dropdown"]).optional(),
  options: z.array(z.string()).optional(),
});

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().optional(),
  description: z.string(),
  blocks: z.array(TemplateBlockSchema),
  authorId: z.string(),
  admins: z.array(z.string()),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const TemplateUpdateSchema = TemplateSchema.partial();

interface Template {
  id: string;
  name: string;
  image?: string;
  status: "draft" | "published" | "restricted";
  description: string;
  blocks: TemplateBlock[];
  authorId: string;
  admins: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateBlock {
  id: string;
  type: "short" | "paragraph" | "multipleChoice";
  question: string;
  required: boolean;
  description?: string;
  optionsType?: "checkbox" | "radio" | "dropdown";
  options?: string[];
}

export type UpdateTemplate = z.infer<typeof TemplateUpdateSchema>;
export type { Template, TemplateBlock };
export { TemplateSchema, TemplateBlockSchema, TemplateUpdateSchema };
