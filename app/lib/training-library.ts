import { PROGRAM, type Exercise, type WorkoutDay } from "./program";

export type ExerciseCategory = "Styrka" | "Uppvärmning" | "Stretch";

export type LibraryExercise = {
  exercise: Exercise;
  category: ExerciseCategory;
  equipment: string;
  dose: string;
};

export type ExercisePrescription = {
  sets: number;
  minReps: number;
  maxReps: number;
  restSeconds: number;
};

const PROGRAM_EXERCISES = PROGRAM.flatMap((day) => day.exercises);

function withStrengthDefaults(exercise: Exercise): Exercise {
  return { ...exercise, sets: 3, minReps: 6, maxReps: 6, startReps: 6 };
}

function sourceExercise(name: string) {
  const source = PROGRAM_EXERCISES.find((exercise) => exercise.name === name);
  if (!source) throw new Error(`Övningsbanken saknar källövning: ${name}`);
  return source;
}

function strengthVariant(sourceName: string, id: string, name: string, muscle: string, technique: string): Exercise {
  const source = sourceExercise(sourceName);
  return {
    ...source,
    id,
    name,
    muscle,
    technique,
    imageAlt: `${name}, start- och slutläge`,
    guide: {
      ...source.guide,
      summary: `${name} är ett alternativ för ${muscle.toLocaleLowerCase("sv-SE")}. ${source.guide.summary}`,
    },
    note: `Övningsbanksalternativ. ${source.note}`,
  };
}

function movement(
  sourceName: string,
  id: string,
  name: string,
  muscle: string,
  category: Exclude<ExerciseCategory, "Styrka">,
  equipment: string,
  dose: string,
  summary: string,
  steps: string[],
  tips: string[],
  avoid: string[],
): LibraryExercise {
  const source = sourceExercise(sourceName);
  return {
    category,
    equipment,
    dose,
    exercise: {
      ...source,
      id,
      name,
      muscle,
      sets: 1,
      minReps: 1,
      maxReps: 1,
      weight: null,
      startReps: 1,
      restSeconds: 0,
      technique: steps.join(" · "),
      note: `${category} · ${dose}`,
      imageAlt: `${name}, rörelseguide`,
      guide: { summary, steps, tips, avoid },
    },
  };
}

