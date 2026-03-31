import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const USER_AGENT = "FELA-Scraper/1.0";
const prisma = new PrismaClient();

async function searchWikidata(name: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=fr&format=json&limit=3`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const data = (await res.json()) as { search?: { id: string }[] };
  for (const result of data.search || []) {
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${result.id}&props=claims&format=json`;
    const res2 = await fetch(entityUrl, { headers: { "User-Agent": USER_AGENT } });
    const data2 = (await res2.json()) as { entities?: Record<string, { claims?: Record<string, { mainsnak?: { datavalue?: { value?: string } } }[]> }> };
    const image = data2.entities?.[result.id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (image) return image;
  }
  return null;
}

async function getCommonsThumb(filename: string): Promise<string | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=300&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const data = (await res.json()) as { query?: { pages?: Record<string, { imageinfo?: { thumburl?: string; url?: string }[] }> } };
  const pages = Object.values(data.query?.pages || {});
  const info = pages[0]?.imageinfo?.[0];
  return info?.thumburl || info?.url || null;
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return false;
    writeFileSync(filepath, buffer);
    return true;
  } catch {
    return false;
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractName(title: string): string | null {
  const m = title.match(/^(.+?)\s*[—–-]\s*/);
  if (m) {
    const name = m[1].trim();
    if (name.match(/^(Les|La|Le|L'|Un|Action|Human|Crimes|3 )/)) return null;
    return name;
  }
  return null;
}

async function main() {
  const episodes = await prisma.episode.findMany({
    select: { id: true, title: true },
    orderBy: { id: "asc" },
  });

  const portraits: { id: number; name: string; file: string }[] = [];

  for (const ep of episodes) {
    const name = extractName(ep.title);
    if (!name) continue;

    await delay(500);
    const imageName = await searchWikidata(name);
    if (!imageName) continue;

    await delay(300);
    const thumbUrl = await getCommonsThumb(imageName);
    if (!thumbUrl) continue;

    const ext = imageName.match(/\.(jpg|jpeg|png)/i)?.[1] || "jpg";
    const filename = `${ep.id}.${ext.toLowerCase()}`;
    const filepath = `/home/y4n/dev/fela/public/portraits/${filename}`;

    await delay(300);
    const ok = await downloadImage(thumbUrl, filepath);
    if (ok) {
      portraits.push({ id: ep.id, name, file: filename });
      console.log(`✓ [${ep.id}] ${name} → ${filename}`);
    }
  }

  console.log(`\nDownloaded ${portraits.length} portraits`);
  writeFileSync("/home/y4n/dev/fela/data/portraits.json", JSON.stringify(portraits, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
