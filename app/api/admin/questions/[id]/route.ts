import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";
import { QuestionSchema } from "@/lib/admin-validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID invalide" }, { status: 400 });
  }

  try {
    const q = await prisma.quizQuestion.findUnique({
      where: { id },
      include: {
        episode: { select: { id: true, title: true, season: true, episode: true } },
      },
    });
    if (!q) {
      return NextResponse.json({ ok: false, error: "Question introuvable" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: q });
  } catch (err) {
    console.error("Get question error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID invalide" }, { status: 400 });
  }

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
    const updated = await prisma.quizQuestion.update({
      where: { id },
      data: {
        question: data.question,
        correctAnswer: data.correctAnswer,
        wrongAnswers: data.wrongAnswers,
        difficulty: data.difficulty,
        episodeId: data.episodeId,
        category: data.category || null,
      },
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("Update question error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID invalide" }, { status: 400 });
  }

  try {
    await prisma.quizQuestion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete question error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
