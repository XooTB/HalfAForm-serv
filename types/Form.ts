import { z } from "zod";

const FormAnswersSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  questionType: z.enum(["short", "paragraph", "multipleChoice"]),
  answer: z.union([z.string(), z.array(z.string())]),
});

const FormSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  templateId: z.string(),
  answers: z.array(FormAnswersSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

type FormAnswers = z.infer<typeof FormAnswersSchema>;
type Form = z.infer<typeof FormSchema>;

export type { FormAnswers, Form };
export { FormSchema, FormAnswersSchema };
