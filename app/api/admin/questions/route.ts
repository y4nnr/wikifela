import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";
import { QuestionSchema } from "@/lib/admin-validators";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

  try {
    const allQuestions = await prisma.quizQuestion.findMany({
      include: {
        episode: {
          select: { id: true, title: true, season: true, episode: true },
        },
      },
      orderBy: { id: "asc" },
    });

    const seasons = [
      ...new Set(
        allQuestions
          .map((q) => q.episode?.season)
          .filter((s): s is number => s != null)
      ),
    ].sort((a, b) => a - b);

    const questions = allQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.correctAnswer,
      options: q.wrongAnswers,
      difficulty: q.difficulty,
      episodeId: q.episodeId,
      episodeTitle: q.episode?.title || null,
      season: q.episode?.season || null,
      episode: q.episode?.episode || null,
      category: q.category,
    }));

    return NextResponse.json({ questions, seasons });
  } catch (err) {
    console.error("Admin questions error:", err);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = QuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Validation echouee", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.episodeId != null) {
    const ep = await prisma.episode.findUnique({ where: { id: data.episodeId }, select: { id: true } });
    if (!ep) {
      return NextResponse.json({ ok: false, error: "Episode introuvable" }, { status: 400 });
    }
  }

  try {
    const created = await prisma.quizQuestion.create({
      data: {
        question: data.question,
        correctAnswer: data.correctAnswer,
        wrongAnswers: data.wrongAnswers,
        difficulty: data.difficulty,
        episodeId: data.episodeId,
        category: data.category || null,
      },
    });
    return NextResponse.json({ ok: true, data: created });
  } catch (err) {
    console.error("Create question error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
