import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const dryRun = process.argv.includes("--dry-run");

const CRIME_TYPES: { tag: string; patterns: RegExp[] }[] = [
  { tag: "assassinat", patterns: [/assassinat/i, /prémédité/i] },
  { tag: "meurtre", patterns: [/meurtre/i, /homicide/i, /tué/i, /tuée/i] },
  { tag: "viol", patterns: [/\bviol\b/i, /\bviols\b/i, /violé/i, /violée/i, /agression sexuelle/i] },
  { tag: "enlèvement", patterns: [/enlèvement/i, /kidnapping/i, /séquestration/i, /rapt\b/i] },
  { tag: "disparition", patterns: [/disparition/i, /disparu/i, /disparue/i] },
  { tag: "empoisonnement", patterns: [/empoisonn/i, /poison/i, /arsenic/i, /cyanure/i] },
  { tag: "braquage", patterns: [/braquage/i, /cambriolage/i, /hold-up/i, /vol à main armée/i] },
  { tag: "infanticide", patterns: [/infanticide/i, /néonaticide/i] },
  { tag: "parricide", patterns: [/parricide/i] },
  { tag: "matricide", patterns: [/matricide/i] },
  { tag: "fratricide", patterns: [/fratricide/i] },
  { tag: "escroquerie", patterns: [/escroquer/i, /escroquerie/i, /arnaque/i, /abus de confiance/i] },
  { tag: "terrorisme", patterns: [/terroris/i, /attentat/i] },
  { tag: "pédocriminalité", patterns: [/pédophil/i, /pédocrim/i, /abus sexuel.*mineur/i, /abus.*enfant/i] },
  { tag: "crime passionnel", patterns: [/crime passionnel/i, /jalousie/i] },
  { tag: "affaire non résolue", patterns: [/non résolu/i, /non élucidé/i, /cold case/i, /affaire non résolue/i] },
  { tag: "série", patterns: [/tueur en série/i, /serial/i, /série de/i, /récidiv/i] },
  { tag: "erreur judiciaire", patterns: [/erreur judiciaire/i, /acquitté/i, /innocenté/i, /innocent condamné/i] },
  { tag: "incendie", patterns: [/incendie/i, /incendié/i, /pyromane/i] },
  { tag: "arme à feu", patterns: [/fusillade/i, /fusil/i, /arme à feu/i, /revolver/i, /pistolet/i, /carabine/i] },
  { tag: "arme blanche", patterns: [/couteau/i, /poignardé/i, /coup de couteau/i, /arme blanche/i, /lame/i] },
  { tag: "strangulation", patterns: [/strangul/i, /étrangl/i, /asphyxi/i] },
];

function extractCrimeTypes(text: string): string[] {
  const found = new Set<string>();
  for (const { tag, patterns } of CRIME_TYPES) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        found.add(tag);
        break;
      }
    }
  }
  return [...found];
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const episodes = await prisma.episode.findMany({
      select: { id: true, title: true, description: true, wikiSummary: true },
    });

    console.log(`Processing ${episodes.length} episodes...`);
    let updated = 0;

    for (const ep of episodes) {
      const text = [ep.description, ep.wikiSummary].filter(Boolean).join(" ");
      const keywords = extractCrimeTypes(text);

      if (keywords.length === 0) continue;

      if (dryRun) {
        console.log(`  ${ep.title}: ${keywords.join(", ")}`);
      } else {
        await prisma.episode.update({
          where: { id: ep.id },
          data: { keywords },
        });
        console.log(`  ✓ ${ep.title}: ${keywords.join(", ")}`);
      }
      updated++;
    }

    console.log(`\n${updated} episodes ${dryRun ? "would be" : ""} tagged.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
