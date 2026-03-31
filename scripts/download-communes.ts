import { writeFileSync } from "fs";
import { resolve } from "path";

const CSV_URL =
  "https://geo.api.gouv.fr/communes?fields=nom,code,codeDepartement,departement,centre,population&format=json&geometry=centre";

interface ApiCommune {
  nom: string;
  code: string;
  codeDepartement: string;
  departement: { code: string; nom: string };
  centre?: { type: string; coordinates: [number, number] };
  population?: number;
}

export interface Commune {
  nom: string;
  dep: string;
  nomDep: string;
  lat: number;
  lng: number;
  pop: number;
}

async function main() {
  console.log("Fetching communes from geo.api.gouv.fr...");
  const res = await fetch(CSV_URL, {
    headers: { "User-Agent": "FELA-Scraper/1.0" },
  });

  if (!res.ok) {
    throw new Error(`API returned ${res.status}`);
  }

  const raw: ApiCommune[] = await res.json();
  console.log(`Fetched ${raw.length} communes.`);

  const communes: Commune[] = raw
    .filter((c) => c.centre && c.centre.coordinates)
    .map((c) => ({
      nom: c.nom,
      dep: c.codeDepartement,
      nomDep: c.departement.nom,
      lat: c.centre!.coordinates[1],
      lng: c.centre!.coordinates[0],
      pop: c.population ?? 0,
    }));

  console.log(`Processed ${communes.length} communes with coordinates.`);

  const outPath = resolve(__dirname, "../data/communes.json");
  writeFileSync(outPath, JSON.stringify(communes));
  console.log(`Written to ${outPath} (${(JSON.stringify(communes).length / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
