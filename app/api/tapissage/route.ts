import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { resolve } from "path";

interface Portrait {
  id: number;
  name: string;
  file: string;
  subtitle?: string;
  season?: number;
  episode?: number;
  gender?: string;
}

let portraitsCache: Portrait[] | null = null;

function loadPortraits(): Portrait[] {
  if (portraitsCache) return portraitsCache;
  try {
    const data = readFileSync(
      resolve(process.cwd(), "data/portraits.json"),
      "utf-8"
    );
    portraitsCache = JSON.parse(data);
    return portraitsCache!;
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
  const mode = request.nextUrl.searchParams.get("mode") || "classique";
  const maxCount = mode === "survie" ? 100 : 10;
  const count = Math.min(
    parseInt(request.nextUrl.searchParams.get("count") || "5", 10),
    maxCount
  );

  const portraits = loadPortraits();
  if (portraits.length < 4) {
    return NextResponse.json({ rounds: [] });
  }

  const rounds = [];
  const usedAsCorrect = new Set<number>();
  const usedAsWrong = new Set<number>();

  for (let i = 0; i < count; i++) {
    // Pick a correct answer not yet used as correct
    const available = portraits.filter((p) => !usedAsCorrect.has(p.id));
    if (available.length === 0) break;

    const correct = available[Math.floor(Math.random() * available.length)];
    usedAsCorrect.add(correct.id);

    // Pick 3 wrong portraits of the same gender, not already used as wrong in this session
    const sameGender = portraits.filter(
      (p) => p.id !== correct.id && p.gender === correct.gender && !usedAsWrong.has(p.id)
    );
    // Fallback to any same gender if not enough unused
    const fallback = portraits.filter(
      (p) => p.id !== correct.id && p.gender === correct.gender
    );
    const pool = sameGender.length >= 3 ? sameGender : fallback;
    const wrong = shuffle(pool).slice(0, 3);
    wrong.forEach((w) => usedAsWrong.add(w.id));

    // Build lineup: 4 portraits in random order
    const lineup = shuffle([correct, ...wrong]);
    const correctIndex = lineup.findIndex((p) => p.id === correct.id);

    rounds.push({
      question: correct.name,
      subtitle: correct.subtitle || "",
      season: correct.season || null,
      episode: correct.episode || null,
      episodeId: correct.id,
      lineup: lineup.map((p) => ({
        file: `/portraits/${p.file}`,
        name: p.name,
        number: 0, // will be set below
      })),
      correctIndex,
    });

    // Set numbers 1-4
    rounds[rounds.length - 1].lineup.forEach((l, idx) => {
      l.number = idx + 1;
    });
  }

  return NextResponse.json({ rounds });
}
