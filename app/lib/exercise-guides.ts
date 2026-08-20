export type ExerciseGuide = {
  summary: string;
  steps: string[];
  tips: string[];
  avoid: string[];
};

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  "Bänkpress": {
    summary: "En tung basövning för bröst, triceps och främre axel där en stabil helkroppsposition gör pressen både starkare och tryggare.",
    steps: [
      "Lägg dig med ögonen ungefär under stången. Sätt hela fötterna i golvet och dra skulderbladen bakåt och nedåt.",
      "Greppa strax utanför axelbredd, håll handlederna ovanför armbågarna och lyft ut stången med raka armar.",
      "Sänk kontrollerat mot nedre delen av bröstet med armbågarna snett nedåt, inte rakt ut åt sidorna.",
      "Pressa stången uppåt och lite bakåt samtidigt som fötterna trycker stadigt i golvet.",
    ],
    tips: ["Håll rumpa och övre rygg kvar i bänken.", "Ta ett nytt buktryck före varje tung repetition.", "Använd passare eller säkerhetsarmar nära failure."],
    avoid: ["Studsa stången mot bröstet.", "Låt handlederna vika bakåt.", "Jaga vikt när skuldrorna tappar sin position."],
  },
  "Sittande kabelrodd": {
    summary: "Bygger övre rygg och lats genom att föra armbågarna bakåt medan bålen hålls stabil.",
    steps: [
      "Sätt fötterna stabilt, sträck på ryggen och håll knäna lätt böjda.",
      "Starta med långa armar och axlarna långt från öronen utan att säcka ihop i ländryggen.",
      "Dra handtaget mot magen och för armbågarna bakåt nära kroppen.",
      "Pausa kort när skulderbladen närmar sig varandra och återgå långsamt till full räckvidd.",
    ],
    tips: ["Tänk armbågar mot bakfickorna.", "Låt skulderbladen röra sig – inte bara armarna.", "En liten naturlig rörelse i bålen är okej, men undvik gung."],
    avoid: ["Rycka igång vikten.", "Dra upp axlarna mot öronen.", "Runda ländryggen i ytterläget."],
  },
  "Latsdrag": {
    summary: "Tränar framför allt latsen och hjälper dig bygga ryggbredd och styrka i vertikala drag.",
    steps: [
      "Lås fast låren under dynan och greppa stången något bredare än axelbrett.",
      "Luta överkroppen svagt bakåt, lyft bröstet och sänk axlarna.",
      "Dra armbågarna ned mot sidorna tills stången närmar sig övre bröstet.",
      "Släpp upp kontrollerat tills armarna är långa och latsen får sträckas ut.",
    ],
    tips: ["Tänk att händerna bara är krokar.", "Dra med armbågarna, inte med handlederna.", "Välj en vikt som låter dig behålla samma bålposition."],
    avoid: ["Dra stången bakom nacken.", "Gunga bak vikten med hela kroppen.", "Korta av toppläget för att få fler reps."],
  },
  "Shoulder press": {
    summary: "En press för främre och mellersta axel samt triceps, med extra krav på bål- och skulderkontroll.",
    steps: [
      "Ställ ryggstödet nästan upprätt och placera fötterna stadigt i golvet.",
      "Starta med hantlarna vid axelhöjd, underarmarna lodräta och handlederna raka.",
      "Spänn magen och pressa upp tills armarna nästan är raka utan att överdriva svanken.",
      "Sänk lugnt tillbaka till ett djup där axlarna känns stabila och smärtfria.",
    ],
    tips: ["Håll revbenen nere.", "Pressa uppåt och svagt inåt.", "Stanna före det djup där axeln glider fram."],
    avoid: ["Överdriven svank.", "Slå ihop hantlarna i toppen.", "Sänka snabbare än du kan kontrollera."],
  },
  "Sidolyft i kabel": {
    summary: "Isolerar främst axelns mellersta del och ger jämn belastning genom nästan hela rörelsen.",
    steps: [
      "Stå stabilt med kabeln på motsatt sida och handtaget framför eller strax bakom kroppen.",
      "Håll en liten böj i armbågen och låt axeln vara sänkt.",
      "För armen ut åt sidan genom att leda rörelsen med armbågen.",
      "Stanna ungefär vid axelhöjd och sänk långsamt tillbaka utan att låta viktmagasinet slå i.",
    ],
    tips: ["Lättare vikt ger oftast bättre träff.", "Tänk bred rörelse, inte uppdraget axelryck.", "Håll samma armbågsvinkel hela vägen."],
    avoid: ["Svinga kroppen.", "Lyfta handen långt högre än armbågen.", "Rycka ur bottenläget."],
  },
  "Triceps pushdown": {
    summary: "En stabil isolationsövning för triceps där överarmen ska ligga still medan armbågen sträcks.",
    steps: [
      "Stå nära kabeln med lätt böjda knän, spänd mage och armbågarna intill kroppen.",
      "Starta med underarmarna ungefär parallella med golvet och axlarna sänkta.",
      "Pressa handtaget ned tills armarna är raka utan att flytta överarmarna bakåt.",
      "Spänn triceps kort och låt vikten återgå kontrollerat.",
    ],
    tips: ["Håll handlederna neutrala.", "Separera repets ändar lätt i botten om du använder rep.", "Låt bara underarmen röra sig."],
    avoid: ["Fälla överkroppen över handtaget.", "Låta armbågarna glida fram och tillbaka.", "Släppa upp vikten snabbt."],
  },
  "Biceps curl-maskin": {
    summary: "Ger stabil bicepsträning med liten möjlighet att fuska när maskinen är rätt inställd.",
    steps: [
      "Justera sitsen så armbågarna ligger i linje med maskinens rotationspunkt.",
      "Placera överarmarna mot stödet och greppa med raka, stabila handleder.",
      "Böj armbågarna och lyft handtaget utan att axlarna följer med framåt.",
      "Spänn i toppen och sänk hela vägen med kontroll utan att slå i viktmagasinet.",
    ],
    tips: ["Behåll kontakt mellan överarm och stöd.", "Sänk gärna lite långsammare än du lyfter.", "Stanna strax före ett hårt låst armbågsläge."],
    avoid: ["Lyfta axlarna.", "Böja handlederna för att få upp vikten.", "Studsa ur bottenläget."],
  },
  "Hip thrust / glute drive": {
    summary: "En höftdominant övning som belastar sätet tungt och som fungerar bäst med en stabil bänk och kontrollerat toppläge.",
    steps: [
      "Placera skulderbladens nedre kant mot bänken och stå med fötterna ungefär höftbrett.",
      "Håll hakan lätt in, revbenen nere och vikten centrerad över höften.",
      "Tryck genom hela foten och lyft höften tills bål och lår bildar en rak linje.",
      "Tippa bäckenet lätt bakåt, spänn sätet en sekund och sänk kontrollerat.",
    ],
    tips: ["I toppläget ska underbenen vara nära lodräta.", "Tänk att bältesspännet ska mot hakan.", "En dyna över stången gör tunga set bekvämare."],
    avoid: ["Översträcka ländryggen i toppen.", "Trycka mest genom tårna.", "Studsa vikten ur bottenläget."],
  },
  "Rumänska marklyft (RDL)": {
    summary: "Ett höftfällningsmönster för baksida lår, säte och ryggens stabiliserande muskler.",
    steps: [
      "Stå höftbrett med stången nära låren, lätt böjda knän och spänd bål.",
      "Dra axlarna nedåt, spänn latsen och skjut höften långt bak.",
      "Låt stången glida tätt längs benen tills baksida lår är tydligt sträckt och ryggen fortfarande neutral.",
      "Tryck höften fram och res dig genom att spänna säte och baksida lår.",
    ],
    tips: ["Tänk stäng en bildörr med rumpan.", "Stången ska nästan skrapa benen.", "Djupet bestäms av din rörlighet, inte av golvet."],
    avoid: ["Göra rörelsen till en knäböj.", "Runda ryggen för extra djup.", "Luta dig bakåt i toppläget."],
  },
  "Sittande lårcurl": {
    summary: "Isolerar baksida lår i ett höftböjt läge där muskeln kan arbeta genom ett långt rörelseomfång.",
    steps: [
      "Justera sits och ryggstöd så knäleden ligger i linje med maskinens axel.",
      "Placera rullen strax ovanför hälen och lås fast låren med den övre dynan.",
      "Pressa höfterna mot sitsen och böj knäna så långt du kan med kontroll.",
      "Pausa kort och återgå långsamt till nästan raka ben.",
    ],
    tips: ["Håll tårna avslappnade eller lätt mot dig.", "Behåll rumpan i sitsen.", "Prioritera full rörelse framför extra vikt."],
    avoid: ["Lyfta höfterna.", "Släppa vikten på vägen tillbaka.", "Ställa knäleden framför eller bakom maskinens rotationspunkt."],
  },
  "Benspark / leg extension": {
    summary: "Isolerar framsida lår och är enkel att dosera när knä och maskin är rätt linjerade.",
    steps: [
      "Justera ryggstödet så knävecket ligger vid sitsens kant och knäleden vid maskinens axel.",
      "Placera rullen på nedre delen av smalbenet och greppa handtagen.",
      "Sträck benen kontrollerat tills knäna är raka men inte aggressivt översträckta.",
      "Spänn framsida lår kort och sänk långsamt till ett bekvämt bottenläge.",
    ],
    tips: ["Håll höfterna nedtryckta.", "Använd jämnt tempo.", "Justera rörelsedjupet om knäna känns irriterade."],
    avoid: ["Sparka upp vikten med fart.", "Låta viktmagasinet slå ihop.", "Träna genom skarp knäsmärta."],
  },
  "Vadpress": {
    summary: "Tränar vadmusklerna genom att växla mellan ett djupt, kontrollerat stretchläge och ett tydligt toppläge.",
    steps: [
      "Placera främre delen av fötterna stabilt på plattformen med hälarna fria.",
      "Sänk hälarna långsamt tills du känner en tydlig stretch i vaderna.",
      "Pressa genom stortån och trampdynan tills du står så högt på tå som möjligt.",
      "Pausa i toppen och sänk tillbaka utan studs.",
    ],
    tips: ["Håll knäna i samma vinkel hela setet.", "Använd hela rörelsen innan du höjer vikten.", "En kort paus i båda ändlägena gör lättare vikt effektiv."],
    avoid: ["Studsa i botten.", "Rulla ut på lilltån.", "Göra små snabba halvreps som standard."],
  },
  "Kabelcrunch": {
    summary: "Belastar magen genom att föra bröstkorgen mot bäckenet medan höften hålls relativt stilla.",
    steps: [
      "Knästående framför kabeln, håll repet vid sidorna av huvudet utan att dra med armarna.",
      "Sätt höfterna över knäna, spänn sätet lätt och börja med lång ryggrad.",
      "Andas ut och rulla revbenen ned mot bäckenet genom att krumma överkroppen.",
      "Pausa när magen är maximalt förkortad och återgå långsamt utan att tappa kabelspänningen.",
    ],
    tips: ["Tänk bröstben mot navel.", "Håll repet still vid huvudet.", "Låt magen skapa rörelsen, inte armar och höft."],
    avoid: ["Göra en vanlig höftfällning.", "Dra repet med triceps.", "Rycka ned för tung vikt."],
  },
  "Snedbänk hantelpress": {
    summary: "Pressar med extra fokus på övre bröst, samtidigt som axlar och triceps hjälper till.",
    steps: [
      "Ställ bänken på ungefär 20–40 grader och sätt fötterna stadigt i golvet.",
      "Dra skulderbladen bakåt och nedåt och starta med hantlarna ovanför övre bröstet.",
      "Sänk kontrollerat med armbågarna snett nedåt tills hantlarna når bröstets sidor.",
      "Pressa upp och svagt inåt utan att slå ihop hantlarna.",
    ],
    tips: ["En för brant bänk gör övningen mer axeldominant.", "Håll handleder över armbågar.", "Använd låren för att få hantlarna säkert in och ur position."],
    avoid: ["Fälla ut armbågarna rakt åt sidan.", "Tappa skulderpositionen i botten.", "Sänka olika djupt på höger och vänster sida."],
  },
  "Pec deck": {
    summary: "En stabil bröstisolering där du kan fokusera på att föra överarmarna mot varandra.",
    steps: [
      "Justera sitsen så handtag och armbågar hamnar ungefär i brösthöjd.",
      "Håll bröstet upp, skulderbladen stabila och armbågarna lätt böjda.",
      "För armarna mot varandra i en jämn båge utan att axlarna glider fram.",
      "Spänn bröstet kort och öppna långsamt till ett bekvämt stretchläge.",
    ],
    tips: ["Tänk att överarmarna ska mötas.", "Behåll samma armbågsvinkel.", "Stanna innan framsidan av axeln känns pressad."],
    avoid: ["Smälla ihop handtagen.", "Överdriva stretchläget.", "Lyfta axlarna mot öronen."],
  },
  "Maskinrodd / bröststödd rodd": {
    summary: "Tränar övre rygg och lats med bröststöd som minskar möjligheten att skapa fart med bålen.",
    steps: [
      "Justera sitsen så bröstet ligger stabilt mot stödet och handtagen nås med långa armar.",
      "Sänk axlarna och spänn magen utan att pressa huvudet framåt.",
      "Dra armbågarna bakåt och låt skulderbladen närma sig varandra.",
      "Pausa kort och sträck långsamt ut armarna medan bröstet stannar mot dynan.",
    ],
    tips: ["Armbågar nära kroppen träffar mer lats.", "Lite bredare armbågar träffar mer övre rygg.", "Håll nacken lång och avslappnad."],
    avoid: ["Lyfta bröstet från stödet.", "Rycka bak axlarna.", "Korta av det utsträckta läget."],
  },
  "Neutralt latsdrag": {
    summary: "Ett vertikalt drag med handflatorna mot varandra som ofta känns naturligt för axlarna och låter armbågarna följa kroppen.",
    steps: [
      "Lås fast låren och greppa de neutrala handtagen med långa armar.",
      "Lyft bröstet lätt, håll magen spänd och sänk axlarna.",
      "Dra armbågarna ned mot fickorna tills handtaget når övre bröstet.",
      "Återgå lugnt till full sträckning utan att tappa bålpositionen.",
    ],
    tips: ["Håll underarmarna i handtagens riktning.", "Pausa en kort stund i botten.", "Låt skulderbladen rotera upp i toppläget."],
    avoid: ["Luta dig långt bakåt.", "Dra med biceps först.", "Släppa upp viktmagasinet okontrollerat."],
  },
  "Reverse fly / omvänd pec deck": {
    summary: "Isolerar bakre axel och övre rygg genom att föra armarna utåt och bakåt mot motstånd.",
    steps: [
      "Justera sitsen så handtagen är i axelhöjd och håll bröstet mot stödet.",
      "Greppa med mjuka armbågar och sänk axlarna från öronen.",
      "För armarna ut åt sidorna och bakåt utan att ändra armbågsvinkeln.",
      "Pausa kort och återgå kontrollerat tills du känner en mild stretch baktill på axeln.",
    ],
    tips: ["Tänk bred båge med händerna.", "Lätt vikt brukar ge bättre kontakt.", "Håll bröstet kvar mot dynan."],
    avoid: ["Göra rörelsen till en rodd.", "Rycka ihop skulderbladen.", "Översträcka långt bakom kroppen."],
  },
  "Triceps extension": {
    summary: "Överhuvudvarianten tränar triceps, särskilt det långa huvudet, i ett utsträckt läge.",
    steps: [
      "Stå i delad position vänd från kabeln och håll repet bakom huvudet.",
      "Spänn magen, håll revbenen nere och rikta armbågarna framåt nära huvudet.",
      "Sträck armbågarna tills armarna är raka utan att flytta överarmarna.",
      "Sänk långsamt tills triceps får en tydlig stretch och upprepa.",
    ],
    tips: ["Håll nacken neutral.", "Låt repets ändar gå isär i slutläget.", "Använd en vikt som inte drar dig ur position."],
    avoid: ["Svära kraftigt i ryggen.", "Låta armbågarna falla isär.", "Göra rörelsen med axlarna."],
  },
  "Preacher curl": {
    summary: "En bicepscurl där stödet låser överarmen och gör det lättare att hålla varje repetition strikt.",
    steps: [
      "Justera sitsen så armhålorna ligger nära stödets överkant och överarmarna vilar plant.",
      "Starta med nästan raka armar och raka handleder.",
      "Böj armbågarna och för vikten upp utan att lyfta överarmarna från stödet.",
      "Spänn biceps och sänk långsamt tillbaka utan att släppa spänningen helt.",
    ],
    tips: ["Kontrollera de sista centimetrarna nedåt.", "Håll axlarna bak och ned.", "Avsluta setet när du måste lyfta armbågarna."],
    avoid: ["Studsa ur bottenläget.", "Översträcka armbågen hårt.", "Böja handlederna för att få upp vikten."],
  },
  "Bulgarian split squat": {
    summary: "En enbensövning för lår och säte som även tränar balans, höftkontroll och sidoskillnader.",
    steps: [
      "Stå ett lagom långt steg framför bänken och placera bakre fotens ovansida på den.",
      "Håll främre foten helt i golvet, spänn bålen och för större delen av vikten till främre benet.",
      "Sänk kroppen rakt ned medan främre knät följer tårnas riktning.",
      "Tryck genom mitten av främre foten och res dig utan att skjuta ifrån mycket med bakbenet.",
    ],
    tips: ["Börja utan vikt tills balansen sitter.", "Längre steg träffar oftast mer säte, kortare mer framsida lår.", "Ha ett stöd nära om du vill fokusera mer på muskeln än balansen."],
    avoid: ["Studsa knät i botten.", "Låta främre fotens häl lyfta.", "Stå så nära bänken att höften vrids eller balansen försvinner."],
  },
};

export function getExerciseGuide(name: string) {
  const guide = EXERCISE_GUIDES[name];
  if (!guide) throw new Error(`Övningsguide saknas för ${name}`);
  return guide;
}
