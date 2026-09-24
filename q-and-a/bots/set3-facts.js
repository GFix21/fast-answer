/**
 * SET00003 facts. New questions, not reworded lines from an older set.
 * Choice 0 is correct in every language.
 */

const GENS = [
  "silent-generation",
  "baby-boomer",
  "gen-x",
  "gen-y",
  "gen-z",
  "gen-alpha",
  "multi-gen",
];

function loc(prompt, choices, hint) {
  return { categoryTitle: hint.title, prompt, choices, banterHint: hint.line };
}

function pack(tier, topic, slug, text, structure) {
  return { tier, topic, slug, structure: structure || null, text };
}

function trio(en, qc, de) {
  return { en, qc, de };
}

function choicesOf(correct, wrongs) {
  const as = (v) => (typeof v === "string" ? trio(v, v, v) : v);
  const all = [as(correct), ...wrongs.map(as)];
  return {
    en: all.map((c) => c.en),
    qc: all.map((c) => c.qc),
    de: all.map((c) => c.de),
  };
}

function q(tier, topic, slug, prompts, correct, wrongs, titles, hints, structure) {
  const choices = choicesOf(correct, wrongs);
  return pack(tier, topic, slug, {
    en: loc(prompts.en, choices.en, { title: titles.en, line: hints.en }),
    "fr-CA": loc(prompts.qc, choices.qc, { title: titles.qc, line: hints.qc }),
    de: loc(prompts.de, choices.de, { title: titles.de, line: hints.de }),
  }, structure);
}

const T = {
  geo: trio("Place", "Endroit", "Ort"),
  who: trio("Name", "Nom", "Name"),
  year: trio("Year", "Année", "Jahr"),
  count: trio("Count", "Nombre", "Zahl"),
  lab: trio("Lab", "Labo", "Labor"),
  art: trio("Art", "Art", "Kunst"),
  sport: trio("Sport", "Sport", "Sport"),
  colour: trio("Colour", "Couleur", "Farbe"),
};

const H = {
  place: trio("The capital is a city with a government, not always the biggest.", "La capitale, c'est le siège du gouvernement, pas toujours la plus grande ville.", "Die Hauptstadt ist Regierungssitz, nicht immer die größte Stadt."),
  country: trio("The landmark sits in one country.", "Le lieu est dans un seul pays.", "Das Wahrzeichen liegt in einem Land."),
  straight: trio("One answer is the accepted one.", "Une réponse est la bonne.", "Eine Antwort ist die geltende."),
};

function capital(tier, slug, place, city, wrongs) {
  return q(tier, "geography", `cap-${slug}`, {
    en: `What is the capital of ${place.en}?`,
    qc: `C'est quoi la capitale ${place.fr}?`,
    de: `Was ist die Hauptstadt von ${place.de}?`,
  }, city, wrongs, T.geo, H.place);
}

function countryOf(tier, slug, thing, country, wrongs) {
  return q(tier, "geography", `in-${slug}`, {
    en: `In which country is ${thing.en}?`,
    qc: `C'est dans quel pays, ${thing.qc}?`,
    de: `In welchem Land liegt ${thing.de}?`,
  }, country, wrongs, T.geo, H.country);
}

function wrote(tier, slug, work, author, wrongs) {
  return q(tier, "culture", `wrote-${slug}`, {
    en: `Who wrote ${work.en}?`,
    qc: `C'est qui qui a écrit ${work.qc}?`,
    de: `Wer hat ${work.de} geschrieben?`,
  }, author, wrongs, T.who, H.straight);
}

function currency(tier, slug, place, money, wrongs) {
  return q(tier, "culture", `cur-${slug}`, {
    en: `What is the currency of ${place.en}?`,
    qc: `C'est quoi la devise ${place.fr}?`,
    de: `Was ist die Währung von ${place.de}?`,
  }, money, wrongs, T.geo, H.straight);
}

function language(tier, slug, place, tongue, wrongs) {
  return q(tier, "culture", `lang-${slug}`, {
    en: `What is the main language of ${place.en}?`,
    qc: `C'est quoi la langue principale ${place.fr}?`,
    de: `Was ist die Hauptsprache von ${place.de}?`,
  }, tongue, wrongs, T.who, H.straight);
}

function symbol(tier, slug, element, sym, wrongs) {
  return q(tier, "sci-fi", `sym-${slug}`, {
    en: `What is the chemical symbol for ${element.en}?`,
    qc: `C'est quoi le symbole chimique ${element.fr}?`,
    de: `Welches chemische Symbol hat ${element.de}?`,
  }, sym, wrongs, T.lab, H.straight);
}

function atomic(tier, slug, element, num, wrongs) {
  return q(tier, "sci-fi", `atom-${slug}`, {
    en: `What is the atomic number of ${element.en}?`,
    qc: `C'est quoi le numéro atomique ${element.fr}?`,
    de: `Welche Ordnungszahl hat ${element.de}?`,
  }, String(num), wrongs.map(String), T.lab, H.straight);
}

function colour(tier, slug, thing, color, wrongs) {
  return q(tier, "art", `col-${slug}`, {
    en: `What colour is ${thing.en}?`,
    qc: `C'est quoi la couleur ${thing.fr}?`,
    de: `Welche Farbe hat ${thing.de}?`,
  }, color, wrongs, T.colour, H.straight, "colour");
}

function count(tier, slug, thing, num, wrongs) {
  return q(tier, "sci-fi", `n-${slug}`, {
    en: `How many ${thing.en}?`,
    qc: `Il y a combien de ${thing.qc}?`,
    de: `Wie viele ${thing.de}?`,
  }, String(num), wrongs.map(String), T.count, H.straight);
}

function cityHost(tier, slug, event, city, wrongs) {
  return q(tier, "sport", `host-${slug}`, {
    en: `Which city hosted ${event.en}?`,
    qc: `Quelle ville a accueilli ${event.qc}?`,
    de: `Welche Stadt war Gastgeber ${event.de}?`,
  }, city, wrongs, T.sport, H.straight);
}

function made(tier, slug, thing, person, wrongs) {
  return q(tier, "film-tv", `made-${slug}`, {
    en: `Who directed ${thing.en}?`,
    qc: `C'est qui qui a réalisé ${thing.qc}?`,
    de: `Wer hat ${thing.de} inszeniert?`,
  }, person, wrongs, T.who, H.straight);
}

function music(tier, slug, piece, person, wrongs) {
  return q(tier, "music", `music-${slug}`, {
    en: `Who composed ${piece.en}?`,
    qc: `C'est qui qui a composé ${piece.qc}?`,
    de: `Wer hat ${piece.de} komponiert?`,
  }, person, wrongs, T.who, H.straight);
}

function founded(tier, slug, brand, country, wrongs) {
  return q(tier, "cars", `co-${slug}`, {
    en: `In which country was ${brand} founded?`,
    qc: `${brand} a été fondé dans quel pays?`,
    de: `In welchem Land wurde ${brand} gegründet?`,
  }, country, wrongs, T.geo, H.straight);
}

function flows(tier, slug, river, water, wrongs) {
  return q(tier, "geography", `river-${slug}`, {
    en: `Into which body of water does the ${river.en} empty?`,
    qc: `Le ${river.qc} se jette dans quel plan d'eau?`,
    de: `In welches Gewässer mündet ${river.de}?`,
  }, water, wrongs, T.geo, H.straight);
}

function yearOf(tier, slug, event, year, wrongs) {
  return q(tier, "culture", `year-${slug}`, {
    en: `In which year ${event.en}?`,
    qc: `C'est en quelle année ${event.qc}?`,
    de: `In welchem Jahr ${event.de}?`,
  }, String(year), wrongs.map(String), T.year, H.straight);
}

const P = (en, fr, de) => ({ en, fr, de });
const W = (en, qc, de) => ({ en, qc, de });

const facts = [];

function add(row) {
  facts.push(row);
}

const CA = [
  ["easy", "alberta", P("Alberta", "de l'Alberta", "Alberta"), "Edmonton", ["Calgary", "Red Deer", "Banff"]],
  ["easy", "bc", P("British Columbia", "de la Colombie-Britannique", "British Columbia"), "Victoria", ["Vancouver", "Kelowna", "Prince George"]],
  ["easy", "manitoba", P("Manitoba", "du Manitoba", "Manitoba"), "Winnipeg", ["Brandon", "Thompson", "Churchill"]],
  ["hard", "nb", P("New Brunswick", "du Nouveau-Brunswick", "New Brunswick"), "Fredericton", ["Moncton", "Saint John", "Dieppe"]],
  ["hard", "nl", P("Newfoundland and Labrador", "de Terre-Neuve-et-Labrador", "Neufundland und Labrador"), "St. John's", ["Corner Brook", "Gander", "Happy Valley-Goose Bay"]],
  ["easy", "ns", P("Nova Scotia", "de la Nouvelle-Écosse", "Nova Scotia"), "Halifax", ["Sydney", "Dartmouth", "Truro"]],
  ["easy", "ontario", P("Ontario", "de l'Ontario", "Ontario"), "Toronto", ["Ottawa", "Hamilton", "London"]],
  ["hard", "pei", P("Prince Edward Island", "de l'Île-du-Prince-Édouard", "Prince Edward Island"), "Charlottetown", ["Summerside", "Montague", "Souris"]],
  ["easy", "quebec", P("Quebec", "du Québec", "Quebec"), "Quebec City", ["Montreal", "Laval", "Gatineau"]],
  ["hard", "sk", P("Saskatchewan", "de la Saskatchewan", "Saskatchewan"), "Regina", ["Saskatoon", "Moose Jaw", "Prince Albert"]],
  ["difficult", "nwt", P("the Northwest Territories", "des Territoires du Nord-Ouest", "den Nordwest-Territorien"), "Yellowknife", ["Inuvik", "Hay River", "Fort Smith"]],
  ["difficult", "nunavut", P("Nunavut", "du Nunavut", "Nunavut"), "Iqaluit", ["Rankin Inlet", "Cambridge Bay", "Pangnirtung"]],
  ["difficult", "yukon", P("Yukon", "du Yukon", "Yukon"), "Whitehorse", ["Dawson City", "Watson Lake", "Haines Junction"]],
];
for (const [tier, slug, place, city, wrongs] of CA) add(capital(tier, slug, place, city, wrongs));

const AU = [
  ["easy", "nsw", P("New South Wales", "de la Nouvelle-Galles du Sud", "New South Wales"), "Sydney", ["Canberra", "Newcastle", "Wollongong"]],
  ["easy", "vic-au", P("Victoria, Australia", "de l'État de Victoria, en Australie", "Victoria in Australien"), "Melbourne", ["Sydney", "Geelong", "Ballarat"]],
  ["hard", "qld", P("Queensland", "du Queensland", "Queensland"), "Brisbane", ["Cairns", "Gold Coast", "Townsville"]],
  ["hard", "wa", P("Western Australia", "de l'Australie-Occidentale", "Westaustralien"), "Perth", ["Fremantle", "Broome", "Albany"]],
  ["hard", "sa-au", P("South Australia", "de l'Australie-Méridionale", "Südaustralien"), "Adelaide", ["Perth", "Port Augusta", "Mount Gambier"]],
  ["difficult", "tas", P("Tasmania", "de la Tasmanie", "Tasmanien"), "Hobart", ["Launceston", "Devonport", "Burnie"]],
  ["easy", "act", P("the Australian Capital Territory", "du Territoire de la capitale australienne", "dem Australian Capital Territory"), "Canberra", ["Sydney", "Melbourne", "Brisbane"]],
  ["difficult", "nt-au", P("the Northern Territory of Australia", "du Territoire du Nord, en Australie", "dem Northern Territory Australiens"), "Darwin", ["Alice Springs", "Katherine", "Nhulunbuy"]],
];
for (const [tier, slug, place, city, wrongs] of AU) add(capital(tier, slug, place, city, wrongs));