const STRENGTH_VARIANT_SPECS: Array<[string, string, string, string, string]> = [
  // Bröst — fotona kommer bara från bänkpress, snedbänk eller pec deck.
  ["Bänkpress", "library-chest-pause-bench", "Pausbänkpress", "Bröst", "Pausa mjukt mot bröstet · behåll skulderbladen låsta · pressa kontrollerat"],
  ["Bänkpress", "library-chest-close-bench", "Bänkpress med smalt grepp", "Bröst", "Greppa strax innanför normalbredd · håll armbågarna nära · pressa jämnt"],
  ["Bänkpress", "library-chest-tempo-bench", "Tempobänkpress", "Bröst", "Sänk på tre sekunder · lätt stopp · pressa utan studs"],
  ["Snedbänk hantelpress", "library-chest-neutral-incline", "Snedbänk hantelpress · neutralt grepp", "Bröst", "Handflator mot varandra · sänk nära bröstet · pressa i samma bana"],
  ["Snedbänk hantelpress", "library-chest-pause-incline", "Snedbänk hantelpress med paus", "Bröst", "Pausa i botten · håll skulderbladen stabila · pressa utan att slå ihop hantlarna"],
  ["Pec deck", "library-chest-pec-pause", "Pec deck med toppstopp", "Bröst", "För ihop armarna · håll en sekund · återgå långsamt"],
  ["Pec deck", "library-chest-pec-tempo", "Pec deck med långsam retur", "Bröst", "Pressa ihop kontrollerat · sänk på tre sekunder · behåll bröstet mot stödet"],

  // Rygg — varje variant använder motsvarande rodd- eller latsdragsfoto.
  ["Sittande kabelrodd", "library-back-cable-pause", "Sittande kabelrodd med paus", "Rygg", "Dra mot magen · pausa med skulderbladen ihop · sträck ut kontrollerat"],
  ["Sittande kabelrodd", "library-back-cable-wide", "Sittande kabelrodd · brett grepp", "Rygg", "Armbågar lätt utåt · dra mot nedre bröstet · håll bålen still"],
  ["Latsdrag", "library-back-lat-pause", "Latsdrag med bottenstopp", "Rygg", "Dra ned till övre bröstet · pausa · släpp upp utan att tappa skulderkontroll"],
  ["Neutralt latsdrag", "library-back-lat-close", "Latsdrag med smalt neutralt grepp", "Rygg", "Brösta upp · dra armbågarna mot sidan · nå full stretch"],
  ["Maskinrodd / bröststödd rodd", "library-back-machine-neutral", "Bröststödd maskinrodd · neutralt grepp", "Rygg", "Bröst mot dynan · armbågar nära kroppen · pausa baktill"],
  ["Maskinrodd / bröststödd rodd", "library-back-machine-tempo", "Bröststödd maskinrodd med långsam retur", "Rygg", "Dra kraftfullt · sänk på tre sekunder · håll bröstet kvar mot stödet"],

  // Axlar.
  ["Shoulder press", "library-shoulder-neutral-press", "Shoulder press · neutralt grepp", "Axlar", "Handflator mot varandra · spänn magen · pressa rakt upp"],
  ["Shoulder press", "library-shoulder-pause-press", "Shoulder press med paus", "Axlar", "Pausa vid axelhöjd · håll bålen stabil · pressa utan fart"],
  ["Shoulder press", "library-shoulder-tempo-press", "Shoulder press med långsam sänkning", "Axlar", "Pressa upp · sänk på tre sekunder · stoppa vid axelhöjd"],
  ["Sidolyft i kabel", "library-shoulder-cable-pause", "Sidolyft i kabel med toppstopp", "Axlar", "Lyft till axelhöjd · håll en sekund · sänk långsamt"],
  ["Sidolyft i kabel", "library-shoulder-cable-behind", "Sidolyft i kabel bakom kroppen", "Axlar", "Starta handen lätt bakom höften · led med armbågen · undvik att rycka"],
  ["Reverse fly / omvänd pec deck", "library-shoulder-reverse-pause", "Reverse fly med paus", "Axlar", "Öppna armarna · pausa baktill · återgå under kontroll"],
  ["Reverse fly / omvänd pec deck", "library-shoulder-reverse-tempo", "Reverse fly med långsam retur", "Axlar", "För armarna bakåt · sänk på tre sekunder · håll axlarna nere"],

  // Triceps.
  ["Triceps extension", "library-triceps-overhead", "Overhead tricepsextension", "Triceps", "Armbågar nära huvudet · sträck fullt · bromsa tillbaka"],
  ["Triceps pushdown", "library-triceps-pushdown-pause", "Triceps pushdown med bottenstopp", "Triceps", "Pressa ned fullt · pausa · håll överarmen still"],
  ["Triceps pushdown", "library-triceps-pushdown-tempo", "Triceps pushdown med långsam retur", "Triceps", "Pressa ned · släpp upp på tre sekunder · undvik axelrörelse"],
  ["Triceps pushdown", "library-triceps-pushdown-close", "Triceps pushdown · smalt grepp", "Triceps", "Greppa smalt · håll armbågarna intill kroppen · sträck helt"],
  ["Triceps pushdown", "library-triceps-pushdown-volume", "Triceps pushdown · högreps", "Triceps", "Lätt vikt · jämn rytm · behåll spänningen genom hela setet"],
  ["Triceps extension", "library-triceps-extension-pause", "Triceps extension med paus", "Triceps", "Sänk kontrollerat · pausa i stretchläget · sträck utan att flytta överarmen"],
  ["Triceps extension", "library-triceps-extension-tempo", "Triceps extension med långsam sänkning", "Triceps", "Sträck upp · sänk på tre sekunder · håll revbenen nere"],
  ["Triceps extension", "library-triceps-extension-short", "Triceps extension · kort toppläge", "Triceps", "Stanna strax före utlåsning · håll konstant spänning · sänk kontrollerat"],

  // Biceps.
  ["Biceps curl-maskin", "library-biceps-neutral-machine", "Biceps curl-maskin · neutralt grepp", "Biceps", "Neutral handled · överarm still · sänk långsamt"],
  ["Biceps curl-maskin", "library-biceps-machine-pause", "Biceps curl-maskin med toppstopp", "Biceps", "Curl upp · håll en sekund · sänk utan att släppa spänningen"],
  ["Biceps curl-maskin", "library-biceps-machine-tempo", "Biceps curl-maskin med långsam sänkning", "Biceps", "Lyft kontrollerat · sänk på tre sekunder · håll axlarna nere"],
  ["Biceps curl-maskin", "library-biceps-machine-short", "Biceps curl-maskin · kort toppläge", "Biceps", "Arbeta i övre halvan · håll konstant spänning · undvik kroppsgungning"],
  ["Preacher curl", "library-biceps-preacher-pause", "Preacher curl med toppstopp", "Biceps", "Curl upp · pausa · sänk tills armen nästan är rak"],
  ["Preacher curl", "library-biceps-preacher-tempo", "Preacher curl med långsam sänkning", "Biceps", "Lyft jämnt · sänk på tre sekunder · håll överarmen i stödet"],
  ["Preacher curl", "library-biceps-preacher-bottom", "Preacher curl med bottenstopp", "Biceps", "Stanna kort nära botten · behåll kontroll · curl utan fart"],
  ["Preacher curl", "library-biceps-preacher-volume", "Preacher curl · högreps", "Biceps", "Välj lättare vikt · full rörelse · håll jämn rytm"],

  // Säte — endast hip thrust/glute drive och sätesbetonad Bulgarian split squat.
  ["Bulgarian split squat", "library-glute-split", "Bulgarian split squat · sätesfokus", "Säte", "Långt steg · lätt framåtlutning · tryck genom hela främre foten"],
  ["Hip thrust / glute drive", "library-glute-hip-pause", "Hip thrust med toppstopp", "Säte", "Sträck höften fullt · håll två sekunder · sänk kontrollerat"],
  ["Hip thrust / glute drive", "library-glute-hip-tempo", "Hip thrust med långsam sänkning", "Säte", "Pressa upp · sänk på tre sekunder · håll hakan lätt indragen"],
  ["Hip thrust / glute drive", "library-glute-hip-half", "Hip thrust med 1½-reps", "Säte", "Fullt toppläge · halvvägs ned · upp igen · sänk helt"],
  ["Hip thrust / glute drive", "library-glute-drive-pause", "Glute drive med paus", "Säte", "Pressa höften fram · pausa · håll revbenen nere"],
  ["Hip thrust / glute drive", "library-glute-drive-tempo", "Glute drive med jämnt tempo", "Säte", "Två sekunder upp · två sekunder ned · håll spänningen på sätet"],
  ["Bulgarian split squat", "library-glute-split-long", "Bulgarian split squat · lång steglängd", "Säte", "Placera framfoten längre fram · luta lätt fram · pressa genom hälen"],
  ["Bulgarian split squat", "library-glute-split-pause", "Bulgarian split squat · sätesfokus med paus", "Säte", "Sjunk kontrollerat · pausa i botten · res dig genom främre foten"],
  ["Bulgarian split squat", "library-glute-split-tempo", "Bulgarian split squat · sätesfokus med tempo", "Säte", "Sänk på tre sekunder · håll höften stabil · res dig utan studs"],

  // Baksida lår.
  ["Rumänska marklyft (RDL)", "library-hamstring-rdl-pause", "Rumänska marklyft med paus", "Baksida lår", "Pausa strax under knät · håll stången nära · res dig med höften"],
  ["Rumänska marklyft (RDL)", "library-hamstring-rdl-tempo", "Rumänska marklyft med långsam sänkning", "Baksida lår", "Sänk på tre sekunder · håll ryggen stabil · pressa höften fram"],
  ["Rumänska marklyft (RDL)", "library-hamstring-rdl-narrow", "Rumänska marklyft · smal fotställning", "Baksida lår", "Fötter höftsmalt · mjuka knän · fäll höften bakåt"],
  ["Rumänska marklyft (RDL)", "library-hamstring-rdl-stretch", "Rumänska marklyft · kontrollerad stretch", "Baksida lår", "Sänk tills tydlig stretch · stanna före ryggen rundas · res dig kontrollerat"],
  ["Sittande lårcurl", "library-hamstring-curl-pause", "Sittande lårcurl med bottenstopp", "Baksida lår", "Böj fullt · håll en sekund · släpp tillbaka långsamt"],
  ["Sittande lårcurl", "library-hamstring-curl-single", "Sittande lårcurl · ett ben i taget", "Baksida lår", "Arbeta ett ben · håll höften still · matcha båda sidor"],
  ["Sittande lårcurl", "library-hamstring-curl-tempo", "Sittande lårcurl med långsam retur", "Baksida lår", "Curl in · släpp ut på tre sekunder · behåll kontakt med dynan"],
  ["Sittande lårcurl", "library-hamstring-curl-half", "Sittande lårcurl med 1½-reps", "Baksida lår", "Böj fullt · halvvägs ut · böj igen · återgå helt"],

  // Framsida lår.
  ["Bulgarian split squat", "library-quad-split-upright", "Bulgarian split squat · upprätt bål", "Framsida lår", "Kortare steg · håll bålen upprätt · låt knät följa tårna"],
  ["Bulgarian split squat", "library-quad-split-pause", "Bulgarian split squat med paus", "Framsida lår", "Sjunk rakt ned · pausa i botten · pressa upp utan studs"],
  ["Bulgarian split squat", "library-quad-split-tempo", "Bulgarian split squat med långsam sänkning", "Framsida lår", "Sänk på tre sekunder · håll knät stabilt · res dig kontrollerat"],
  ["Bulgarian split squat", "library-quad-split-half", "Bulgarian split squat med 1½-reps", "Framsida lår", "Bottenläge · halvvägs upp · ned igen · res dig helt"],
  ["Benspark / leg extension", "library-quad-extension-pause", "Benspark med toppstopp", "Framsida lår", "Sträck knät · håll en sekund · sänk långsamt"],
  ["Benspark / leg extension", "library-quad-extension-single", "Enbens benspark", "Framsida lår", "Arbeta ett ben i taget · håll höften still · matcha sidorna"],
  ["Benspark / leg extension", "library-quad-extension-tempo", "Benspark med långsam sänkning", "Framsida lår", "Sträck kontrollerat · sänk på tre sekunder · undvik att släppa vikten"],
  ["Benspark / leg extension", "library-quad-extension-half", "Benspark med 1½-reps", "Framsida lår", "Sträck fullt · halvvägs ned · sträck igen · sänk helt"],

  // Vader.
  ["Vadpress", "library-calf-single", "Enbens vadpress", "Vader", "Ett ben i taget · full stretch · tydlig paus i toppläget"],
  ["Vadpress", "library-calf-pause", "Vadpress med toppstopp", "Vader", "Pressa upp på tå · håll två sekunder · sänk till full stretch"],
  ["Vadpress", "library-calf-bottom-pause", "Vadpress med bottenstopp", "Vader", "Sänk hälen djupt · pausa · pressa upp utan studs"],
  ["Vadpress", "library-calf-tempo", "Vadpress med långsam sänkning", "Vader", "Pressa upp · sänk på tre sekunder · behåll raka fotleder"],
  ["Vadpress", "library-calf-half", "Vadpress med 1½-reps", "Vader", "Toppläge · halvvägs ned · upp igen · sänk helt"],
  ["Vadpress", "library-calf-straight", "Vadpress med raka knän", "Vader", "Håll knäna raka men mjuka · pressa genom stortån · pausa i toppen"],
  ["Vadpress", "library-calf-bent", "Vadpress med lätt böjda knän", "Vader", "Böj knäna lätt · håll vinkeln · arbeta bara i fotleden"],
  ["Vadpress", "library-calf-narrow", "Vadpress · smal fotställning", "Vader", "Fötter nära · full stretch · pressa jämnt genom framfoten"],
  ["Vadpress", "library-calf-volume", "Vadpress · högreps", "Vader", "Lättare vikt · full rörelse · undvik studs även när det bränner"],

  // Mage — samtliga använder den faktiska kabelcrunch-rörelsen på bilden.
  ["Kabelcrunch", "library-abs-paused", "Kabelcrunch med bottenstopp", "Mage", "Runda bröstryggen · pausa i botten · håll höften still"],
  ["Kabelcrunch", "library-abs-tempo", "Kabelcrunch med långsam retur", "Mage", "Crunch ned · släpp upp på tre sekunder · håll bäckenet stabilt"],
  ["Kabelcrunch", "library-abs-half", "Kabelcrunch med 1½-reps", "Mage", "Crunch fullt · halvvägs upp · crunch igen · återgå helt"],
  ["Kabelcrunch", "library-abs-kneeling-pause", "Knästående kabelcrunch med paus", "Mage", "Höften still · rulla bröstet mot bäckenet · håll en sekund"],
  ["Kabelcrunch", "library-abs-kneeling-tempo", "Knästående kabelcrunch med tempo", "Mage", "Två sekunder ned · två sekunder upp · behåll buktrycket"],
  ["Kabelcrunch", "library-abs-short", "Kabelcrunch · kort toppläge", "Mage", "Stanna innan full avslappning · håll spänningen · cruncha ned igen"],
  ["Kabelcrunch", "library-abs-heavy", "Kabelcrunch · tung sexa", "Mage", "Välj kontrollerbar vikt · sex strikta reps · ingen höftfällning"],
  ["Kabelcrunch", "library-abs-volume", "Kabelcrunch · högreps", "Mage", "Lättare vikt · jämn rytm · andas ut i botten"],
  ["Kabelcrunch", "library-abs-exhale", "Kabelcrunch med lång utandning", "Mage", "Andas ut hela vägen ned · dra ihop magen · återgå kontrollerat"],
];

