import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { promisify } from "node:util";
import ImageKit from "@imagekit/nodejs";
import exifr from "exifr";

const execFileAsync = promisify(execFile);
const IMAGE_EXTS = new Set([".heic", ".heif", ".jpg", ".jpeg", ".png", ".webp"]);

const dryRun = process.argv.includes("--dry-run");
const inputDir = join(homedir(), "Developer/imgkit");
const outPath = resolve(import.meta.dirname, "../../../apps/photos/src/data/photos.json");

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
if (!dryRun && !privateKey) {
  console.error("Missing IMAGEKIT_PRIVATE_KEY (set it in .env or pass --dry-run).");
  process.exit(1);
}

const client = dryRun ? null : new ImageKit({ privateKey });

type GroupedPhotos = Record<string, Record<string, Record<string, unknown>[]>>;

const existingById = new Map<string, Record<string, unknown>>();
try {
  const saved = JSON.parse(await readFile(outPath, "utf8")) as { photos?: GroupedPhotos };
  for (const months of Object.values(saved.photos ?? {})) {
    for (const items of Object.values(months)) {
      for (const item of items) {
        if (typeof item.id === "string") existingById.set(item.id, item);
      }
    }
  }
} catch {
  // First run
}

const files = (await readdir(inputDir))
  .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
  .sort();

const tempDir = await mkdtemp(join(tmpdir(), "imgkit-"));
const grouped: GroupedPhotos = {};

try {
  for (const file of files) {
    const fullPath = join(inputDir, file);
    const id = basename(file, extname(file))
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-");
    const prev = existingById.get(id);

    let entry: Record<string, unknown>;
    let year: number;
    let month: number;

    if (prev?.src && !dryRun) {
      console.log(`[skip] ${file}`);
      entry = prev;
      const d = new Date(typeof prev.capturedAt === "string" ? prev.capturedAt : "");
      year = d.getFullYear();
      month = d.getMonth();
    } else {
      const buf = await readFile(fullPath);
      const exif = (await exifr.parse(buf, { tiff: true, exif: true, gps: false })) ?? {};

      const rawDate = exif.DateTimeOriginal ?? exif.CreateDate ?? (await stat(fullPath)).mtime;
      const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
      year = date.getFullYear();
      month = date.getMonth();

      let w = Number(exif.ExifImageWidth || 4);
      let h = Number(exif.ExifImageHeight || 3);
      const isRotated =
        typeof exif.Orientation === "string"
          ? /90|270/.test(exif.Orientation)
          : exif.Orientation >= 5 && exif.Orientation <= 8;
      if (isRotated) [w, h] = [h, w];

      const focal = exif.FocalLengthIn35mmFormat ?? exif.FocalLength;
      const shutter =
        exif.ExposureTime >= 1
          ? `${Number(exif.ExposureTime.toFixed(1))}s`
          : exif.ExposureTime > 0
            ? `1/${Math.round(1 / exif.ExposureTime)}s`
            : null;

      const settings = [
        focal ? `${Math.round(focal)}mm` : null,
        exif.FNumber ? `f/${Number(exif.FNumber.toFixed(1))}` : null,
        shutter,
        exif.ISO ? `ISO ${exif.ISO}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const make = String(exif.Make ?? "").trim();
      const model = String(exif.Model ?? "").trim();
      const camera =
        model && make && !model.toLowerCase().startsWith(make.toLowerCase())
          ? `${make} ${model}`
          : model || make || "Unknown Camera";

      const ext = extname(file).toLowerCase();
      let src = `dry-run://${id}${ext}`;

      if (dryRun) {
        console.log(`[dry-run] ${file} -> ${date.toISOString().slice(0, 10)}`);
      } else {
        const scrubbed = join(tempDir, `${id}${ext}`);
        await execFileAsync("exiftool", ["-gps:all=", "-o", scrubbed, fullPath]);

        const folder = `/photos/${year}/${String(month + 1).padStart(2, "0")}`;
        console.log(`[upload] ${file} -> ${folder}/${id}${ext}`);
        const res = await client!.files.upload({
          file: createReadStream(scrubbed),
          fileName: `${id}${ext}`,
          folder,
          useUniqueFileName: false,
        });
        src = res.url ?? "";
      }

      entry = {
        id,
        src,
        aspectRatio: Number((w / h).toFixed(3)),
        camera,
        lens: String(exif.LensModel ?? "").trim(),
        settings,
        location: typeof prev?.location === "string" ? prev.location : "",
        capturedAt: date.toISOString().slice(0, 10),
      };
    }

    const yKey = String(year);
    const mKey = String(month);
    grouped[yKey] ??= {};
    grouped[yKey][mKey] ??= [];
    grouped[yKey][mKey].push(entry);
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

const output = { photos: grouped };

if (dryRun) {
  console.log(`\n${JSON.stringify(output, null, 2)}`);
} else {
  await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${files.length} photos to ${outPath}`);
}
