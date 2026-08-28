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

test("exercise cards switch directly between full and compact modes", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /type ExerciseCardMode = "full" \| "compact"/);
  assert.match(trainingApp, /const nextMode: ExerciseCardMode = isFull \? "compact" : "full"/);
  assert.doesNotMatch(trainingApp, /mode === "summary"/);
  assert.match(trainingApp, /data-card-mode={mode}/);
  assert.match(trainingApp, /!isCompact && \(/);
  assert.match(trainingApp, /!isCompact && <div className="recommendation-strip smart-recommendation"/);
  assert.match(trainingApp, /\{isFull && \(/);
  assert.match(styles, /\.exercise-card\.mode-compact/);
  assert.match(styles, /contain-intrinsic-size:\s*82px/);
});

test("workouts open only the first exercise and advance one full card at a time", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /index === 0 \? "full" : "compact"/);
  assert.match(trainingApp, /exercise\.id === nextExercise\?\.id \? "full" : "compact"/);
  assert.match(trainingApp, /Nästa övning/);
  assert.match(trainingApp, /Alla övningar genomgångna/);
  assert.match(trainingApp, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(trainingApp, /id="workout-finish"/);
  assert.match(styles, /\.exercise-next-action/);
});

test("compact workout cards support touch drag reordering with durable per-pass order", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /exerciseOrder: Record<string, string\[\]>/);
  assert.match(trainingApp, /effectiveProgram\(activeProgramDefinition\.days, state\.exerciseSwaps, state\.exerciseOrder, state\.exerciseSettings\)/);
  assert.match(trainingApp, /onPointerDown={onDragStart}/);
  assert.match(trainingApp, /document\.elementFromPoint/);
  assert.match(trainingApp, /onReorder\(activePass\.id, orderedExerciseIdsRef\.current\)/);
  assert.match(trainingApp, /aria-keyshortcuts="ArrowUp ArrowDown"/);
  assert.match(trainingApp, /className="exercise-compact-thumbnail"/);
  assert.match(trainingApp, /<Image src={exercise\.imageStart} alt="" fill sizes="46px" unoptimized \/>/);
  assert.match(styles, /\.exercise-card\.mode-compact \.exercise-drag-handle/);
  assert.match(styles, /grid-template-columns:\s*46px minmax\(0, 1fr\) 52px 62px/);
  assert.match(styles, /grid-template-columns:\s*46px minmax\(0, 1fr\) 180px 62px/);
  assert.match(styles, /\.exercise-compact-thumbnail/);
  assert.match(styles, /\.exercise-card\.mode-compact \.exercise-drag-handle[\s\S]*?width:\s*100%/);
  assert.match(styles, /touch-action:\s*none/);
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
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
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
  assert.match(styles, /html\[data-theme="light"\] \.card-surface/);
  assert.match(styles, /html\[data-theme="light"\] \.workout-hero/);
  assert.match(styles, /html\[data-theme="light"\] \.plan-card/);
  assert.match(styles, /html\[data-theme="light"\] \.profile-hero/);
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

test("bulk logs Swedish daily calorie and protein summaries across dates", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /function parseBulkDaySummary/);
  assert.match(trainingApp, /Bulklogga flera dagar/);
  assert.match(trainingApp, /Importerad dagssumma/);
  assert.match(trainingApp, /bulk-day-summary-/);
  assert.match(trainingApp, /tusentalsmellanslag/);
  assert.match(trainingApp, /localizedNumber/);
  assert.match(styles, /\.bulk-day-preview/);
  assert.match(styles, /\.bulk-day-existing-note/);
});

test("shows complete workout and daily health history under progress", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /type DailyHealthEntry/);
  assert.match(trainingApp, /exercises\?: Array/);
  assert.match(trainingApp, /history: \[historyEntry, \.\.\.current\.history\]\.slice\(0, 500\)/);
  assert.match(trainingApp, /Framsteg & historik/);
  assert.match(trainingApp, /ALLA TRÄNINGSDAGAR/);
  assert.match(trainingApp, /ALLT DAG FÖR DAG/);
  assert.match(trainingApp, /Fettmassa/);
  assert.match(trainingApp, /Muskelmassa/);
  assert.match(trainingApp, /Kreatin/);
  assert.match(trainingApp, /Vitaminer/);
  assert.match(styles, /\.daily-checkin-card/);
  assert.match(styles, /\.workout-history-item/);
  assert.match(styles, /\.daily-overview-row/);
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

