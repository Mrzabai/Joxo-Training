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

## Kvalitetskontroller

```bash
npm run lint
npm test
```
