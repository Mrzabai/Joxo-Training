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
