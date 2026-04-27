import { z } from "zod";

export const QuestionSchema = z
  .object({
    question: z.string().trim().min(1, "La question est requise"),
    correctAnswer: z.string().trim().min(1, "La bonne reponse est requise"),
    wrongAnswers: z
      .array(z.string().trim().min(1, "Mauvaise reponse vide"))
      .length(3, "Exactement 3 mauvaises reponses requises"),
    difficulty: z.enum(["facile", "moyen", "difficile"]),
    episodeId: z.number().int().nullable(),
    category: z.string().trim().nullable().optional(),
  })
  .refine(
    (d) => new Set(d.wrongAnswers).size === d.wrongAnswers.length,
    { message: "Les mauvaises reponses doivent etre distinctes", path: ["wrongAnswers"] }
  )
  .refine(
    (d) => !d.wrongAnswers.includes(d.correctAnswer),
    { message: "La bonne reponse ne peut pas figurer dans les mauvaises", path: ["correctAnswer"] }
  );

export type QuestionInput = z.infer<typeof QuestionSchema>;

export const PortraitSchema = z.object({
  episodeId: z.number().int(),
  personName: z.string().trim().min(1, "Le nom est requis"),
  subtitle: z.string().trim().nullable().optional(),
  gender: z.enum(["M", "F"]),
  isPrimary: z.boolean().optional().default(false),
  imagePath: z
    .string()
    .trim()
    .min(1, "Le fichier est requis")
    .regex(
      /^[a-zA-Z0-9_.-]+\.(jpg|jpeg|png)$/i,
      "Nom de fichier invalide (ex: 120.jpg, 55_jl.jpg)"
    ),
});

export type PortraitInput = z.infer<typeof PortraitSchema>;

export const TakedownSchema = z.object({
  reason: z.string().trim().nullable().optional(),
});
