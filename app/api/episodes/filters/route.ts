import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [seasons, episodesWithKeywords, departments] = await Promise.all([
      prisma.episode.findMany({
        select: { season: true },
        distinct: ["season"],
        orderBy: { season: "asc" },
      }),
      prisma.episode.findMany({
        select: { keywords: true },
        where: { keywords: { isEmpty: false } },
      }),
      prisma.episodeLocation.findMany({
        select: { department: true, departmentName: true },
        distinct: ["department"],
        orderBy: { departmentName: "asc" },
      }),
    ]);

    const crimeTypes = [
      ...new Set(episodesWithKeywords.flatMap((e) => e.keywords)),
    ].sort();

    return NextResponse.json({
      seasons: seasons.map((s) => s.season).filter((s) => s != null),
      crimeTypes,
      departments: departments.map((d) => ({
        code: d.department,
        name: d.departmentName,
      })),
    });
  } catch {
    return NextResponse.json({ seasons: [], crimeTypes: [], departments: [] });
  }
}
