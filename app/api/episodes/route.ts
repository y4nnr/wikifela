import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const season = params.get("season");
  const crime = params.get("crime");
  const department = params.get("department");
  const from = params.get("from");
  const to = params.get("to");

  const where: Record<string, unknown> = {};

  if (season) {
    where.season = parseInt(season, 10);
  }

  if (crime) {
    where.keywords = { has: crime };
  }

  if (department) {
    where.locations = { some: { department } };
  }

  if (from || to) {
    const airDateFilter: Record<string, Date> = {};
    if (from) airDateFilter.gte = new Date(`${from}-01-01`);
    if (to) airDateFilter.lte = new Date(`${to}-12-31`);
    where.airDate = airDateFilter;
  }

  try {
    const episodes = await prisma.episode.findMany({
      where,
      select: {
        id: true,
        title: true,
        season: true,
        episode: true,
        airDate: true,
        keywords: true,
      },
      orderBy: [{ season: "asc" }, { episode: "asc" }],
    });

    return NextResponse.json({ episodes });
  } catch {
    return NextResponse.json({ episodes: [] });
  }
}
