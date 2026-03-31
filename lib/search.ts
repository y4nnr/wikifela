import { prisma } from "./db";

export interface SearchResult {
  id: number;
  title: string;
  season: number | null;
  episode: number | null;
  airDate: string | null;
  description: string | null;
  headline: string;
  rank: number;
}

function sanitizeWords(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[\\'"&|!():*]/g, ""))
    .filter(Boolean);
}

function buildTsQuery(
  words: string[],
  operator: "&" | "|",
  prefix: boolean
): string {
  if (words.length === 0) return "";
  return words
    .map((w, i) =>
      prefix && i === words.length - 1 ? `${w}:*` : w
    )
    .join(` ${operator} `);
}

async function runSearch(
  tsQuery: string,
  limit: number
): Promise<SearchResult[]> {
  return prisma.$queryRaw<SearchResult[]>`
    SELECT
      id,
      title,
      season,
      episode,
      "airDate"::text as "airDate",
      description,
      ts_headline(
        'french',
        coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce("wikiSummary", ''),
        to_tsquery('french', ${tsQuery}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15, MaxFragments=1'
      ) as headline,
      ts_rank("searchVector", to_tsquery('french', ${tsQuery})) as rank
    FROM "Episode"
    WHERE "searchVector" @@ to_tsquery('french', ${tsQuery})
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
}

export async function searchEpisodes(
  query: string,
  limit = 20
): Promise<SearchResult[]> {
  const words = sanitizeWords(query);
  if (words.length === 0) return [];

  // 1. Try exact stem match (no prefix) — most precise
  const exactAnd = buildTsQuery(words, "&", false);
  const exactResults = await runSearch(exactAnd, limit);
  if (exactResults.length > 0) return exactResults;

  // 2. Try prefix match on last word (handles partial typing)
  const prefixAnd = buildTsQuery(words, "&", true);
  const prefixResults = await runSearch(prefixAnd, limit);
  if (prefixResults.length > 0) return prefixResults;

  // 3. Fallback to OR with exact stems
  const exactOr = buildTsQuery(words, "|", false);
  const orResults = await runSearch(exactOr, limit);
  if (orResults.length > 0) return orResults;

  // 4. Last resort: OR with prefix
  const prefixOr = buildTsQuery(words, "|", true);
  return runSearch(prefixOr, limit);
}