const DE_STATES = [
  ["hard", "bavaria", P("Bavaria", "de la Bavière", "Bayern"), "Munich", ["Nuremberg", "Augsburg", "Regensburg"]],
  ["difficult", "saxony", P("Saxony", "de la Saxe", "Sachsen"), "Dresden", ["Leipzig", "Chemnitz", "Görlitz"]],
  ["difficult", "hesse", P("Hesse", "de la Hesse", "Hessen"), "Wiesbaden", ["Frankfurt", "Kassel", "Darmstadt"]],
  ["extreme", "brandenburg", P("Brandenburg", "du Brandebourg", "Brandenburg"), "Potsdam", ["Cottbus", "Frankfurt an der Oder", "Brandenburg an der Havel"]],
  ["hard", "nrw", P("North Rhine-Westphalia", "de la Rhénanie-du-Nord-Westphalie", "Nordrhein-Westfalen"), "Düsseldorf", ["Cologne", "Dortmund", "Bonn"]],
  ["difficult", "bw", P("Baden-Württemberg", "du Bade-Wurtemberg", "Baden-Württemberg"), "Stuttgart", ["Karlsruhe", "Freiburg", "Heidelberg"]],
  ["extreme", "schleswig", P("Schleswig-Holstein", "du Schleswig-Holstein", "Schleswig-Holstein"), "Kiel", ["Lübeck", "Flensburg", "Neumünster"]],
  ["extreme", "thuringia", P("Thuringia", "de la Thuringe", "Thüringen"), "Erfurt", ["Jena", "Weimar", "Gera"]],
  ["extreme", "saxony-anhalt", P("Saxony-Anhalt", "de la Saxe-Anhalt", "Sachsen-Anhalt"), "Magdeburg", ["Halle", "Dessau", "Wittenberg"]],
  ["extreme", "rlp", P("Rhineland-Palatinate", "de la Rhénanie-Palatinat", "Rheinland-Pfalz"), "Mainz", ["Koblenz", "Trier", "Ludwigshafen"]],
  ["extreme", "saarland", P("Saarland", "de la Sarre", "dem Saarland"), "Saarbrücken", ["Neunkirchen", "Homburg", "Völklingen"]],
  ["hard", "lower-saxony", P("Lower Saxony", "de la Basse-Saxe", "Niedersachsen"), "Hanover", ["Bremen", "Braunschweig", "Osnabrück"]],
  ["extreme", "mecklenburg", P("Mecklenburg-Vorpommern", "du Mecklembourg-Poméranie-Occidentale", "Mecklenburg-Vorpommern"), "Schwerin", ["Rostock", "Stralsund", "Greifswald"]],
];
for (const [tier, slug, place, city, wrongs] of DE_STATES) add(capital(tier, slug, place, city, wrongs));

const FR_REG = [
  ["hard", "bretagne", P("Brittany", "de la Bretagne", "der Bretagne"), "Rennes", ["Brest", "Nantes", "Vannes"]],
  ["hard", "normandie", P("Normandy", "de la Normandie", "der Normandie"), "Rouen", ["Caen", "Le Havre", "Cherbourg"]],
  ["difficult", "occitanie", P("Occitanie", "de l'Occitanie", "Okzitanien"), "Toulouse", ["Montpellier", "Nîmes", "Perpignan"]],
  ["hard", "nouvelle-aquitaine", P("Nouvelle-Aquitaine", "de la Nouvelle-Aquitaine", "Nouvelle-Aquitaine"), "Bordeaux", ["Limoges", "Poitiers", "Pau"]],
  ["hard", "aura", P("Auvergne-Rhône-Alpes", "d'Auvergne-Rhône-Alpes", "Auvergne-Rhône-Alpes"), "Lyon", ["Grenoble", "Clermont-Ferrand", "Saint-Étienne"]],
  ["difficult", "grand-est", P("Grand Est", "du Grand Est", "Grand Est"), "Strasbourg", ["Reims", "Metz", "Nancy"]],
  ["difficult", "hdf", P("Hauts-de-France", "des Hauts-de-France", "Hauts-de-France"), "Lille", ["Amiens", "Roubaix", "Calais"]],
  ["difficult", "pdl", P("Pays de la Loire", "des Pays de la Loire", "Pays de la Loire"), "Nantes", ["Angers", "Le Mans", "Saint-Nazaire"]],
  ["extreme", "cvl", P("Centre-Val de Loire", "du Centre-Val de Loire", "Centre-Val de Loire"), "Orléans", ["Tours", "Bourges", "Blois"]],
  ["extreme", "bfc", P("Bourgogne-Franche-Comté", "de Bourgogne-Franche-Comté", "Bourgogne-Franche-Comté"), "Dijon", ["Besançon", "Belfort", "Auxerre"]],
  ["hard", "corse", P("Corsica", "de la Corse", "Korsika"), "Ajaccio", ["Bastia", "Porto-Vecchio", "Calvi"]],
  ["easy", "idf", P("Île-de-France", "de l'Île-de-France", "der Île-de-France"), "Paris", ["Versailles", "Boulogne-Billancourt", "Saint-Denis"]],
];
for (const [tier, slug, place, city, wrongs] of FR_REG) add(capital(tier, slug, place, city, wrongs));

const LANDMARKS = [
  ["easy", "eiffel", W("the Eiffel Tower", "la tour Eiffel", "der Eiffelturm"), trio("France", "France", "Frankreich"), [trio("Italy", "Italie", "Italien"), trio("Belgium", "Belgique", "Belgien"), trio("Spain", "Espagne", "Spanien")]],
  ["easy", "colosseum", W("the Colosseum", "le Colisée", "das Kolosseum"), trio("Italy", "Italie", "Italien"), [trio("Greece", "Grèce", "Griechenland"), trio("France", "France", "Frankreich"), trio("Spain", "Espagne", "Spanien")]],
  ["easy", "machu", W("Machu Picchu", "le Machu Picchu", "Machu Picchu"), trio("Peru", "Pérou", "Peru"), [trio("Bolivia", "Bolivie", "Bolivien"), trio("Mexico", "Mexique", "Mexiko"), trio("Chile", "Chili", "Chile")]],
  ["easy", "redeemer", W("Christ the Redeemer", "le Christ Rédempteur", "die Christusstatue"), trio("Brazil", "Brésil", "Brasilien"), [trio("Portugal", "Portugal", "Portugal"), trio("Argentina", "Argentine", "Argentinien"), trio("Mexico", "Mexique", "Mexiko")]],
  ["easy", "wall", W("the Great Wall", "la Grande Muraille", "die Große Mauer"), trio("China", "Chine", "China"), [trio("Mongolia", "Mongolie", "die Mongolei"), trio("Japan", "Japon", "Japan"), trio("Korea", "Corée", "Korea")]],
  ["easy", "taj", W("the Taj Mahal", "le Taj Mahal", "das Taj Mahal"), trio("India", "Inde", "Indien"), [trio("Pakistan", "Pakistan", "Pakistan"), trio("Iran", "Iran", "Iran"), trio("Bangladesh", "Bangladesh", "Bangladesch")]],
  ["hard", "petra", W("Petra", "Pétra", "Petra"), trio("Jordan", "Jordanie", "Jordanien"), [trio("Egypt", "Égypte", "Ägypten"), trio("Israel", "Israël", "Israel"), trio("Syria", "Syrie", "Syrien")]],
  ["easy", "liberty", W("the Statue of Liberty", "la statue de la Liberté", "die Freiheitsstatue"), trio("the United States", "les États-Unis", "die Vereinigten Staaten"), [trio("France", "France", "Frankreich"), trio("Canada", "Canada", "Kanada"), trio("the United Kingdom", "le Royaume-Uni", "das Vereinigte Königreich")]],
  ["easy", "sagrada", W("the Sagrada Familia", "la Sagrada Familia", "die Sagrada Familia"), trio("Spain", "Espagne", "Spanien"), [trio("Italy", "Italie", "Italien"), trio("Portugal", "Portugal", "Portugal"), trio("France", "France", "Frankreich")]],
  ["hard", "angkor", W("Angkor Wat", "Angkor Wat", "Angkor Wat"), trio("Cambodia", "Cambodge", "Kambodscha"), [trio("Thailand", "Thaïlande", "Thailand"), trio("Vietnam", "Vietnam", "Vietnam"), trio("Laos", "Laos", "Laos")]],
  ["hard", "chichen", W("Chichen Itza", "Chichen Itza", "Chichén Itzá"), trio("Mexico", "Mexique", "Mexiko"), [trio("Guatemala", "Guatemala", "Guatemala"), trio("Peru", "Pérou", "Peru"), trio("Belize", "Belize", "Belize")]],
  ["easy", "stonehenge", W("Stonehenge", "Stonehenge", "Stonehenge"), trio("the United Kingdom", "le Royaume-Uni", "das Vereinigte Königreich"), [trio("Ireland", "Irlande", "Irland"), trio("France", "France", "Frankreich"), trio("Denmark", "Danemark", "Dänemark")]],
  ["easy", "opera", W("the Sydney Opera House", "l'Opéra de Sydney", "das Opernhaus von Sydney"), trio("Australia", "Australie", "Australien"), [trio("New Zealand", "Nouvelle-Zélande", "Neuseeland"), trio("the United Kingdom", "le Royaume-Uni", "das Vereinigte Königreich"), trio("Canada", "Canada", "Kanada")]],
  ["easy", "cn", W("the CN Tower", "la Tour CN", "der CN Tower"), trio("Canada", "Canada", "Kanada"), [trio("the United States", "les États-Unis", "die Vereinigten Staaten"), trio("France", "France", "Frankreich"), trio("Japan", "Japon", "Japan")]],
  ["easy", "burj", W("the Burj Khalifa", "la Burj Khalifa", "der Burj Khalifa"), trio("the United Arab Emirates", "les Émirats arabes unis", "die Vereinigten Arabischen Emirate"), [trio("Saudi Arabia", "l'Arabie saoudite", "Saudi-Arabien"), trio("Qatar", "le Qatar", "Katar"), trio("Bahrain", "Bahreïn", "Bahrain")]],
  ["easy", "fuji", W("Mount Fuji", "le mont Fuji", "der Berg Fuji"), trio("Japan", "Japon", "Japan"), [trio("China", "Chine", "China"), trio("South Korea", "la Corée du Sud", "Südkorea"), trio("Taiwan", "Taïwan", "Taiwan")]],
  ["easy", "giza", W("the Great Pyramid of Giza", "la grande pyramide de Gizeh", "die Große Pyramide von Gizeh"), trio("Egypt", "Égypte", "Ägypten"), [trio("Sudan", "Soudan", "Sudan"), trio("Mexico", "Mexique", "Mexiko"), trio("Iraq", "Irak", "Irak")]],
  ["easy", "acropolis", W("the Acropolis of Athens", "l'Acropole d'Athènes", "die Akropolis von Athen"), trio("Greece", "Grèce", "Griechenland"), [trio("Italy", "Italie", "Italien"), trio("Turkey", "Turquie", "Türkei"), trio("Cyprus", "Chypre", "Zypern")]],
  ["hard", "neuschwanstein", W("Neuschwanstein Castle", "le château de Neuschwanstein", "Schloss Neuschwanstein"), trio("Germany", "Allemagne", "Deutschland"), [trio("Austria", "Autriche", "Österreich"), trio("Switzerland", "Suisse", "die Schweiz"), trio("France", "France", "Frankreich")]],
  ["hard", "kremlin", W("the Moscow Kremlin", "le Kremlin de Moscou", "der Moskauer Kreml"), trio("Russia", "Russie", "Russland"), [trio("Ukraine", "Ukraine", "die Ukraine"), trio("Poland", "Pologne", "Polen"), trio("Finland", "Finlande", "Finnland")]],
  ["hard", "table", W("Table Mountain", "la Montagne de la Table", "der Tafelberg"), trio("South Africa", "l'Afrique du Sud", "Südafrika"), [trio("Namibia", "Namibie", "Namibia"), trio("Kenya", "Kenya", "Kenia"), trio("Australia", "Australie", "Australien")]],
  ["difficult", "moai", W("the moai statues of Rapa Nui", "les moaï de Rapa Nui", "die Moai von Rapa Nui"), trio("Chile", "Chili", "Chile"), [trio("Peru", "Pérou", "Peru"), trio("Ecuador", "Équateur", "Ecuador"), trio("Japan", "Japon", "Japan")]],
  ["hard", "uluru", W("Uluru", "Uluru", "Uluru"), trio("Australia", "Australie", "Australien"), [trio("New Zealand", "Nouvelle-Zélande", "Neuseeland"), trio("South Africa", "l'Afrique du Sud", "Südafrika"), trio("Namibia", "Namibie", "Namibia")]],
  ["hard", "forbidden", W("the Forbidden City", "la Cité interdite", "die Verbotene Stadt"), trio("China", "Chine", "China"), [trio("Japan", "Japon", "Japan"), trio("Vietnam", "Vietnam", "Vietnam"), trio("Mongolia", "Mongolie", "die Mongolei")]],
  ["hard", "brandenburg", W("the Brandenburg Gate", "la porte de Brandebourg", "das Brandenburger Tor"), trio("Germany", "Allemagne", "Deutschland"), [trio("Austria", "Autriche", "Österreich"), trio("Poland", "Pologne", "Polen"), trio("Czechia", "Tchéquie", "Tschechien")]],
  ["easy", "rushmore", W("Mount Rushmore", "le mont Rushmore", "der Mount Rushmore"), trio("the United States", "les États-Unis", "die Vereinigten Staaten"), [trio("Canada", "Canada", "Kanada"), trio("Mexico", "Mexique", "Mexiko"), trio("France", "France", "Frankreich")]],
  ["easy", "golden-gate", W("the Golden Gate Bridge", "le pont du Golden Gate", "die Golden Gate Bridge"), trio("the United States", "les États-Unis", "die Vereinigten Staaten"), [trio("Canada", "Canada", "Kanada"), trio("Australia", "Australie", "Australien"), trio("the United Kingdom", "le Royaume-Uni", "das Vereinigte Königreich")]],
  ["hard", "alhambra", W("the Alhambra", "l'Alhambra", "die Alhambra"), trio("Spain", "Espagne", "Spanien"), [trio("Morocco", "Maroc", "Marokko"), trio("Portugal", "Portugal", "Portugal"), trio("Italy", "Italie", "Italien")]],
  ["hard", "hagia", W("Hagia Sophia", "Sainte-Sophie", "die Hagia Sophia"), trio("Turkey", "Turquie", "die Türkei"), [trio("Greece", "Grèce", "Griechenland"), trio("Italy", "Italie", "Italien"), trio("Egypt", "Égypte", "Ägypten")]],
  ["difficult", "kili", W("Kilimanjaro", "le Kilimandjaro", "der Kilimandscharo"), trio("Tanzania", "Tanzanie", "Tansania"), [trio("Kenya", "Kenya", "Kenia"), trio("Uganda", "Ouganda", "Uganda"), trio("Ethiopia", "Éthiopie", "Äthiopien")]],
  ["easy", "versailles", W("the Palace of Versailles", "le château de Versailles", "das Schloss Versailles"), trio("France", "France", "Frankreich"), [trio("Belgium", "Belgique", "Belgien"), trio("Germany", "Allemagne", "Deutschland"), trio("Spain", "Espagne", "Spanien")]],
  ["hard", "tower-london", W("the Tower of London", "la Tour de Londres", "der Tower of London"), trio("the United Kingdom", "le Royaume-Uni", "das Vereinigte Königreich"), [trio("France", "France", "Frankreich"), trio("Ireland", "Irlande", "Irland"), trio("the Netherlands", "les Pays-Bas", "die Niederlande")]],
];
for (const [tier, slug, thing, country, wrongs] of LANDMARKS) add(countryOf(tier, slug, thing, country, wrongs));

