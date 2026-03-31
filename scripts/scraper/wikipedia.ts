const WIKI_API =
  "https://fr.wikipedia.org/w/api.php?action=parse&page=Liste_des_%C3%A9pisodes_de_Faites_entrer_l%27accus%C3%A9&prop=wikitext&format=json";

const USER_AGENT = "FELA-Scraper/1.0 (fan project; https://github.com/fela)";

export interface RawEpisode {
  season: number;
  episode: number;
  title: string;
  wikiLinks: string[];
  crimeType: string | null;
  caseDate: string | null;
  airDate: string | null;
  observations: string | null;
}

export async function fetchWikitext(): Promise<string> {
  const res = await fetch(WIKI_API, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Wikipedia API returned ${res.status}`);
  }
  const data = (await res.json()) as {
    parse: { wikitext: { "*": string } };
  };
  return data.parse.wikitext["*"];
}

export function parseWikitext(wikitext: string): RawEpisode[] {
  const episodes: RawEpisode[] = [];
  const seasonRegex =
    /^==\s*(.+?saison)\s*\(.*?\)\s*==$/gm;

  const seasonHeaders: { name: string; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = seasonRegex.exec(wikitext)) !== null) {
    seasonHeaders.push({ name: match[1].trim(), index: match.index });
  }

  for (let s = 0; s < seasonHeaders.length; s++) {
    const seasonNum = s + 1;
    const sectionStart = seasonHeaders[s].index;
    const sectionEnd =
      s + 1 < seasonHeaders.length
        ? seasonHeaders[s + 1].index
        : wikitext.length;
    const section = wikitext.slice(sectionStart, sectionEnd);

    // Find the wikitable in this section
    const tableMatch = section.match(
      /\{\|[^\n]*wikitable[^\n]*\n([\s\S]*?)\n\|\}/
    );
    if (!tableMatch) continue;

    const tableBody = tableMatch[1];
    // Split rows by |- delimiter
    const rows = tableBody.split(/^\|-/m).slice(1); // skip header

    let episodeNum = 0;
    for (const row of rows) {
      const trimmed = row.trim();
      if (!trimmed || trimmed.startsWith("!")) continue;

      episodeNum++;
      const parsed = parseRow(trimmed, seasonNum, episodeNum);
      if (parsed) {
        episodes.push(parsed);
      }
    }
  }

  return episodes;
}

function parseRow(
  row: string,
  season: number,
  episodeDefault: number
): RawEpisode | null {
  // Split cells by | or || delimiters, handling the wikitext cell syntax
  const cells = splitCells(row);
  if (cells.length < 2) return null;

  // First cell: episode number (may have align=center| prefix)
  const epNumMatch = cells[0].match(/(\d+)\s*$/);
  const episodeNum = epNumMatch ? parseInt(epNumMatch[1], 10) : episodeDefault;

  // Second cell: extract wikilinks before cleaning, then clean for title
  const rawTitle = cells[1];
  const wikiLinks = extractWikiLinks(rawTitle);
  const title = cleanWikitext(rawTitle).trim();
  if (!title) return null;

  // Third cell: crime type (if present)
  const crimeType = cells[2] ? cleanWikitext(cells[2]).trim() || null : null;

  // Fourth cell: case start date
  const caseDate = cells[3] ? extractDate(cells[3]) : null;

  // Fifth cell: air date
  const airDate = cells[4] ? extractDate(cells[4]) : null;

  // Sixth cell: observations
  const observations = cells[5]
    ? cleanWikitext(cells[5]).trim() || null
    : null;

  return {
    season,
    episode: episodeNum,
    title,
    wikiLinks,
    crimeType,
    caseDate,
    airDate,
    observations,
  };
}

function splitCells(row: string): string[] {
  // Normalize the row: join lines, then split by || or newline-|
  const normalized = row
    .replace(/\n\|/g, "||")
    .replace(/\n/g, " ");

  const parts = normalized.split(/\|\|/);
  return parts.map((p) => p.trim());
}

function extractDate(cell: string): string | null {
  // Match {{date|day|month|year...}} template
  const dateMatch = cell.match(
    /\{\{date\|(\d{1,2})\|([a-zéûâôî]+)\|(\d{4})/i
  );
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = frenchMonthToNumber(dateMatch[2]);
    const year = dateMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  // Match {{date|||year...}} (year only)
  const yearOnlyMatch = cell.match(/\{\{date\|\|\|(\d{4})/);
  if (yearOnlyMatch) return `${yearOnlyMatch[1]}-01-01`;

  // Match bare date like "22 juin 1985"
  const bareMatch = cell.match(/(\d{1,2})\s+([a-zéûâôî]+)\s+(\d{4})/i);
  if (bareMatch) {
    const day = bareMatch[1].padStart(2, "0");
    const month = frenchMonthToNumber(bareMatch[2]);
    const year = bareMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  return null;
}

function frenchMonthToNumber(month: string): string | null {
  const months: Record<string, string> = {
    janvier: "01",
    février: "02",
    mars: "03",
    avril: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    août: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    décembre: "12",
  };
  return months[month.toLowerCase()] ?? null;
}

function extractWikiLinks(cell: string): string[] {
  const links: string[] = [];
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(cell)) !== null) {
    const link = m[1].trim();
    // Skip meta/utility links
    if (
      link.includes("date") ||
      link.includes("télévision") ||
      link.includes("Fichier:") ||
      link.includes("File:")
    ) continue;
    links.push(link);
  }
  return links;
}

const ARTICLE_API =
  "https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=";

export async function fetchArticleSummary(title: string): Promise<string | null> {
  const encoded = encodeURIComponent(title);
  try {
    const res = await fetch(`${ARTICLE_API}${encoded}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { extract?: string }> };
    };
    const pages = data.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    if (!page?.extract || page.extract.length < 50) return null;
    return page.extract;
  } catch {
    return null;
  }
}

function cleanWikitext(text: string): string {
  return (
    text
      // Remove ref tags and their content first (before stripping other markup)
      .replace(/<ref[^>]*\/>/g, "")
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
      // Remove external links: [http://... "text"] -> ""
      .replace(/\[https?:\/\/[^\]]*\]/g, "")
      // Remove style attributes: style="..." | or standalone style="..."
      .replace(/style="[^"]*"\s*\|?/g, "")
      // Remove align attributes: align=center|
      .replace(/align=\w+\s*\|/g, "")
      // Resolve wikilinks: [[Affaire X|Display]] -> Display, [[Simple]] -> Simple
      .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
      // Replace line-break templates with separator before removing other templates
      .replace(/\{\{clr\}\}/gi, " — ")
      // Remove remaining templates like {{date|...}}, etc.
      .replace(/\{\{[^}]*\}\}/g, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, "")
      // Remove remaining wiki markup
      .replace(/'{2,}/g, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}
