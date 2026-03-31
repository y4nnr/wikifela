import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

// Manual geocoding for locations outside metropolitan France
const MANUAL_LOCATIONS: Record<string, { lat: number; lng: number; dep: string; nomDep: string }> = {
  // Belgium
  "Marcinelle": { lat: 50.4, lng: 4.44, dep: "BE", nomDep: "Belgique" },
  "Bruxelles": { lat: 50.85, lng: 4.35, dep: "BE", nomDep: "Belgique" },
  "Mons": { lat: 50.45, lng: 3.95, dep: "BE", nomDep: "Belgique" },
  "Namur": { lat: 50.47, lng: 4.87, dep: "BE", nomDep: "Belgique" },
  "Liège": { lat: 50.63, lng: 5.57, dep: "BE", nomDep: "Belgique" },
  // Switzerland
  "Genève": { lat: 46.20, lng: 6.14, dep: "CH", nomDep: "Suisse" },
  "Lausanne": { lat: 46.52, lng: 6.63, dep: "CH", nomDep: "Suisse" },
  "Vevey": { lat: 46.46, lng: 6.84, dep: "CH", nomDep: "Suisse" },
  // Italy
  "Pérouse": { lat: 43.11, lng: 12.39, dep: "IT", nomDep: "Italie" },
  // Germany
  "Berlin": { lat: 52.52, lng: 13.40, dep: "DE", nomDep: "Allemagne" },
  // Monaco
  "Monaco": { lat: 43.73, lng: 7.42, dep: "MC", nomDep: "Monaco" },
  // La Réunion
  "Saint-Denis": { lat: -20.88, lng: 55.45, dep: "974", nomDep: "La Réunion" },
  "Piton Saint-Leu": { lat: -21.19, lng: 55.29, dep: "974", nomDep: "La Réunion" },
  "Sainte-Suzanne": { lat: -20.91, lng: 55.61, dep: "974", nomDep: "La Réunion" },
  // Nouvelle-Calédonie
  "Nouméa": { lat: -22.27, lng: 166.46, dep: "988", nomDep: "Nouvelle-Calédonie" },
  "Île des Pins": { lat: -22.62, lng: 167.48, dep: "988", nomDep: "Nouvelle-Calédonie" },
  // Guyane
  "Cayenne": { lat: 4.94, lng: -52.33, dep: "973", nomDep: "Guyane" },
  // USA
  "New York": { lat: 40.71, lng: -74.01, dep: "US", nomDep: "États-Unis" },
  "Marseille (port)": { lat: 43.30, lng: 5.37, dep: "13", nomDep: "Bouches-du-Rhône" },
  // Canada
  "Montréal": { lat: 45.50, lng: -73.57, dep: "CA", nomDep: "Canada" },
};

// Episodes that need international/overseas locations added
const ADDITIONS: { episodeId: number; locations: { city: string; description: string }[] }[] = [
  { episodeId: 20, locations: [
    { city: "Marcinelle", description: "Lieu de séquestration des victimes dans la cave de Marc Dutroux" },
  ]},
  { episodeId: 56, locations: [
    { city: "New York", description: "Destination finale de l'héroïne dans le réseau de la French Connection" },
  ]},
  { episodeId: 160, locations: [
    { city: "Île des Pins", description: "Lieu des meurtres commis par les frères Konhu en Nouvelle-Calédonie" },
  ]},
  { episodeId: 167, locations: [
    { city: "Mons", description: "Lieu du procès de Peter et Aurore" },
    { city: "Bruxelles", description: "Cour d'assises en appel" },
  ]},
  { episodeId: 176, locations: [
    { city: "Cayenne", description: "Lieu des crimes de Patrick Littorie en Guyane" },
  ]},
  { episodeId: 208, locations: [
    { city: "Saint-Denis", description: "Lieu des crimes de Juliano Verbard à La Réunion" },
  ]},
  { episodeId: 232, locations: [
    { city: "Montréal", description: "Lieu du meurtre commis par Luka Rocco Magnotta" },
    { city: "Berlin", description: "Lieu de l'arrestation de Luka Rocco Magnotta" },
  ]},
  { episodeId: 234, locations: [
    { city: "Pérouse", description: "Lieu du meurtre de Meredith Kercher dans l'affaire Amanda Knox" },
  ]},
  { episodeId: 299, locations: [
    { city: "Monaco", description: "Lieu de résidence d'Hélène Pastor, victime de l'attentat" },
  ]},
  { episodeId: 178, locations: [
    { city: "Vevey", description: "Lieu des meurtres commis dans le canton de Vaud en Suisse" },
  ]},
];

async function main() {
  const prisma = new PrismaClient();
  let added = 0;

  try {
    for (const { episodeId, locations } of ADDITIONS) {
      for (const loc of locations) {
        const geo = MANUAL_LOCATIONS[loc.city];
        if (!geo) {
          console.log(`  ⚠ No coordinates for: ${loc.city}`);
          continue;
        }

        await prisma.episodeLocation.create({
          data: {
            episodeId,
            communeName: loc.city,
            department: geo.dep,
            departmentName: geo.nomDep,
            latitude: geo.lat,
            longitude: geo.lng,
            isPrimary: false,
            eventDescription: loc.description,
          },
        });
        console.log(`  ✓ EP ${episodeId}: ${loc.city} (${geo.nomDep})`);
        added++;
      }
    }

    console.log(`\nAdded ${added} international locations.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