const BOOKS = [
  ["easy", "1984", W("1984", "1984", "1984"), "George Orwell", ["Aldous Huxley", "Ray Bradbury", "H. G. Wells"]],
  ["easy", "pride", W("Pride and Prejudice", "Orgueil et Préjugés", "Stolz und Vorurteil"), "Jane Austen", ["Charlotte Brontë", "Emily Brontë", "Mary Shelley"]],
  ["hard", "quixote", W("Don Quixote", "Don Quichotte", "Don Quijote"), "Miguel de Cervantes", ["Lope de Vega", "Federico García Lorca", "Gabriel García Márquez"]],
  ["hard", "odyssey", W("the Odyssey", "l'Odyssée", "die Odyssee"), "Homer", ["Virgil", "Sophocles", "Ovid"]],
  ["easy", "hamlet", W("Hamlet", "Hamlet", "Hamlet"), "William Shakespeare", ["Christopher Marlowe", "Ben Jonson", "John Milton"]],
  ["hard", "crime", W("Crime and Punishment", "Crime et Châtiment", "Schuld und Sühne"), "Fyodor Dostoevsky", ["Leo Tolstoy", "Anton Chekhov", "Ivan Turgenev"]],
  ["easy", "prince", W("The Little Prince", "Le Petit Prince", "Der kleine Prinz"), "Antoine de Saint-Exupéry", ["Jules Verne", "Victor Hugo", "Albert Camus"]],
  ["hard", "solitude", W("One Hundred Years of Solitude", "Cent ans de solitude", "Hundert Jahre Einsamkeit"), "Gabriel García Márquez", ["Isabel Allende", "Jorge Luis Borges", "Pablo Neruda"]],
  ["easy", "gatsby", W("The Great Gatsby", "Gatsby le Magnifique", "Der große Gatsby"), "F. Scott Fitzgerald", ["Ernest Hemingway", "John Steinbeck", "William Faulkner"]],
  ["hard", "frankenstein", W("Frankenstein", "Frankenstein", "Frankenstein"), "Mary Shelley", ["Bram Stoker", "Edgar Allan Poe", "Ann Radcliffe"]],
  ["easy", "hobbit", W("The Hobbit", "Le Hobbit", "Der Hobbit"), "J. R. R. Tolkien", ["C. S. Lewis", "J. K. Rowling", "George R. R. Martin"]],
  ["easy", "alice", W("Alice's Adventures in Wonderland", "Alice au pays des merveilles", "Alice im Wunderland"), "Lewis Carroll", ["J. M. Barrie", "Roald Dahl", "Beatrix Potter"]],
  ["hard", "war-peace", W("War and Peace", "Guerre et Paix", "Krieg und Frieden"), "Leo Tolstoy", ["Fyodor Dostoevsky", "Alexander Pushkin", "Nikolai Gogol"]],
  ["difficult", "comedy", W("The Divine Comedy", "La Divine Comédie", "Die Göttliche Komödie"), "Dante Alighieri", ["Petrarch", "Boccaccio", "Virgil"]],
  ["hard", "miserables", W("Les Misérables", "Les Misérables", "Die Elenden"), "Victor Hugo", ["Émile Zola", "Gustave Flaubert", "Alexandre Dumas"]],
  ["hard", "bovary", W("Madame Bovary", "Madame Bovary", "Madame Bovary"), "Gustave Flaubert", ["Victor Hugo", "Honoré de Balzac", "Émile Zola"]],
  ["difficult", "stranger", W("The Stranger", "L'Étranger", "Der Fremde"), "Albert Camus", ["Jean-Paul Sartre", "André Gide", "Marcel Proust"]],
  ["hard", "things", W("Things Fall Apart", "Le monde s'effondre", "Alles zerfällt"), "Chinua Achebe", ["Wole Soyinka", "Ngugi wa Thiong'o", "Ben Okri"]],
  ["easy", "mockingbird", W("To Kill a Mockingbird", "Ne tirez pas sur l'oiseau moqueur", "Wer die Nachtigall stört"), "Harper Lee", ["Truman Capote", "Flannery O'Connor", "Toni Morrison"]],
  ["easy", "catcher", W("The Catcher in the Rye", "L'Attrape-cœurs", "Der Fänger im Roggen"), "J. D. Salinger", ["Jack Kerouac", "John Updike", "Philip Roth"]],
  ["hard", "moby", W("Moby-Dick", "Moby Dick", "Moby-Dick"), "Herman Melville", ["Nathaniel Hawthorne", "Mark Twain", "Jack London"]],
  ["hard", "jane-eyre", W("Jane Eyre", "Jane Eyre", "Jane Eyre"), "Charlotte Brontë", ["Emily Brontë", "Jane Austen", "George Eliot"]],
  ["difficult", "metamorphosis", W("The Metamorphosis", "La Métamorphose", "Die Verwandlung"), "Franz Kafka", ["Thomas Mann", "Hermann Hesse", "Stefan Zweig"]],
  ["easy", "alchemist", W("The Alchemist", "L'Alchimiste", "Der Alchimist"), "Paulo Coelho", ["Gabriel García Márquez", "Isabel Allende", "Jorge Amado"]],
  ["easy", "potter", W("Harry Potter and the Philosopher's Stone", "Harry Potter à l'école des sorciers", "Harry Potter und der Stein der Weisen"), "J. K. Rowling", ["Philip Pullman", "Roald Dahl", "C. S. Lewis"]],
  ["easy", "diary", W("The Diary of a Young Girl", "Le Journal d'Anne Frank", "Das Tagebuch der Anne Frank"), "Anne Frank", ["Elie Wiesel", "Primo Levi", "Corrie ten Boom"]],
  ["hard", "origin", W("On the Origin of Species", "L'Origine des espèces", "Über die Entstehung der Arten"), "Charles Darwin", ["Alfred Russel Wallace", "Gregor Mendel", "Jean-Baptiste Lamarck"]],
  ["difficult", "republic", W("The Republic", "La République", "Der Staat"), "Plato", ["Aristotle", "Socrates", "Epicurus"]],
  ["hard", "brief-time", W("A Brief History of Time", "Une brève histoire du temps", "Eine kurze Geschichte der Zeit"), "Stephen Hawking", ["Carl Sagan", "Richard Feynman", "Neil deGrasse Tyson"]],
  ["easy", "art-war", W("The Art of War", "L'Art de la guerre", "Die Kunst des Krieges"), "Sun Tzu", ["Confucius", "Laozi", "Mencius"]],
];
for (const [tier, slug, work, author, wrongs] of BOOKS) add(wrote(tier, slug, work, author, wrongs));

