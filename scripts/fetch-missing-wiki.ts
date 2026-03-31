import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const USER_AGENT = "FELA-Scraper/1.0 (fan project)";
const SEARCH_API = "https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=";
const ARTICLE_API = "https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=";

const dryRun = process.argv.includes("--dry-run");

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Extract search terms from episode title
function getTitleSearchTerms(title: string): string[] {
  const terms: string[] = [];

  // Try "Affaire X" pattern from the name before the dash
  const dashMatch = title.match(/^(.+?)\s*[—–-]\s*/);
  if (dashMatch) {
    const name = dashMatch[1].trim();
    // Skip generic names
    if (!name.match(/^(Les|La|Le|L'|Un|Une|Crimes|Mystère)/)) {
      terms.push(`Affaire ${name}`);
      terms.push(name);
    }
  }

  // Try the full title
  terms.push(title.replace(/\s*[—–-]\s*Débat\s*:.*/i, "").trim());

  // Try subtitle after dash
  const subMatch = title.match(/[—–-]\s*(.+)/);
  if (subMatch) {
    const sub = subMatch[1].replace(/Débat\s*:.*/, "").trim();
    if (sub.length > 5) terms.push(sub);
  }

  return terms;
}

async function searchWikipedia(query: string): Promise<string | null> {
  const url = `${SEARCH_API}${encodeURIComponent(query)}&srnamespace=0&srlimit=3&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { search?: { title: string }[] };
    };
    const results = data.query?.search;
    if (!results || results.length === 0) return null;

    // Prefer results with "Affaire" in title
    const affaire = results.find((r) =>
      r.title.toLowerCase().includes("affaire")
    );
    return affaire?.title ?? results[0].title;
  } catch {
    return null;
  }
}

async function fetchArticle(title: string): Promise<string | null> {
  const url = `${ARTICLE_API}${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { extract?: string }> };
    };
    const pages = data.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    if (!page?.extract || page.extract.length < 100) return null;
    return page.extract.slice(0, 5000);
  } catch {
    return null;
  }
}

async function main() {
  const prisma = new PrismaClient();

  try {
    // Get episodes without locations (excluding compilations)
    const episodes = await prisma.episode.findMany({
      where: {
        id: {
          notIn: [1, 2, 3, 5, 7, 107], // compilations
        },
        OR: [
          { wikiSummary: null },
          { wikiSummary: "" },
        ],
      },
      select: { id: true, title: true, wikiSummary: true },
      orderBy: { id: "asc" },
    });

    console.log(`${episodes.length} episodes missing wiki text.`);
    let fetched = 0;

    for (const ep of episodes) {
      const searchTerms = getTitleSearchTerms(ep.title);
      let article: string | null = null;
      let foundTitle: string | null = null;

      for (const term of searchTerms) {
        await delay(500);
        const wikiTitle = await searchWikipedia(term);
        if (!wikiTitle) continue;

        await delay(500);
        article = await fetchArticle(wikiTitle);
        if (article && article.length > 200) {
          foundTitle = wikiTitle;
          break;
        }
      }

      if (article && foundTitle) {
        fetched++;
        if (dryRun) {
          console.log(`  ✓ ${ep.title} → ${foundTitle} (${article.length} chars)`);
        } else {
          await prisma.episode.update({
            where: { id: ep.id },
            data: { wikiSummary: article },
          });
          console.log(`  ✓ ${ep.title} → ${foundTitle}`);
        }
      } else {
        console.log(`  ✗ ${ep.title} — no article found`);
      }
    }

    console.log(`\nFetched ${fetched} / ${episodes.length} articles.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
