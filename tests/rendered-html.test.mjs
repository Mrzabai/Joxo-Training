import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";
import NextImageModule from "next/image.js";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const NextImage = NextImageModule.default ?? NextImageModule;

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

const exerciseNames = [
  "Bänkpress",
  "Sittande kabelrodd",
  "Latsdrag",
  "Shoulder press",
  "Sidolyft i kabel",
  "Triceps pushdown",
  "Biceps curl-maskin",
  "Hip thrust / glute drive",
  "Rumänska marklyft (RDL)",
  "Sittande lårcurl",
  "Benspark / leg extension",
  "Vadpress",
  "Kabelcrunch",
  "Snedbänk hantelpress",
  "Pec deck",
  "Maskinrodd / bröststödd rodd",
  "Neutralt latsdrag",
  "Reverse fly / omvänd pec deck",
  "Triceps extension",
  "Preacher curl",
  "Bulgarian split squat",
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

test("serves exercise images directly without the unavailable image proxy", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");

  assert.match(config, /unoptimized:\s*true/);
  assert.equal(trainingApp.match(/\bunoptimized\b/g)?.length, 6);

  const imageHtml = renderToStaticMarkup(
    React.createElement(NextImage, {
      src: "/exercises/hip-thrust-0.webp",
      alt: "",
      width: 96,
      height: 96,
      unoptimized: true,
    }),
  );
  assert.match(imageHtml, /src="\/exercises\/hip-thrust-0\.webp"/);
  assert.doesNotMatch(imageHtml, /\/_next\/image/);
});

test("includes a detailed guide for every unique exercise", async () => {
  const guides = await readFile(new URL("../app/lib/exercise-guides.ts", import.meta.url), "utf8");
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");

  for (const name of exerciseNames) {
    assert.match(guides, new RegExp(`"${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":\\s*{`), `Missing exercise guide: ${name}`);
  }

  assert.equal(guides.match(/^    summary:/gm)?.length, exerciseNames.length);
  assert.match(trainingApp, /function ExerciseGuideSheet/);
  assert.match(trainingApp, /GÖR SÅ HÄR/);
  assert.match(trainingApp, /PT-TIPS/);
  assert.match(trainingApp, /VANLIGA MISSTAG/);
  assert.match(trainingApp, /onClick={onGuide}/);
});

test("has no active Notion integration, links, or settings", async () => {
  const runtimeFiles = [
    "../app/training-app.tsx",
    "../app/lib/program.ts",
    "../app/layout.tsx",
    "../app/globals.css",
    "../db/schema.ts",
    "../README.md",
  ];

  for (const path of runtimeFiles) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /notion/i, `${path} still contains a Notion reference`);
  }

  await assert.rejects(stat(new URL("../app/api/notion/route.ts", import.meta.url)));
  await assert.rejects(stat(new URL("../.env.example", import.meta.url)));
});

test("includes opaque Joxo icons for iPhone and PWA installs", async () => {
  const icons = [
    ["../public/apple-touch-icon.png", 180],
    ["../public/apple-touch-icon-precomposed.png", 180],
    ["../public/joxo-app-icon-180-20260821.png", 180],
    ["../public/icon-192.png", 192],
    ["../public/joxo-app-icon-192-20260821.png", 192],
    ["../public/icon-512.png", 512],
    ["../public/joxo-app-icon-512-20260821.png", 512],
    ["../public/icon-1024.png", 1024],
    ["../app/apple-icon.png", 180],
    ["../app/icon.png", 512],
  ];

  for (const [path, size] of icons) {
    const image = await readFile(new URL(path, import.meta.url));
    assert.equal(image.toString("ascii", 1, 4), "PNG", `${path} is not a PNG`);
    assert.equal(image.readUInt32BE(16), size, `${path} has the wrong width`);
    assert.equal(image.readUInt32BE(20), size, `${path} has the wrong height`);
    assert.equal(image[25], 2, `${path} must be opaque for a clean iPhone icon`);
  }

  for (const path of ["../public/favicon.ico", "../public/joxo-favicon-20260821.ico"]) {
    const image = await readFile(new URL(path, import.meta.url));
    assert.deepEqual([...image.subarray(0, 4)], [0, 0, 1, 0], `${path} is not a valid ICO file`);
    assert.ok(image.readUInt16LE(4) >= 6, `${path} should contain multiple fallback sizes`);
  }

  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const manifest = await readFile(new URL("../app/manifest.ts", import.meta.url), "utf8");
  assert.match(layout, /\/favicon\.ico\?v=20260821/);
  assert.match(layout, /joxo-app-icon-180-20260821\.png/);
  assert.match(manifest, /joxo-app-icon-192-20260821\.png/);
  assert.match(manifest, /joxo-app-icon-512-20260821\.png/);

  for (const path of [
    "../dist/client/favicon.ico",
    "../dist/client/joxo-favicon-20260821.ico",
    "../dist/client/joxo-app-icon-180-20260821.png",
  ]) {
    assert.ok((await stat(new URL(path, import.meta.url))).size > 5_000, `${path} was not included in the production build`);
  }
});
