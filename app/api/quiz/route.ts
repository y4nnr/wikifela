import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { resolve } from "path";

interface QuizQuestion {
  question: string;
  answer: string;
  options: string[];
  episodeId: number;
  difficulty: "facile" | "moyen" | "difficile";
}

let questionsCache: QuizQuestion[] | null = null;

function loadQuestions(): QuizQuestion[] {
  if (questionsCache) return questionsCache;
  try {
    const data = readFileSync(
      resolve(process.cwd(), "data/quiz-bank.json"),
      "utf-8"
    );
    questionsCache = JSON.parse(data);
    return questionsCache!;
  } catch {
    return [];
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const difficulty = params.get("difficulty") || "facile";
  const mode = params.get("mode") || "classique";
  const maxCount = mode === "survie" ? 100 : 10;
  const count = Math.min(parseInt(params.get("count") || "5", 10), maxCount);

  const allQuestions = loadQuestions();
  const filtered = allQuestions.filter((q) => q.difficulty === difficulty);

  if (filtered.length === 0) {
    return NextResponse.json({ questions: [] });
  }

  const selected = shuffle(filtered).slice(0, count);

  // Shuffle options with the answer for each question
  const questions = selected.map((q) => ({
    question: q.question,
    episodeId: q.episodeId,
    options: shuffle([q.answer, ...q.options]),
    correctIndex: -1, // will be set below
  }));

  // Set correctIndex after shuffle
  for (let i = 0; i < questions.length; i++) {
    questions[i].correctIndex = questions[i].options.indexOf(
      selected[i].answer
    );
  }

  return NextResponse.json({ questions });
}