const EXTRA_STRENGTH_EXERCISES: Exercise[] = STRENGTH_VARIANT_SPECS.map(([sourceName, id, name, muscle, technique]) =>
  strengthVariant(sourceName, id, name, muscle, technique),
);

const uniqueStrength = new Map<string, Exercise>();
[...PROGRAM_EXERCISES, ...EXTRA_STRENGTH_EXERCISES].forEach((exercise) => {
  if (!uniqueStrength.has(exercise.name)) uniqueStrength.set(exercise.name, exercise);
});

export const STRENGTH_EXERCISES = [...uniqueStrength.values()].map(withStrengthDefaults);

export const WARMUP_EXERCISES: LibraryExercise[] = [
  movement("Sittande kabelrodd", "warmup-row", "Lugn roddmaskin", "Helkropp", "Uppvärmning", "Roddmaskin", "4–6 minuter", "Höj puls och kroppstemperatur utan att trötta ut musklerna före passet.", ["Starta mycket lugnt och hitta en jämn rytm.", "Öka tempot lite efter två minuter men håll andningen kontrollerad.", "Avsluta medan du fortfarande känner dig fräsch."], ["Du ska bli varm, inte slut.", "Håll axlarna sänkta."], ["Maxintervaller före styrkepasset.", "Att hoppa över stegrande uppvärmningsset."]),
  movement("Reverse fly / omvänd pec deck", "warmup-band-pull", "Band pull-aparts", "Axlar", "Uppvärmning", "Gummiband", "2 × 12–15", "Aktiverar övre rygg och bakre axel inför pressar och drag.", ["Håll bandet framför dig med nästan raka armar.", "Dra händerna isär och för skulderbladen lätt bakåt.", "Återgå långsamt utan att tappa hållningen."], ["Välj ett lätt band.", "Håll revbenen nere."], ["Rycka isär bandet.", "Lyfta axlarna mot öronen."]),
  movement("Bänkpress", "warmup-scapular-pushup", "Skulderbladsarmhävning", "Bröst", "Uppvärmning", "Kroppsvikt", "2 × 8–12", "Förbereder skulderbladens rörelse och bålkontroll inför pressövningar.", ["Stå i plankposition med raka armar.", "Låt bröstet sjunka lätt mellan skulderbladen utan att böja armbågarna.", "Pressa golvet bort och runda övre ryggen lätt."], ["Gör liten men kontrollerad rörelse.", "Spänn säte och mage."], ["Böja armbågarna.", "Tappa höften."]),
  movement("Triceps pushdown", "warmup-elbow", "Lätt pushdown", "Triceps", "Uppvärmning", "Kabel", "2 × 15–20", "Värmer armbågar och triceps med låg belastning före tyngre pressarbete.", ["Välj mycket lätt vikt.", "Håll överarmarna intill kroppen och sträck armbågarna.", "Arbeta lugnt genom ett smärtfritt rörelseomfång."], ["Jämnt tempo.", "Ingen utmattning."], ["Tung vikt.", "Träna genom skarp armbågssmärta."]),
  movement("Biceps curl-maskin", "warmup-curl", "Lätt kabelcurl", "Biceps", "Uppvärmning", "Kabel", "2 × 15–20", "Förbereder armbågsböjarna inför rodd, latsdrag och curls.", ["Stå stabilt med mycket lätt belastning.", "Böj armbågarna utan att flytta överarmarna.", "Sänk långsamt tills armarna nästan är raka."], ["Håll handlederna neutrala.", "Stanna långt från failure."], ["Gunga med kroppen.", "Översträcka armbågen."]),
  movement("Bulgarian split squat", "warmup-lunge", "Dynamisk höftöppnare", "Säte", "Uppvärmning", "Kroppsvikt", "6 per sida", "Förbereder höft, säte och lår inför underkroppspass.", ["Ta ett långt utfallssteg och sätt bakre knät mjukt mot golvet.", "Spänn sätet på bakre benet och för höften lätt framåt.", "Växla sida i lugn, flytande takt."], ["Håll bålen lång.", "Använd ett stöd vid behov."], ["Pressa in i smärta.", "Svanka kraftigt."]),
  movement("Rumänska marklyft (RDL)", "warmup-hamstring-sweep", "Dynamiskt hamstringsvep", "Baksida lår", "Uppvärmning", "Kroppsvikt", "8 per sida", "Ger baksida lår ett gradvis rörelseomfång före höftfällningar och lårcurls.", ["Sätt ena hälen lätt framför kroppen med rakare knä.", "Skjut höften bakåt och svep händerna mot foten.", "Res dig och växla sida utan att stanna i stretchläget."], ["Ryggen lång.", "Rörelsen ska kännas mjuk."], ["Studsa i botten.", "Runda ländryggen."]),
  movement("Bulgarian split squat", "warmup-squat", "Knäböj med kroppsvikt", "Framsida lår", "Uppvärmning", "Kroppsvikt", "2 × 8–10", "Värmer knän, höfter och framsida lår före benövningar.", ["Stå ungefär axelbrett med hela foten i golvet.", "Sätt dig ned mellan höfterna medan knäna följer tårna.", "Res dig kontrollerat och upprepa med jämnt tempo."], ["Välj ett bekvämt djup.", "Andas lugnt."], ["Knän som faller in.", "Snabba studsreps."]),
  movement("Vadpress", "warmup-ankle-rock", "Fotledsgung mot vägg", "Vader", "Uppvärmning", "Vägg", "10 per sida", "Förbereder fotledens rörlighet inför knäböj, utfall och benpress.", ["Placera framfoten en kort bit från väggen.", "För knät mot väggen utan att hälen lyfter.", "Backa ut och upprepa i lugn rytm."], ["Knät följer andra tån.", "Flytta foten för lagom motstånd."], ["Lyfta hälen.", "Tvinga förbi smärta."]),
  movement("Kabelcrunch", "warmup-dead-bug", "Dead bug", "Mage", "Uppvärmning", "Kroppsvikt", "2 × 6 per sida", "Aktiverar bålens kontroll före tunga pressar, drag och benövningar.", ["Ligg på rygg med höfter och knän i 90 grader.", "Pressa ländryggen lätt mot golvet.", "Sträck motsatt arm och ben utan att ryggen släpper."], ["Andas ut när du sträcker.", "Kortare rörelse är okej."], ["Svanka från golvet.", "Skynda genom repetitionerna."]),
];

