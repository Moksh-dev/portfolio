import { createHash } from "node:crypto";
import { access, readdir, readFile, mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(await readFile(new URL("./gallery.config.json", import.meta.url), "utf8"));
const source = path.resolve(root, config.sourceDirectory);
const output = path.join(root, "public", "gallery");
const supported = /\.(jpe?g|png|webp|avif)$/i;

async function discover(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await discover(relative));
    else if (supported.test(entry.name)) files.push(path.relative(source, relative).replaceAll("\\", "/"));
  }
  return files;
}

let discovered;
try {
  discovered = (await discover(source)).sort((a, b) => a.localeCompare(b, "en"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  // A clean hosting checkout uses committed derivatives; private originals
  // are intentionally absent. An empty existing source folder still removes
  // all generated photos, so intentional removals remain predictable.
  const existing = JSON.parse(await readFile(path.join(root, "src", "content", "photos.json"), "utf8"));
  if (!Array.isArray(existing)) throw new Error("The gallery manifest must be an array.");
  for (const photo of existing) {
    if (!/^\/gallery\/[a-f0-9]{16}\.webp$/.test(photo.src)) throw new Error("Invalid gallery asset path.");
    await access(path.join(root, "public", photo.src.slice(1)));
  }
  console.log(`Gallery: private source folder absent; using ${existing.length} committed photographs.`);
  process.exit(0);
}
const included = discovered.filter((file) => !Object.hasOwn(config.exclude, file));
const ordered = [...config.featured.filter((file) => included.includes(file)), ...included.filter((file) => !config.featured.includes(file))];
await mkdir(output, { recursive: true });
const photos = [];
const seen = new Set();
let duplicates = 0;

for (const file of ordered) {
  const input = await readFile(path.join(source, file));
  // Public assets contain no source path, camera filename, EXIF, GPS, or XMP.
  const id = createHash("sha256").update(input).update(String(config.rotate[file] ?? 0)).digest("hex").slice(0, 16);
  if (seen.has(id)) { duplicates++; continue; }
  seen.add(id);
  const destination = path.join(output, `${id}.webp`);
  const existing = await readFile(destination).catch(() => null);
  if (existing) {
    const info = await sharp(existing).metadata();
    photos.push({ id, src: `/gallery/${id}.webp`, width: info.width, height: info.height, alt: config.alt[file] ?? "Photograph from the personal collection" });
    continue;
  }
  let pipeline = sharp(input).autoOrient();
  if (config.rotate[file]) pipeline = pipeline.rotate(config.rotate[file]);
  const { data, info } = await pipeline.resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
  await writeFile(destination, data);
  photos.push({ id, src: `/gallery/${id}.webp`, width: info.width, height: info.height, alt: config.alt[file] ?? "Photograph from the personal collection" });
}

// Only generated, anonymously named assets in this dedicated directory are pruned.
// The source directory is never written to.
for (const file of await readdir(output)) {
  if (/^[a-f0-9]{16}\.webp$/.test(file) && !seen.has(file.slice(0, -5))) await unlink(path.join(output, file));
}
const manifestPath = path.join(root, "src", "content", "photos.json");
const manifest = `${JSON.stringify(photos, null, 2)}\n`;
if (await readFile(manifestPath, "utf8").catch(() => "") !== manifest) await writeFile(manifestPath, manifest);
console.log(`Gallery: ${discovered.length} supported images discovered, ${photos.length} photographs prepared, ${discovered.length - included.length} excluded, ${duplicates} exact duplicates omitted. Originals preserved.`);
