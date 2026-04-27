import { PrismaClient } from "@prisma/client";
import { readdir, readFile, writeFile, mkdir, rename, rm, stat } from "fs/promises";
import { existsSync } from "fs";
import { resolve, parse } from "path";
import { processPortraitImage } from "../lib/image-processing";

const prisma = new PrismaClient();
const PORTRAITS_DIR = resolve(process.cwd(), "public/portraits");

interface FileStat {
  filename: string;
  newFilename: string;
  inputBytes: number;
  outputBytes: number;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, " ");
}

async function dirSize(dir: string): Promise<number> {
  const entries = await readdir(dir, { withFileTypes: true });
  let total = 0;
  for (const e of entries) {
    if (e.isFile()) {
      const s = await stat(resolve(dir, e.name));
      total += s.size;
    }
  }
  return total;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

async function main() {
  const start = Date.now();

  // 1. Collect input files (skip dotfiles, only image extensions)
  const all = await readdir(PORTRAITS_DIR, { withFileTypes: true });
  const inputFiles = all
    .filter((e) => e.isFile() && !e.name.startsWith(".") && /\.(jpe?g|png|webp)$/i.test(e.name))
    .map((e) => e.name);

  console.log(`Found ${inputFiles.length} input files in public/portraits/`);
  if (inputFiles.length === 0) {
    console.log("Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  const inputDirSize = await dirSize(PORTRAITS_DIR);

  // 2. Set up staging dir (clean if exists)
  const stagingDir = resolve(PORTRAITS_DIR, ".staging");
  if (existsSync(stagingDir)) {
    console.log("Removing stale .staging/ directory...");
    await rm(stagingDir, { recursive: true, force: true });
  }
  await mkdir(stagingDir, { recursive: true });

  // 3. Process each file into staging
  const stats: FileStat[] = [];
  const failures: { filename: string; error: string }[] = [];

  for (const filename of inputFiles) {
    try {
      const inputPath = resolve(PORTRAITS_DIR, filename);
      const inputBuffer = await readFile(inputPath);
      const processed = await processPortraitImage(inputBuffer);

      // Force .jpg extension on output
      const { name } = parse(filename);
      const newFilename = `${name}.jpg`;
      const stagedPath = resolve(stagingDir, newFilename);
      await writeFile(stagedPath, processed);

      stats.push({
        filename,
        newFilename,
        inputBytes: inputBuffer.length,
        outputBytes: processed.length,
      });
    } catch (err) {
      failures.push({ filename, error: String(err) });
      console.error(`  FAIL ${filename}: ${err}`);
    }
  }

  // 4. Abort if any failed — don't touch originals
  if (failures.length > 0) {
    console.error(`\nABORT: ${failures.length} file(s) failed to process. Originals unchanged.`);
    failures.forEach((f) => console.error(`  ${f.filename}: ${f.error}`));
    await rm(stagingDir, { recursive: true, force: true });
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Processed ${stats.length}/${inputFiles.length} files into staging.`);

  // 5. Atomic move:
  //    a) Move originals to .backup-<timestamp>/
  //    b) Move staged files into place
  //    c) Update DB rows whose extension changed
  const ts = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const backupDir = resolve(PORTRAITS_DIR, `.backup-${ts}`);
  await mkdir(backupDir, { recursive: true });

  for (const filename of inputFiles) {
    await rename(resolve(PORTRAITS_DIR, filename), resolve(backupDir, filename));
  }

  for (const s of stats) {
    await rename(resolve(stagingDir, s.newFilename), resolve(PORTRAITS_DIR, s.newFilename));
  }

  // Clean staging
  await rm(stagingDir, { recursive: true, force: true });

  // 6. DB updates: rows whose imagePath had non-jpg extension
  const dbUpdates: { id: number; old: string; new: string }[] = [];
  for (const s of stats) {
    if (s.filename !== s.newFilename) {
      // Extension changed — find any portrait rows referencing the old filename
      const rows = await prisma.portrait.findMany({
        where: { imagePath: s.filename },
        select: { id: true },
      });
      for (const r of rows) {
        await prisma.portrait.update({
          where: { id: r.id },
          data: { imagePath: s.newFilename },
        });
        dbUpdates.push({ id: r.id, old: s.filename, new: s.newFilename });
      }
    }
  }

  // 7. Report
  const outputDirSize = await dirSize(PORTRAITS_DIR);
  const outputBytes = stats.map((s) => s.outputBytes);
  const inputBytes = stats.map((s) => s.inputBytes);
  const oversized = stats.filter((s) => s.outputBytes > 150 * 1024);

  console.log("\n=== BACKFILL REPORT ===");
  console.log(`Files processed:      ${stats.length}`);
  console.log(`Total size before:    ${pad((inputDirSize / 1024).toFixed(0), 8)} KB (${(inputDirSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Total size after:     ${pad((outputDirSize / 1024).toFixed(0), 8)} KB (${(outputDirSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Reduction:            ${(((inputDirSize - outputDirSize) / inputDirSize) * 100).toFixed(1)}%`);
  console.log(`Median size before:   ${pad((median(inputBytes) / 1024).toFixed(1), 8)} KB`);
  console.log(`Median size after:    ${pad((median(outputBytes) / 1024).toFixed(1), 8)} KB`);
  console.log(`Max output size:      ${pad((Math.max(...outputBytes) / 1024).toFixed(1), 8)} KB`);
  console.log(`Files >150KB:         ${oversized.length}`);
  if (oversized.length > 0) {
    oversized.forEach((s) => console.log(`   - ${s.newFilename}: ${(s.outputBytes / 1024).toFixed(1)} KB`));
  }
  console.log(`DB rows updated:      ${dbUpdates.length}`);
  console.log(`Originals backed up:  ${backupDir}`);
  console.log(`Duration:             ${((Date.now() - start) / 1000).toFixed(2)}s`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("BACKFILL FAILED:", err);
  await prisma.$disconnect();
  process.exit(1);
});
