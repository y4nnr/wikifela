import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { fetchWikitext, parseWikitext } from "@/scripts/scraper/wikipedia";
import { transformAll } from "@/scripts/scraper/transform";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SCRAPER_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const prisma = new PrismaClient();
  const summary = { processed: 0, errors: 0, total: 0 };

  try {
    const wikitext = await fetchWikitext();
    const rawEpisodes = parseWikitext(wikitext);
    const episodes = transformAll(rawEpisodes);
    summary.processed = episodes.length;

    for (const ep of episodes) {
      try {
        await prisma.episode.upsert({
          where: {
            season_episode: {
              season: ep.season,
              episode: ep.episode,
            },
          },
          create: {
            title: ep.title,
            season: ep.season,
            episode: ep.episode,
            airDate: ep.airDate,
            description: ep.description,
            keywords: ep.keywords,
            wikiSummary: ep.wikiSummary,
          },
          update: {
            title: ep.title,
            airDate: ep.airDate,
            description: ep.description,
          },
        });
      } catch {
        summary.errors++;
      }
    }

    summary.total = await prisma.episode.count();

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du rafraîchissement." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
