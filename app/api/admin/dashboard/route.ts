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

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Load static JSON data
    const quizBank: { episodeId: number; difficulty: string }[] = JSON.parse(
      readFileSync(resolve(process.cwd(), "data/quiz-bank.json"), "utf-8")
    );
    const portraits: { id: number; name: string; file: string; gender: string }[] = JSON.parse(
      readFileSync(resolve(process.cwd(), "data/portraits.json"), "utf-8")
    );

    // Index quiz questions by episodeId
    const quizByEpisode = new Map<number, { total: number; facile: number; moyen: number; difficile: number }>();
    for (const q of quizBank) {
      const entry = quizByEpisode.get(q.episodeId) || { total: 0, facile: 0, moyen: 0, difficile: 0 };
      entry.total++;
      if (q.difficulty === "facile") entry.facile++;
      else if (q.difficulty === "moyen") entry.moyen++;
      else if (q.difficulty === "difficile") entry.difficile++;
      quizByEpisode.set(q.episodeId, entry);
    }

    // Index portraits by episode id
    const portraitsByEpisode = new Map<number, typeof portraits>();
    for (const p of portraits) {
      const list = portraitsByEpisode.get(p.id) || [];
      list.push(p);
      portraitsByEpisode.set(p.id, list);
    }

    // Fetch all episodes with location counts
    const episodes = await prisma.episode.findMany({
      select: {
        id: true,
        title: true,
        season: true,
        episode: true,
        airDate: true,
        keywords: true,
        description: true,
        wikiSummary: true,
        locations: {
          select: {
            id: true,
            communeName: true,
            category: true,
            eventDescription: true,
          },
        },
      },
      orderBy: [{ season: "asc" }, { episode: "asc" }],
    });

    // Build per-episode report
    const episodeData = episodes.map((ep) => ({
      id: ep.id,
      title: ep.title,
      season: ep.season,
      episode: ep.episode,
      airDate: ep.airDate,
      hasDescription: !!ep.description,
      hasWikiSummary: !!ep.wikiSummary,
      keywordCount: ep.keywords.length,
      locations: ep.locations,
      locationCount: ep.locations.length,
      quiz: quizByEpisode.get(ep.id) || { total: 0, facile: 0, moyen: 0, difficile: 0 },
      portraits: portraitsByEpisode.get(ep.id) || [],
      portraitCount: (portraitsByEpisode.get(ep.id) || []).length,
    }));

    // Summary stats
    const summary = {
      totalEpisodes: episodes.length,
      withLocations: episodeData.filter((e) => e.locationCount > 0).length,
      totalPins: episodeData.reduce((s, e) => s + e.locationCount, 0),
      withQuiz: episodeData.filter((e) => e.quiz.total > 0).length,
      totalQuestions: quizBank.length,
      withPortraits: episodeData.filter((e) => e.portraitCount > 0).length,
      totalPortraits: portraits.length,
      withDescription: episodeData.filter((e) => e.hasDescription).length,
      withWikiSummary: episodeData.filter((e) => e.hasWikiSummary).length,
      withKeywords: episodeData.filter((e) => e.keywordCount > 0).length,
    };

    return NextResponse.json({ summary, episodes: episodeData });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(err) },
      { status: 500 }
    );
  }
}
