import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: {
        locations: true,
        quizQuestions: {
          select: {
            id: true,
            question: true,
            correctAnswer: true,
            wrongAnswers: true,
            difficulty: true,
          },
        },
        portraits: {
          select: {
            id: true,
            personName: true,
            imagePath: true,
            subtitle: true,
            gender: true,
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Map to the shape the admin frontend expects
    const questions = episode.quizQuestions.map((q) => ({
      question: q.question,
      answer: q.correctAnswer,
      options: q.wrongAnswers,
      difficulty: q.difficulty,
    }));

    const portraits = episode.portraits.map((p) => ({
      id: p.id,
      name: p.personName,
      file: p.imagePath,
      subtitle: p.subtitle,
      gender: p.gender,
    }));

    // Find prev/next episodes
    const [prev, next] = await Promise.all([
      prisma.episode.findFirst({
        where: { id: { lt: id } },
        orderBy: { id: "desc" },
        select: { id: true, title: true },
      }),
      prisma.episode.findFirst({
        where: { id: { gt: id } },
        orderBy: { id: "asc" },
        select: { id: true, title: true },
      }),
    ]);

    return NextResponse.json({
      episode: {
        ...episode,
        searchVector: undefined,
        quizQuestions: undefined,
        portraits: undefined,
      },
      questions,
      portraits,
      prev,
      next,
    });
  } catch (err) {
    console.error("Admin episode error:", err);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    );
  }
}
