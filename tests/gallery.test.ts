import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import sharp from "sharp";
import { galleryPhotos } from "../src/content/photos";
import { photoDistance, photoPose, wrapPhoto } from "../src/lib/photo-orbit";

test("orbit wraps and chooses a short reversible path across the collection boundary", () => {
  for (const count of [1, 2, 9, 50, 101]) {
    assert.equal(wrapPhoto(-1, count), count - 1);
    assert.equal(wrapPhoto(count, count), 0);
    for (let index = 0; index < count; index++) {
      const distance = photoDistance(index, count - 0.2, count);
      assert.ok(Math.abs(distance) <= count / 2);
      assert.ok(Math.abs(photoDistance(index, count - 0.2 + count, count) - distance) < 1e-9);
    }
  }
  assert.ok(Math.abs(photoDistance(0, 49.8, 50) - 0.2) < 1e-9);
});

test("desktop and mobile photos occupy a dimensional path with a dominant front photograph", () => {
  for (const width of [320, 390, 759, 760, 1440, 2400]) {
    const front = photoPose(0, width, 1, false);
    const side = photoPose(1, width, 1, false);
    const far = photoPose(width < 760 ? 2 : 4, width, 1, false);
    assert.equal(front.x, 0);
    assert.equal(front.z, 0);
    assert.ok(side.z < front.z && far.z < side.z);
    assert.ok(far.opacity < side.opacity && side.opacity < front.opacity);
    assert.ok(Math.abs(side.turn) > 0);
    for (let distance = -5; distance <= 5; distance += 0.25) {
      for (const arrival of [0, 0.3, 0.7, 1]) {
        const pose = photoPose(distance, width, arrival, false);
        assert.ok(Object.values(pose).every(Number.isFinite));
        assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
      }
    }
    const still = photoPose(1, width, 0, true);
    assert.equal(still.turn, 0);
    assert.equal(still.tilt, 0);
    assert.ok(still.opacity > 0);
  }
});

test("every published photograph decodes and contains no private camera metadata or source filenames", async () => {
  assert.ok(galleryPhotos.length > 0);
  assert.equal(new Set(galleryPhotos.map((photo) => photo.id)).size, galleryPhotos.length);
  for (const photo of galleryPhotos) {
    assert.match(photo.src, /^\/gallery\/[a-f0-9]{16}\.webp$/);
    assert.ok(photo.alt && photo.width > 0 && photo.height > 0);
    const bytes = await readFile(`public${photo.src}`);
    const metadata = await sharp(bytes).metadata();
    await sharp(bytes).raw().toBuffer();
    assert.equal(metadata.width, photo.width);
    assert.equal(metadata.height, photo.height);
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.equal(metadata.iptc, undefined);
    assert.equal(metadata.orientation, undefined);
    assert.ok(Math.max(photo.width, photo.height) <= 1800);
  }
  const payload = JSON.stringify(galleryPhotos);
  assert.ok(!payload.includes("WhatsApp"));
  assert.ok(!payload.includes("moksh photos"));
  const published = await readdir("public/gallery");
  assert.equal(published.length, galleryPhotos.length);
});