const MONEY = [
  ["easy", "japan", P("Japan", "du Japon", "Japan"), trio("Yen", "Le yen", "Yen"), [trio("Won", "Le won", "Won"), trio("Yuan", "Le yuan", "Yuan"), trio("Dollar", "Le dollar", "Dollar")]],
  ["easy", "uk", P("the United Kingdom", "du Royaume-Uni", "dem Vereinigten Königreich"), trio("Pound sterling", "La livre sterling", "Pfund Sterling"), [trio("Euro", "L'euro", "Euro"), trio("Dollar", "Le dollar", "Dollar"), trio("Krone", "La couronne", "Krone")]],
  ["easy", "switzerland", P("Switzerland", "de la Suisse", "der Schweiz"), trio("Franc", "Le franc", "Franken"), [trio("Euro", "L'euro", "Euro"), trio("Mark", "Le mark", "Mark"), trio("Krone", "La couronne", "Krone")]],
  ["easy", "mexico", P("Mexico", "du Mexique", "Mexiko"), trio("Peso", "Le peso", "Peso"), [trio("Dollar", "Le dollar", "Dollar"), trio("Real", "Le réal", "Real"), trio("Quetzal", "Le quetzal", "Quetzal")]],
  ["hard", "brazil", P("Brazil", "du Brésil", "Brasilien"), trio("Real", "Le réal", "Real"), [trio("Peso", "Le peso", "Peso"), trio("Escudo", "L'escudo", "Escudo"), trio("Bolívar", "Le bolivar", "Bolívar")]],
  ["easy", "india", P("India", "de l'Inde", "Indien"), trio("Rupee", "La roupie", "Rupie"), [trio("Taka", "Le taka", "Taka"), trio("Yuan", "Le yuan", "Yuan"), trio("Rial", "Le rial", "Rial")]],
  ["easy", "china", P("China", "de la Chine", "China"), trio("Yuan", "Le yuan", "Yuan"), [trio("Yen", "Le yen", "Yen"), trio("Won", "Le won", "Won"), trio("Dollar", "Le dollar", "Dollar")]],
  ["easy", "korea", P("South Korea", "de la Corée du Sud", "Südkorea"), trio("Won", "Le won", "Won"), [trio("Yen", "Le yen", "Yen"), trio("Yuan", "Le yuan", "Yuan"), trio("Dollar", "Le dollar", "Dollar")]],
  ["hard", "sweden", P("Sweden", "de la Suède", "Schweden"), trio("Krona", "La couronne", "Krone"), [trio("Euro", "L'euro", "Euro"), trio("Markka", "Le markka", "Markka"), trio("Pound", "La livre", "Pfund")]],
  ["hard", "poland", P("Poland", "de la Pologne", "Polen"), trio("Zloty", "Le zloty", "Zloty"), [trio("Euro", "L'euro", "Euro"), trio("Forint", "Le forint", "Forint"), trio("Koruna", "La couronne", "Krone")]],
  ["hard", "hungary", P("Hungary", "de la Hongrie", "Ungarn"), trio("Forint", "Le forint", "Forint"), [trio("Euro", "L'euro", "Euro"), trio("Zloty", "Le zloty", "Zloty"), trio("Leu", "Le leu", "Leu")]],
  ["difficult", "czechia", P("Czechia", "de la Tchéquie", "Tschechien"), trio("Koruna", "La couronne tchèque", "Krone"), [trio("Euro", "L'euro", "Euro"), trio("Zloty", "Le zloty", "Zloty"), trio("Forint", "Le forint", "Forint")]],
  ["hard", "thailand", P("Thailand", "de la Thaïlande", "Thailand"), trio("Baht", "Le baht", "Baht"), [trio("Dong", "Le dong", "Dong"), trio("Rupiah", "La roupie", "Rupiah"), trio("Ringgit", "Le ringgit", "Ringgit")]],
  ["hard", "vietnam", P("Vietnam", "du Vietnam", "Vietnam"), trio("Dong", "Le dong", "Dong"), [trio("Baht", "Le baht", "Baht"), trio("Kip", "Le kip", "Kip"), trio("Riel", "Le riel", "Riel")]],
  ["difficult", "indonesia", P("Indonesia", "de l'Indonésie", "Indonesien"), trio("Rupiah", "La roupie", "Rupiah"), [trio("Ringgit", "Le ringgit", "Ringgit"), trio("Baht", "Le baht", "Baht"), trio("Peso", "Le peso", "Peso")]],
  ["hard", "south-africa", P("South Africa", "de l'Afrique du Sud", "Südafrika"), trio("Rand", "Le rand", "Rand"), [trio("Dollar", "Le dollar", "Dollar"), trio("Shilling", "Le shilling", "Schilling"), trio("Naira", "Le naira", "Naira")]],
  ["difficult", "nigeria", P("Nigeria", "du Nigeria", "Nigeria"), trio("Naira", "Le naira", "Naira"), [trio("Cedi", "Le cedi", "Cedi"), trio("Rand", "Le rand", "Rand"), trio("Shilling", "Le shilling", "Schilling")]],
  ["hard", "egypt", P("Egypt", "de l'Égypte", "Ägypten"), trio("Pound", "La livre", "Pfund"), [trio("Dinar", "Le dinar", "Dinar"), trio("Rial", "Le rial", "Rial"), trio("Dirham", "Le dirham", "Dirham")]],
  ["hard", "israel", P("Israel", "d'Israël", "Israel"), trio("Shekel", "Le shekel", "Schekel"), [trio("Pound", "La livre", "Pfund"), trio("Dinar", "Le dinar", "Dinar"), trio("Lira", "La lire", "Lira")]],
  ["easy", "turkey", P("Turkey", "de la Turquie", "der Türkei"), trio("Lira", "La livre", "Lira"), [trio("Euro", "L'euro", "Euro"), trio("Dinar", "Le dinar", "Dinar"), trio("Rial", "Le rial", "Rial")]],
  ["hard", "saudi", P("Saudi Arabia", "de l'Arabie saoudite", "Saudi-Arabien"), trio("Riyal", "Le riyal", "Riyal"), [trio("Dinar", "Le dinar", "Dinar"), trio("Dirham", "Le dirham", "Dirham"), trio("Pound", "La livre", "Pfund")]],
  ["easy", "canada-cur", P("Canada", "du Canada", "Kanada"), trio("Dollar", "Le dollar", "Dollar"), [trio("Pound", "La livre", "Pfund"), trio("Euro", "L'euro", "Euro"), trio("Peso", "Le peso", "Peso")]],
  ["easy", "australia-cur", P("Australia", "de l'Australie", "Australien"), trio("Dollar", "Le dollar", "Dollar"), [trio("Pound", "La livre", "Pfund"), trio("Euro", "L'euro", "Euro"), trio("Yen", "Le yen", "Yen")]],
  ["difficult", "ukraine", P("Ukraine", "de l'Ukraine", "der Ukraine"), trio("Hryvnia", "La hryvnia", "Hrywnja"), [trio("Ruble", "Le rouble", "Rubel"), trio("Zloty", "Le zloty", "Zloty"), trio("Euro", "L'euro", "Euro")]],
  ["hard", "euro-france", P("France", "de la France", "Frankreich"), trio("Euro", "L'euro", "Euro"), [trio("Franc", "Le franc", "Franken"), trio("Pound", "La livre", "Pfund"), trio("Mark", "Le mark", "Mark")]],
  ["difficult", "morocco", P("Morocco", "du Maroc", "Marokko"), trio("Dirham", "Le dirham", "Dirham"), [trio("Dinar", "Le dinar", "Dinar"), trio("Euro", "L'euro", "Euro"), trio("Pound", "La livre", "Pfund")]],
  ["difficult", "kenya", P("Kenya", "du Kenya", "Kenia"), trio("Shilling", "Le shilling", "Schilling"), [trio("Rand", "Le rand", "Rand"), trio("Naira", "Le naira", "Naira"), trio("Pound", "La livre", "Pfund")]],
  ["hard", "argentina", P("Argentina", "de l'Argentine", "Argentinien"), trio("Peso", "Le peso", "Peso"), [trio("Real", "Le réal", "Real"), trio("Dollar", "Le dollar", "Dollar"), trio("Sol", "Le sol", "Sol")]],
];
for (const [tier, slug, place, money, wrongs] of MONEY) add(currency(tier, slug, place, money, wrongs));

const TONGUES = [
  ["easy", "brazil", P("Brazil", "du Brésil", "Brasilien"), trio("Portuguese", "Le portugais", "Portugiesisch"), [trio("Spanish", "L'espagnol", "Spanisch"), trio("French", "Le français", "Französisch"), trio("Italian", "L'italien", "Italienisch")]],
  ["easy", "austria", P("Austria", "de l'Autriche", "Österreich"), trio("German", "L'allemand", "Deutsch"), [trio("Hungarian", "Le hongrois", "Ungarisch"), trio("Italian", "L'italien", "Italienisch"), trio("Czech", "Le tchèque", "Tschechisch")]],
  ["easy", "mexico-lang", P("Mexico", "du Mexique", "Mexiko"), trio("Spanish", "L'espagnol", "Spanisch"), [trio("Portuguese", "Le portugais", "Portugiesisch"), trio("English", "L'anglais", "Englisch"), trio("Nahuatl", "Le nahuatl", "Nahuatl")]],
  ["easy", "japan-lang", P("Japan", "du Japon", "Japan"), trio("Japanese", "Le japonais", "Japanisch"), [trio("Korean", "Le coréen", "Koreanisch"), trio("Chinese", "Le chinois", "Chinesisch"), trio("Thai", "Le thaï", "Thailändisch")]],
  ["easy", "poland-lang", P("Poland", "de la Pologne", "Polen"), trio("Polish", "Le polonais", "Polnisch"), [trio("Russian", "Le russe", "Russisch"), trio("German", "L'allemand", "Deutsch"), trio("Czech", "Le tchèque", "Tschechisch")]],
  ["easy", "greece-lang", P("Greece", "de la Grèce", "Griechenland"), trio("Greek", "Le grec", "Griechisch"), [trio("Latin", "Le latin", "Latein"), trio("Turkish", "Le turc", "Türkisch"), trio("Italian", "L'italien", "Italienisch")]],
  ["easy", "qc-lang", P("the province of Quebec", "du Québec", "der Provinz Quebec"), trio("French", "Le français", "Französisch"), [trio("English", "L'anglais", "Englisch"), trio("Spanish", "L'espagnol", "Spanisch"), trio("German", "L'allemand", "Deutsch")]],
  ["hard", "iran-lang", P("Iran", "de l'Iran", "Iran"), trio("Persian", "Le persan", "Persisch"), [trio("Arabic", "L'arabe", "Arabisch"), trio("Turkish", "Le turc", "Türkisch"), trio("Kurdish", "Le kurde", "Kurdisch")]],
  ["hard", "israel-lang", P("Israel", "d'Israël", "Israel"), trio("Hebrew", "L'hébreu", "Hebräisch"), [trio("Arabic", "L'arabe", "Arabisch"), trio("Yiddish", "Le yiddish", "Jiddisch"), trio("Aramaic", "L'araméen", "Aramäisch")]],
  ["hard", "netherlands-lang", P("the Netherlands", "des Pays-Bas", "den Niederlanden"), trio("Dutch", "Le néerlandais", "Niederländisch"), [trio("German", "L'allemand", "Deutsch"), trio("Danish", "Le danois", "Dänisch"), trio("French", "Le français", "Französisch")]],
  ["hard", "finland-lang", P("Finland", "de la Finlande", "Finnland"), trio("Finnish", "Le finnois", "Finnisch"), [trio("Swedish", "Le suédois", "Schwedisch"), trio("Russian", "Le russe", "Russisch"), trio("Norwegian", "Le norvégien", "Norwegisch")]],
  ["hard", "hungary-lang", P("Hungary", "de la Hongrie", "Ungarn"), trio("Hungarian", "Le hongrois", "Ungarisch"), [trio("German", "L'allemand", "Deutsch"), trio("Romanian", "Le roumain", "Rumänisch"), trio("Slovak", "Le slovaque", "Slowakisch")]],
  ["easy", "korea-lang", P("South Korea", "de la Corée du Sud", "Südkorea"), trio("Korean", "Le coréen", "Koreanisch"), [trio("Japanese", "Le japonais", "Japanisch"), trio("Chinese", "Le chinois", "Chinesisch"), trio("Mongolian", "Le mongol", "Mongolisch")]],
  ["difficult", "iceland-lang", P("Iceland", "de l'Islande", "Island"), trio("Icelandic", "L'islandais", "Isländisch"), [trio("Norwegian", "Le norvégien", "Norwegisch"), trio("Danish", "Le danois", "Dänisch"), trio("English", "L'anglais", "Englisch")]],
  ["hard", "bangladesh-lang", P("Bangladesh", "du Bangladesh", "Bangladesch"), trio("Bengali", "Le bengali", "Bengalisch"), [trio("Hindi", "Le hindi", "Hindi"), trio("Urdu", "L'ourdou", "Urdu"), trio("Tamil", "Le tamoul", "Tamil")]],
  ["hard", "ukraine-lang", P("Ukraine", "de l'Ukraine", "der Ukraine"), trio("Ukrainian", "L'ukrainien", "Ukrainisch"), [trio("Russian", "Le russe", "Russisch"), trio("Polish", "Le polonais", "Polnisch"), trio("Belarusian", "Le biélorusse", "Belarussisch")]],
];
for (const [tier, slug, place, tongue, wrongs] of TONGUES) add(language(tier, slug, place, tongue, wrongs));

