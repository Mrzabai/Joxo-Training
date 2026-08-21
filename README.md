# Joxo Training

En mobil träningsapp för Jocke med ett personligt fyrdagarsschema, aktiv setloggning, vilotimer, dubbel progression, kostlogg, dagsform och PT-stöd.

## Funktioner

- 4 pass och 27 övningar i ett fristående träningsprogram
- Klickbara övningsbilder med start- och slutläge, steg-för-steg, PT-tips och vanliga misstag
- Vikt, reps och RPE direkt i varje övningskort
- Autosparning i Neon Postgres med lokal offlinekö
- Automatisk vilotimer och passammanfattning
- Progressionsråd som tar hänsyn till reps, RPE och dagsform
- Kalori-, protein- och vattenlogg
- Tålig lokal sökning i 2 606 svenska baslivsmedel och 38 kurerade träningsfavoriter
- Separata mängd- och enhetsval för gram, kilo, deciliter, milliliter, styck, portion, matsked och tesked
- Måltidsbilder som sparas privat tillsammans med loggen
- Installerbar PWA för mobil

## Lokal utveckling

Krav: Node.js 22.13 eller senare.

```bash
npm run install:ci
npm run dev
```

## Databas och Vercel

Appen använder Neon Postgres och Drizzle. Schemat ligger i `db/schema.ts` och migrationer i `drizzle/`.

Kopiera `.env.example` till `.env.local` och fyll i Neon-anslutningarna. Använd den poolade URL:en för `DATABASE_URL` och den direkta URL:en för `DATABASE_URL_UNPOOLED`.

Efter en schemaändring:

```bash
npm run db:generate
npm run db:migrate
```

Varje installation får en slumpad enhetsnyckel i webbläsaren. Träningsdata, matlogg och privata måltidsbilder isoleras med den nyckeln, samtidigt som lokal lagring gör appen användbar om molnsynkningen tillfälligt är nere.

På Vercel ska projektet använda ramverket Next.js och standardkommandot `npm run build`. Koppla `main`-grenen i GitHub för automatiska produktionsdeploymenter.

Matloggens sökindex är en inbyggd export från Livsmedelsverkets
Livsmedelsdatabas och kräver inget API vid användning. För att uppdatera den
incheckade kopian:

```bash
npm run fooddb:build
```

Källhänvisning och licens finns i `FOOD_DATA_LICENSE.md`.

## Kvalitetskontroller

```bash
npm run lint
npm test
```
