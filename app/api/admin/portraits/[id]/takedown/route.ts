import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";
import { TakedownSchema } from "@/lib/admin-validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID invalide" }, { status: 400 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // body is optional for takedown
  }

  const parsed = TakedownSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Validation echouee" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.portrait.update({
      where: { id },
      data: {
        takedownAt: new Date(),
        takedownReason: parsed.data.reason || null,
        personName: "",
        subtitle: null,
        imagePath: "",
        isPrimary: false,
      },
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("Takedown error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
