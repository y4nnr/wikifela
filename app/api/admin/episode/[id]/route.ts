import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFileSync } from "fs";
import { resolve } from "path";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
  const expected = process.env.ADMIN_CREDENTIALS || "admin:admin";
  return decoded === expected;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      },
    });

    if (!episode) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Load quiz questions for this episode
    const quizBank: { question: string; answer: string; options: string[]; episodeId: number; difficulty: string }[] =
      JSON.parse(readFileSync(resolve(process.cwd(), "data/quiz-bank.json"), "utf-8"));
    const questions = quizBank.filter((q) => q.episodeId === id);

    // Load portraits for this episode
    const allPortraits: { id: number; name: string; file: string; subtitle: string; season: number; episode: number; gender: string }[] =
      JSON.parse(readFileSync(resolve(process.cwd(), "data/portraits.json"), "utf-8"));
    const portraits = allPortraits.filter((p) => p.id === id);

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
