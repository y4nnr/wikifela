import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [departments, episodesWithKeywords, allEpisodes] = await Promise.all([
      prisma.episodeLocation.findMany({
        select: { department: true, departmentName: true },
        distinct: ["department"],
        orderBy: { departmentName: "asc" },
      }),
      prisma.episode.findMany({
        select: { keywords: true },
        where: { keywords: { isEmpty: false } },
      }),
      prisma.episode.findMany({
        select: { id: true, title: true, season: true, episode: true },
        orderBy: [{ season: "asc" }, { episode: "asc" }],
      }),
    ]);

    const crimeTypes = [
      ...new Set(episodesWithKeywords.flatMap((e) => e.keywords)),
    ].sort();

    return NextResponse.json({
      departments: departments.map((d) => ({
        code: d.department,
        name: d.departmentName,
      })),
      crimeTypes,
      episodes: allEpisodes,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du chargement des filtres." },
      { status: 500 }
    );
  }
}