const ELEMS = [
  ["hard", "lithium", W("lithium", "du lithium", "Lithium"), "Li", ["L", "Lt", "Lm"]],
  ["extreme", "beryllium", W("beryllium", "du béryllium", "Beryllium"), "Be", ["B", "Br", "Ba"]],
  ["hard", "boron", W("boron", "du bore", "Bor"), "B", ["Bo", "Br", "Be"]],
  ["hard", "fluorine", W("fluorine", "du fluor", "Fluor"), "F", ["Fl", "Fr", "Fo"]],
  ["hard", "manganese", W("manganese", "du manganèse", "Mangan"), "Mn", ["Mg", "Ma", "Mo"]],
  ["difficult", "krypton", W("krypton", "du krypton", "Krypton"), "Kr", ["K", "Ky", "Kn"]],
  ["hard", "bromine", W("bromine", "du brome", "Brom"), "Br", ["B", "Bm", "Bo"]],
  ["extreme", "strontium", W("strontium", "du strontium", "Strontium"), "Sr", ["S", "St", "Sn"]],
  ["extreme", "molybdenum", W("molybdenum", "du molybdène", "Molybdän"), "Mo", ["M", "Mb", "Mn"]],
  ["hard", "platinum", W("platinum", "du platine", "Platin"), "Pt", ["P", "Pl", "Pu"]],
  ["difficult", "barium", W("barium", "du baryum", "Barium"), "Ba", ["B", "Br", "Be"]],
  ["difficult", "xenon", W("xenon", "du xénon", "Xenon"), "Xe", ["X", "Xn", "Xi"]],
  ["extreme", "arsenic", W("arsenic", "de l'arsenic", "Arsen"), "As", ["A", "Ar", "Ac"]],
  ["extreme", "selenium", W("selenium", "du sélénium", "Selen"), "Se", ["S", "Sl", "Sn"]],
  ["extreme", "gallium", W("gallium", "du gallium", "Gallium"), "Ga", ["G", "Gl", "Ge"]],
  ["extreme", "germanium", W("germanium", "du germanium", "Germanium"), "Ge", ["G", "Ga", "Gr"]],
  ["difficult", "cadmium", W("cadmium", "du cadmium", "Cadmium"), "Cd", ["C", "Ca", "Cm"]],
  ["extreme", "bismuth", W("bismuth", "du bismuth", "Bismut"), "Bi", ["B", "Bs", "Bm"]],
  ["extreme", "palladium", W("palladium", "du palladium", "Palladium"), "Pd", ["P", "Pa", "Pt"]],
  ["extreme", "antimony", W("antimony", "de l'antimoine", "Antimon"), "Sb", ["S", "An", "At"]],
];
for (const [tier, slug, element, sym, wrongs] of ELEMS) add(symbol(tier, slug, element, sym, wrongs));

const ATOMS = [
  ["hard", "carbon", W("carbon", "du carbone", "Kohlenstoff"), "6", ["12", "8", "14"]],
  ["hard", "oxygen", W("oxygen", "de l'oxygène", "Sauerstoff"), "8", ["16", "6", "10"]],
  ["difficult", "sodium", W("sodium", "du sodium", "Natrium"), "11", ["23", "12", "19"]],
  ["hard", "iron", W("iron", "du fer", "Eisen"), "26", ["56", "20", "30"]],
  ["difficult", "copper", W("copper", "du cuivre", "Kupfer"), "29", ["64", "27", "30"]],
  ["extreme", "platinum-n", W("platinum", "du platine", "Platin"), "78", ["47", "79", "82"]],
  ["easy", "hydrogen-n", W("hydrogen", "de l'hydrogène", "Wasserstoff"), "1", ["2", "8", "16"]],
  ["easy", "helium-n", W("helium", "de l'hélium", "Helium"), "2", ["4", "1", "10"]],
];
for (const [tier, slug, element, num, wrongs] of ATOMS) add(atomic(tier, slug, element, num, wrongs));

const COLOURS = [
  ["easy", "banana", W("a ripe banana", "d'une banane mûre", "eine reife Banane"), trio("Yellow", "Jaune", "Gelb"), [trio("Green", "Vert", "Grün"), trio("Red", "Rouge", "Rot"), trio("Blue", "Bleu", "Blau")]],
  ["easy", "stop", W("a standard stop sign", "d'un panneau d'arrêt standard", "ein gewöhnliches Stoppschild"), trio("Red", "Rouge", "Rot"), [trio("Yellow", "Jaune", "Gelb"), trio("Blue", "Bleu", "Blau"), trio("Green", "Vert", "Grün")]],
  ["easy", "leaf", W("a healthy summer leaf", "d'une feuille saine en été", "ein gesundes Sommerblatt"), trio("Green", "Vert", "Grün"), [trio("Red", "Rouge", "Rot"), trio("Blue", "Bleu", "Blau"), trio("White", "Blanc", "Weiß")]],
  ["easy", "maple", W("the maple leaf on the flag of Canada", "de la feuille d'érable sur le drapeau du Canada", "das Ahornblatt auf der Flagge Kanadas"), trio("Red", "Rouge", "Rot"), [trio("Green", "Vert", "Grün"), trio("Blue", "Bleu", "Blau"), trio("Yellow", "Jaune", "Gelb")]],
  ["easy", "emerald", W("a typical emerald", "d'une émeraude typique", "ein typischer Smaragd"), trio("Green", "Vert", "Grün"), [trio("Red", "Rouge", "Rot"), trio("Blue", "Bleu", "Blau"), trio("Yellow", "Jaune", "Gelb")]],
  ["easy", "ruby", W("a typical ruby", "d'un rubis typique", "ein typischer Rubin"), trio("Red", "Rouge", "Rot"), [trio("Green", "Vert", "Grün"), trio("Blue", "Bleu", "Blau"), trio("White", "Blanc", "Weiß")]],
  ["easy", "sapphire", W("a typical sapphire", "d'un saphir typique", "ein typischer Saphir"), trio("Blue", "Bleu", "Blau"), [trio("Red", "Rouge", "Rot"), trio("Green", "Vert", "Grün"), trio("Yellow", "Jaune", "Gelb")]],
  ["hard", "liberty-col", W("the copper surface of the Statue of Liberty", "de la surface de cuivre de la statue de la Liberté", "die Kupferoberfläche der Freiheitsstatue"), trio("Green", "Vert", "Grün"), [trio("Orange", "Orange", "Orange"), trio("Grey", "Gris", "Grau"), trio("Red", "Rouge", "Rot")]],
  ["easy", "flamingo", W("a typical flamingo", "d'un flamant typique", "ein typischer Flamingo"), trio("Pink", "Rose", "Rosa"), [trio("White", "Blanc", "Weiß"), trio("Blue", "Bleu", "Blau"), trio("Yellow", "Jaune", "Gelb")]],
  ["easy", "polar", W("the fur of a polar bear", "du pelage d'un ours polaire", "das Fell eines Eisbären"), trio("White", "Blanc", "Weiß"), [trio("Brown", "Brun", "Braun"), trio("Grey", "Gris", "Grau"), trio("Black", "Noir", "Schwarz")]],
  ["easy", "school-bus", W("a typical North American school bus", "d'un autobus scolaire typique en Amérique du Nord", "ein typischer nordamerikanischer Schulbus"), trio("Yellow", "Jaune", "Gelb"), [trio("Orange", "Orange", "Orange"), trio("Red", "Rouge", "Rot"), trio("Blue", "Bleu", "Blau")]],
  ["hard", "chlorophyll", W("grass that has chlorophyll in it", "du gazon qui contient de la chlorophylle", "Gras, das Chlorophyll enthält"), trio("Green", "Vert", "Grün"), [trio("Red", "Rouge", "Rot"), trio("Brown", "Brun", "Braun"), trio("Blue", "Bleu", "Blau")]],
];
for (const [tier, slug, thing, color, wrongs] of COLOURS) add(colour(tier, slug, thing, color, wrongs));

const COUNTS = [
  ["easy", "cube-faces", W("faces does a cube have", "faces a un cube", "Flächen hat ein Würfel"), "6", ["4", "8", "12"]],
  ["hard", "cube-edges", W("edges does a cube have", "arêtes a un cube", "Kanten hat ein Würfel"), "12", ["6", "8", "16"]],
  ["hard", "cube-corners", W("corners does a cube have", "coins a un cube", "Ecken hat ein Würfel"), "8", ["6", "4", "12"]],
  ["easy", "hexagon", W("sides does a hexagon have", "côtés a un hexagone", "Seiten hat ein Sechseck"), "6", ["5", "8", "4"]],
  ["easy", "octagon", W("sides does an octagon have", "côtés a un octogone", "Seiten hat ein Achteck"), "8", ["6", "10", "7"]],
  ["easy", "pentagon", W("sides does a pentagon have", "côtés a un pentagone", "Seiten hat ein Fünfeck"), "5", ["6", "4", "8"]],
  ["easy", "heart", W("chambers does a human heart have", "cavités a un cœur humain", "Kammern hat ein menschliches Herz"), "4", ["2", "3", "6"]],
  ["hard", "teeth", W("teeth does a typical adult human have, counting wisdom teeth", "dents a un adulte, en comptant les dents de sagesse", "Zähne hat ein Erwachsener, inklusive Weisheitszähne"), "32", ["28", "30", "36"]],
  ["difficult", "bones", W("bones are in a typical adult human skeleton", "os compte un squelette adulte typique", "Knochen hat ein typisches Erwachsenenskelett"), "206", ["186", "256", "180"]],
  ["hard", "chromosomes", W("chromosomes are in a typical human body cell", "chromosomes compte une cellule humaine typique", "Chromosomen hat eine typische menschliche Körperzelle"), "46", ["23", "48", "44"]],
  ["easy", "planets", W("planets are in the Solar System, by the current count", "planètes compte le système solaire, selon le décompte actuel", "Planeten hat das Sonnensystem nach heutiger Zählung"), "8", ["9", "7", "12"]],
  ["easy", "byte", W("bits are in one byte", "bits compte un octet", "Bits hat ein Byte"), "8", ["4", "16", "10"]],
  ["easy", "spider", W("legs does a spider have", "pattes a une araignée", "Beine hat eine Spinne"), "8", ["6", "10", "4"]],
  ["easy", "insect", W("legs does an insect have", "pattes a un insecte", "Beine hat ein Insekt"), "6", ["8", "4", "10"]],
  ["hard", "octopus-hearts", W("hearts does an octopus have", "cœurs a une pieuvre", "Herzen hat ein Oktopus"), "3", ["1", "2", "8"]],
  ["easy", "triangle", W("degrees are in the angles of a triangle, added together", "degrés totalisent les angles d'un triangle", "Grad ergeben die Winkel eines Dreiecks zusammen"), "180", ["90", "360", "270"]],
  ["easy", "circle", W("degrees are in a full circle", "degrés compte un cercle complet", "Grad hat ein voller Kreis"), "360", ["180", "90", "270"]],
  ["easy", "right", W("degrees are in a right angle", "degrés compte un angle droit", "Grad hat ein rechter Winkel"), "90", ["45", "180", "60"]],
  ["hard", "strings-violin", W("strings does a standard violin have", "cordes a un violon standard", "Saiten hat eine gewöhnliche Geige"), "4", ["6", "5", "8"]],
  ["hard", "strings-guitar", W("strings does a standard guitar have", "cordes a une guitare standard", "Saiten hat eine gewöhnliche Gitarre"), "6", ["4", "5", "12"]],
];
for (const [tier, slug, thing, num, wrongs] of COUNTS) add(count(tier, slug, thing, num, wrongs));