test("keeps durable and isolated data for named profiles", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const owner = await readFile(new URL("../app/lib/owner.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /joxo-profile-directory-v1/);
  assert.match(trainingApp, /joxo-training-profile-v2:/);
  assert.match(trainingApp, /joxo-food-profile-v3:/);
  assert.match(trainingApp, /LEGACY_OWNER_BACKUP_KEY/);
  assert.match(trainingApp, /migrateLegacyLocalData/);
  assert.ok((trainingApp.match(/"x-joxo-owner"/g)?.length ?? 0) >= 9);
  assert.match(trainingApp, /Vem tränar idag\?/);
  assert.match(trainingApp, /Skapa en helt ny profil/);
  assert.match(trainingApp, /Anslut med profilkod/);
  assert.match(trainingApp, /Privat profilkod/);
  assert.match(owner, /request\.headers\.get\("x-joxo-owner"\)/);
  assert.ok(owner.indexOf('request.headers.get("x-joxo-owner")') < owner.indexOf('request.headers.get("oai-authenticated-user-email")'));
  assert.match(styles, /\.profile-gate-grid/);
  assert.match(styles, /\.profile-recovery/);
});

test("locks individual profiles and only changes profile after logout", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const profileView = trainingApp.slice(trainingApp.indexOf("function ProfileView"), trainingApp.indexOf("function BadgeCheckIcon"));

  assert.match(trainingApp, /PBKDF2/);
  assert.match(trainingApp, /SHA-256/);
  assert.match(trainingApp, /PASSWORD_ITERATIONS = 120_000/);
  assert.match(trainingApp, /verifyProfilePassword/);
  assert.match(trainingApp, /Fel lösenord\. Försök igen\./);
  assert.match(trainingApp, /Lösenord krävs nästa gång någon väljer din profil/);
  assert.match(trainingApp, /Logga ut/);
  assert.match(trainingApp, /Gå tillbaka till profilväljaren/);
  assert.doesNotMatch(profileView, /onSwitch|onCreate|onConnect|Vem loggar idag/);
  assert.match(styles, /\.profile-lock-badge/);
  assert.match(styles, /\.profile-password-form/);
  assert.match(styles, /\.profile-logout-action/);
});

test("connects the Today week strip to completed workouts by calendar date", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /function isoWeekNumber/);
  assert.match(trainingApp, /function calendarWeek/);
  assert.match(trainingApp, /VECKA \{week\.number\}/);
  assert.match(trainingApp, /stockholmDateKey\(entry\.date\)/);
  assert.match(trainingApp, /passesByDate\.get\(day\.dateKey\)/);
  assert.match(trainingApp, /dateKey === todayKey/);
  assert.match(trainingApp, /Mån.*Tis.*Ons.*Tor.*Fre.*Lör.*Sön/);
  assert.match(styles, /\.week-date b/);
});

test("opens editable day details from the Today week strip", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /onSelectDay\(day\.dateKey\)/);
  assert.match(trainingApp, /function DayDetailSheet/);
  assert.match(trainingApp, /function WorkoutHistoryEditSheet/);
  assert.match(trainingApp, /Granska och redigera allt som hör till dagen/);
  assert.match(trainingApp, /Lägg till pass manuellt/);
  assert.match(trainingApp, /Lägg till mat/);
  assert.match(trainingApp, /Vätska/);
  assert.match(trainingApp, /Fettmassa/);
  assert.match(trainingApp, /Muskelmassa/);
  assert.match(trainingApp, /Kreatin taget/);
  assert.match(trainingApp, /Vitaminer tagna/);
  assert.match(trainingApp, /saveWorkoutHistory/);
  assert.match(trainingApp, /saveDailyHealth/);
  assert.match(styles, /\.day-detail-sheet/);
  assert.match(styles, /\.day-health-form/);
});

