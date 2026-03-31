import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const dryRun = process.argv.includes("--dry-run");

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractSnippet(text: string, cityName: string): string | null {
  const normText = normalize(text);
  const normCity = normalize(cityName);

  const pos = normText.indexOf(normCity);
  if (pos === -1) return null;

  // Find the sentence containing this location
  // Look backwards for sentence start (., !, ?, newline, or start of text)
  let sentStart = pos;
  for (let i = pos - 1; i >= Math.max(0, pos - 200); i--) {
    const ch = text[i];
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      sentStart = i + 1;
      break;
    }
    if (i === Math.max(0, pos - 200)) {
      sentStart = i;
    }
  }

  // Look forwards for sentence end
  let sentEnd = pos + cityName.length;
  for (let i = pos + cityName.length; i < Math.min(text.length, pos + 300); i++) {
    const ch = text[i];
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      sentEnd = i + 1;
      break;
    }
    if (i === Math.min(text.length, pos + 300) - 1) {
      sentEnd = i + 1;
    }
  }

  let snippet = text.slice(sentStart, sentEnd).trim();

  // Cap at 200 chars
  if (snippet.length > 200) {
    snippet = snippet.slice(0, 197) + "...";
  }

  return snippet || null;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const locations = await prisma.episodeLocation.findMany({
      include: {
        episode: {
          select: { wikiSummary: true, description: true },
        },
      },
    });

    console.log(`Processing ${locations.length} locations...`);
    let updated = 0;
    let noMatch = 0;

    for (const loc of locations) {
      const text = [loc.episode.wikiSummary, loc.episode.description]
        .filter(Boolean)
        .join(" ");
      if (!text) {
        noMatch++;
        continue;
      }

      const snippet = extractSnippet(text, loc.communeName);
      if (!snippet) {
        noMatch++;
        if (dryRun) {
          console.log(`  ⚠ No match: ${loc.communeName} (ep ${loc.episodeId})`);
        }
        continue;
      }

      if (dryRun) {
        console.log(`  ${loc.communeName}: ${snippet}`);
      } else {
        await prisma.episodeLocation.update({
          where: { id: loc.id },
          data: { eventDescription: snippet },
        });
      }
      updated++;
    }

    console.log(`\n--- Summary ---`);
    console.log(`Updated: ${updated}`);
    console.log(`No match: ${noMatch}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