export const STRETCH_EXERCISES: LibraryExercise[] = [
  movement("Bänkpress", "stretch-chest-wall", "Bröststretch mot vägg", "Bröst", "Stretch", "Vägg", "30–45 sek per sida", "Mjuk statisk stretch för bröst och framsida axel efter passet.", ["Placera handflatan mot väggen strax över axelhöjd.", "Vrid kroppen långsamt bort från armen.", "Stanna vid tydlig men behaglig stretch och andas lugnt."], ["Sänk axeln.", "Minska vinkeln om axeln känns trängd."], ["Pressa genom smärta.", "Hålla andan."]),
  movement("Latsdrag", "stretch-lat-bench", "Latstretch mot bänk", "Rygg", "Stretch", "Bänk", "30–45 sek", "Öppnar lats och bröstrygg efter dragövningar.", ["Sätt armbågar eller händer på en bänk.", "Skjut höften bakåt och sänk bröstet.", "Håll revbenen samlade och andas in i sidan av bröstkorgen."], ["Neutral nacke.", "Flytta händerna närmare vid behov."], ["Överdriven svank.", "Trycka axeln in i smärta."]),
  movement("Shoulder press", "stretch-shoulder-cross", "Axelstretch över bröstet", "Axlar", "Stretch", "Kroppsvikt", "25–35 sek per sida", "Mjuk stretch för bakre axel efter pressar och drag.", ["För ena armen tvärs över bröstet.", "Använd andra armen för ett lätt stöd ovanför armbågen.", "Håll axeln sänkt och andas lugnt."], ["Litet tryck räcker.", "Håll bålen still."], ["Dra i armbågsleden.", "Lyfta axeln."]),
  movement("Triceps extension", "stretch-triceps-overhead", "Tricepsstretch över huvudet", "Triceps", "Stretch", "Kroppsvikt", "25–35 sek per sida", "Stretch för triceps långa huvud och sidan av överkroppen.", ["Lyft armen och böj armbågen bakom huvudet.", "Stöd lätt på armbågen med andra handen.", "Håll revbenen nere och undvik att svanka."], ["Sänk axeln.", "Håll nacken avslappnad."], ["Trycka hårt i armbågen.", "Överdriven svank."]),
  movement("Biceps curl-maskin", "stretch-biceps-wall", "Bicepsstretch mot vägg", "Biceps", "Stretch", "Vägg", "20–30 sek per sida", "Förlänger biceps och framsida arm efter curls och drag.", ["Placera handflatan mot väggen med rak arm.", "Vrid kroppen försiktigt bort från handen.", "Stanna innan stickningar eller domningar uppstår."], ["Mjuk armbåge.", "Kort dos räcker."], ["Tvinga handleden bakåt.", "Fortsätta vid nervkänsla."]),
  movement("Hip thrust / glute drive", "stretch-glute-four", "Figure-four sätesstretch", "Säte", "Stretch", "Golv", "30–45 sek per sida", "Mjuk stretch för säte och utsida höft efter höftdominant träning.", ["Ligg på rygg och placera ena fotleden över motsatt knä.", "Dra det undre låret mot kroppen.", "Håll bäckenet tungt och andas lugnt."], ["Fotleden lätt spänd.", "Justera vinkeln för komfort."], ["Pressa knät hårt nedåt.", "Fortsätta vid knäsmärta."]),
  movement("Rumänska marklyft (RDL)", "stretch-hamstring", "Hamstringstretch", "Baksida lår", "Stretch", "Bänk", "30–45 sek per sida", "Kontrollerad stretch för baksida lår efter höftfällningar och curls.", ["Placera hälen på en låg bänk.", "Håll ryggen lång och fäll lätt fram från höften.", "Stanna när baksida lår sträcks utan att ryggen rundas."], ["Tårna pekar upp.", "Liten knäböj är okej."], ["Jaga maximal räckvidd.", "Studsa."]),
  movement("Benspark / leg extension", "stretch-quad", "Stående framsida lår-stretch", "Framsida lår", "Stretch", "Kroppsvikt", "30–40 sek per sida", "Stretch för framsida lår och höftböjare efter benpass.", ["Stå med stöd och greppa fotleden bakom kroppen.", "För knäna nära varandra och spänn sätet lätt.", "Dra hälen varsamt mot sätet utan att svanka."], ["Håll knät nedåt.", "Använd rem om du inte når foten."], ["Dra i foten med kraft.", "Svanka för större rörelse."]),
  movement("Vadpress", "stretch-calf-wall", "Vadstretch mot vägg", "Vader", "Stretch", "Vägg", "30–45 sek per sida", "Stretch för vaden med hälen kvar i golvet.", ["Sätt ena foten bakom den andra och håll tårna framåt.", "Pressa bakre hälen mot golvet.", "Luta kroppen fram tills vaden sträcks."], ["Rakt knä träffar yttre vaden mer.", "Böjt knä flyttar fokus djupare."], ["Vrida foten utåt.", "Studsa i läget."]),
  movement("Kabelcrunch", "stretch-abdominal", "Mjuk magstretch", "Mage", "Stretch", "Golv", "20–30 sek", "Försiktig öppning av framsida bål efter magträning.", ["Ligg på mage med underarmarna i golvet.", "Lyft bröstet försiktigt medan bäckenet ligger kvar.", "Stanna vid en mild stretch och andas lugnt."], ["Lång nacke.", "Välj lägre höjd vid behov."], ["Pressa upp i ryggsmärta.", "Spänna sätet hårt."]),
];

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  ...STRENGTH_EXERCISES.map((exercise) => ({ exercise, category: "Styrka" as const, equipment: "Gym", dose: "3 × 6" })),
  ...WARMUP_EXERCISES,
  ...STRETCH_EXERCISES,
];

