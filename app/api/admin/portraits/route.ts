import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";
import { PortraitSchema } from "@/lib/admin-validators";
import { existsSync } from "fs";
import { resolve } from "path";

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

  try {
    const portraits = await prisma.portrait.findMany({
      include: {
        episode: { select: { id: true, title: true, season: true, episode: true } },
      },
      orderBy: [{ episodeId: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({
      portraits: portraits.map((p) => ({
        id: p.id,
        episodeId: p.episodeId,
        episodeTitle: p.episode?.title || null,
        season: p.episode?.season || null,
        episode: p.episode?.episode || null,
        personName: p.personName,
        subtitle: p.subtitle,
        gender: p.gender,
        imagePath: p.imagePath,
        isPrimary: p.isPrimary,
        takedownAt: p.takedownAt,
        takedownReason: p.takedownReason,
      })),
    });
  } catch (err) {
    console.error("List portraits error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

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

  // Warn if file does not exist (non-blocking)
  const fileExists = existsSync(resolve(process.cwd(), "public/portraits", data.imagePath));

  try {
    const created = await prisma.$transaction(async (tx) => {
      // If isPrimary, unset on other portraits for the same episode
      if (data.isPrimary) {
        await tx.portrait.updateMany({
          where: { episodeId: data.episodeId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.portrait.create({
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
      data: created,
      warnings: fileExists ? [] : [`Le fichier public/portraits/${data.imagePath} n'existe pas.`],
    });
  } catch (err) {
    console.error("Create portrait error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
