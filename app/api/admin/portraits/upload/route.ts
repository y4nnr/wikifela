import { NextRequest, NextResponse } from "next/server";
import { writeFile, rename, access } from "fs/promises";
import { existsSync } from "fs";
import { resolve } from "path";
import { checkAdminAuth, unauthorized } from "@/lib/admin-auth";
import { processPortraitImage } from "@/lib/image-processing";

const FILENAME_REGEX = /^[a-zA-Z0-9_-]+\.jpg$/;
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB
const PORTRAITS_DIR = resolve(process.cwd(), "public/portraits");

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Multipart invalide" }, { status: 400 });
  }

  const file = form.get("file");
  const filename = (form.get("filename") as string | null)?.trim() || "";
  const mode = (form.get("mode") as string | null) || "new";

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Fichier requis" }, { status: 400 });
  }

  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json(
      { ok: false, error: `Fichier trop volumineux (max ${MAX_INPUT_BYTES / 1024 / 1024} Mo)` },
      { status: 400 }
    );
  }

  if (!FILENAME_REGEX.test(filename)) {
    return NextResponse.json(
      { ok: false, error: "Nom de fichier invalide (lettres/chiffres/_/- + .jpg)" },
      { status: 400 }
    );
  }

  const targetPath = resolve(PORTRAITS_DIR, filename);

  // Collision check (only in "new" mode)
  if (mode === "new" && existsSync(targetPath)) {
    return NextResponse.json(
      { ok: false, error: "Ce fichier existe deja" },
      { status: 409 }
    );
  }

  // Read file
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // Process
  let processed: Buffer;
  try {
    processed = await processPortraitImage(inputBuffer);
  } catch (err) {
    console.error("Image processing failed:", err);
    return NextResponse.json(
      { ok: false, error: "Image invalide ou corrompue" },
      { status: 400 }
    );
  }

  // Atomic write: temp path then rename
  const tempPath = resolve(PORTRAITS_DIR, `.tmp-${Date.now()}-${filename}`);
  try {
    await writeFile(tempPath, processed);
    await rename(tempPath, targetPath);
  } catch (err) {
    console.error("Write failed:", err);
    try {
      await access(tempPath);
      const fs = await import("fs/promises");
      await fs.unlink(tempPath);
    } catch {
      // temp file already gone or never created
    }
    return NextResponse.json({ ok: false, error: "Erreur lors de l'enregistrement" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, filename, sizeBytes: processed.length });
}
