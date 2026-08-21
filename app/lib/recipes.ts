export type Recipe = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  yield: string;
  ingredients: string[];
  steps: string[];
  nutrition: {
    basis: "serving" | "100g";
    calories: number;
    protein: number;
    defaultAmount: number;
    unit: "portioner" | "g";
    note: string;
  };
};

export const RECIPES: Recipe[] = [
  {
    id: "carnivore-chips",
    name: "Bellas carnivore chips",
    emoji: "🧀",
    category: "Proteinrikt snacks",
    yield: "ca 4 portioner",
    ingredients: [
      "Äggvitor från 5 ägg",
      "2 tsk vatten",
      "Riven hårdost",
      "Salt, peppar och valfria kryddor",
    ],
    steps: [
      "Sätt ugnen på 200 °C.",
      "Separera äggen och vispa vitorna till mjuka toppar.",
      "Vänd ner vatten och kryddor försiktigt.",
      "Klicka cirka 1 tsk smet i varje form i en muffinsplåt och strö över lite riven ost.",
      "Grädda cirka 12 minuter och låt svalna tills chipsen är krispiga.",
    ],
    nutrition: {
      basis: "serving",
      calories: 121,
      protein: 10.8,
      defaultAmount: 1,
      unit: "portioner",
      note: "Grov uppskattning per ¼ sats, beräknad med 100 g hårdost i hela satsen. Justera om du använder mer eller mindre ost.",
    },
  },
  {
    id: "ostkaka",
    name: "Ostkaka",
    emoji: "🍰",
    category: "Proteinrikt fika",
    yield: "1 stor form",
    ingredients: [
      "1 000 g keso",
      "8 ägg",
      "2 dl proteinpulver utan smak",
      "Salt och vaniljarom",
      "4 bittermandlar",
      "Finrivet citronskal",
    ],
    steps: [
      "Sätt ugnen på 200 °C.",
      "Lägg alla ingredienser i en mixer.",
      "Mixa till en jämn smet och häll i en ugnsform.",
      "Grädda 15–20 minuter, tills ostkakan har satt sig och fått färg.",
      "Låt svalna före servering.",
    ],
    nutrition: {
      basis: "100g",
      calories: 143,
      protein: 20.4,
      defaultAmount: 250,
      unit: "g",
      note: "Uppskattning per 100 g. Exakt värde beror på keso och proteinpulver.",
    },
  },
  {
    id: "protein-matmuffin",
    name: "Protein-matmuffin",
    emoji: "🧁",
    category: "Matlåda",
    yield: "1 sats",
    ingredients: [
      "60 g havregryn",
      "250 g grekisk yoghurt",
      "65 g rödlök",
      "60 g proteinpulver totalt",
      "46 g kalkon och 90 g kyckling",
      "18 g spenat och 70 g tomat",
      "150 g minikeso",
      "6 ägg",
      "50 g riven ost, 12 %",
    ],
    steps: [
      "Tillagningssteg saknades i originalanteckningen.",
      "Väg den färdiga satsen och logga den mängd du äter i gram för bäst beräkning.",
    ],
    nutrition: {
      basis: "100g",
      calories: 140,
      protein: 16.8,
      defaultAmount: 250,
      unit: "g",
      note: "Uppskattning per 100 g av den färdiga satsen.",
    },
  },
  {
    id: "rakpizza",
    name: "Räkpizza med vitlökscrème och dill",
    emoji: "🍕",
    category: "Middag",
    yield: "1 stor eller 2 små pizzor",
    ingredients: [
      "1 pizzadeg",
      "2 msk olivolja",
      "2 vitlöksklyftor",
      "1 dl crème fraiche",
      "1 dl riven ost, gärna mozzarella och lite hårdost",
      "200 g skalade räkor",
      "½ rödlök och ½ röd paprika, valfritt",
      "Rucola eller babyspenat",
      "Färsk dill, salt och svartpeppar",
    ],
    steps: [
      "Sätt ugnen på 250 °C eller så varmt den går. Värm gärna en pizzasten.",
      "Kavla degen tunt och lägg den på plåt eller pizzasten.",
      "Blanda crème fraiche, vitlök, salt och peppar och bred över degen.",
      "Toppa med ost, rödlök och eventuell paprika.",
      "Grädda 7–10 minuter. Lägg på räkor, dill och grönt efter gräddningen.",
      "Avsluta gärna med lite citron eller olivolja.",
    ],
    nutrition: {
      basis: "serving",
      calories: 900,
      protein: 45,
      defaultAmount: 1,
      unit: "portioner",
      note: "Grov uppskattning för en halv stor pizza. Deg, ost och crème fraiche påverkar värdet mycket.",
    },
  },
  {
    id: "grot-joxo",
    name: "Gröt à la Joxo",
    emoji: "🥣",
    category: "Frukost",
    yield: "1 portion",
    ingredients: [
      "1 dl proteinpulver",
      "1 dl havregryn",
      "1 dl vatten",
      "1 msk vardera av pumpafrön, solrosfrön, torkade tranbär och chiafrön",
      "Salt och sötningsmedel",
      "3 msk lågkalori-hallonsylt",
      "1 dl mandelmjölk",
    ],
    steps: [
      "Blanda de torra ingredienserna i en kastrull.",
      "Tillsätt vatten och rör om.",
      "Värm på medelvärme i 3–5 minuter under omrörning.",
      "Rör ner mandelmjölk och justera konsistensen.",
      "Toppa med hallonsylt.",
    ],
    nutrition: {
      basis: "serving",
      calories: 500,
      protein: 40,
      defaultAmount: 1,
      unit: "portioner",
      note: "Uppskattning för en portion med cirka 37 g proteinpulver.",
    },
  },
  {
    id: "overnight-oats-blabar",
    name: "Overnight oats med blåbär",
    emoji: "🫐",
    category: "Frukost",
    yield: "1 stor portion",
    ingredients: [
      "1 dl kvarg",
      "1 dl proteinpulver",
      "1 dl mandelmjölk",
      "1 msk chiafrön",
      "1 dl havregryn",
      "100 g blåbär",
      "Sötningsmedel efter smak",
    ],
    steps: [
      "Blanda allt utom en del av blåbären i en burk.",
      "Rör tills blandningen är jämn och toppa med resten av bären.",
      "Täck och ställ i kyl över natten.",
      "Rör om före servering och späd med lite mandelmjölk vid behov.",
    ],
    nutrition: {
      basis: "serving",
      calories: 745,
      protein: 57,
      defaultAmount: 1,
      unit: "portioner",
      note: "Sparad uppskattning för en stor portion. Kontrollera gärna mängd och produktetiketter.",
    },
  },
];
