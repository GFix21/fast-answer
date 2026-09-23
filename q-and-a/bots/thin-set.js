/**
 * Factual questions for the thin sections: more difficult in every generation,
 * an extreme for multi-gen, and a plain hard when-question where that set was thin.
 * The slang line is added later. It is not part of the prompt.
 */
const WEEK = "2026-W39";

function q(row) {
  return { addedWeek: WEEK, sources: row.sources || [], ...row };
}

function row(id, tier, topic, generation, structure, text) {
  return q({
    id,
    tier,
    topic,
    generation,
    structure,
    correctIndex: 0,
    sources: text.sources,
    text: text.locales,
  });
}

export const thinSet = [
  row("cq-d-silent-suez", "difficult", "culture", "silent-generation", null, {
    sources: [{ label: "Encyclopaedia Britannica — Suez Crisis" }, { label: "UK National Archives — 1956" }],
    locales: {
      en: { categoryTitle: "Canal Year", prompt: "In which year did the Suez Crisis begin?", choices: ["1956", "1948", "1967", "1950"], banterHint: "The canal closed. The year is the earlier one." },
      fr: { categoryTitle: "Année du canal", prompt: "En quelle année la crise de Suez a-t-elle commencé ?", choices: ["1956", "1948", "1967", "1950"], banterHint: "Le canal a fermé. L'année est la plus ancienne." },
      "fr-CA": { categoryTitle: "Année du canal", prompt: "En quelle année la crise de Suez a commencé ?", choices: ["1956", "1948", "1967", "1950"], banterHint: "Le canal a fermé. L'année est la plus ancienne." },
      de: { categoryTitle: "Kanaljahr", prompt: "In welchem Jahr begann die Suezkrise?", choices: ["1956", "1948", "1967", "1950"], banterHint: "Der Kanal schloss. Das Jahr ist das frühere." },
    },
  }),
  row("cq-d-boomer-salt", "difficult", "culture", "baby-boomer", null, {
    sources: [{ label: "US Department of State — SALT I" }, { label: "Encyclopaedia Britannica — SALT I" }],
    locales: {
      en: { categoryTitle: "1972 Treaty", prompt: "Which arms-control agreement did the United States and the Soviet Union sign in 1972?", choices: ["SALT I", "Warsaw Pact", "Camp David Accords", "Helsinki Final Act"], banterHint: "The initials are the short name. The year is 1972." },
      fr: { categoryTitle: "Traité de 1972", prompt: "Quel accord de maîtrise des armements les États-Unis et l'Union soviétique ont-ils signé en 1972 ?", choices: ["SALT I", "Pacte de Varsovie", "Accords de Camp David", "Acte final d'Helsinki"], banterHint: "Les initiales sont le nom court. L'année est 1972." },
      "fr-CA": { categoryTitle: "Traité de 1972", prompt: "Quel accord de maîtrise des armements les États-Unis et l'Union soviétique ont signé en 1972 ?", choices: ["SALT I", "Pacte de Varsovie", "Accords de Camp David", "Acte final d'Helsinki"], banterHint: "Les initiales sont le nom court. L'année est 1972." },
      de: { categoryTitle: "Vertrag 1972", prompt: "Welches Rüstungskontrollabkommen unterzeichneten die USA und die Sowjetunion 1972?", choices: ["SALT I", "Warschauer Pakt", "Camp-David-Abkommen", "Schlussakte von Helsinki"], banterHint: "Die Initialen sind der kurze Name. Das Jahr ist 1972." },
    },
  }),
  row("cq-h-boomer-wall", "hard", "culture", "baby-boomer", "when", {
    sources: [{ label: "Encyclopaedia Britannica — Berlin Wall" }, { label: "German Historical Museum — Berlin Wall" }],
    locales: {
      en: { categoryTitle: "Wire and Concrete", prompt: "When did construction of the Berlin Wall begin?", choices: ["1961", "1949", "1989", "1953"], banterHint: "The fall came later. This is the year it went up." },
      fr: { categoryTitle: "Fil et béton", prompt: "Quand la construction du mur de Berlin a-t-elle commencé ?", choices: ["1961", "1949", "1989", "1953"], banterHint: "La chute est venue après. Ici, c'est l'année de la construction." },
      "fr-CA": { categoryTitle: "Fil et béton", prompt: "Quand la construction du mur de Berlin a commencé ?", choices: ["1961", "1949", "1989", "1953"], banterHint: "La chute est venue après. Ici, c'est l'année de la construction." },
      de: { categoryTitle: "Draht und Beton", prompt: "Wann begann der Bau der Berliner Mauer?", choices: ["1961", "1949", "1989", "1953"], banterHint: "Der Fall kam später. Hier geht es um das Jahr des Baus." },
    },
  }),
  row("cq-d-genx-columbia", "difficult", "sci-fi", "gen-x", null, {
    sources: [{ label: "NASA — STS-1" }, { label: "Encyclopaedia Britannica — space shuttle" }],
    locales: {
      en: { categoryTitle: "First Flight", prompt: "Which space shuttle flew the first orbital shuttle mission in 1981?", choices: ["Columbia", "Challenger", "Discovery", "Atlantis"], banterHint: "The program had several names. This one flew first." },
      fr: { categoryTitle: "Premier vol", prompt: "Quelle navette spatiale a effectué la première mission orbitale en 1981 ?", choices: ["Columbia", "Challenger", "Discovery", "Atlantis"], banterHint: "Le programme a plusieurs noms. Celle-ci a volé la première." },
      "fr-CA": { categoryTitle: "Premier vol", prompt: "Quelle navette spatiale a fait la première mission orbitale en 1981 ?", choices: ["Columbia", "Challenger", "Discovery", "Atlantis"], banterHint: "Le programme a plusieurs noms. Celle-ci a volé la première." },
      de: { categoryTitle: "Erster Flug", prompt: "Welches Space Shuttle flog 1981 die erste Orbitalmission?", choices: ["Columbia", "Challenger", "Discovery", "Atlantis"], banterHint: "Das Programm hatte mehrere Namen. Dieses flog zuerst." },
    },
  }),
  row("cq-h-genx-hubble", "hard", "sci-fi", "gen-x", "when", {
    sources: [{ label: "NASA — Hubble Space Telescope" }, { label: "Encyclopaedia Britannica — Hubble Space Telescope" }],
    locales: {
      en: { categoryTitle: "Orbiting Eye", prompt: "When was the Hubble Space Telescope launched?", choices: ["1990", "1981", "1998", "2003"], banterHint: "The mirror needed a later visit. The launch year is the first one." },
      fr: { categoryTitle: "Œil en orbite", prompt: "Quand le télescope spatial Hubble a-t-il été lancé ?", choices: ["1990", "1981", "1998", "2003"], banterHint: "Le miroir a eu besoin d'une visite plus tard. L'année de lancement est la première." },
      "fr-CA": { categoryTitle: "Œil en orbite", prompt: "Quand le télescope spatial Hubble a été lancé ?", choices: ["1990", "1981", "1998", "2003"], banterHint: "Le miroir a eu besoin d'une visite plus tard. L'année de lancement est la première." },
      de: { categoryTitle: "Auge im Orbit", prompt: "Wann wurde das Hubble-Weltraumteleskop gestartet?", choices: ["1990", "1981", "1998", "2003"], banterHint: "Der Spiegel brauchte später einen Besuch. Das Startjahr ist das erste." },
    },
  }),
  row("cq-d-geny-wiki", "difficult", "culture", "gen-y", null, {
    sources: [{ label: "Wikimedia Foundation — Wikipedia history" }, { label: "Encyclopaedia Britannica — Wikipedia" }],
    locales: {
      en: { categoryTitle: "Open Pages", prompt: "In which year did Wikipedia launch?", choices: ["2001", "1998", "2004", "1995"], banterHint: "The pages are many. The start is one year." },
      fr: { categoryTitle: "Pages ouvertes", prompt: "En quelle année Wikipédia a-t-il été lancé ?", choices: ["2001", "1998", "2004", "1995"], banterHint: "Les pages sont nombreuses. Le départ est une année." },
      "fr-CA": { categoryTitle: "Pages ouvertes", prompt: "En quelle année Wikipédia a été lancé ?", choices: ["2001", "1998", "2004", "1995"], banterHint: "Les pages sont nombreuses. Le départ est une année." },
      de: { categoryTitle: "Offene Seiten", prompt: "In welchem Jahr startete Wikipedia?", choices: ["2001", "1998", "2004", "1995"], banterHint: "Die Seiten sind viele. Der Anfang ist ein Jahr." },
    },
  }),
  row("cq-h-geny-youtube", "hard", "film-tv", "gen-y", "when", {
    sources: [{ label: "Encyclopaedia Britannica — YouTube" }, { label: "Google — YouTube about" }],
    locales: {
      en: { categoryTitle: "First Upload", prompt: "When did YouTube launch to the public?", choices: ["2005", "2001", "2007", "2010"], banterHint: "The first clip was short. The year is the middle one of that decade." },
      fr: { categoryTitle: "Premier envoi", prompt: "Quand YouTube a-t-il été ouvert au public ?", choices: ["2005", "2001", "2007", "2010"], banterHint: "Le premier clip était court. L'année est au milieu de cette décennie." },
      "fr-CA": { categoryTitle: "Premier envoi", prompt: "Quand YouTube a été ouvert au public ?", choices: ["2005", "2001", "2007", "2010"], banterHint: "Le premier clip était court. L'année est au milieu de cette décennie." },
      de: { categoryTitle: "Erster Upload", prompt: "Wann wurde YouTube für die Öffentlichkeit geöffnet?", choices: ["2005", "2001", "2007", "2010"], banterHint: "Der erste Clip war kurz. Das Jahr liegt in der Mitte dieses Jahrzehnts." },
    },
  }),
  row("cq-d-genz-webb", "difficult", "sci-fi", "gen-z", null, {
    sources: [{ label: "NASA — James Webb Space Telescope" }, { label: "ESA — Webb launch" }],
    locales: {
      en: { categoryTitle: "Deep Eye", prompt: "In which year did the James Webb Space Telescope launch?", choices: ["2021", "2018", "2016", "2024"], banterHint: "Christmas Day, from a spaceport in South America." },
      fr: { categoryTitle: "Œil lointain", prompt: "En quelle année le télescope spatial James-Webb a-t-il été lancé ?", choices: ["2021", "2018", "2016", "2024"], banterHint: "Le jour de Noël, depuis un port spatial en Amérique du Sud." },
      "fr-CA": { categoryTitle: "Œil lointain", prompt: "En quelle année le télescope spatial James-Webb a été lancé ?", choices: ["2021", "2018", "2016", "2024"], banterHint: "Le jour de Noël, depuis un port spatial en Amérique du Sud." },
      de: { categoryTitle: "Fernes Auge", prompt: "In welchem Jahr startete das James-Webb-Weltraumteleskop?", choices: ["2021", "2018", "2016", "2024"], banterHint: "Am ersten Weihnachtstag, von einem Weltraumbahnhof in Südamerika." },
    },
  }),
  row("cq-h-genz-curiosity", "hard", "sci-fi", "gen-z", "when", {
    sources: [{ label: "NASA — Curiosity rover" }, { label: "Encyclopaedia Britannica — Curiosity" }],
    locales: {
      en: { categoryTitle: "Gale Crater", prompt: "When did NASA's Curiosity rover land on Mars?", choices: ["2012", "2004", "2021", "1997"], banterHint: "The sky crane did the last step. The year is 2012." },
      fr: { categoryTitle: "Cratère Gale", prompt: "Quand le rover Curiosity de la NASA s'est-il posé sur Mars ?", choices: ["2012", "2004", "2021", "1997"], banterHint: "La grue volante a fait le dernier pas. L'année est 2012." },
      "fr-CA": { categoryTitle: "Cratère Gale", prompt: "Quand le rover Curiosity de la NASA s'est posé sur Mars ?", choices: ["2012", "2004", "2021", "1997"], banterHint: "La grue volante a fait le dernier pas. L'année est 2012." },
      de: { categoryTitle: "Gale-Krater", prompt: "Wann landete der NASA-Rover Curiosity auf dem Mars?", choices: ["2012", "2004", "2021", "1997"], banterHint: "Der Flugkran machte den letzten Schritt. Das Jahr ist 2012." },
    },
  }),
  row("cq-d-alpha-perseverance", "difficult", "sci-fi", "gen-alpha", null, {
    sources: [{ label: "NASA — Perseverance rover" }, { label: "Encyclopaedia Britannica — Perseverance" }],
    locales: {
      en: { categoryTitle: "Jezero", prompt: "In which year did NASA's Perseverance rover land on Mars?", choices: ["2021", "2012", "2020", "2004"], banterHint: "A small helicopter came along for the ride." },
      fr: { categoryTitle: "Jezero", prompt: "En quelle année le rover Perseverance de la NASA s'est-il posé sur Mars ?", choices: ["2021", "2012", "2020", "2004"], banterHint: "Un petit hélicoptère est venu pour la promenade." },
      "fr-CA": { categoryTitle: "Jezero", prompt: "En quelle année le rover Perseverance de la NASA s'est posé sur Mars ?", choices: ["2021", "2012", "2020", "2004"], banterHint: "Un petit hélicoptère est venu pour la promenade." },
      de: { categoryTitle: "Jezero", prompt: "In welchem Jahr landete der NASA-Rover Perseverance auf dem Mars?", choices: ["2021", "2012", "2020", "2004"], banterHint: "Ein kleiner Hubschrauber flog mit." },
    },
  }),
  row("cq-h-alpha-iss", "hard", "sci-fi", "gen-alpha", "when", {
    sources: [{ label: "NASA — Expedition 1" }, { label: "Encyclopaedia Britannica — International Space Station" }],
    locales: {
      en: { categoryTitle: "First Crew", prompt: "When did the first crew arrive at the International Space Station?", choices: ["2000", "1998", "2011", "1986"], banterHint: "The first module was already up. The people came in 2000." },
      fr: { categoryTitle: "Premier équipage", prompt: "Quand le premier équipage est-il arrivé à la Station spatiale internationale ?", choices: ["2000", "1998", "2011", "1986"], banterHint: "Le premier module était déjà là. Les gens sont arrivés en 2000." },
      "fr-CA": { categoryTitle: "Premier équipage", prompt: "Quand le premier équipage est arrivé à la Station spatiale internationale ?", choices: ["2000", "1998", "2011", "1986"], banterHint: "Le premier module était déjà là. Les gens sont arrivés en 2000." },
      de: { categoryTitle: "Erste Besatzung", prompt: "Wann traf die erste Besatzung auf der Internationalen Raumstation ein?", choices: ["2000", "1998", "2011", "1986"], banterHint: "Das erste Modul war schon oben. Die Menschen kamen 2000." },
    },
  }),
  row("cq-d-multi-everest", "difficult", "geography", "multi-gen", null, {
    sources: [{ label: "Encyclopaedia Britannica — Mount Everest" }, { label: "Royal Geographical Society — 1953 expedition" }],
    locales: {
      en: { categoryTitle: "Summit", prompt: "In which year did Edmund Hillary and Tenzing Norgay first reach the summit of Mount Everest?", choices: ["1953", "1924", "1963", "1950"], banterHint: "Two people, one ridge, one year that stuck." },
      fr: { categoryTitle: "Sommet", prompt: "En quelle année Edmund Hillary et Tenzing Norgay ont-ils atteint pour la première fois le sommet de l'Everest ?", choices: ["1953", "1924", "1963", "1950"], banterHint: "Deux personnes, une arête, une année restée." },
      "fr-CA": { categoryTitle: "Sommet", prompt: "En quelle année Edmund Hillary et Tenzing Norgay ont atteint pour la première fois le sommet de l'Everest ?", choices: ["1953", "1924", "1963", "1950"], banterHint: "Deux personnes, une arête, une année restée." },
      de: { categoryTitle: "Gipfel", prompt: "In welchem Jahr erreichten Edmund Hillary und Tenzing Norgay erstmals den Gipfel des Mount Everest?", choices: ["1953", "1924", "1963", "1950"], banterHint: "Zwei Menschen, ein Grat, ein Jahr, das blieb." },
    },
  }),
  row("cq-x-multi-light", "extreme", "sci-fi", "multi-gen", null, {
    sources: [{ label: "NASA — Sun fact sheet" }, { label: "Encyclopaedia Britannica — sunlight" }],
    locales: {
      en: { categoryTitle: "Travel Time", prompt: "About how long does sunlight take to reach Earth?", choices: ["About 8 minutes", "About 8 seconds", "About 8 hours", "About 8 days"], banterHint: "The Sun is far, and the trip is still a coffee break." },
      fr: { categoryTitle: "Temps de trajet", prompt: "Environ combien de temps la lumière du Soleil met-elle pour atteindre la Terre ?", choices: ["Environ 8 minutes", "Environ 8 secondes", "Environ 8 heures", "Environ 8 jours"], banterHint: "Le Soleil est loin, et le trajet tient dans une pause-café." },
      "fr-CA": { categoryTitle: "Temps de trajet", prompt: "La lumière du Soleil prend environ combien de temps pour atteindre la Terre ?", choices: ["Environ 8 minutes", "Environ 8 secondes", "Environ 8 heures", "Environ 8 jours"], banterHint: "Le Soleil est loin, et le trajet tient dans une pause-café." },
      de: { categoryTitle: "Reisezeit", prompt: "Ungefähr wie lange braucht das Sonnenlicht bis zur Erde?", choices: ["Etwa 8 Minuten", "Etwa 8 Sekunden", "Etwa 8 Stunden", "Etwa 8 Tage"], banterHint: "Die Sonne ist weit, und die Reise passt in eine Kaffeepause." },
    },
  }),
  row("cq-h-multi-metric", "hard", "culture", "multi-gen", "when", {
    sources: [{ label: "US Congress — Metric Conversion Act of 1975" }, { label: "NIST — metric conversion" }],
    locales: {
      en: { categoryTitle: "Metric Act", prompt: "When did the United States adopt the Metric Conversion Act?", choices: ["1975", "1960", "1988", "1959"], banterHint: "The inch stayed in the kitchen. The act still has a year." },
      fr: { categoryTitle: "Loi métrique", prompt: "Quand les États-Unis ont-ils adopté la loi sur la conversion au système métrique ?", choices: ["1975", "1960", "1988", "1959"], banterHint: "Le pouce est resté dans la cuisine. La loi a quand même une année." },
      "fr-CA": { categoryTitle: "Loi métrique", prompt: "Quand les États-Unis ont adopté la loi sur la conversion au système métrique ?", choices: ["1975", "1960", "1988", "1959"], banterHint: "Le pouce est resté dans la cuisine. La loi a quand même une année." },
      de: { categoryTitle: "Metrisches Gesetz", prompt: "Wann haben die USA das Gesetz zur metrischen Umstellung verabschiedet?", choices: ["1975", "1960", "1988", "1959"], banterHint: "Der Zoll blieb in der Küche. Das Gesetz hat trotzdem ein Jahr." },
    },
  }),
];