const HOSTS = [
  ["easy", "1976", W("the 1976 Summer Olympics", "les Jeux olympiques d'été de 1976", "der Olympischen Sommerspiele 1976"), "Montreal", ["Toronto", "Quebec City", "Vancouver"]],
  ["easy", "2010w", W("the 2010 Winter Olympics", "les Jeux olympiques d'hiver de 2010", "der Olympischen Winterspiele 2010"), "Vancouver", ["Calgary", "Montreal", "Whistler"]],
  ["hard", "1988w", W("the 1988 Winter Olympics", "les Jeux olympiques d'hiver de 1988", "der Olympischen Winterspiele 1988"), "Calgary", ["Vancouver", "Edmonton", "Montreal"]],
  ["easy", "2000", W("the 2000 Summer Olympics", "les Jeux olympiques d'été de 2000", "der Olympischen Sommerspiele 2000"), "Sydney", ["Melbourne", "Athens", "Atlanta"]],
  ["easy", "2008", W("the 2008 Summer Olympics", "les Jeux olympiques d'été de 2008", "der Olympischen Sommerspiele 2008"), "Beijing", ["Shanghai", "Tokyo", "Seoul"]],
  ["easy", "2012", W("the 2012 Summer Olympics", "les Jeux olympiques d'été de 2012", "der Olympischen Sommerspiele 2012"), "London", ["Paris", "Manchester", "Madrid"]],
  ["easy", "2016", W("the 2016 Summer Olympics", "les Jeux olympiques d'été de 2016", "der Olympischen Sommerspiele 2016"), "Rio de Janeiro", ["São Paulo", "Buenos Aires", "Lima"]],
  ["hard", "1992", W("the 1992 Summer Olympics", "les Jeux olympiques d'été de 1992", "der Olympischen Sommerspiele 1992"), "Barcelona", ["Madrid", "Paris", "Seville"]],
  ["hard", "1984", W("the 1984 Summer Olympics", "les Jeux olympiques d'été de 1984", "der Olympischen Sommerspiele 1984"), "Los Angeles", ["New York", "Chicago", "Atlanta"]],
  ["hard", "1964", W("the 1964 Summer Olympics", "les Jeux olympiques d'été de 1964", "der Olympischen Sommerspiele 1964"), "Tokyo", ["Osaka", "Kyoto", "Seoul"]],
  ["difficult", "1896", W("the first modern Summer Olympics, in 1896", "les premiers Jeux olympiques modernes, en 1896", "der ersten Olympischen Spiele der Neuzeit 1896"), "Athens", ["Paris", "Rome", "London"]],
  ["difficult", "1956", W("the 1956 Summer Olympics", "les Jeux olympiques d'été de 1956", "der Olympischen Sommerspiele 1956"), "Melbourne", ["Sydney", "Stockholm", "Rome"]],
  ["hard", "1968", W("the 1968 Summer Olympics", "les Jeux olympiques d'été de 1968", "der Olympischen Sommerspiele 1968"), "Mexico City", ["Rio de Janeiro", "Madrid", "Los Angeles"]],
  ["difficult", "1924", W("the 1924 Summer Olympics", "les Jeux olympiques d'été de 1924", "der Olympischen Sommerspiele 1924"), "Paris", ["London", "Amsterdam", "Berlin"]],
  ["extreme", "1920", W("the 1920 Summer Olympics", "les Jeux olympiques d'été de 1920", "der Olympischen Sommerspiele 1920"), "Antwerp", ["Brussels", "Paris", "Amsterdam"]],
];
for (const [tier, slug, event, city, wrongs] of HOSTS) add(cityHost(tier, slug, event, city, wrongs));

const FILMS = [
  ["easy", "spirited", W("Spirited Away", "Le Voyage de Chihiro", "Chihiros Reise ins Zauberland"), "Hayao Miyazaki", ["Isao Takahata", "Makoto Shinkai", "Satoshi Kon"]],
  ["hard", "parasite", W("Parasite", "Parasite", "Parasite"), "Bong Joon-ho", ["Park Chan-wook", "Lee Chang-dong", "Kim Ki-duk"]],
  ["hard", "get-out", W("Get Out", "Get Out", "Get Out"), "Jordan Peele", ["Spike Lee", "Barry Jenkins", "Ryan Coogler"]],
  ["easy", "inception", W("Inception", "Inception", "Inception"), "Christopher Nolan", ["Steven Spielberg", "Denis Villeneuve", "Ridley Scott"]],
  ["easy", "jaws", W("Jaws", "Les Dents de la mer", "Der weiße Hai"), "Steven Spielberg", ["George Lucas", "Martin Scorsese", "Ridley Scott"]],
  ["hard", "psycho", W("Psycho", "Psychose", "Psycho"), "Alfred Hitchcock", ["Orson Welles", "Billy Wilder", "John Ford"]],
  ["easy", "godfather", W("The Godfather", "Le Parrain", "Der Pate"), "Francis Ford Coppola", ["Martin Scorsese", "Brian De Palma", "Sergio Leone"]],
  ["difficult", "samurai", W("Seven Samurai", "Les Sept Samouraïs", "Die sieben Samurai"), "Akira Kurosawa", ["Yasujiro Ozu", "Kenji Mizoguchi", "Hayao Miyazaki"]],
  ["hard", "amelie", W("Amélie", "Le Fabuleux Destin d'Amélie Poulain", "Die fabelhafte Welt der Amélie"), "Jean-Pierre Jeunet", ["Luc Besson", "François Truffaut", "Jean-Luc Godard"]],
  ["hard", "pans", W("Pan's Labyrinth", "Le Labyrinthe de Pan", "Pans Labyrinth"), "Guillermo del Toro", ["Alfonso Cuarón", "Alejandro González Iñárritu", "Pedro Almodóvar"]],
  ["difficult", "piano", W("The Piano", "La Leçon de piano", "Das Piano"), "Jane Campion", ["Sofia Coppola", "Kathryn Bigelow", "Greta Gerwig"]],
  ["hard", "fury", W("Mad Max: Fury Road", "Mad Max: Fury Road", "Mad Max: Fury Road"), "George Miller", ["James Cameron", "Peter Jackson", "Ridley Scott"]],
  ["hard", "moonlight", W("Moonlight", "Moonlight", "Moonlight"), "Barry Jenkins", ["Jordan Peele", "Steve McQueen", "Ryan Coogler"]],
  ["hard", "arrival", W("Arrival", "Premier Contact", "Arrival"), "Denis Villeneuve", ["Christopher Nolan", "Jean-Marc Vallée", "Xavier Dolan"]],
  ["difficult", "portrait", W("Portrait of a Lady on Fire", "Portrait de la jeune fille en feu", "Porträt einer jungen Frau in Flammen"), "Céline Sciamma", ["Claire Denis", "Agnès Varda", "Jane Campion"]],
];
for (const [tier, slug, film, person, wrongs] of FILMS) add(made(tier, slug, film, person, wrongs));

const PIECES = [
  ["easy", "seasons", W("The Four Seasons", "Les Quatre Saisons", "Die vier Jahreszeiten"), "Antonio Vivaldi", ["Johann Sebastian Bach", "George Frideric Handel", "Arcangelo Corelli"]],
  ["easy", "fifth", W("Symphony No. 5", "la Symphonie no 5", "die 5. Sinfonie"), "Ludwig van Beethoven", ["Wolfgang Amadeus Mozart", "Franz Schubert", "Johannes Brahms"]],
  ["easy", "flute", W("The Magic Flute", "La Flûte enchantée", "Die Zauberflöte"), "Wolfgang Amadeus Mozart", ["Ludwig van Beethoven", "Joseph Haydn", "Christoph Willibald Gluck"]],
  ["easy", "nutcracker", W("The Nutcracker", "Casse-Noisette", "Der Nussknacker"), "Pyotr Ilyich Tchaikovsky", ["Igor Stravinsky", "Sergei Rachmaninoff", "Modest Mussorgsky"]],
  ["hard", "messiah", W("Messiah", "Le Messie", "Der Messias"), "George Frideric Handel", ["Johann Sebastian Bach", "Henry Purcell", "Antonio Vivaldi"]],
  ["hard", "rite", W("The Rite of Spring", "Le Sacre du printemps", "Le Sacre du printemps"), "Igor Stravinsky", ["Claude Debussy", "Maurice Ravel", "Béla Bartók"]],
  ["easy", "clair", W("Clair de lune", "Clair de lune", "Clair de lune"), "Claude Debussy", ["Maurice Ravel", "Erik Satie", "Gabriel Fauré"]],
  ["hard", "brandenburg-c", W("the Brandenburg Concertos", "les Concertos brandebourgeois", "die Brandenburgischen Konzerte"), "Johann Sebastian Bach", ["George Frideric Handel", "Antonio Vivaldi", "Georg Philipp Telemann"]],
  ["hard", "planets-suite", W("The Planets", "Les Planètes", "Die Planeten"), "Gustav Holst", ["Edward Elgar", "Ralph Vaughan Williams", "Benjamin Britten"]],
  ["easy", "carmen", W("Carmen", "Carmen", "Carmen"), "Georges Bizet", ["Giuseppe Verdi", "Giacomo Puccini", "Charles Gounod"]],
  ["hard", "aida", W("Aida", "Aida", "Aida"), "Giuseppe Verdi", ["Giacomo Puccini", "Gioachino Rossini", "Georges Bizet"]],
  ["hard", "peer", W("Peer Gynt", "Peer Gynt", "Peer Gynt"), "Edvard Grieg", ["Jean Sibelius", "Carl Nielsen", "Franz Liszt"]],
  ["difficult", "new-world", W("the New World Symphony", "la Symphonie du Nouveau Monde", "die Sinfonie Aus der Neuen Welt"), "Antonín Dvořák", ["Bedřich Smetana", "Johannes Brahms", "Gustav Mahler"]],
  ["easy", "bolero", W("Boléro", "le Boléro", "Boléro"), "Maurice Ravel", ["Claude Debussy", "Camille Saint-Saëns", "Georges Bizet"]],
  ["hard", "west-side", W("West Side Story", "West Side Story", "West Side Story"), "Leonard Bernstein", ["Stephen Sondheim", "George Gershwin", "Cole Porter"]],
];
for (const [tier, slug, piece, person, wrongs] of PIECES) add(music(tier, slug, piece, person, wrongs));

const BRANDS = [
  ["easy", "toyota", "Toyota", trio("Japan", "Japon", "Japan"), [trio("South Korea", "Corée du Sud", "Südkorea"), trio("Germany", "Allemagne", "Deutschland"), trio("the United States", "États-Unis", "Vereinigte Staaten")]],
  ["easy", "samsung", "Samsung", trio("South Korea", "Corée du Sud", "Südkorea"), [trio("Japan", "Japon", "Japan"), trio("China", "Chine", "China"), trio("Taiwan", "Taïwan", "Taiwan")]],
  ["hard", "nokia", "Nokia", trio("Finland", "Finlande", "Finnland"), [trio("Sweden", "Suède", "Schweden"), trio("Japan", "Japon", "Japan"), trio("Germany", "Allemagne", "Deutschland")]],
  ["easy", "ikea", "IKEA", trio("Sweden", "Suède", "Schweden"), [trio("Denmark", "Danemark", "Dänemark"), trio("Germany", "Allemagne", "Deutschland"), trio("Norway", "Norvège", "Norwegen")]],
  ["easy", "lego", "Lego", trio("Denmark", "Danemark", "Dänemark"), [trio("Sweden", "Suède", "Schweden"), trio("Germany", "Allemagne", "Deutschland"), trio("the Netherlands", "Pays-Bas", "Niederlande")]],
  ["hard", "nestle", "Nestlé", trio("Switzerland", "Suisse", "Schweiz"), [trio("France", "France", "Frankreich"), trio("Germany", "Allemagne", "Deutschland"), trio("Belgium", "Belgique", "Belgien")]],
  ["hard", "siemens", "Siemens", trio("Germany", "Allemagne", "Deutschland"), [trio("Sweden", "Suède", "Schweden"), trio("the United States", "États-Unis", "Vereinigte Staaten"), trio("Japan", "Japon", "Japan")]],
  ["easy", "spotify", "Spotify", trio("Sweden", "Suède", "Schweden"), [trio("the United States", "États-Unis", "Vereinigte Staaten"), trio("the United Kingdom", "Royaume-Uni", "Vereinigtes Königreich"), trio("Germany", "Allemagne", "Deutschland")]],
  ["hard", "zara", "Zara", trio("Spain", "Espagne", "Spanien"), [trio("Italy", "Italie", "Italien"), trio("France", "France", "Frankreich"), trio("Portugal", "Portugal", "Portugal")]],
  ["easy", "gucci", "Gucci", trio("Italy", "Italie", "Italien"), [trio("France", "France", "Frankreich"), trio("Spain", "Espagne", "Spanien"), trio("the United Kingdom", "Royaume-Uni", "Vereinigtes Königreich")]],
  ["hard", "rolex", "Rolex", trio("Switzerland", "Suisse", "Schweiz"), [trio("France", "France", "Frankreich"), trio("Germany", "Allemagne", "Deutschland"), trio("Italy", "Italie", "Italien")]],
  ["easy", "hyundai", "Hyundai", trio("South Korea", "Corée du Sud", "Südkorea"), [trio("Japan", "Japon", "Japan"), trio("China", "Chine", "China"), trio("Germany", "Allemagne", "Deutschland")]],
  ["easy", "honda", "Honda", trio("Japan", "Japon", "Japan"), [trio("South Korea", "Corée du Sud", "Südkorea"), trio("Germany", "Allemagne", "Deutschland"), trio("the United States", "États-Unis", "Vereinigte Staaten")]],
  ["hard", "volvo", "Volvo", trio("Sweden", "Suède", "Schweden"), [trio("Germany", "Allemagne", "Deutschland"), trio("Japan", "Japon", "Japan"), trio("the United States", "États-Unis", "Vereinigte Staaten")]],
  ["easy", "heineken", "Heineken", trio("the Netherlands", "Pays-Bas", "Niederlande"), [trio("Belgium", "Belgique", "Belgien"), trio("Germany", "Allemagne", "Deutschland"), trio("Denmark", "Danemark", "Dänemark")]],
  ["easy", "guinness", "Guinness", trio("Ireland", "Irlande", "Irland"), [trio("the United Kingdom", "Royaume-Uni", "Vereinigtes Königreich"), trio("Germany", "Allemagne", "Deutschland"), trio("Belgium", "Belgique", "Belgien")]],
  ["hard", "ferrero", "Ferrero", trio("Italy", "Italie", "Italien"), [trio("Switzerland", "Suisse", "Schweiz"), trio("France", "France", "Frankreich"), trio("Belgium", "Belgique", "Belgien")]],
  ["hard", "danone", "Danone", trio("France", "France", "Frankreich"), [trio("Switzerland", "Suisse", "Schweiz"), trio("Spain", "Espagne", "Spanien"), trio("Belgium", "Belgique", "Belgien")]],
];
for (const [tier, slug, brand, country, wrongs] of BRANDS) add(founded(tier, slug, brand, country, wrongs));

