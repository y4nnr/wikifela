import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";
import { PortraitSchema } from "@/lib/admin-validators";
import { existsSync } from "fs";
import { resolve } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID invalide" }, { status: 400 });
  }

  try {
    const p = await prisma.portrait.findUnique({
      where: { id },
      include: {
        episode: { select: { id: true, title: true, season: true, episode: true } },
      },
    });
    if (!p) {
      return NextResponse.json({ ok: false, error: "Portrait introuvable" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: p });
  } catch (err) {
    console.error("Get portrait error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID invalide" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = PortraitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Validation echouee", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const ep = await prisma.episode.findUnique({ where: { id: data.episodeId }, select: { id: true } });
  if (!ep) {
    return NextResponse.json({ ok: false, error: "Episode introuvable" }, { status: 400 });
  }

  const fileExists = existsSync(resolve(process.cwd(), "public/portraits", data.imagePath));

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.portrait.updateMany({
          where: { episodeId: data.episodeId, isPrimary: true, NOT: { id } },
          data: { isPrimary: false },
        });
      }
      return tx.portrait.update({
        where: { id },
        data: {
          episodeId: data.episodeId,
          personName: data.personName,
          subtitle: data.subtitle || null,
          gender: data.gender,
          isPrimary: data.isPrimary || false,
          imagePath: data.imagePath,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      data: updated,
      warnings: fileExists ? [] : [`Le fichier public/portraits/${data.imagePath} n'existe pas.`],
    });
  } catch (err) {
    console.error("Update portrait error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID invalide" }, { status: 400 });
  }

  try {
    await prisma.portrait.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete portrait error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
