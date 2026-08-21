# Livsmedelsdata

Den lokala filen `app/data/swedish-foods.json` bygger på **Livsmedelsverkets
Livsmedelsdatabas version 2026-07-01**. Ursprungliga näringsvärden anges per
100 gram livsmedel och lagras oförändrade för de utvalda kolumnerna energi,
protein, kolhydrater, fett och fiber.

- Källa: https://soknaringsinnehall.livsmedelsverket.se/
- Licens: CC BY 4.0
- Antal livsmedel i den inbyggda exporten: 2 606

Appens portionsberäkningar är härledda värden: användarens angivna gram
multipliceras med källvärdet per 100 gram. Om hushållsmått används visas detta
som ett antagande som användaren måste granska.

## Träningsfavoriter

Filen `app/data/popular-fitness-foods.json` kompletterar basdatabasen med 38
vanliga produkter inom kvarg, proteinmellanmål, bars, pulver, knäckebröd och
växtdryck. Värdena är manuellt avlästa från respektive tillverkares offentliga
näringsdeklaration och kontrollerades 2026-08-21. Varje post innehåller egen
`sourceUrl` och `sourceName`.

Produktnamn och varumärken tillhör respektive ägare. Uppgifterna kan ändras;
appen visar därför källan för vald produkt och uppmanar användaren att jämföra
med den aktuella förpackningen.
