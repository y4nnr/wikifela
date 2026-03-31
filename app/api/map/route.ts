import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const department = params.get("department");
  const crime = params.get("crime");
  const from = params.get("from");
  const to = params.get("to");
  const affaireIds = params.get("affaires"); // comma-separated IDs

  const where: Record<string, unknown> = {
    locations: { some: {} },
  };

  if (department) {
    where.locations = { some: { department } };
  }

  if (affaireIds) {
    const ids = affaireIds.split(",").map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    if (ids.length > 0) {
      where.id = { in: ids };
    }
  }

  if (crime) {
    where.keywords = { has: crime };
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
        locations: {
          select: {
            communeName: true,
            department: true,
            departmentName: true,
            latitude: true,
            longitude: true,
            eventDescription: true,
          },
        },
      },
      orderBy: { airDate: "desc" },
    });

    return NextResponse.json({ episodes });
  } catch (err) {
    console.error("Map API error:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la carte.", details: String(err) },
      { status: 500 }
    );
  }
}
