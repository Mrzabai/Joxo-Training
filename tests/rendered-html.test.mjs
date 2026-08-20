import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const exerciseImageKeys = [
  "bench-press",
  "seated-cable-row",
  "lat-pulldown",
  "shoulder-press",
  "cable-lateral-raise",
  "triceps-pushdown",
  "machine-biceps-curl",
  "hip-thrust",
  "romanian-deadlift",
  "seated-leg-curl",
  "leg-extension",
  "calf-raise",
  "cable-crunch",
  "incline-dumbbell-press",
  "pec-deck",
  "machine-row",
  "neutral-lat-pulldown",
  "reverse-pec-deck",
  "triceps-extension",
  "preacher-curl",
  "bulgarian-split-squat",
];

test("renders Joxo Training metadata", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /title:\s*"Joxo Training"/i);
  assert.match(layout, /<html lang="sv"/i);
});

test("includes start and end images for every unique exercise", async () => {
  const assetDirectory = new URL("../public/exercises/", import.meta.url);
  const files = new Set(await readdir(assetDirectory));

  assert.equal(
    [...files].filter((file) => file.endsWith(".webp")).length,
    exerciseImageKeys.length * 2,
  );

  for (const key of exerciseImageKeys) {
    for (const frame of [0, 1]) {
      const file = `${key}-${frame}.webp`;
      assert.ok(files.has(file), `Missing exercise image: ${file}`);
      assert.ok((await stat(new URL(file, assetDirectory))).size > 10_000, `Exercise image is unexpectedly small: ${file}`);
    }
  }
});
