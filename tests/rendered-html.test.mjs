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
  assert.ok((trainingApp.match(/\bunoptimized\b/g)?.length ?? 0) >= 6);

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
    "../app/lib/recipes.ts",
    "../app/layout.tsx",
    "../app/globals.css",
    "../app/api/nutrition/analyze/route.ts",
    "../app/api/nutrition/entries/route.ts",
    "../app/api/nutrition/photo/route.ts",
    "../db/schema.ts",
    "../README.md",
  ];

  for (const path of runtimeFiles) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /notion/i, `${path} still contains a Notion reference`);
  }

  await assert.rejects(stat(new URL("../app/api/notion/route.ts", import.meta.url)));

  const migrationDirectory = new URL("../drizzle/", import.meta.url);
  for (const file of await readdir(migrationDirectory)) {
    if (!file.endsWith(".sql")) continue;
    const migration = await readFile(new URL(file, migrationDirectory), "utf8");
    assert.doesNotMatch(migration, /notion/i, `${file} still contains a Notion reference`);
  }
});

test("includes durable local food-database logging, recipes, photos, and theme switching", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const recipes = await readFile(new URL("../app/lib/recipes.ts", import.meta.url), "utf8");
  const analysisRoute = await readFile(new URL("../app/api/nutrition/analyze/route.ts", import.meta.url), "utf8");
  const foodDatabaseSource = await readFile(new URL("../app/lib/food-database.ts", import.meta.url), "utf8");
  const foodDatabase = JSON.parse(await readFile(new URL("../app/data/swedish-foods.json", import.meta.url), "utf8"));
  const popularFoodDatabase = JSON.parse(await readFile(new URL("../app/data/popular-fitness-foods.json", import.meta.url), "utf8"));
  const nutritionMatcher = await readFile(new URL("../app/lib/nutrition-matcher.ts", import.meta.url), "utf8");
  const entryRoute = await readFile(new URL("../app/api/nutrition/entries/route.ts", import.meta.url), "utf8");
  const photoRoute = await readFile(new URL("../app/api/nutrition/photo/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  for (const name of [
    "Bellas carnivore chips",
    "Ostkaka",
    "Protein-matmuffin",
    "Räkpizza med vitlökscrème och dill",
    "Gröt à la Joxo",
    "Overnight oats med blåbär",
  ]) {
    assert.match(recipes, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(trainingApp, /"nutrition", label: "Mat"/);
  assert.match(trainingApp, /Hämta kcal & protein/);
  assert.match(trainingApp, /2 644 livsmedel/);
  assert.match(trainingApp, /2 606 basvaror \+ 38 träningsfavoriter/);
  assert.match(trainingApp, /Stavfel och sammansatta ord går bra/);
  assert.match(trainingApp, /option value="dl">deciliter/);
  assert.match(trainingApp, /Wasa Protein\+/);
  assert.match(trainingApp, /utan externt API/);
  assert.match(trainingApp, /Sparas med loggen/);
  assert.match(trainingApp, /GRANSKA UPPSKATTNINGEN/);
  assert.match(trainingApp, /joxo-theme/);
  assert.match(analysisRoute, /analyzeFoodDescription/);
  assert.match(analysisRoute, /analyzeFoodSearch/);
  assert.match(analysisRoute, /form\.get\("amount"\)/);
  assert.match(analysisRoute, /form\.get\("unit"\)/);
  assert.match(analysisRoute, /food-database/);
  assert.doesNotMatch(analysisRoute, /api\.openai\.com|OPENAI_API_KEY|input_image/);
  assert.match(foodDatabaseSource, /FOOD_DATABASE_META/);
  assert.match(foodDatabaseSource, /householdWeight/);
  assert.match(foodDatabaseSource, /editDistance/);
  assert.match(foodDatabaseSource, /vanilj\|hallon\|jordgubb\|blabar\|citron/);
  assert.equal(foodDatabase.source, "Livsmedelsverkets Livsmedelsdatabas");
  assert.equal(foodDatabase.version, "2026-07-01");
  assert.equal(foodDatabase.count, 2606);
  assert.equal(foodDatabase.foods.length, 2606);
  assert.equal(new Set(foodDatabase.foods.map((food) => food.id)).size, 2606);
  assert.ok(foodDatabase.foods.every((food) => typeof food.kcal === "number" && typeof food.protein === "number"));
  assert.equal(popularFoodDatabase.foods.length, 38);
  assert.equal(new Set(popularFoodDatabase.foods.map((food) => food.id)).size, 38);
  assert.ok(popularFoodDatabase.foods.every((food) => typeof food.sourceUrl === "string" && food.sourceUrl.startsWith("https://")));
  const vanillaQuark = popularFoodDatabase.foods.find((food) => food.aliases.includes("vaniljkvarg"));
  assert.equal(vanillaQuark?.kcal, 59);
  assert.equal(vanillaQuark?.protein, 10);
  assert.equal(vanillaQuark?.portionAmount, 150);
  assert.ok(popularFoodDatabase.foods.some((food) => food.aliases.includes("wasa protein")));
  const lowCalorieRaspberryJam = popularFoodDatabase.foods.find((food) => food.aliases.includes("lågkalori hallonsylt"));
  assert.equal(lowCalorieRaspberryJam?.brand, "ÖNOS");
  assert.equal(lowCalorieRaspberryJam?.kcal, 40);
  assert.match(nutritionMatcher, /overnight oats/);
  assert.match(nutritionMatcher, /matchSavedRecipe/);
  assert.match(entryRoute, /nutritionEntries/);
  assert.match(photoRoute, /nutritionPhotos/);
  assert.match(schema, /"nutrition_entries"/);
  assert.match(schema, /pgTable/);
  assert.match(schema, /"nutrition_photos"/);
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.dependencies["@neondatabase/serverless"], "^1.0.2");
  assert.equal(packageJson.devDependencies.vinext, undefined);
  assert.equal(packageJson.devDependencies.wrangler, undefined);
});

