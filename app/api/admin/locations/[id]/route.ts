import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";
import { LocationPatchSchema } from "@/lib/admin-validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = LocationPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation échouée", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data: Record<string, string | null> = {};
  if (parsed.data.eventDescription !== undefined) {
    data.eventDescription = parsed.data.eventDescription || null;
  }
  if (parsed.data.eventDescriptionGame !== undefined) {
    data.eventDescriptionGame = parsed.data.eventDescriptionGame || null;
  }

  try {
    const location = await prisma.episodeLocation.update({
      where: { id },
      data,
    });
    return NextResponse.json({ location });
  } catch (err) {
    console.error("Location PATCH error:", err);
    return NextResponse.json(
      { error: "Localisation introuvable ou erreur serveur" },
      { status: 404 }
    );
  }
}
