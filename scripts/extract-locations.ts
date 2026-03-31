import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

const dryRun = process.argv.includes("--dry-run");

interface Commune {
  nom: string;
  dep: string;
  nomDep: string;
  lat: number;
  lng: number;
  pop: number;
}

interface FoundLocation {
  communeName: string;
  department: string;
  departmentName: string;
  latitude: number;
  longitude: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLookups(communes: Commune[]) {
  const byName = new Map<string, Commune[]>();
  const majorCities = new Set<string>();
  const departments = new Map<string, { dep: string; lat: number; lng: number }>();

  for (const c of communes) {
    const key = normalize(c.nom);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(c);
    if (c.pop >= 50000) majorCities.add(key);
    if (!departments.has(normalize(c.nomDep))) {
      departments.set(normalize(c.nomDep), { dep: c.dep, lat: c.lat, lng: c.lng });
    }
  }

  return { byName, majorCities, departments };
}

// Words/phrases that are also commune names — guaranteed false positives
const EXCLUDED_COMMUNES = new Set([
  "le pas", "corps", "jardin", "salon", "pont", "la riviere",
  "romans", "bonnes", "force", "vaucluse", "doubs", "saone",
  "le quartier", "coron", "charleville", "verneuil", "lagny",
  "clermont", "villeneuve", "villemur", "saint-germain", "saint-omer",
  "faux", "plaisance", "l'echelle", "grand", "bois", "le val",
  "campagne", "la barre", "l'union", "jouy", "bords", "bains",
  "la vallee", "quarante", "saint-ouen", "vic", "mars", "nice",
  "orange", "la garde", "tours", "sens", "grace", "la cote",
  "la chapelle", "le port", "ban", "gare", "maison", "font",
  "sainte-cecile", "loge", "caen", "le bois", "le plan",
]);

// Event keywords that indicate a location is relevant to the case
const EVENT_KEYWORDS = [
  // Crime events
  "meurtre", "assassinat", "assassine", "tue", "tuee", "abattu", "abattue",
  "poignarde", "etrangle", "etranglee", "empoisonne", "viole", "violee",
  "agresse", "agresseur", "enleve", "enlevee", "enlevement", "kidnapp",
  "sequestre", "sequestration", "cambriol", "braquage", "braque",
  "incendie", "incendiee", "fusillade",
  // Discovery
  "corps retrouve", "cadavre", "depouille", "decouverte du corps",
  "retrouve mort", "retrouvee morte", "disparu", "disparue", "disparition",
  // Legal/arrest
  "arrete", "arrestation", "interpelle", "garde a vue",
  "incarcere", "ecroue", "prison", "maison d'arret",
  "tribunal", "cour d'assises", "proces", "condamne", "condamnee",
  "juge", "jugement", "verdict", "acquitte",
  // Investigation
  "scene de crime", "lieu du crime", "perquisition",
  "enquete", "instruction",
  // Key events
  "evasion", "cavale", "fuite", "suicide", "tentative",
  "domicile", "habite", "habitation", "residence",
  "vehicule", "voiture", "camionnette", "fourgon",
];

// Contexts that indicate a location is NOT relevant (biographical, generic)
const EXCLUDE_CONTEXT_PATTERNS = [
  /n[ée]e?\s+(?:le\s+\d+\s+\w+\s+\d+\s+)?[àa]\s+/i,
  /originaire\s+d[e']/i,
  /natif\s+d[e']/i,
  /grandit?\s+[àa]/i,
  /etudes?\s+[àa]/i,
  /universite\s+d[e']/i,
  /salle\s+de\s+/i, // "salle de bains"
  /lycee\s+d[e']/i,
  /college\s+d[e']/i,
];

function hasEventContext(text: string, matchPos: number, matchLen: number): boolean {
  // Check within 150 chars before and after the location match
  const radius = 150;
  const start = Math.max(0, matchPos - radius);
  const end = Math.min(text.length, matchPos + matchLen + radius);
  const surrounding = text.slice(start, end);

  return EVENT_KEYWORDS.some((kw) => surrounding.includes(kw));
}

function hasExcludeContext(text: string, matchPos: number): boolean {
  const before = text.slice(Math.max(0, matchPos - 80), matchPos);
  return EXCLUDE_CONTEXT_PATTERNS.some((p) => p.test(before));
}

function findLocationInText(
  normalizedText: string,
  communeKey: string,
  requirePreposition: boolean
): number {
  if (requirePreposition) {
    // Must appear after a spatial preposition
    const preps = [
      `(?:^|[\\s,;(])(?:a|de|du|d')\\s+`,
      `(?:^|[\\s,;(])(?:dans|pres\\s+de|proche\\s+de)\\s+`,
      `(?:^|[\\s,;(])(?:commune\\s+de|ville\\s+de)\\s+`,
    ];
    for (const prep of preps) {
      const regex = new RegExp(
        prep + escapeRegex(communeKey) + `(?:[\\s,;).'\\-]|$)`,
        "gi"
      );
      const match = regex.exec(normalizedText);
      if (match) return match.index;
    }
    return -1;
  }

  // Direct word boundary match for major cities
  const regex = new RegExp(
    `(?:^|[\\s,;('\\-])${escapeRegex(communeKey)}(?:[\\s,;).'\\-]|$)`,
    "gi"
  );
  const match = regex.exec(normalizedText);
  return match ? match.index : -1;
}

function extractLocations(
  text: string,
  lookups: ReturnType<typeof buildLookups>
): FoundLocation[] {
  const { byName, majorCities, departments } = lookups;
  const found = new Map<string, FoundLocation>();
  const normalizedText = normalize(text);

  // Find departments mentioned in text for disambiguation
  const depsInText = new Set<string>();
  for (const [depName, depInfo] of departments) {
    if (depName.length < 5) continue;
    if (normalizedText.includes(depName)) {
      depsInText.add(depInfo.dep);
    }
  }

  // Process all commune names
  for (const [communeKey, candidates] of byName) {
    if (communeKey.length < 4) continue;
    if (EXCLUDED_COMMUNES.has(communeKey)) continue;
    if (!normalizedText.includes(communeKey)) continue;

    const isMajor = majorCities.has(communeKey);
    const matchPos = findLocationInText(normalizedText, communeKey, !isMajor);
    if (matchPos === -1) continue;

    // Must NOT be in an exclude context (birth, school, etc.)
    if (hasExcludeContext(normalizedText, matchPos)) continue;

    // Must be near an event keyword
    if (!hasEventContext(normalizedText, matchPos, communeKey.length)) continue;

    // Disambiguate
    let best: Commune | null = null;
    if (candidates.length === 1) {
      best = candidates[0];
    } else {
      for (const c of candidates) {
        if (depsInText.has(c.dep)) { best = c; break; }
      }
      if (!best) best = candidates.reduce((a, b) => (a.pop > b.pop ? a : b));
    }

    if (best) {
      const key = `${best.nom}|${best.dep}`;
      if (!found.has(key)) {
        found.set(key, {
          communeName: best.nom,
          department: best.dep,
          departmentName: best.nomDep,
          latitude: best.lat,
          longitude: best.lng,
        });
      }
    }
  }

  return [...found.values()];
}

async function main() {
  console.log("Loading communes dataset...");
  const communesRaw = JSON.parse(
    readFileSync(resolve(__dirname, "../data/communes.json"), "utf-8")
  ) as Commune[];
  console.log(`Loaded ${communesRaw.length} communes.`);

  const lookups = buildLookups(communesRaw);
  console.log(`Major cities (pop >= 50k): ${lookups.majorCities.size}`);

  const prisma = new PrismaClient();

  try {
    const episodes = await prisma.episode.findMany({
      select: { id: true, title: true, description: true, wikiSummary: true },
    });

    console.log(`\nProcessing ${episodes.length} episodes...`);
    let withLocations = 0;
    let totalLocations = 0;

    if (!dryRun) {
      await prisma.episodeLocation.deleteMany();
    }

    for (const ep of episodes) {
      const text = [ep.description, ep.wikiSummary].filter(Boolean).join(" ");
      if (!text) continue;

      const locations = extractLocations(text, lookups);
      if (locations.length === 0) continue;

      withLocations++;
      totalLocations += locations.length;

      if (dryRun) {
        console.log(
          `  ${ep.title}: ${locations.map((l) => `${l.communeName} (${l.departmentName})`).join(", ")}`
        );
      } else {
        await prisma.episodeLocation.createMany({
          data: locations.map((l) => ({
            episodeId: ep.id,
            communeName: l.communeName,
            department: l.department,
            departmentName: l.departmentName,
            latitude: l.latitude,
            longitude: l.longitude,
            isPrimary: false,
          })),
        });
        console.log(`  ✓ ${ep.title}: ${locations.length} location(s)`);
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Episodes with locations: ${withLocations} / ${episodes.length}`);
    console.log(`Total locations extracted: ${totalLocations}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
