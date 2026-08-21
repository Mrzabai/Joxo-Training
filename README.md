# Joxo Training

En mobil träningsapp för Jocke med ett personligt fyrdagarsschema, aktiv setloggning, vilotimer, dubbel progression, kostlogg, dagsform och PT-stöd.

## Funktioner

- 4 pass och 27 övningar i ett fristående träningsprogram
- Klickbara övningsbilder med start- och slutläge, steg-för-steg, PT-tips och vanliga misstag
- Vikt, reps och RPE direkt i varje övningskort
- Autosparning i D1 med lokal offlinekö
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

## Databas

Appen använder D1 och Drizzle. Schemat ligger i `db/schema.ts` och migrationer i `drizzle/`.

Efter en schemaändring:

```bash
npm run db:generate
```

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
