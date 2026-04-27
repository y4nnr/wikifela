import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

  try {
    // Fetch all episodes with locations, quiz questions, and portraits
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
        quizQuestions: {
          select: {
            id: true,
            difficulty: true,
          },
        },
        portraits: {
          select: {
            id: true,
            personName: true,
            imagePath: true,
            gender: true,
          },
        },
      },
      orderBy: [{ season: "asc" }, { episode: "asc" }],
    });

    // Build per-episode report
    const episodeData = episodes.map((ep) => {
      const quizStats = { total: ep.quizQuestions.length, facile: 0, moyen: 0, difficile: 0 };
      for (const q of ep.quizQuestions) {
        if (q.difficulty === "facile") quizStats.facile++;
        else if (q.difficulty === "moyen") quizStats.moyen++;
        else if (q.difficulty === "difficile") quizStats.difficile++;
      }

      return {
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
        quiz: quizStats,
        portraits: ep.portraits.map((p) => ({
          id: p.id,
          name: p.personName,
          file: p.imagePath,
          gender: p.gender,
        })),
        portraitCount: ep.portraits.length,
      };
    });

    // Count totals including general questions (no episode)
    const totalQuestions = await prisma.quizQuestion.count();
    const totalPortraits = await prisma.portrait.count();

    const summary = {
      totalEpisodes: episodes.length,
      withLocations: episodeData.filter((e) => e.locationCount > 0).length,
      totalPins: episodeData.reduce((s, e) => s + e.locationCount, 0),
      withQuiz: episodeData.filter((e) => e.quiz.total > 0).length,
      totalQuestions,
      withPortraits: episodeData.filter((e) => e.portraitCount > 0).length,
      totalPortraits,
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