test("rotates rich Joxo PT guidance and keeps the next workout marker movable", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const coachImage = await readFile(new URL("../public/coach/joxo-motivation-v1.png", import.meta.url));

  assert.match(trainingApp, /const COACH_TIPS: CoachTip\[]/);
  assert.ok((trainingApp.match(/category: "(?:Träning|Teknik|Progression|Återhämtning|Kost|Mindset)"/g)?.length ?? 0) >= 24);
  assert.match(trainingApp, /coachTipForDate/);
  assert.match(trainingApp, /Ge mig ett nytt tips/);
  assert.match(trainingApp, /youtube\.com\/watch\?v=/);
  assert.match(trainingApp, /joxo-motivation-v1\.png/);
  assert.match(trainingApp, /DU ÄR HÄR · NÄSTA PASS/);
  assert.match(trainingApp, /Flytta hit/);
  assert.match(trainingApp, /onSetNext=\{\(day\)/);
  assert.match(styles, /\.coach-inspiration/);
  assert.match(styles, /\.coach-video-card/);
  assert.match(styles, /\.plan-card\.current/);
  assert.match(styles, /\.plan-marker-row/);
  assert.equal(coachImage.toString("ascii", 1, 4), "PNG");
  assert.ok(coachImage.length > 500_000);
});

test("starts with a Netflix-style profile gate and per-profile fitness onboarding", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(trainingApp, /function ProfileGate/);
  assert.match(trainingApp, /Vem tränar idag\?/);
  assert.match(trainingApp, /Lägg till/);
  assert.match(trainingApp, /Har du redan en profil\? Anslut med profilkod/);
  assert.match(trainingApp, /function ProfileOnboarding/);
  assert.match(trainingApp, /STEG \{step \+ 1\} AV 3/);
  assert.match(trainingApp, /Träningsvana/);
  assert.match(trainingApp, /Pass per vecka/);
  assert.match(trainingApp, /Aktivitet utanför gymmet/);
  assert.match(trainingApp, /Skador eller övningar att ta hänsyn till/);
  assert.match(trainingApp, /onboardingCompleted: true/);
  assert.match(styles, /\.profile-gate-grid/);
  assert.match(styles, /\.onboarding-card/);
  assert.match(styles, /\.onboarding-progress/);
});