const RIVERS = [
  ["easy", "nile", W("Nile", "Nil", "der Nil"), trio("the Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer"), [trio("the Red Sea", "La mer Rouge", "Das Rote Meer"), trio("the Atlantic Ocean", "L'océan Atlantique", "Der Atlantik"), trio("the Indian Ocean", "L'océan Indien", "Der Indische Ozean")]],
  ["easy", "amazon", W("Amazon", "Amazone", "der Amazonas"), trio("the Atlantic Ocean", "L'océan Atlantique", "Der Atlantik"), [trio("the Pacific Ocean", "L'océan Pacifique", "Der Pazifik"), trio("the Caribbean Sea", "La mer des Caraïbes", "Die Karibik"), trio("the Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer")]],
  ["hard", "danube", W("Danube", "Danube", "die Donau"), trio("the Black Sea", "La mer Noire", "Das Schwarze Meer"), [trio("the Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer"), trio("the Baltic Sea", "La mer Baltique", "Die Ostsee"), trio("the North Sea", "La mer du Nord", "Die Nordsee")]],
  ["hard", "rhine", W("Rhine", "Rhin", "der Rhein"), trio("the North Sea", "La mer du Nord", "Die Nordsee"), [trio("the Baltic Sea", "La mer Baltique", "Die Ostsee"), trio("the Black Sea", "La mer Noire", "Das Schwarze Meer"), trio("the Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer")]],
  ["easy", "thames", W("Thames", "Tamise", "die Themse"), trio("the North Sea", "La mer du Nord", "Die Nordsee"), [trio("the English Channel", "La Manche", "Der Ärmelkanal"), trio("the Irish Sea", "La mer d'Irlande", "Die Irische See"), trio("the Baltic Sea", "La mer Baltique", "Die Ostsee")]],
  ["easy", "seine", W("Seine", "Seine", "die Seine"), trio("the English Channel", "La Manche", "Der Ärmelkanal"), [trio("the Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer"), trio("the North Sea", "La mer du Nord", "Die Nordsee"), trio("the Bay of Biscay", "Le golfe de Gascogne", "Die Biskaya")]],
  ["hard", "ganges", W("Ganges", "Gange", "der Ganges"), trio("the Bay of Bengal", "Le golfe du Bengale", "Der Golf von Bengalen"), [trio("the Arabian Sea", "La mer d'Arabie", "Das Arabische Meer"), trio("the Indian Ocean", "L'océan Indien", "Der Indische Ozean"), trio("the South China Sea", "La mer de Chine méridionale", "Das Südchinesische Meer")]],
  ["difficult", "volga", W("Volga", "Volga", "die Wolga"), trio("the Caspian Sea", "La mer Caspienne", "Das Kaspische Meer"), [trio("the Black Sea", "La mer Noire", "Das Schwarze Meer"), trio("the Baltic Sea", "La mer Baltique", "Die Ostsee"), trio("the Arctic Ocean", "L'océan Arctique", "Das Nordpolarmeer")]],
  ["hard", "st-lawrence", W("St. Lawrence", "Saint-Laurent", "der Sankt-Lorenz-Strom"), trio("the Atlantic Ocean", "L'océan Atlantique", "Der Atlantik"), [trio("Hudson Bay", "La baie d'Hudson", "Die Hudson Bay"), trio("the Pacific Ocean", "L'océan Pacifique", "Der Pazifik"), trio("the Gulf of Mexico", "Le golfe du Mexique", "Der Golf von Mexiko")]],
  ["difficult", "mackenzie", W("Mackenzie", "Mackenzie", "der Mackenzie"), trio("the Arctic Ocean", "L'océan Arctique", "Das Nordpolarmeer"), [trio("the Pacific Ocean", "L'océan Pacifique", "Der Pazifik"), trio("Hudson Bay", "La baie d'Hudson", "Die Hudson Bay"), trio("the Atlantic Ocean", "L'océan Atlantique", "Der Atlantik")]],
  ["hard", "mississippi", W("Mississippi", "Mississippi", "der Mississippi"), trio("the Gulf of Mexico", "Le golfe du Mexique", "Der Golf von Mexiko"), [trio("the Atlantic Ocean", "L'océan Atlantique", "Der Atlantik"), trio("the Pacific Ocean", "L'océan Pacifique", "Der Pazifik"), trio("Hudson Bay", "La baie d'Hudson", "Die Hudson Bay")]],
  ["difficult", "zambezi", W("Zambezi", "Zambèze", "der Sambesi"), trio("the Indian Ocean", "L'océan Indien", "Der Indische Ozean"), [trio("the Atlantic Ocean", "L'océan Atlantique", "Der Atlantik"), trio("the Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer"), trio("the Red Sea", "La mer Rouge", "Das Rote Meer")]],
];
for (const [tier, slug, river, water, wrongs] of RIVERS) add(flows(tier, slug, river, water, wrongs));

const YEARS = [
  ["easy", "confed", W("did Canadian Confederation take effect", "la Confédération canadienne a pris effet", "trat die Kanadische Konföderation in Kraft"), "1867", ["1776", "1967", "1840"]],
  ["hard", "plains", W("was the Battle of the Plains of Abraham fought", "a eu lieu la bataille des plaines d'Abraham", "fand die Schlacht auf der Abraham-Ebene statt"), "1759", ["1763", "1775", "1812"]],
  ["hard", "montreal-found", W("was Montreal founded, as Fort Ville-Marie", "Montréal a été fondée, comme fort Ville-Marie", "wurde Montreal als Fort Ville-Marie gegründet"), "1642", ["1608", "1534", "1701"]],
  ["easy", "expo", W("did Expo 67 open in Montreal", "l'Expo 67 a ouvert à Montréal", "öffnete die Expo 67 in Montreal"), "1967", ["1976", "1957", "1980"]],
  ["easy", "moon", W("did people first walk on the Moon", "des gens ont marché sur la Lune pour la première fois", "betraten Menschen zum ersten Mal den Mond"), "1969", ["1961", "1972", "1957"]],
  ["easy", "wall-fall", W("did the Berlin Wall open", "le mur de Berlin s'est ouvert", "öffnete sich die Berliner Mauer"), "1989", ["1991", "1985", "1979"]],
  ["hard", "wall-up", W("did construction of the Berlin Wall begin", "a commencé la construction du mur de Berlin", "begann der Bau der Berliner Mauer"), "1961", ["1949", "1953", "1969"]],
  ["easy", "wright", W("did the Wright brothers make their first powered flight", "les frères Wright ont fait leur premier vol motorisé", "machten die Gebrüder Wright ihren ersten Motorflug"), "1903", ["1896", "1914", "1885"]],
  ["easy", "iphone", W("did Apple release the first iPhone", "Apple a lancé le premier iPhone", "brachte Apple das erste iPhone heraus"), "2007", ["2005", "2010", "2001"]],
  ["hard", "sputnik", W("did Sputnik 1 reach orbit", "Spoutnik 1 a atteint l'orbite", "erreichte Sputnik 1 die Umlaufbahn"), "1957", ["1961", "1969", "1945"]],
  ["easy", "titanic", W("did the Titanic sink", "le Titanic a coulé", "sank die Titanic"), "1912", ["1905", "1918", "1898"]],
  ["hard", "chernobyl", W("did the Chernobyl disaster happen", "a eu lieu la catastrophe de Tchernobyl", "geschah die Katastrophe von Tschernobyl"), "1986", ["1979", "1991", "1984"]],
  ["easy", "gagarin", W("did Yuri Gagarin orbit Earth", "Youri Gagarine a fait le tour de la Terre", "umkreiste Juri Gagarin die Erde"), "1961", ["1957", "1969", "1963"]],
  ["hard", "hubble", W("was the Hubble Space Telescope launched", "le télescope spatial Hubble a été lancé", "wurde das Hubble-Weltraumteleskop gestartet"), "1990", ["1986", "1995", "2001"]],
  ["easy", "wiki", W("did Wikipedia go online", "Wikipédia a été mis en ligne", "ging Wikipedia online"), "2001", ["1998", "2004", "1995"]],
  ["easy", "youtube", W("was YouTube launched", "YouTube a été lancé", "startete YouTube"), "2005", ["2003", "2007", "2010"]],
  ["hard", "channel", W("did the Channel Tunnel open to passenger trains", "le tunnel sous la Manche a ouvert aux trains de passagers", "öffnete der Kanaltunnel für Reisezüge"), "1994", ["1990", "1988", "2001"]],
  ["hard", "panama", W("did the Panama Canal open", "le canal de Panama a ouvert", "öffnete der Panamakanal"), "1914", ["1869", "1904", "1920"]],
  ["difficult", "suez", W("did the Suez Canal open", "le canal de Suez a ouvert", "öffnete der Suezkanal"), "1869", ["1859", "1914", "1888"]],
  ["easy", "eiffel-year", W("was the Eiffel Tower completed", "la tour Eiffel a été terminée", "wurde der Eiffelturm fertig"), "1889", ["1876", "1900", "1867"]],
  ["difficult", "magna", W("was Magna Carta sealed", "la Grande Charte a été scellée", "wurde die Magna Carta besiegelt"), "1215", ["1066", "1314", "1415"]],
  ["hard", "gutenberg", W("did Johannes Gutenberg finish his printing press, around this date", "Johannes Gutenberg a achevé sa presse, vers cette date", "vollendete Johannes Gutenberg seine Druckerpresse, um dieses Jahr"), "1440", ["1492", "1517", "1350"]],
  ["easy", "un-year", W("was the United Nations founded", "l'ONU a été fondée", "wurden die Vereinten Nationen gegründet"), "1945", ["1919", "1948", "1955"]],
  ["hard", "nato", W("was NATO founded", "l'OTAN a été fondée", "wurde die NATO gegründet"), "1949", ["1945", "1955", "1939"]],
  ["easy", "olympics-mod", W("were the first modern Olympic Games held", "ont eu lieu les premiers Jeux olympiques modernes", "fanden die ersten Olympischen Spiele der Neuzeit statt"), "1896", ["1900", "1886", "1912"]],
  ["difficult", "quebec-act", W("was the Quebec Act passed", "l'Acte de Québec a été adopté", "wurde der Quebec Act verabschiedet"), "1774", ["1759", "1791", "1867"]],
  ["hard", "euro-cash", W("did euro notes and coins enter daily use", "les billets et les pièces en euros sont entrés dans l'usage quotidien", "kamen Euro-Scheine und -Münzen in den Alltag"), "2002", ["1999", "1992", "2007"]],
  ["easy", "facebook", W("was Facebook launched", "Facebook a été lancé", "startete Facebook"), "2004", ["2001", "2006", "1998"]],
];
for (const [tier, slug, event, year, wrongs] of YEARS) add(yearOf(tier, slug, event, year, wrongs));

