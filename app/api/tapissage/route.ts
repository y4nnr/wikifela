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
  const count = Math.min(
    parseInt(request.nextUrl.searchParams.get("count") || "5", 10),
    10
  );

  const portraits = loadPortraits();
  if (portraits.length < 4) {
    return NextResponse.json({ rounds: [] });
  }

  const rounds = [];
  const used = new Set<number>();

  for (let i = 0; i < count; i++) {
    // Pick a correct answer not yet used
    const available = portraits.filter((p) => !used.has(p.id));
    if (available.length === 0) break;

    const correct = available[Math.floor(Math.random() * available.length)];
    used.add(correct.id);

    // Pick 3 wrong portraits
    const wrong = shuffle(portraits.filter((p) => p.id !== correct.id)).slice(
      0,
      3
    );

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
