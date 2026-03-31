import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import {
  fetchWikitext,
  parseWikitext,
  fetchArticleSummary,
} from "./scraper/wikipedia";
import { transformAll } from "./scraper/transform";

const dryRun = process.argv.includes("--dry-run");
const skipEnrich = process.argv.includes("--skip-enrich");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Fetching episode list from Wikipedia...");
  const wikitext = await fetchWikitext();
  console.log(`Fetched ${wikitext.length} characters of wikitext.`);

  console.log("Parsing episodes...");
  const rawEpisodes = parseWikitext(wikitext);
  console.log(`Parsed ${rawEpisodes.length} episodes.`);

  const episodes = transformAll(rawEpisodes);

  // Phase 2: Enrich episodes with Wikipedia article summaries
  if (!skipEnrich) {
    console.log("\nEnriching episodes with Wikipedia summaries...");
    let enriched = 0;
    const seen = new Set<string>();

    for (const ep of episodes) {
      if (ep.wikiLinks.length === 0) continue;

      const summaries: string[] = [];
      for (const link of ep.wikiLinks) {
        if (seen.has(link)) continue;
        seen.add(link);

        await delay(500); // Rate limit
        const summary = await fetchArticleSummary(link);
        if (summary) {
          summaries.push(summary);
        }
      }

      if (summaries.length > 0) {
        ep.wikiSummary = summaries.join("\n\n");
        enriched++;
        console.log(
          `  ✓ S${ep.season}E${ep.episode}: ${ep.wikiLinks.length} link(s), ${ep.wikiSummary.length} chars`
        );
      }
    }
    console.log(`Enriched ${enriched} episodes with Wikipedia summaries.`);
  }

  if (dryRun) {
    console.log("\n--- DRY RUN ---");
    for (const ep of episodes) {
      const summaryLen = ep.wikiSummary ? `${ep.wikiSummary.length} chars` : "no summary";
      console.log(
        `  S${ep.season}E${ep.episode}: ${ep.title} (${ep.airDate?.toISOString().slice(0, 10) ?? "no date"}) [${summaryLen}]`
      );
    }
    console.log(`\nTotal: ${episodes.length} episodes (not written to DB)`);
    return;
  }

  const prisma = new PrismaClient();
  let errors = 0;

  try {
    for (const ep of episodes) {
      try {
        await prisma.episode.upsert({
          where: {
            season_episode: {
              season: ep.season,
              episode: ep.episode,
            },
          },
          create: {
            title: ep.title,
            season: ep.season,
            episode: ep.episode,
            airDate: ep.airDate,
            description: ep.description,
            keywords: ep.keywords,
            wikiSummary: ep.wikiSummary,
          },
          update: {
            title: ep.title,
            airDate: ep.airDate,
            description: ep.description,
            wikiSummary: ep.wikiSummary,
          },
        });

        console.log(`  ✓ S${ep.season}E${ep.episode}: ${ep.title}`);
      } catch (err) {
        errors++;
        console.error(
          `  ✗ S${ep.season}E${ep.episode}: ${ep.title} — ${err instanceof Error ? err.message : err}`
        );
      }
    }

    const totalInDb = await prisma.episode.count();
    const withSummary = await prisma.episode.count({
      where: { wikiSummary: { not: null } },
    });
    console.log(`\n--- Summary ---`);
    console.log(`Processed: ${episodes.length}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total episodes in DB: ${totalInDb}`);
    console.log(`Episodes with wiki summary: ${withSummary}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});
