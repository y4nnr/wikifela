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

interface CuratedLocation {
  city: string;
  department: string;
}

interface CuratedEpisode {
  id: number;
  locations: CuratedLocation[];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildCommuneIndex(communes: Commune[]): Map<string, Commune[]> {
  const index = new Map<string, Commune[]>();
  for (const c of communes) {
    const key = normalize(c.nom);
    if (!index.has(key)) index.set(key, []);
    index.get(key)!.push(c);
  }
  return index;
}

function geocode(
  city: string,
  department: string,
  communeIndex: Map<string, Commune[]>
): { lat: number; lng: number; dep: string; nomDep: string } | null {
  const normCity = normalize(city);
  const normDep = normalize(department);

  const candidates = communeIndex.get(normCity);
  if (!candidates) return null;

  // Try to match department
  for (const c of candidates) {
    if (
      normalize(c.nomDep) === normDep ||
      c.dep === department ||
      normalize(c.nomDep).includes(normDep) ||
      normDep.includes(normalize(c.nomDep))
    ) {
      return { lat: c.lat, lng: c.lng, dep: c.dep, nomDep: c.nomDep };
    }
  }

  // If only one candidate, use it
  if (candidates.length === 1) {
    return {
      lat: candidates[0].lat,
      lng: candidates[0].lng,
      dep: candidates[0].dep,
      nomDep: candidates[0].nomDep,
    };
  }

  // Pick highest population as fallback
  const best = candidates.reduce((a, b) => (a.pop > b.pop ? a : b));
  return { lat: best.lat, lng: best.lng, dep: best.dep, nomDep: best.nomDep };
}

async function main() {
  console.log("Loading communes dataset...");
  const communes: Commune[] = JSON.parse(
    readFileSync(resolve(__dirname, "../data/communes.json"), "utf-8")
  );
  const communeIndex = buildCommuneIndex(communes);
  console.log(`Loaded ${communes.length} communes.`);

  // Merge all batch files
  console.log("Loading curated location batches...");
  const allEpisodes: CuratedEpisode[] = [];
  for (let i = 0; i <= 5; i++) {
    const path = `/tmp/fela_locations_${i}.json`;
    try {
      const batch: CuratedEpisode[] = JSON.parse(readFileSync(path, "utf-8"));
      allEpisodes.push(...batch);
      console.log(`  Batch ${i}: ${batch.length} episodes`);
    } catch (err) {
      console.error(`  Batch ${i}: MISSING or invalid`);
    }
  }
  console.log(`Total: ${allEpisodes.length} episodes loaded.`);

  const prisma = new PrismaClient();
  let geocoded = 0;
  let failed = 0;
  let episodesWithLocs = 0;
  let totalLocs = 0;

  try {
    if (!dryRun) {
      console.log("Clearing existing locations...");
      await prisma.episodeLocation.deleteMany();
    }

    for (const ep of allEpisodes) {
      if (ep.locations.length === 0) continue;

      const resolved: {
        communeName: string;
        department: string;
        departmentName: string;
        latitude: number;
        longitude: number;
      }[] = [];

      for (const loc of ep.locations) {
        const geo = geocode(loc.city, loc.department, communeIndex);
        if (geo) {
          resolved.push({
            communeName: loc.city,
            department: geo.dep,
            departmentName: geo.nomDep,
            latitude: geo.lat,
            longitude: geo.lng,
          });
          geocoded++;
        } else {
          failed++;
          if (dryRun) {
            console.log(`    ⚠ Could not geocode: ${loc.city} (${loc.department})`);
          }
        }
      }

      if (resolved.length === 0) continue;

      episodesWithLocs++;
      totalLocs += resolved.length;

      if (dryRun) {
        console.log(
          `  ID=${ep.id}: ${resolved.map((l) => `${l.communeName} (${l.departmentName})`).join(", ")}`
        );
      } else {
        await prisma.episodeLocation.createMany({
          data: resolved.map((l) => ({
            episodeId: ep.id,
            communeName: l.communeName,
            department: l.department,
            departmentName: l.departmentName,
            latitude: l.latitude,
            longitude: l.longitude,
            isPrimary: false,
          })),
        });
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Episodes with locations: ${episodesWithLocs}`);
    console.log(`Total locations: ${totalLocs}`);
    console.log(`Geocoded: ${geocoded}, Failed: ${failed}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
