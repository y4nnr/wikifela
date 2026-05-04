import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Difficulty } from "@prisma/client";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseExclude(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("mode") || "classique";
  const difficultyParam = params.get("difficulty");
  const maxCount = mode === "survie" ? 100 : 10;
  const count = Math.min(parseInt(params.get("count") || "5", 10), maxCount);
  const exclude = parseExclude(params.get("exclude"));

  const baseWhere =
    mode === "survie"
      ? {}
      : difficultyParam && ["facile", "moyen", "difficile"].includes(difficultyParam)
        ? { difficulty: difficultyParam as Difficulty }
        : null;

  if (baseWhere === null) {
    return NextResponse.json({ questions: [] });
  }

  const where = exclude.length > 0
    ? { ...baseWhere, id: { notIn: exclude } }
    : baseWhere;

  try {
    const allQuestions = await prisma.quizQuestion.findMany({
      where,
      select: {
        id: true,
        question: true,
        correctAnswer: true,
        wrongAnswers: true,
        episodeId: true,
      },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    const selected = shuffle(allQuestions).slice(0, count);

    const questions = selected.map((q) => {
      const options = shuffle([q.correctAnswer, ...q.wrongAnswers]);
      return {
        id: q.id,
        question: q.question,
        episodeId: q.episodeId,
        options,
        correctIndex: options.indexOf(q.correctAnswer),
      };
    });

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("Quiz API error:", err);
    return NextResponse.json({ questions: [] }, { status: 500 });
  }
}