const MORE = [
  q("easy", "sport", "hockey-canada", {
    en: "What is Canada's national winter sport?",
    qc: "C'est quoi le sport national d'hiver du Canada?",
    de: "Was ist Kanadas nationaler Wintersport?",
  }, trio("Ice hockey", "Le hockey sur glace", "Eishockey"), [trio("Curling", "Le curling", "Curling"), trio("Skiing", "Le ski", "Skifahren"), trio("Lacrosse", "La crosse", "Lacrosse")], T.sport, H.straight),
  q("hard", "sport", "lacrosse-canada", {
    en: "What is Canada's national summer sport?",
    qc: "C'est quoi le sport national d'été du Canada?",
    de: "Was ist Kanadas nationaler Sommersport?",
  }, trio("Lacrosse", "La crosse", "Lacrosse"), [trio("Ice hockey", "Le hockey sur glace", "Eishockey"), trio("Baseball", "Le baseball", "Baseball"), trio("Soccer", "Le soccer", "Fußball")], T.sport, H.straight),
  q("easy", "geography", "canada-pm", {
    en: "What is the title of Canada's head of government?",
    qc: "C'est quoi le titre du chef du gouvernement du Canada?",
    de: "Wie lautet der Titel des Regierungschefs von Kanada?",
  }, trio("Prime Minister", "Premier ministre", "Premierminister"), [trio("President", "Président", "Präsident"), trio("Chancellor", "Chancelier", "Kanzler"), trio("Governor", "Gouverneur", "Gouverneur")], T.who, H.straight),
  q("easy", "geography", "highest-canada", {
    en: "What is the highest mountain in Canada?",
    qc: "C'est quoi la plus haute montagne du Canada?",
    de: "Welcher Berg ist der höchste in Kanada?",
  }, "Mount Logan", ["Mount Robson", "Mont Tremblant", "Mount Columbia"], T.geo, H.straight),
  q("hard", "geography", "biggest-province", {
    en: "Which Canadian province has the most people?",
    qc: "C'est quelle province canadienne qui a le plus d'habitants?",
    de: "Welche kanadische Provinz hat die meisten Einwohner?",
  }, trio("Ontario", "L'Ontario", "Ontario"), [trio("Quebec", "Le Québec", "Quebec"), trio("British Columbia", "La Colombie-Britannique", "British Columbia"), trio("Alberta", "L'Alberta", "Alberta")], T.geo, H.straight),
  q("easy", "sci-fi", "closest-star", {
    en: "Which star is closest to Earth?",
    qc: "C'est quelle étoile qui est la plus proche de la Terre?",
    de: "Welcher Stern ist der Erde am nächsten?",
  }, trio("The Sun", "Le Soleil", "Die Sonne"), [trio("Proxima Centauri", "Proxima du Centaure", "Proxima Centauri"), trio("Sirius", "Sirius", "Sirius"), trio("Polaris", "L'étoile Polaire", "Polaris")], T.lab, H.straight),
  q("easy", "sci-fi", "red-planet", {
    en: "Which planet is called the Red Planet?",
    qc: "C'est quelle planète qu'on appelle la planète rouge?",
    de: "Welcher Planet heißt der Rote Planet?",
  }, "Mars", ["Venus", "Jupiter", "Mercury"], T.lab, H.straight),
  q("easy", "sci-fi", "biggest-planet", {
    en: "Which planet is the largest in the Solar System?",
    qc: "C'est quelle planète qui est la plus grosse du système solaire?",
    de: "Welcher Planet ist der größte im Sonnensystem?",
  }, "Jupiter", ["Saturn", "Neptune", "Earth"], T.lab, H.straight),
  q("hard", "sci-fi", "first-woman-space", {
    en: "Who was the first woman to fly in space?",
    qc: "C'est qui, la première femme dans l'espace?",
    de: "Wer war die erste Frau im Weltall?",
  }, "Valentina Tereshkova", ["Sally Ride", "Mae Jemison", "Svetlana Savitskaya"], T.who, H.straight),
  q("easy", "sci-fi", "skin", {
    en: "What is the largest organ of the human body?",
    qc: "C'est quoi le plus grand organe du corps humain?",
    de: "Welches ist das größte Organ des menschlichen Körpers?",
  }, trio("The skin", "La peau", "Die Haut"), [trio("The liver", "Le foie", "Die Leber"), trio("The brain", "Le cerveau", "Das Gehirn"), trio("The lungs", "Les poumons", "Die Lunge")], T.lab, H.straight),
  q("easy", "sci-fi", "longest-bone", {
    en: "What is the longest bone in the human body?",
    qc: "C'est quoi le plus long os du corps humain?",
    de: "Welcher Knochen ist der längste im menschlichen Körper?",
  }, trio("The femur", "Le fémur", "Der Oberschenkelknochen"), [trio("The tibia", "Le tibia", "Das Schienbein"), trio("The humerus", "L'humérus", "Der Oberarmknochen"), trio("The spine", "La colonne", "Die Wirbelsäule")], T.lab, H.straight),
  q("easy", "culture", "cheetah", {
    en: "Which land animal is the fastest in a sprint?",
    qc: "C'est quel animal terrestre qui est le plus rapide au sprint?",
    de: "Welches Landtier ist im Sprint am schnellsten?",
  }, trio("The cheetah", "Le guépard", "Der Gepard"), [trio("The lion", "Le lion", "Der Löwe"), trio("The pronghorn", "L'antilocapre", "Der Gabelbock"), trio("The horse", "Le cheval", "Das Pferd")], T.who, H.straight),
  q("easy", "culture", "blue-whale", {
    en: "What is the largest animal alive today?",
    qc: "C'est quoi le plus grand animal vivant aujourd'hui?",
    de: "Welches ist das größte heute lebende Tier?",
  }, trio("The blue whale", "La baleine bleue", "Der Blauwal"), [trio("The elephant", "L'éléphant", "Der Elefant"), trio("The whale shark", "Le requin-baleine", "Der Walhai"), trio("The giraffe", "La girafe", "Die Giraffe")], T.who, H.straight),
  q("easy", "culture", "platypus", {
    en: "Which mammal lays eggs?",
    qc: "C'est quel mammifère qui pond des œufs?",
    de: "Welches Säugetier legt Eier?",
  }, trio("The platypus", "L'ornithorynque", "Das Schnabeltier"), [trio("The bat", "La chauve-souris", "Die Fledermaus"), trio("The kangaroo", "Le kangourou", "Das Känguru"), trio("The seal", "Le phoque", "Die Robbe")], T.who, H.straight),
  q("easy", "culture", "kiwi-bird", {
    en: "Which country is the kiwi bird from?",
    qc: "Le kiwi, l'oiseau, vient de quel pays?",
    de: "Aus welchem Land kommt der Kiwi-Vogel?",
  }, trio("New Zealand", "La Nouvelle-Zélande", "Neuseeland"), [trio("Australia", "L'Australie", "Australien"), trio("Madagascar", "Madagascar", "Madagaskar"), trio("Chile", "Le Chili", "Chile")], T.geo, H.country),
  q("hard", "music", "roman-c", {
    en: "What number does the Roman numeral C stand for?",
    qc: "Le chiffre romain C veut dire quel nombre?",
    de: "Für welche Zahl steht die römische Ziffer C?",
  }, "100", ["50", "500", "1000"], T.count, H.straight),
  q("hard", "music", "roman-l", {
    en: "What number does the Roman numeral L stand for?",
    qc: "Le chiffre romain L veut dire quel nombre?",
    de: "Für welche Zahl steht die römische Ziffer L?",
  }, "50", ["100", "5", "500"], T.count, H.straight),
  q("difficult", "music", "roman-d", {
    en: "What number does the Roman numeral D stand for?",
    qc: "Le chiffre romain D veut dire quel nombre?",
    de: "Für welche Zahl steht die römische Ziffer D?",
  }, "500", ["50", "1000", "100"], T.count, H.straight),
  q("easy", "music", "roman-m", {
    en: "What number does the Roman numeral M stand for?",
    qc: "Le chiffre romain M veut dire quel nombre?",
    de: "Für welche Zahl steht die römische Ziffer M?",
  }, "1000", ["100", "500", "50"], T.count, H.straight),
  q("easy", "art", "louvre-city", {
    en: "In which city is the Louvre?",
    qc: "Le Louvre est dans quelle ville?",
    de: "In welcher Stadt steht der Louvre?",
  }, trio("Paris", "Paris", "Paris"), [trio("Lyon", "Lyon", "Lyon"), trio("Brussels", "Bruxelles", "Brüssel"), trio("Rome", "Rome", "Rom")], T.art, H.straight),
  q("hard", "art", "uffizi", {
    en: "In which city is the Uffizi Gallery?",
    qc: "La galerie des Offices est dans quelle ville?",
    de: "In welcher Stadt steht die Uffizien?",
  }, trio("Florence", "Florence", "Florenz"), [trio("Rome", "Rome", "Rom"), trio("Venice", "Venise", "Venedig"), trio("Milan", "Milan", "Mailand")], T.art, H.straight),
  q("hard", "art", "prado", {
    en: "In which city is the Prado Museum?",
    qc: "Le musée du Prado est dans quelle ville?",
    de: "In welcher Stadt steht das Prado-Museum?",
  }, trio("Madrid", "Madrid", "Madrid"), [trio("Barcelona", "Barcelone", "Barcelona"), trio("Seville", "Séville", "Sevilla"), trio("Lisbon", "Lisbonne", "Lissabon")], T.art, H.straight),
  q("difficult", "art", "hermitage", {
    en: "In which city is the Hermitage Museum?",
    qc: "Le musée de l'Ermitage est dans quelle ville?",
    de: "In welcher Stadt steht die Eremitage?",
  }, trio("Saint Petersburg", "Saint-Pétersbourg", "Sankt Petersburg"), [trio("Moscow", "Moscou", "Moskau"), trio("Kyiv", "Kyiv", "Kiew"), trio("Vienna", "Vienne", "Wien")], T.art, H.straight),
  q("easy", "art", "rijks", {
    en: "In which city is the Rijksmuseum?",
    qc: "Le Rijksmuseum est dans quelle ville?",
    de: "In welcher Stadt steht das Rijksmuseum?",
  }, trio("Amsterdam", "Amsterdam", "Amsterdam"), [trio("Rotterdam", "Rotterdam", "Rotterdam"), trio("The Hague", "La Haye", "Den Haag"), trio("Brussels", "Bruxelles", "Brüssel")], T.art, H.straight),
];
for (const row of MORE) add(row);

export {
  capital, countryOf, wrote, currency, language, symbol, atomic, colour, count,
  cityHost, made, music, founded, flows, yearOf, q, P, W, trio, T, H,
};

export function set3Facts() {
  const slugs = new Set();
  for (const row of facts) {
    if (slugs.has(row.slug)) throw new Error(`duplicate slug ${row.slug}`);
    slugs.add(row.slug);
  }
  return facts;
}

export const SET3_GENS = GENS;
