import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const USER_AGENT = "FELA-Scraper/1.0 (fan project)";
const SEARCH_API =
  "https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=";
const ARTICLE_API =
  "https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Extract the person's name from the episode title
function extractCaseName(title: string): string[] {
  const terms: string[] = [];

  // "Person Name — Subtitle" pattern
  const dashMatch = title.match(/^(.+?)\s*[—–-]\s*(.+)/);
  if (dashMatch) {
    const name = dashMatch[1].trim();
    const subtitle = dashMatch[2].replace(/Débat\s*:.*/, "").trim();

    // Try "Affaire [name]" first
    if (!name.match(/^(Les|La|Le|L'|Un|Une|Crimes?|Mystère|Action)/)) {
      terms.push(`Affaire ${name}`);
    }
    terms.push(name);
    if (subtitle.length > 8) terms.push(subtitle);
  }

  // Full title
  terms.push(title);

  return [...new Set(terms)];
}

async function searchWiki(query: string): Promise<string | null> {
  const url = `${SEARCH_API}${encodeURIComponent(query)}&srnamespace=0&srlimit=5&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { search?: { title: string; snippet: string }[] };
    };
    const results = data.query?.search;
    if (!results?.length) return null;

    // Prefer "Affaire" results, then the first result
    const affaire = results.find(
      (r) =>
        r.title.toLowerCase().includes("affaire") &&
        !r.title.includes("Liste des")
    );
    if (affaire) return affaire.title;

    // Skip results that are episode lists or unrelated
    const good = results.find(
      (r) =>
        !r.title.includes("Liste des épisodes") &&
        !r.title.includes("Faites entrer") &&
        (r.snippet.includes("crime") ||
          r.snippet.includes("meurtre") ||
          r.snippet.includes("assassin") ||
          r.snippet.includes("condamn") ||
          r.snippet.includes("affaire") ||
          r.snippet.includes("victime") ||
          r.snippet.includes("enlèvement") ||
          r.snippet.includes("disparition") ||
          r.snippet.includes("police") ||
          r.snippet.includes("prison"))
    );
    return good?.title ?? null;
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
    if (!page?.extract || page.extract.length < 200) return null;
    return page.extract;
  } catch {
    return null;
  }
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const episodes = await prisma.episode.findMany({
      where: {
        OR: [
          { wikiSummary: null },
          { wikiSummary: "" },
        ],
        id: { notIn: [1, 2, 3, 5, 7, 107] },
      },
      select: { id: true, title: true },
      orderBy: { id: "asc" },
    });

    console.log(`${episodes.length} episodes missing Wikipedia text.\n`);
    let fetched = 0;
    let notFound = 0;

    for (const ep of episodes) {
      const searchTerms = extractCaseName(ep.title);
      let article: string | null = null;
      let foundTitle: string | null = null;

      for (const term of searchTerms) {
        await delay(500);
        const wikiTitle = await searchWiki(term);
        if (!wikiTitle) continue;

        await delay(500);
        article = await fetchArticle(wikiTitle);
        if (article && article.length > 500) {
          foundTitle = wikiTitle;
          break;
        }
      }

      if (article && foundTitle) {
        fetched++;
        await prisma.episode.update({
          where: { id: ep.id },
          data: { wikiSummary: article },
        });
        console.log(
          `  ✓ [${ep.id}] ${ep.title} → ${foundTitle} (${article.length} chars)`
        );
      } else {
        notFound++;
        console.log(`  ✗ [${ep.id}] ${ep.title}`);
      }
    }

    console.log(`\nFetched: ${fetched}, Not found: ${notFound}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
