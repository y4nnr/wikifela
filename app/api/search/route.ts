import { NextRequest, NextResponse } from "next/server";
import { searchEpisodes } from "@/lib/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json({ results: [] });
  }

  if (q.length > 200) {
    return NextResponse.json(
      { error: "La requête est trop longue." },
      { status: 400 }
    );
  }

  try {
    const results = await searchEpisodes(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la recherche." },
      { status: 500 }
    );
  }
}
