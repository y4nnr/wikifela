import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

  try {
    const episodes = await prisma.episode.findMany({
      select: { id: true, title: true, season: true, episode: true },
      orderBy: [{ season: "asc" }, { episode: "asc" }],
    });
    return NextResponse.json({ episodes });
  } catch (err) {
    console.error("Episodes lookup error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
