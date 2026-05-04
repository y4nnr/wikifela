import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const episodes = await prisma.episode.findMany({
      include: { locations: true },
    });

    const eligible = episodes
      .filter((ep) => ep.locations.length >= 3)
      .map((ep) => ({
        id: ep.id,
        title: ep.title,
        airDate: ep.airDate ? ep.airDate.toISOString() : null,
        locations: ep.locations.map((loc) => ({
          id: loc.id,
          communeName: loc.communeName,
          department: loc.department,
          departmentName: loc.departmentName,
          latitude: loc.latitude,
          longitude: loc.longitude,
          category: loc.category,
          eventDescription: loc.eventDescription,
          eventDescriptionGame: loc.eventDescriptionGame,
        })),
      }));

    return NextResponse.json({ cases: eligible });
  } catch (err) {
    console.error("GeoFELA API error:", err);
    return NextResponse.json({ cases: [] }, { status: 500 });
  }
}
