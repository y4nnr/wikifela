import { PrismaClient, Difficulty, Gender } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

const VALID_DIFFICULTIES = new Set(["facile", "moyen", "difficile"]);
const VALID_GENDERS = new Set(["M", "F"]);

interface JsonQuiz {
  question: string;
  answer: string;
  options: string[];
  episodeId: number | null;
  difficulty: string;
}

interface JsonPortrait {
  id: number;
  name: string;
  file: string;
  subtitle: string;
  season: number;
  episode: number;
  gender: string;
}

async function main() {
  const force = process.argv.includes("--force");
  const start = Date.now();

  // Check idempotency
  const existingQuiz = await prisma.quizQuestion.count();
  const existingPortraits = await prisma.portrait.count();

  if ((existingQuiz > 0 || existingPortraits > 0) && !force) {
    console.error(
      `Tables already have data (${existingQuiz} questions, ${existingPortraits} portraits). Use --force to truncate and re-import.`
    );
    process.exit(1);
  }

  // Load JSON files
  const quizBank: JsonQuiz[] = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/quiz-bank.json"), "utf-8")
  );
  const portraits: JsonPortrait[] = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/portraits.json"), "utf-8")
  );

  console.log(`Read ${quizBank.length} quiz questions from JSON`);
  console.log(`Read ${portraits.length} portraits from JSON`);

  // Get all valid episode IDs
  const episodes = await prisma.episode.findMany({ select: { id: true } });
  const validEpisodeIds = new Set(episodes.map((e) => e.id));

  // Validate quiz questions
  const missingQuizEpIds = new Set<number>();
  for (let i = 0; i < quizBank.length; i++) {
    const q = quizBank[i];
    if (!q.question || typeof q.question !== "string") {
      throw new Error(`Quiz[${i}]: missing or invalid question`);
    }
    if (!q.answer || typeof q.answer !== "string") {
      throw new Error(`Quiz[${i}]: missing or invalid answer`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 3) {
      throw new Error(`Quiz[${i}]: options must be array of 3, got ${q.options?.length}`);
    }
    if (!VALID_DIFFICULTIES.has(q.difficulty)) {
      throw new Error(`Quiz[${i}]: invalid difficulty "${q.difficulty}"`);
    }
    if (q.episodeId != null && !validEpisodeIds.has(q.episodeId)) {
      missingQuizEpIds.add(q.episodeId);
    }
  }

  if (missingQuizEpIds.size > 0) {
    throw new Error(
      `Quiz references non-existent episode IDs: ${[...missingQuizEpIds].join(", ")}`
    );
  }

  // Validate portraits
  const missingPortraitEpIds = new Set<number>();
  for (let i = 0; i < portraits.length; i++) {
    const p = portraits[i];
    if (typeof p.id !== "number") {
      throw new Error(`Portrait[${i}]: missing or invalid id`);
    }
    if (!p.name || typeof p.name !== "string") {
      throw new Error(`Portrait[${i}]: missing or invalid name`);
    }
    if (!p.file || typeof p.file !== "string") {
      throw new Error(`Portrait[${i}]: missing or invalid file`);
    }
    if (!VALID_GENDERS.has(p.gender)) {
      throw new Error(`Portrait[${i}]: invalid gender "${p.gender}"`);
    }
    if (!validEpisodeIds.has(p.id)) {
      missingPortraitEpIds.add(p.id);
    }
  }

  if (missingPortraitEpIds.size > 0) {
    throw new Error(
      `Portraits reference non-existent episode IDs: ${[...missingPortraitEpIds].join(", ")}`
    );
  }

  // Determine isPrimary for portraits: first portrait per episode is primary
  const seenEpisodes = new Set<number>();
  const portraitPrimary = portraits.map((p) => {
    const isPrimary = !seenEpisodes.has(p.id);
    seenEpisodes.add(p.id);
    return isPrimary;
  });

  // Run in transaction
  await prisma.$transaction(async (tx) => {
    if (force) {
      await tx.quizQuestion.deleteMany();
      await tx.portrait.deleteMany();
      console.log("Truncated existing data (--force)");
    }

    // Insert quiz questions
    const quizData = quizBank.map((q) => ({
      episodeId: q.episodeId,
      difficulty: q.difficulty as Difficulty,
      question: q.question,
      correctAnswer: q.answer,
      wrongAnswers: q.options,
      category: q.episodeId == null ? "general" : null,
    }));

    const quizResult = await tx.quizQuestion.createMany({ data: quizData });
    console.log(`Inserted ${quizResult.count} quiz questions`);

    // Insert portraits
    const portraitData = portraits.map((p, i) => ({
      episodeId: p.id,
      imagePath: p.file,
      personName: p.name,
      subtitle: p.subtitle || null,
      gender: p.gender as Gender,
      isPrimary: portraitPrimary[i],
    }));

    const portraitResult = await tx.portrait.createMany({ data: portraitData });
    console.log(`Inserted ${portraitResult.count} portraits`);
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\nMigration completed in ${duration}s`);
}

main()
  .catch((err) => {
    console.error("MIGRATION FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
