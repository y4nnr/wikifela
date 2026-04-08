import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_GAMES = ["quiz", "tapissage"] as const;
const VALID_DIFFICULTIES = ["facile", "moyen", "difficile"] as const;
const TOP_N = 5;

type Game = (typeof VALID_GAMES)[number];
type Difficulty = (typeof VALID_DIFFICULTIES)[number];

function isValidGame(v: string): v is Game {
  return (VALID_GAMES as readonly string[]).includes(v);
}

function isValidDifficulty(v: string): v is Difficulty {
  return (VALID_DIFFICULTIES as readonly string[]).includes(v);
}

async function getTop(game: string, difficulty: string | null) {
  return prisma.leaderboardEntry.findMany({
    where: { game, difficulty },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: TOP_N,
    select: { id: true, nickname: true, score: true, createdAt: true },
  });
}

export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get("game");
  const difficulty = req.nextUrl.searchParams.get("difficulty") || null;

  if (!game || !isValidGame(game)) {
    return NextResponse.json({ error: "Paramètre 'game' invalide" }, { status: 400 });
  }
  if (game === "quiz" && (!difficulty || !isValidDifficulty(difficulty))) {
    return NextResponse.json({ error: "Paramètre 'difficulty' requis pour le quiz" }, { status: 400 });
  }

  const entries = await getTop(game, game === "quiz" ? difficulty : null);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  let body: { game?: string; difficulty?: string; nickname?: string; score?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const { game, difficulty, nickname, score } = body;

  if (!game || !isValidGame(game)) {
    return NextResponse.json({ error: "Paramètre 'game' invalide" }, { status: 400 });
  }
  if (game === "quiz" && (!difficulty || !isValidDifficulty(difficulty))) {
    return NextResponse.json({ error: "Paramètre 'difficulty' requis pour le quiz" }, { status: 400 });
  }
  if (!nickname || typeof nickname !== "string" || nickname.trim().length === 0 || nickname.trim().length > 20) {
    return NextResponse.json({ error: "Pseudo invalide (1-20 caractères)" }, { status: 400 });
  }
  if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
    return NextResponse.json({ error: "Score invalide" }, { status: 400 });
  }

  const diff = game === "quiz" ? difficulty! : null;
  const currentTop = await getTop(game, diff);

  // Check if score qualifies for top 5
  if (currentTop.length >= TOP_N && score <= currentTop[TOP_N - 1].score) {
    return NextResponse.json({ error: "Score insuffisant pour le classement" }, { status: 409 });
  }

  // Insert the new entry
  await prisma.leaderboardEntry.create({
    data: { game, difficulty: diff, nickname: nickname.trim(), score },
  });

  // If more than TOP_N entries now, delete the lowest
  if (currentTop.length >= TOP_N) {
    const allEntries = await getTop(game, diff);
    if (allEntries.length > TOP_N) {
      const toDelete = allEntries.slice(TOP_N);
      await prisma.leaderboardEntry.deleteMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
      });
    }
  }

  const entries = await getTop(game, diff);
  return NextResponse.json({ entries });
}
