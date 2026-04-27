import sharp from "sharp";

/**
 * Normalize a portrait image:
 * - Decode JPEG / PNG / WEBP input
 * - Resize so the long edge is <= 600px (no upscaling)
 * - Re-encode as progressive JPEG, quality 85
 * - Strip all metadata (EXIF, ICC apart from sRGB, comments)
 *
 * Throws if the input is not a valid image. Caller should try/catch.
 */
export async function processPortraitImage(inputBuffer: Buffer): Promise<Buffer> {
  // sharp strips metadata by default when re-encoding; we explicitly do NOT call
  // withMetadata() / keepMetadata() so EXIF, ICC (non-sRGB), and comments are dropped.
  return sharp(inputBuffer, { failOn: "error" })
    .rotate() // honor EXIF orientation before stripping it
    .resize({
      width: 600,
      height: 600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 85,
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer();
}