export const STRENGTH_EXERCISE_BY_ID = new Map(STRENGTH_EXERCISES.map((exercise) => [exercise.id, exercise]));

export function exerciseAlternatives(exercise: Exercise) {
  return STRENGTH_EXERCISES.filter((candidate) => candidate.name !== exercise.name);
}

export function effectiveProgram(
  sourceProgram: WorkoutDay[],
  swaps: Record<string, string>,
  exerciseOrder: Record<string, string[]>,
  settings: Record<string, ExercisePrescription>,
) {
  return sourceProgram.map((day) => ({
    ...day,
    exercises: day.exercises.map((slot) => {
      const replacement = STRENGTH_EXERCISE_BY_ID.get(swaps[slot.id]);
      const selected = replacement
        ? { ...replacement, id: slot.id, order: slot.order, note: `Ersätter ${slot.name}. ${replacement.note}` }
        : slot;
      const defaulted = withStrengthDefaults(selected);
      const prescription = settings[slot.id];
      return prescription ? { ...defaulted, ...prescription } : defaulted;
    }).toSorted((first, second) => {
      const savedOrder = exerciseOrder[day.id] ?? [];
      const firstIndex = savedOrder.indexOf(first.id);
      const secondIndex = savedOrder.indexOf(second.id);
      return (firstIndex < 0 ? first.order + savedOrder.length : firstIndex) - (secondIndex < 0 ? second.order + savedOrder.length : secondIndex);
    }).map((exercise, index) => ({ ...exercise, order: index + 1 })),
  }));
}