test("supports editing meals and ingredients with durable daily history comparisons", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const entryRoute = await readFile(new URL("../app/api/nutrition/entries/route.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /function NutritionEditSheet/);
  assert.match(trainingApp, /REDIGERA MATLOGG/);
  assert.match(trainingApp, /Måltid och råvaror/);
  assert.match(trainingApp, /Lägg till råvara/);
  assert.match(trainingApp, /Spara ändringar/);
  assert.match(trainingApp, /method: isExisting \? "PUT" : "POST"/);
  assert.match(trainingApp, /details: \{ \.\.\.entry\.details, items: storedItems \}/);
  assert.match(trainingApp, /SPARADE DAGAR/);
  assert.match(trainingApp, /function NutritionCalendar/);
  assert.match(trainingApp, /Öppna kalender/);
  assert.match(trainingApp, /Dagar med sparade loggar/);
  assert.match(trainingApp, /Jämför dagar/);
  assert.match(trainingApp, /nutritionDaySummaries/);
  assert.match(trainingApp, /nutrition\/entries\?limit=5000/);
  assert.match(entryRoute, /export async function PUT/);
  assert.match(entryRoute, /Math\.min\(5000/);
  assert.match(entryRoute, /eq\(nutritionEntries\.id, entry\.id\).*eq\(nutritionEntries\.owner, owner\)/s);
  assert.match(styles, /\.nutrition-comparison/);
  assert.match(styles, /\.nutrition-calendar-grid/);
  assert.match(styles, /\.nutrition-edit-sheet/);
  assert.match(styles, /\.meal-edit/);
});

test("parses and logs several pasted macro rows as one editable meal", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /function parseBulkMacroText/);
  assert.match(trainingApp, /Klistra in flera makron/);
  assert.match(trainingApp, /Läs in och summera/);
  assert.match(trainingApp, /Kcal och protein är hämtade direkt från de inklistrade värdena/);
  assert.match(trainingApp, /proteinMatch/);
  assert.match(styles, /\.bulk-macro-panel/);
  assert.match(styles, /\.bulk-macro-toggle/);
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
  const manifest = await readFile(new URL("../app/joxo-v8.webmanifest/route.ts", import.meta.url), "utf8");
  const iconSource = await readFile(new URL("../app/lib/app-icon.ts", import.meta.url), "utf8");
  const encodedIcon = iconSource.match(/data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)/)?.[1];

  assert.ok(encodedIcon, "The private iPhone install needs an inline icon");
  assert.match(Buffer.from(encodedIcon, "base64").toString("utf8"), /stroke="#c7ff32"/);
  assert.match(layout, /APP_ICON_DATA_URL/);
  assert.match(layout, /APPLE_TOUCH_ICON_PATH/);
  assert.match(layout, /apple-touch-icon-precomposed/);
  assert.match(layout, /sizes="180x180" href={APPLE_TOUCH_ICON_PATH}/);
  assert.match(iconSource, /joxo-app-icon-180-20260821\.png\?rev=joxo-v9/);
  assert.match(layout, /APP_INSTALL_VERSION}\.webmanifest/);
  assert.match(manifest, /id:\s*`\/\$\{APP_INSTALL_VERSION\}`/);
  assert.match(manifest, /start_url:\s*`\/\?install=\$\{APP_INSTALL_VERSION\}`/);
  assert.match(manifest, /APP_ICON_DATA_URL/);
  assert.match(manifest, /joxo-app-icon-192-20260821\.png/);
  assert.match(manifest, /joxo-app-icon-512-20260821\.png/);

  assert.ok((await stat(new URL("../.next/BUILD_ID", import.meta.url))).size > 0, "Next.js production build was not created");
  for (const path of ["../public/favicon.ico", "../public/joxo-favicon-20260821.ico", "../public/joxo-app-icon-180-20260821.png"]) {
    assert.ok((await stat(new URL(path, import.meta.url))).size > 5_000, `${path} is missing from public assets`);
  }
});
