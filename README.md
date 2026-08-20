# Joxo Training

En mobil träningsapp för Jocke med det aktuella fyrdagarsschemat från Notion, aktiv setloggning, vilotimer, dubbel progression, kostlogg, dagsform och PT-stöd.

## Funktioner

- 4 pass och 27 övningar importerade från den befintliga Notion-loggen
- Vikt, reps och RPE direkt i varje övningskort
- Autosparning i D1 med lokal offlinekö
- Automatisk vilotimer och passammanfattning
- Progressionsråd som tar hänsyn till reps, RPE och dagsform
- Kalori-, protein- och vattenlogg
- Installerbar PWA för mobil
- Säker serverbaserad Notion-synk

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

## Notion

Kopiera `.env.example` till en lokal `.env` och fyll i:

- `NOTION_TOKEN`: hemlig token från din Notion-anslutning
- `NOTION_DATA_SOURCE_ID`: datakällan för **Träningslogg – aktuellt program**

Token används endast på serversidan. Utan token fungerar appen med den redan importerade startkopian av programmet.

För automatisk synk måste Notion-anslutningen ha läsrättighet till originaldatakällan. Appen frågar Notions data source-API och skriver inte tillbaka till Notion.

## Kvalitetskontroller

```bash
npm run lint
npm test
```
