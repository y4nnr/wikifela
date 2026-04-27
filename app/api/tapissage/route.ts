import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") || "classique";
  const maxCount = mode === "survie" ? 100 : 10;
  const count = Math.min(
    parseInt(request.nextUrl.searchParams.get("count") || "5", 10),
    maxCount
  );

  try {
    // Exclude taken-down portraits
    const allPortraits = await prisma.portrait.findMany({
      where: { takedownAt: null },
      include: {
        episode: { select: { season: true, episode: true } },
      },
    });

    if (allPortraits.length < 4) {
      return NextResponse.json({ rounds: [] });
    }

    const rounds = [];
    const usedAsCorrect = new Set<number>();
    const usedAsWrong = new Set<number>();

    for (let i = 0; i < count; i++) {
      const available = allPortraits.filter((p) => !usedAsCorrect.has(p.id));
      if (available.length === 0) break;

      const correct = available[Math.floor(Math.random() * available.length)];
      usedAsCorrect.add(correct.id);

      const sameGender = allPortraits.filter(
        (p) => p.id !== correct.id && p.gender === correct.gender && !usedAsWrong.has(p.id)
      );
      const fallback = allPortraits.filter(
        (p) => p.id !== correct.id && p.gender === correct.gender
      );
      const pool = sameGender.length >= 3 ? sameGender : fallback;
      const wrong = shuffle(pool).slice(0, 3);
      wrong.forEach((w) => usedAsWrong.add(w.id));

      const lineup = shuffle([correct, ...wrong]);
      const correctIndex = lineup.findIndex((p) => p.id === correct.id);

      rounds.push({
        question: correct.personName,
        subtitle: correct.subtitle || "",
        season: correct.episode?.season || null,
        episode: correct.episode?.episode || null,
        episodeId: correct.episodeId,
        lineup: lineup.map((p, idx) => ({
          file: `/portraits/${p.imagePath}`,
          name: p.personName,
          number: idx + 1,
        })),
        correctIndex,
      });
    }

    return NextResponse.json({ rounds });
  } catch (err) {
    console.error("Tapissage API error:", err);
    return NextResponse.json({ rounds: [] }, { status: 500 });
  }
}
