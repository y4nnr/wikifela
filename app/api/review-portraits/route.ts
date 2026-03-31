import { NextResponse } from "next/server";
import { readdirSync } from "fs";
import { resolve } from "path";
import { prisma } from "@/lib/db";

export async function GET() {
  const dir = resolve(process.cwd(), "public/portraits");
  const files = readdirSync(dir).filter((f) => f.match(/\.(jpg|jpeg|png)$/i));

  const ids = files.map((f) => parseInt(f.split(".")[0], 10)).filter((n) => !isNaN(n));

  const episodes = await prisma.episode.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true },
  });

  const titleMap = new Map(episodes.map((e) => [e.id, e.title]));

  const portraits = files
    .map((f) => {
      const id = parseInt(f.split(".")[0], 10);
      return { id, file: f, title: titleMap.get(id) || `ID ${id}` };
    })
    .sort((a, b) => a.id - b.id);

  return NextResponse.json({ portraits });
}
