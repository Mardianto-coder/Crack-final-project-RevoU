import { z } from "zod";

export const courseMetaSchema = z.object({
  slug: z.string().min(3),
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  level: z.enum(["BEGINNER","INTERMEDIATE","ADVANCED"]),
  durationMins: z.number().int().positive()
});

export const lessonSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(1),
  resources: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
  order: z.number().int().nonnegative().default(0)
});

export const quizSchema = z.object({
  title: z.string().min(2),
  questions: z.array(z.object({
    id: z.string(),
    prompt: z.string().min(2),
    choices: z.array(z.string()).min(2),
    answerIndex: z.number().int().nonnegative()
  }))
});
