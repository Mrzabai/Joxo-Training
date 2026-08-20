export type Exercise = {
  id: string;
  notionUrl: string;
  name: string;
  muscle: string;
  order: number;
  sets: number;
  minReps: number;
  maxReps: number;
  weight: number | null;
  startReps: number;
  restSeconds: number;
  technique: string;
  note: string;
  nextAdvice?: string;
};

export type WorkoutDay = {
  id: string;
  number: number;
  name: string;
  focus: string;
  style: string;
  duration: string;
  exercises: Exercise[];
};

const n = (pageId: string) => `https://app.notion.com/${pageId}`;
const e = (
  id: string,
  name: string,
  muscle: string,
  order: number,
  sets: number,
  reps: [number, number],
  weight: number | null,
  startReps: number,
  restSeconds: number,
  technique: string,
  note: string,
  nextAdvice?: string,
): Exercise => ({
  id,
  notionUrl: n(id),
  name,
  muscle,
  order,
  sets,
  minReps: reps[0],
  maxReps: reps[1],
  weight,
  startReps,
  restSeconds,
  technique,
  note,
  nextAdvice,
});

export const PROGRAM: WorkoutDay[] = [
  {
    id: "upper-a",
    number: 1,
    name: "Överkropp A",
    focus: "Bröst · Rygg · Axlar · Armar",
    style: "Styrka + hypertrofi",
    duration: "65–80 min",
    exercises: [
      e("3bf0e834f47f81c2924bcc1aa8d324ba", "Bänkpress", "Bröst", 1, 3, [6, 8], 80, 7, 150, "Skulderblad bak/ned · fötter stadigt · lugn väg ned · ingen studs", "Tidigare 75–85 kg × 6–8", "Klara 80 kg × 8 i alla set vid RPE 8 eller lägre → höj till 82,5 kg."),
      e("3bf0e834f47f81a7acf3d707b0c2997f", "Sittande kabelrodd", "Rygg", 2, 3, [8, 10], null, 10, 105, "Bröst upp · armbågar bak mot höften · dra ihop skulderbladen", "Hitta en kontrollerad startvikt"),
      e("3bf0e834f47f811ebe7cf19ff1d34179", "Latsdrag", "Rygg", 3, 3, [8, 12], null, 10, 105, "Brösta upp · dra armbågarna nedåt · sträck ut kontrollerat", "Ny exakt variant i loggen"),
      e("3bf0e834f47f81a18f8becf5217cf27e", "Shoulder press", "Axlar", 4, 3, [8, 10], 30, 8, 105, "Spänn magen · pressa rakt upp · sänk lugnt till axelhöjd", "Gammal hantelpress 32,5 kg × 6–8"),
      e("3bf0e834f47f815db302ebca22a579cf", "Sidolyft i kabel", "Axlar", 5, 3, [12, 15], null, 12, 75, "Lätt vikt · strikt rörelse · lyft till ungefär axelhöjd", "Prioritera kontakt framför vikt"),
      e("3bf0e834f47f8118b740cf1ab0abba3f", "Triceps pushdown", "Triceps", 6, 2, [10, 15], null, 12, 75, "Överarmen still · pressa ned fullt · kontrollera returen", "Gammal enhands pushdown steg 4–5"),
      e("3bf0e834f47f81229899d403f701687e", "Biceps curl-maskin", "Biceps", 7, 2, [10, 15], null, 12, 75, "Överarmen still · full kontroll · ingen kroppsgungning", "Maskinens vikt behöver ställas in"),
    ],
  },
  {
    id: "lower-a",
    number: 2,
    name: "Underkropp A",
    focus: "Säte · Baksida lår · Framsida lår · Mage",
    style: "Styrkefokus",
    duration: "65–80 min",
    exercises: [
      e("3bf0e834f47f81d6b9acc0a77ca4506e", "Hip thrust / glute drive", "Säte", 1, 3, [6, 8], 100, 7, 150, "Full höftsträckning · kort paus i toppen · sänk kontrollerat", "Tidigare 90–110 kg × 6–8"),
      e("3bf0e834f47f81e9b527dc7a57e11443", "Rumänska marklyft (RDL)", "Baksida lår", 2, 3, [6, 8], null, 8, 150, "Fäll i höften · stång nära benen · vänd innan ryggen rundas", "Sätt trygg startvikt första passet"),
      e("3bf0e834f47f810ea5ffef57957f9f33", "Sittande lårcurl", "Baksida lår", 3, 3, [8, 12], null, 10, 105, "Knäleden i linje med maskinen · böj fullt · håll emot", "Maskinvikt ställs in första passet"),
      e("3bf0e834f47f810b84eeffc298704a03", "Benspark / leg extension", "Framsida lår", 4, 3, [10, 15], null, 12, 75, "Sträck kontrollerat · kort stopp · sänk långsamt", "Maskinvikt ställs in första passet"),
      e("3bf0e834f47f81bd988fc317712c1a4b", "Vadpress", "Vader", 5, 3, [10, 15], 80, 10, 75, "Full stretch längst ned · upp på tå · kort paus i toppen", "Tidigare 80 kg × 6–8"),
      e("3bf0e834f47f81b793d9d8322cddf556", "Kabelcrunch", "Mage", 6, 3, [10, 15], null, 12, 75, "Rulla bröstkorgen mot bäckenet · undvik att bara fälla i höften", "Tidigare loggat som max × 10"),
    ],
  },
  {
    id: "upper-b",
    number: 3,
    name: "Överkropp B",
    focus: "Övre bröst · Rygg · Bakre axel · Armar",
    style: "Volym + muskelbygge",
    duration: "65–80 min",
    exercises: [
      e("3bf0e834f47f813f8221f71f2df8dd28", "Snedbänk hantelpress", "Bröst", 1, 3, [8, 10], 30, 8, 120, "Skulderblad stabila · sänk kontrollerat · slå inte ihop hantlarna", "Tidigare 30 kg × 6–8"),
      e("3bf0e834f47f8159bacadfacd20f2e21", "Pec deck", "Bröst", 2, 2, [10, 15], null, 12, 75, "Pressa ihop kontrollerat · håll spänningen på returen", "Ny maskinvariant"),
      e("3bf0e834f47f8110b71ade22a3acc397", "Maskinrodd / bröststödd rodd", "Rygg", 3, 3, [8, 12], null, 10, 120, "Bröst mot stöd · dra armbågarna bakåt · avsluta med skulderbladen", "Närmast gamla inverted rows 75"),
      e("3bf0e834f47f81b5a1d0f96cef2ff4ec", "Neutralt latsdrag", "Rygg", 4, 3, [8, 12], null, 10, 105, "Brösta upp · dra armbågarna nedåt · sträck ut kontrollerat", "Ny exakt variant"),
      e("3bf0e834f47f817ab2bdc6bbc1b8f195", "Reverse fly / omvänd pec deck", "Axlar", 5, 3, [12, 15], null, 12, 75, "Nästan raka armar · för händerna ut/bak · undvik att rycka", "Gammal bakre axel med 9 kg hantlar"),
      e("3bf0e834f47f81d88b1ec9e839272752", "Triceps extension", "Triceps", 6, 2, [10, 15], null, 12, 75, "Överarmarna nära huvudet · räta ut armbågarna · sänk kontrollerat", "Tidigare 10–12,5 kg"),
      e("3bf0e834f47f819a9aa1e0cc1d2eda8a", "Preacher curl", "Biceps", 7, 2, [10, 15], 17.5, 10, 75, "Överarmen still mot stödet · kontroll i botten · ingen fart ur axeln", "Tidigare 17,5 kg × 6–8"),
    ],
  },
  {
    id: "lower-b",
    number: 4,
    name: "Underkropp B",
    focus: "Baksida lår · Säte · Ben · Mage",
    style: "Volym + kontroll",
    duration: "65–80 min",
    exercises: [
      e("3bf0e834f47f81209e29cd9494c17079", "Rumänska marklyft (RDL)", "Baksida lår", 1, 3, [8, 10], null, 8, 150, "Fäll i höften · stång nära kroppen · håll ryggen stabil", "Sätt trygg startvikt första passet"),
      e("3bf0e834f47f81498ea5cc612b23ea42", "Bulgarian split squat", "Framsida lår", 2, 3, [8, 10], 9, 8, 120, "Stabil framfot · sjunk rakt ned · knä följer tår", "Tidigare 9 kg hantlar × 6–8"),
      e("3bf0e834f47f8155b18cfb2fc134fd67", "Vadpress", "Vader", 3, 3, [12, 15], 80, 12, 75, "Full stretch längst ned · tydligt toppläge · ingen studs", "Tidigare 80 kg × 6–8"),
      e("3bf0e834f47f81909013ebbfe61fbd34", "Kabelcrunch", "Mage", 4, 3, [10, 15], null, 12, 75, "Rulla bröstkorgen mot bäckenet · håll repet still", "Tidigare loggat som max × 10"),
      e("3bf0e834f47f81a3865ff601454b9bc1", "Hip thrust / glute drive", "Säte", 5, 3, [8, 10], 100, 8, 120, "Full höftsträckning · kort paus · håll revbenen nere", "Tidigare 90–110 kg × 6–8"),
      e("3bf0e834f47f81b4bc7dc4ae07dbc7a7", "Benspark / leg extension", "Framsida lår", 6, 2, [12, 15], null, 12, 75, "Kontrollerad uppväg · kort stopp · sänk långsamt", "Maskinvikt ställs in första passet"),
      e("3bf0e834f47f81f69837d1d6473498ea", "Sittande lårcurl", "Baksida lår", 7, 3, [10, 15], null, 12, 75, "Knäleden i linje med maskinen · böj fullt · håll emot", "Maskinvikt ställs in första passet"),
    ],
  },
];

export const EXERCISE_COUNT = PROGRAM.reduce((sum, day) => sum + day.exercises.length, 0);

export function getExerciseAdvice(exercise: Exercise, reps: number, rpe: number, weight: number | null) {
  if (exercise.nextAdvice) return exercise.nextAdvice;
  if (weight === null || weight <= 0) return "Välj en vikt där du har ungefär 2–3 bra reps kvar i tanken.";
  if (reps >= exercise.maxReps && rpe <= 8) {
    const increase = exercise.muscle === "Säte" || exercise.muscle.includes("lår") ? 5 : 2.5;
    return `Alla målreps sitter med kontroll. Testa ${weight + increase} kg nästa gång.`;
  }
  if (rpe >= 9.5) return `Behåll ${weight} kg och bygg kvalitet innan du höjer.`;
  return `Behåll ${weight} kg och sikta på ${Math.min(reps + 1, exercise.maxReps)} reps per set.`;
}