test("includes the complete professional training, nutrition, progress, backup, and reminder suite", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const barcodeRoute = await readFile(new URL("../app/api/nutrition/barcode/route.ts", import.meta.url), "utf8");
  const recipeRoute = await readFile(new URL("../app/api/nutrition/recipe-import/route.ts", import.meta.url), "utf8");
  const photoRoute = await readFile(new URL("../app/api/nutrition/photo/route.ts", import.meta.url), "utf8");

  for (const text of [
    "Din veckorapport",
    "ÖVNINGSUTVECKLING",
    "SMART SETFÖRSLAG",
    "FAKTISK BELASTNING · 7 DAGAR",
    "VIKTTREND & PROGNOS",
    "ADAPTIVT KOSTMÅL",
    "DATACENTER",
    "Kopiera gårdagen",
    "PRIVATA FRAMSTEGSBILDER",
    "Byt ut",
    "PERSONLIGA PÅMINNELSER",
  ]) assert.match(trainingApp, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  assert.match(trainingApp, /function smartSetPlan/);
  assert.match(trainingApp, /function plateLoading/);
  assert.match(trainingApp, /joxo-backup-v1/);
  assert.match(trainingApp, /Notification\.requestPermission/);
  assert.match(trainingApp, /webkitSpeechRecognition/);
  assert.match(barcodeRoute, /world\.openfoodfacts\.org\/api\/v2\/product/);
  assert.match(barcodeRoute, /User-Agent/);
  assert.match(recipeRoute, /lookup\(url\.hostname/);
  assert.match(recipeRoute, /privateIp/);
  assert.match(recipeRoute, /application\\\/ld\\\+json/);
  assert.match(photoRoute, /\(nutrition\|progress\)/);
  assert.match(styles, /\.coach-report-card/);
  assert.match(styles, /\.nutrition-quick-tools/);
  assert.match(styles, /\.data-center-card/);
});

test("includes exercise library, editable programs, workout routines, Spotify, steps, activities, and BMI", async () => {
  const trainingApp = await readFile(new URL("../app/training-app.tsx", import.meta.url), "utf8");
  const library = await readFile(new URL("../app/lib/training-library.ts", import.meta.url), "utf8");
  const program = await readFile(new URL("../app/lib/program.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const text of [
    "Övningsbanken",
    "Uppvärmning",
    "Stretch",
    "Byt till denna",
    "Nytt program",
    "Byt ut",
    "Dagens steg",
    "Frisbeegolf",
    "Tennis",
    "Fotboll",
    "Musik till passet",
    "BMI",
    "ÖVNINGSBANK & PROGRAMBYGGARE",
    "Mina favoritövningar",
    "Lägg till i pass",
    "Lägg till övning",
    "Ingen maxgräns",
    "ALLA MUSKELGRUPPER",
    "Redigera dagar",
    "Hur många dagar vill du träna?",
    "Så här blir ditt schema",
    "Lägg till övningar först",
    "Ta bort",
  ]) assert.match(trainingApp, new RegExp(text));

  const namesByMuscle = new Map();
  for (const [, name, muscle] of program.matchAll(/e\("[^"]+",\s*"([^"]+)",\s*"([^"]+)"/g)) {
    const names = namesByMuscle.get(muscle) ?? new Set();
    names.add(name);
    namesByMuscle.set(muscle, names);
  }
  for (const [, , , name, muscle] of library.matchAll(/\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/g)) {
    const names = namesByMuscle.get(muscle) ?? new Set();
    names.add(name);
    namesByMuscle.set(muscle, names);
  }
  for (const muscle of ["Bröst", "Rygg", "Axlar", "Triceps", "Biceps", "Säte", "Baksida lår", "Framsida lår", "Vader", "Mage"]) {
    assert.equal(namesByMuscle.get(muscle)?.size, 10, `${muscle} needs exactly ten unique strength exercises`);
  }
  assert.equal([...namesByMuscle.values()].reduce((sum, names) => sum + names.size, 0), 100);
  assert.match(trainingApp, /DeviceMotionEvent/);
  assert.match(trainingApp, /open\.spotify\.com\/embed\/playlist/);
  assert.match(trainingApp, /favoriteExerciseIds: string\[\]/);
  assert.match(trainingApp, /function addExerciseToProgram/);
  assert.match(trainingApp, /function removeExerciseFromProgram/);
  assert.match(trainingApp, /function configureTrainingDays/);
  assert.match(trainingApp, /function estimatedWorkoutMinutes/);
  assert.match(trainingApp, /function estimatedWorkoutDuration/);
  assert.match(trainingApp, /Redigerbar kopia av Joxo Foundation/);
  assert.match(trainingApp, /function ExerciseLibraryPage/);
  assert.match(trainingApp, /function ProgramDaysEditor/);
  assert.match(trainingApp, /10 genomarbetade övningar i varje muskelgrupp/);
  assert.match(trainingApp, /Övningar i \$\{day\.name\}/);
  assert.match(trainingApp, /Byten, tillägg och borttagning sparas direkt/);
  assert.match(trainingApp, /Övningen har redan klara set i det pågående passet/);
  assert.match(trainingApp, /aria-label={`Ta bort \$\{exercise\.name\} från \$\{day\.name\}`}/);
  assert.match(trainingApp, /data-live-exercise-id/);
  assert.match(trainingApp, /Dra för att flytta \$\{exercise\.name\}/);
  assert.match(trainingApp, /function LibraryBuilderCard/);
  assert.match(library, /export const WARMUP_EXERCISES/);
  assert.match(library, /export const STRETCH_EXERCISES/);
  assert.match(library, /function withStrengthDefaults/);
  assert.match(library, /const STRENGTH_VARIANT_SPECS/);
  assert.doesNotMatch(library, /Hammercurl med hantlar|Kabel kickback|Liggande lårcurl|Benpress|Sittande vadpress|Hängande knälyft/);
  assert.match(library, /sets: 3, minReps: 6, maxReps: 6, startReps: 6/);
  assert.doesNotMatch(library, /replacement && replacement\.muscle/);
  assert.match(library, /export function effectiveProgram/);
  assert.match(styles, /\.exercise-library-grid/);
  assert.match(styles, /\.spotify-workout-player/);
  assert.match(styles, /\.workout-routine-card/);
  assert.match(styles, /\.today-motion-grid/);
  assert.match(styles, /\.bmi-card/);
  assert.match(styles, /\.plan-view-switch/);
  assert.match(styles, /\.library-program-builder/);
  assert.match(styles, /\.library-builder-grid/);
  assert.match(styles, /\.program-days-editor/);
  assert.match(styles, /\.day-count-picker/);
  assert.match(styles, /\.live-schedule-grid/);
  assert.match(styles, /\.live-day-exercises/);
  assert.match(styles, /\.live-exercise-drag/);
  assert.match(styles, /\.live-exercise-swap/);
  assert.match(styles, /\.live-exercise-remove/);
  assert.match(styles, /\.live-day-add-exercise/);
});
