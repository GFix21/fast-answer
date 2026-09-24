/** More original SET00003 facts. Not rewrites of the live bank. */
import { q, trio, T, H } from "./set3-facts.js";

const rows = [];
const add = (row) => rows.push(row);

function continent(tier, slug, place, answer, wrongs) {
  add(q(tier, "geography", `cont-${slug}`, {
    en: `On which continent is ${place.en}?`,
    qc: `C'est sur quel continent, ${place.qc}?`,
    de: `Auf welchem Kontinent liegt ${place.de}?`,
  }, answer, wrongs, T.geo, H.country));
}
function code(tier, slug, place, num, wrongs) {
  add(q(tier, "culture", `dial-${slug}`, {
    en: `What is the international calling code for ${place.en}?`,
    qc: `C'est quoi l'indicatif téléphonique ${place.fr}?`,
    de: `Wie lautet die internationale Vorwahl von ${place.de}?`,
  }, String(num), wrongs.map(String), T.count, H.straight));
}
function park(tier, slug, name, state, wrongs) {
  add(q(tier, "geography", `park-${slug}`, {
    en: `In which U.S. state is ${name} National Park?`,
    qc: `Le parc national ${name} est dans quel État américain?`,
    de: `In welchem US-Bundesstaat liegt der Nationalpark ${name}?`,
  }, state, wrongs, T.geo, H.place));
}
function nick(tier, slug, nickname, state, wrongs) {
  add(q(tier, "culture", `nick-${slug}`, {
    en: `Which U.S. state is known as the ${nickname}?`,
    qc: `C'est quel État américain qu'on surnomme « ${nickname} »?`,
    de: `Welcher US-Bundesstaat trägt den Beinamen ${nickname}?`,
  }, state, wrongs, T.geo, H.straight));
}
function cup(tier, slug, year, country, wrongs) {
  add(q(tier, "sport", `wc-${slug}`, {
    en: `Which country won the men's FIFA World Cup in ${year}?`,
    qc: `Quel pays a gagné la Coupe du monde masculine de la FIFA en ${year}?`,
    de: `Welches Land gewann die Fußball-Weltmeisterschaft der Männer ${year}?`,
  }, country, wrongs, T.sport, H.straight));
}
function food(tier, slug, dish, country, wrongs) {
  add(q(tier, "culture", `food-${slug}`, {
    en: `Which country is most closely associated with ${dish.en}?`,
    qc: `C'est quel pays qu'on associe le plus à ${dish.qc}?`,
    de: `Welches Land verbindet man am ehesten mit ${dish.de}?`,
  }, country, wrongs, T.geo, H.country));
}
function inventor(tier, slug, thing, person, wrongs) {
  add(q(tier, "sci-fi", `inv-${slug}`, {
    en: `Who is credited with ${thing.en}?`,
    qc: `On attribue à qui ${thing.qc}?`,
    de: `Wem schreibt man ${thing.de} zu?`,
  }, person, wrongs, T.who, H.straight));
}
function formula(tier, slug, name, formulaText, wrongs) {
  add(q(tier, "sci-fi", `chem-${slug}`, {
    en: `What is the chemical formula for ${name.en}?`,
    qc: `C'est quoi la formule chimique ${name.fr}?`,
    de: `Wie lautet die chemische Formel von ${name.de}?`,
  }, formulaText, wrongs, T.lab, H.straight));
}
function god(tier, slug, domain, name, wrongs) {
  add(q(tier, "culture", `god-${slug}`, {
    en: `In Greek myth, who is the god of ${domain.en}?`,
    qc: `Dans le mythe grec, c'est qui le dieu ${domain.qc}?`,
    de: `Wer ist in der griechischen Sage der Gott ${domain.de}?`,
  }, name, wrongs, T.who, H.straight));
}

const C = (en, qc, de) => trio(en, qc, de);
const AFR = C("Africa", "L'Afrique", "Afrika");
const ASIA = C("Asia", "L'Asie", "Asien");
const EUR = C("Europe", "L'Europe", "Europa");
const NA = C("North America", "L'Amérique du Nord", "Nordamerika");
const SA = C("South America", "L'Amérique du Sud", "Südamerika");
const OC = C("Oceania", "L'Océanie", "Ozeanien");
const CONT = [AFR, ASIA, EUR, NA, SA, OC];
function others(answer) {
  return CONT.filter((c) => c.en !== answer.en).slice(0, 3);
}

const PLACES = [
  ["easy", "kenya-c", { en: "Kenya", qc: "le Kenya", de: "Kenia" }, AFR],
  ["easy", "japan-c", { en: "Japan", qc: "le Japon", de: "Japan" }, ASIA],
  ["easy", "france-c", { en: "France", qc: "la France", de: "Frankreich" }, EUR],
  ["easy", "mexico-c", { en: "Mexico", qc: "le Mexique", de: "Mexiko" }, NA],
  ["easy", "brazil-c", { en: "Brazil", qc: "le Brésil", de: "Brasilien" }, SA],
  ["easy", "australia-c", { en: "Australia", qc: "l'Australie", de: "Australien" }, OC],
  ["easy", "egypt-c", { en: "Egypt", qc: "l'Égypte", de: "Ägypten" }, AFR],
  ["easy", "china-c", { en: "China", qc: "la Chine", de: "China" }, ASIA],
  ["easy", "italy-c", { en: "Italy", qc: "l'Italie", de: "Italien" }, EUR],
  ["easy", "canada-c", { en: "Canada", qc: "le Canada", de: "Kanada" }, NA],
  ["hard", "peru-c", { en: "Peru", qc: "le Pérou", de: "Peru" }, SA],
  ["easy", "nz-c", { en: "New Zealand", qc: "la Nouvelle-Zélande", de: "Neuseeland" }, OC],
  ["hard", "morocco-c", { en: "Morocco", qc: "le Maroc", de: "Marokko" }, AFR],
  ["hard", "india-c", { en: "India", qc: "l'Inde", de: "Indien" }, ASIA],
  ["hard", "spain-c", { en: "Spain", qc: "l'Espagne", de: "Spanien" }, EUR],
  ["hard", "cuba-c", { en: "Cuba", qc: "Cuba", de: "Kuba" }, NA],
  ["hard", "chile-c", { en: "Chile", qc: "le Chili", de: "Chile" }, SA],
  ["hard", "fiji-c", { en: "Fiji", qc: "les Fidji", de: "Fidschi" }, OC],
  ["difficult", "madagascar-c", { en: "Madagascar", qc: "Madagascar", de: "Madagaskar" }, AFR],
  ["difficult", "mongolia-c", { en: "Mongolia", qc: "la Mongolie", de: "die Mongolei" }, ASIA],
  ["difficult", "iceland-c", { en: "Iceland", qc: "l'Islande", de: "Island" }, EUR],
  ["difficult", "jamaica-c", { en: "Jamaica", qc: "la Jamaïque", de: "Jamaika" }, NA],
  ["difficult", "uruguay-c", { en: "Uruguay", qc: "l'Uruguay", de: "Uruguay" }, SA],
  ["difficult", "papua-c", { en: "Papua New Guinea", qc: "la Papouasie-Nouvelle-Guinée", de: "Papua-Neuguinea" }, OC],
  ["easy", "germany-c", { en: "Germany", qc: "l'Allemagne", de: "Deutschland" }, EUR],
  ["easy", "argentina-c", { en: "Argentina", qc: "l'Argentine", de: "Argentinien" }, SA],
  ["hard", "south-korea-c", { en: "South Korea", qc: "la Corée du Sud", de: "Südkorea" }, ASIA],
  ["hard", "nigeria-c", { en: "Nigeria", qc: "le Nigeria", de: "Nigeria" }, AFR],
  ["extreme", "sri-lanka-c", { en: "Sri Lanka", qc: "le Sri Lanka", de: "Sri Lanka" }, ASIA],
  ["extreme", "greenland-c", { en: "Greenland", qc: "le Groenland", de: "Grönland" }, NA],
];
for (const [tier, slug, place, answer] of PLACES) continent(tier, slug, place, answer, others(answer));

const CODES = [
  ["easy", "us", { en: "the United States", fr: "des États-Unis", de: "den Vereinigten Staaten" }, "1", ["44", "33", "81"]],
  ["easy", "uk", { en: "the United Kingdom", fr: "du Royaume-Uni", de: "dem Vereinigten Königreich" }, "44", ["33", "49", "1"]],
  ["easy", "fr", { en: "France", fr: "de la France", de: "Frankreich" }, "33", ["39", "34", "49"]],
  ["easy", "de", { en: "Germany", fr: "de l'Allemagne", de: "Deutschland" }, "49", ["43", "41", "33"]],
  ["easy", "jp", { en: "Japan", fr: "du Japon", de: "Japan" }, "81", ["82", "86", "66"]],
  ["hard", "au", { en: "Australia", fr: "de l'Australie", de: "Australien" }, "61", ["64", "44", "1"]],
  ["hard", "cn", { en: "China", fr: "de la Chine", de: "China" }, "86", ["81", "82", "91"]],
  ["hard", "in", { en: "India", fr: "de l'Inde", de: "Indien" }, "91", ["92", "86", "94"]],
  ["hard", "br", { en: "Brazil", fr: "du Brésil", de: "Brasilien" }, "55", ["54", "52", "56"]],
  ["easy", "mx", { en: "Mexico", fr: "du Mexique", de: "Mexiko" }, "52", ["55", "54", "1"]],
  ["easy", "it", { en: "Italy", fr: "de l'Italie", de: "Italien" }, "39", ["33", "34", "41"]],
  ["easy", "es", { en: "Spain", fr: "de l'Espagne", de: "Spanien" }, "34", ["33", "351", "39"]],
  ["difficult", "za", { en: "South Africa", fr: "de l'Afrique du Sud", de: "Südafrika" }, "27", ["20", "254", "234"]],
  ["hard", "kr", { en: "South Korea", fr: "de la Corée du Sud", de: "Südkorea" }, "82", ["81", "86", "66"]],
  ["hard", "se", { en: "Sweden", fr: "de la Suède", de: "Schweden" }, "46", ["47", "45", "358"]],
  ["hard", "no", { en: "Norway", fr: "de la Norvège", de: "Norwegen" }, "47", ["46", "45", "354"]],
  ["hard", "dk", { en: "Denmark", fr: "du Danemark", de: "Dänemark" }, "45", ["46", "47", "49"]],
  ["difficult", "ch", { en: "Switzerland", fr: "de la Suisse", de: "der Schweiz" }, "41", ["43", "49", "33"]],
  ["hard", "nl", { en: "the Netherlands", fr: "des Pays-Bas", de: "den Niederlanden" }, "31", ["32", "49", "45"]],
  ["hard", "be", { en: "Belgium", fr: "de la Belgique", de: "Belgien" }, "32", ["31", "33", "352"]],
  ["difficult", "pl", { en: "Poland", fr: "de la Pologne", de: "Polen" }, "48", ["49", "420", "36"]],
  ["difficult", "ie", { en: "Ireland", fr: "de l'Irlande", de: "Irland" }, "353", ["44", "33", "351"]],
  ["hard", "nz", { en: "New Zealand", fr: "de la Nouvelle-Zélande", de: "Neuseeland" }, "64", ["61", "44", "1"]],
  ["difficult", "ar", { en: "Argentina", fr: "de l'Argentine", de: "Argentinien" }, "54", ["55", "56", "598"]],
  ["difficult", "eg", { en: "Egypt", fr: "de l'Égypte", de: "Ägypten" }, "20", ["27", "212", "966"]],
  ["hard", "tr", { en: "Turkey", fr: "de la Turquie", de: "der Türkei" }, "90", ["30", "39", "20"]],
  ["hard", "gr", { en: "Greece", fr: "de la Grèce", de: "Griechenland" }, "30", ["39", "90", "40"]],
  ["difficult", "pt", { en: "Portugal", fr: "du Portugal", de: "Portugal" }, "351", ["34", "33", "39"]],
  ["hard", "at", { en: "Austria", fr: "de l'Autriche", de: "Österreich" }, "43", ["49", "41", "36"]],
  ["difficult", "fi", { en: "Finland", fr: "de la Finlande", de: "Finnland" }, "358", ["46", "47", "372"]],
  ["extreme", "is", { en: "Iceland", fr: "de l'Islande", de: "Island" }, "354", ["47", "45", "46"]],
  ["extreme", "cz", { en: "Czechia", fr: "de la Tchéquie", de: "Tschechien" }, "420", ["421", "48", "36"]],
  ["extreme", "hu", { en: "Hungary", fr: "de la Hongrie", de: "Ungarn" }, "36", ["40", "43", "48"]],
  ["difficult", "ro", { en: "Romania", fr: "de la Roumanie", de: "Rumänien" }, "40", ["36", "359", "381"]],
  ["difficult", "ua", { en: "Ukraine", fr: "de l'Ukraine", de: "der Ukraine" }, "380", ["7", "48", "40"]],
  ["hard", "th", { en: "Thailand", fr: "de la Thaïlande", de: "Thailand" }, "66", ["84", "60", "62"]],
  ["difficult", "vn", { en: "Vietnam", fr: "du Vietnam", de: "Vietnam" }, "84", ["66", "86", "855"]],
  ["difficult", "id", { en: "Indonesia", fr: "de l'Indonésie", de: "Indonesien" }, "62", ["60", "63", "65"]],
  ["difficult", "my", { en: "Malaysia", fr: "de la Malaisie", de: "Malaysia" }, "60", ["65", "62", "66"]],
  ["extreme", "ph", { en: "the Philippines", fr: "des Philippines", de: "den Philippinen" }, "63", ["62", "60", "66"]],
  ["extreme", "sg", { en: "Singapore", fr: "de Singapour", de: "Singapur" }, "65", ["60", "62", "66"]],
  ["extreme", "sa", { en: "Saudi Arabia", fr: "de l'Arabie saoudite", de: "Saudi-Arabien" }, "966", ["971", "965", "974"]],
  ["extreme", "ae", { en: "the United Arab Emirates", fr: "des Émirats arabes unis", de: "den Vereinigten Arabischen Emiraten" }, "971", ["966", "974", "965"]],
];
for (const [tier, slug, place, num, wrongs] of CODES) code(tier, slug, place, num, wrongs);

const PARKS = [
  ["easy", "yosemite", "Yosemite", "California", ["Nevada", "Arizona", "Oregon"]],
  ["easy", "yellowstone", "Yellowstone", "Wyoming", ["Montana", "Idaho", "Colorado"]],
  ["easy", "grand-canyon", "Grand Canyon", "Arizona", ["Utah", "Nevada", "New Mexico"]],
  ["easy", "zion", "Zion", "Utah", ["Arizona", "Colorado", "Nevada"]],
  ["hard", "acadia", "Acadia", "Maine", ["Vermont", "New Hampshire", "Massachusetts"]],
  ["easy", "everglades", "Everglades", "Florida", ["Louisiana", "Georgia", "Texas"]],
  ["hard", "olympic", "Olympic", "Washington", ["Oregon", "Idaho", "Alaska"]],
  ["hard", "rocky", "Rocky Mountain", "Colorado", ["Wyoming", "Utah", "Montana"]],
  ["hard", "glacier", "Glacier", "Montana", ["Wyoming", "Idaho", "Washington"]],
  ["hard", "arches", "Arches", "Utah", ["Arizona", "Colorado", "New Mexico"]],
  ["difficult", "bryce", "Bryce Canyon", "Utah", ["Arizona", "Nevada", "Colorado"]],
  ["easy", "denali", "Denali", "Alaska", ["Washington", "Montana", "Hawaii"]],
  ["hard", "haleakala", "Haleakala", "Hawaii", ["California", "Alaska", "Florida"]],
  ["difficult", "badlands", "Badlands", "South Dakota", ["North Dakota", "Nebraska", "Wyoming"]],
  ["difficult", "shenandoah", "Shenandoah", "Virginia", ["West Virginia", "Maryland", "North Carolina"]],
  ["extreme", "congaree", "Congaree", "South Carolina", ["Georgia", "North Carolina", "Alabama"]],
  ["hard", "crater", "Crater Lake", "Oregon", ["Washington", "California", "Idaho"]],
  ["hard", "rainier", "Mount Rainier", "Washington", ["Oregon", "Alaska", "Montana"]],
  ["difficult", "big-bend", "Big Bend", "Texas", ["New Mexico", "Arizona", "Oklahoma"]],
  ["difficult", "carlsbad", "Carlsbad Caverns", "New Mexico", ["Texas", "Arizona", "Colorado"]],
  ["extreme", "voyageurs", "Voyageurs", "Minnesota", ["Wisconsin", "Michigan", "North Dakota"]],
  ["extreme", "isle-royale", "Isle Royale", "Michigan", ["Minnesota", "Wisconsin", "Ohio"]],
  ["hard", "mammoth", "Mammoth Cave", "Kentucky", ["Tennessee", "Indiana", "Virginia"]],
  ["difficult", "hot-springs", "Hot Springs", "Arkansas", ["Missouri", "Oklahoma", "Louisiana"]],
  ["extreme", "great-basin", "Great Basin", "Nevada", ["Utah", "California", "Idaho"]],
  ["hard", "saguaro", "Saguaro", "Arizona", ["New Mexico", "Texas", "California"]],
  ["difficult", "mesa-verde", "Mesa Verde", "Colorado", ["Utah", "New Mexico", "Arizona"]],
  ["extreme", "gates", "Gates of the Arctic", "Alaska", ["Montana", "Washington", "Maine"]],
  ["hard", "joshua", "Joshua Tree", "California", ["Arizona", "Nevada", "Utah"]],
  ["hard", "sequoia", "Sequoia", "California", ["Oregon", "Washington", "Colorado"]],
];
for (const [tier, slug, name, state, wrongs] of PARKS) park(tier, slug, name, state, wrongs);

const NICKS = [
  ["easy", "lone", "Lone Star State", "Texas", ["California", "Florida", "Arizona"]],
  ["easy", "empire", "Empire State", "New York", ["Pennsylvania", "Massachusetts", "Illinois"]],
  ["easy", "golden", "Golden State", "California", ["Colorado", "Alaska", "Nevada"]],
  ["easy", "sunshine", "Sunshine State", "Florida", ["California", "Arizona", "Hawaii"]],
  ["hard", "evergreen", "Evergreen State", "Washington", ["Oregon", "Maine", "Vermont"]],
  ["hard", "peach", "Peach State", "Georgia", ["South Carolina", "Alabama", "Florida"]],
  ["hard", "keystone", "Keystone State", "Pennsylvania", ["Ohio", "New York", "Virginia"]],
  ["easy", "aloha", "Aloha State", "Hawaii", ["Alaska", "California", "Florida"]],
  ["hard", "bay", "Bay State", "Massachusetts", ["Rhode Island", "Connecticut", "Maine"]],
  ["hard", "hoosier", "Hoosier State", "Indiana", ["Ohio", "Illinois", "Kentucky"]],
  ["easy", "buckeye", "Buckeye State", "Ohio", ["Indiana", "Michigan", "Pennsylvania"]],
  ["hard", "show-me", "Show-Me State", "Missouri", ["Kansas", "Arkansas", "Iowa"]],
  ["difficult", "sooner", "Sooner State", "Oklahoma", ["Texas", "Kansas", "Arkansas"]],
  ["hard", "sunflower", "Sunflower State", "Kansas", ["Nebraska", "Iowa", "Oklahoma"]],
  ["difficult", "cornhusker", "Cornhusker State", "Nebraska", ["Iowa", "Kansas", "South Dakota"]],
  ["hard", "hawkeye", "Hawkeye State", "Iowa", ["Nebraska", "Illinois", "Minnesota"]],
  ["difficult", "natural", "Natural State", "Arkansas", ["Missouri", "Tennessee", "Oklahoma"]],
  ["hard", "magnolia", "Magnolia State", "Mississippi", ["Alabama", "Louisiana", "Georgia"]],
  ["hard", "pelican", "Pelican State", "Louisiana", ["Florida", "Mississippi", "Texas"]],
  ["difficult", "volunteer", "Volunteer State", "Tennessee", ["Kentucky", "Alabama", "North Carolina"]],
  ["hard", "tar", "Tar Heel State", "North Carolina", ["South Carolina", "Virginia", "Tennessee"]],
  ["difficult", "palmetto", "Palmetto State", "South Carolina", ["Georgia", "North Carolina", "Florida"]],
  ["hard", "old-dominion", "Old Dominion", "Virginia", ["Maryland", "West Virginia", "Delaware"]],
  ["difficult", "granite", "Granite State", "New Hampshire", ["Vermont", "Maine", "Massachusetts"]],
  ["hard", "green-mountain", "Green Mountain State", "Vermont", ["New Hampshire", "Maine", "Colorado"]],
  ["difficult", "ocean", "Ocean State", "Rhode Island", ["Connecticut", "Massachusetts", "Delaware"]],
  ["difficult", "constitution", "Constitution State", "Connecticut", ["Massachusetts", "Delaware", "Pennsylvania"]],
  ["extreme", "first", "First State", "Delaware", ["Pennsylvania", "Maryland", "New Jersey"]],
  ["hard", "silver", "Silver State", "Nevada", ["Colorado", "Arizona", "Montana"]],
  ["hard", "beehive", "Beehive State", "Utah", ["Idaho", "Nevada", "Wyoming"]],
  ["difficult", "enchantment", "Land of Enchantment", "New Mexico", ["Arizona", "Colorado", "Texas"]],
  ["extreme", "treasure", "Treasure State", "Montana", ["Idaho", "Wyoming", "Alaska"]],
  ["extreme", "equality", "Equality State", "Wyoming", ["Colorado", "Montana", "Utah"]],
  ["hard", "gem", "Gem State", "Idaho", ["Montana", "Oregon", "Utah"]],
  ["hard", "north-star", "North Star State", "Minnesota", ["Wisconsin", "Michigan", "North Dakota"]],
  ["hard", "badger", "Badger State", "Wisconsin", ["Minnesota", "Michigan", "Iowa"]],
  ["difficult", "wolverine", "Wolverine State", "Michigan", ["Wisconsin", "Ohio", "Minnesota"]],
  ["extreme", "prairie", "Prairie State", "Illinois", ["Iowa", "Kansas", "Indiana"]],
  ["difficult", "bluegrass", "Bluegrass State", "Kentucky", ["Tennessee", "Virginia", "Indiana"]],
  ["extreme", "mountain", "Mountain State", "West Virginia", ["Virginia", "Kentucky", "Colorado"]],
];
for (const [tier, slug, nickname, state, wrongs] of NICKS) nick(tier, slug, nickname, state, wrongs);

const CUPS = [
  ["hard", "1930", "1930", C("Uruguay", "L'Uruguay", "Uruguay"), [C("Argentina", "L'Argentine", "Argentinien"), C("Brazil", "Le Brésil", "Brasilien"), C("Italy", "L'Italie", "Italien")]],
  ["hard", "1950", "1950", C("Uruguay", "L'Uruguay", "Uruguay"), [C("Brazil", "Le Brésil", "Brasilien"), C("Spain", "L'Espagne", "Spanien"), C("Sweden", "La Suède", "Schweden")]],
  ["difficult", "1954", "1954", C("West Germany", "L'Allemagne de l'Ouest", "Westdeutschland"), [C("Hungary", "La Hongrie", "Ungarn"), C("Austria", "L'Autriche", "Österreich"), C("Uruguay", "L'Uruguay", "Uruguay")]],
  ["hard", "1958", "1958", C("Brazil", "Le Brésil", "Brasilien"), [C("Sweden", "La Suède", "Schweden"), C("France", "La France", "Frankreich"), C("Germany", "L'Allemagne", "Deutschland")]],
  ["easy", "1966", "1966", C("England", "L'Angleterre", "England"), [C("Germany", "L'Allemagne", "Deutschland"), C("Portugal", "Le Portugal", "Portugal"), C("Brazil", "Le Brésil", "Brasilien")]],
  ["easy", "1970", "1970", C("Brazil", "Le Brésil", "Brasilien"), [C("Italy", "L'Italie", "Italien"), C("Germany", "L'Allemagne", "Deutschland"), C("Uruguay", "L'Uruguay", "Uruguay")]],
  ["hard", "1978", "1978", C("Argentina", "L'Argentine", "Argentinien"), [C("Netherlands", "Les Pays-Bas", "die Niederlande"), C("Brazil", "Le Brésil", "Brasilien"), C("Italy", "L'Italie", "Italien")]],
  ["hard", "1982", "1982", C("Italy", "L'Italie", "Italien"), [C("Germany", "L'Allemagne", "Deutschland"), C("Brazil", "Le Brésil", "Brasilien"), C("France", "La France", "Frankreich")]],
  ["easy", "1986", "1986", C("Argentina", "L'Argentine", "Argentinien"), [C("Germany", "L'Allemagne", "Deutschland"), C("France", "La France", "Frankreich"), C("Brazil", "Le Brésil", "Brasilien")]],
  ["easy", "1998", "1998", C("France", "La France", "Frankreich"), [C("Brazil", "Le Brésil", "Brasilien"), C("Croatia", "La Croatie", "Kroatien"), C("Italy", "L'Italie", "Italien")]],
  ["easy", "2002", "2002", C("Brazil", "Le Brésil", "Brasilien"), [C("Germany", "L'Allemagne", "Deutschland"), C("Turkey", "La Turquie", "die Türkei"), C("South Korea", "La Corée du Sud", "Südkorea")]],
  ["easy", "2006", "2006", C("Italy", "L'Italie", "Italien"), [C("France", "La France", "Frankreich"), C("Germany", "L'Allemagne", "Deutschland"), C("Portugal", "Le Portugal", "Portugal")]],
  ["easy", "2010", "2010", C("Spain", "L'Espagne", "Spanien"), [C("Netherlands", "Les Pays-Bas", "die Niederlande"), C("Germany", "L'Allemagne", "Deutschland"), C("Uruguay", "L'Uruguay", "Uruguay")]],
  ["easy", "2014", "2014", C("Germany", "L'Allemagne", "Deutschland"), [C("Argentina", "L'Argentine", "Argentinien"), C("Brazil", "Le Brésil", "Brasilien"), C("Netherlands", "Les Pays-Bas", "die Niederlande")]],
  ["easy", "2018", "2018", C("France", "La France", "Frankreich"), [C("Croatia", "La Croatie", "Kroatien"), C("Belgium", "La Belgique", "Belgien"), C("England", "L'Angleterre", "England")]],
  ["easy", "2022", "2022", C("Argentina", "L'Argentine", "Argentinien"), [C("France", "La France", "Frankreich"), C("Croatia", "La Croatie", "Kroatien"), C("Morocco", "Le Maroc", "Marokko")]],
];
for (const [tier, slug, year, country, wrongs] of CUPS) cup(tier, slug, year, country, wrongs);

const FOODS = [
  ["easy", "sushi", { en: "sushi", qc: "les sushis", de: "Sushi" }, C("Japan", "Le Japon", "Japan"), [C("China", "La Chine", "China"), C("South Korea", "La Corée du Sud", "Südkorea"), C("Thailand", "La Thaïlande", "Thailand")]],
  ["easy", "pizza", { en: "pizza", qc: "la pizza", de: "Pizza" }, C("Italy", "L'Italie", "Italien"), [C("France", "La France", "Frankreich"), C("Greece", "La Grèce", "Griechenland"), C("Spain", "L'Espagne", "Spanien")]],
  ["easy", "poutine", { en: "poutine", qc: "la poutine", de: "Poutine" }, C("Canada", "Le Canada", "Kanada"), [C("France", "La France", "Frankreich"), C("Belgium", "La Belgique", "Belgien"), C("the United States", "Les États-Unis", "die Vereinigten Staaten")]],
  ["easy", "tacos", { en: "tacos", qc: "les tacos", de: "Tacos" }, C("Mexico", "Le Mexique", "Mexiko"), [C("Spain", "L'Espagne", "Spanien"), C("Peru", "Le Pérou", "Peru"), C("Cuba", "Cuba", "Kuba")]],
  ["easy", "pho", { en: "pho", qc: "le pho", de: "Pho" }, C("Vietnam", "Le Vietnam", "Vietnam"), [C("Thailand", "La Thaïlande", "Thailand"), C("China", "La Chine", "China"), C("Cambodia", "Le Cambodge", "Kambodscha")]],
  ["easy", "kimchi", { en: "kimchi", qc: "le kimchi", de: "Kimchi" }, C("South Korea", "La Corée du Sud", "Südkorea"), [C("Japan", "Le Japon", "Japan"), C("China", "La Chine", "China"), C("Vietnam", "Le Vietnam", "Vietnam")]],
  ["easy", "paella", { en: "paella", qc: "la paella", de: "Paella" }, C("Spain", "L'Espagne", "Spanien"), [C("Portugal", "Le Portugal", "Portugal"), C("Italy", "L'Italie", "Italien"), C("Mexico", "Le Mexique", "Mexiko")]],
  ["hard", "pierogi", { en: "pierogi", qc: "les pierogis", de: "Pierogi" }, C("Poland", "La Pologne", "Polen"), [C("Ukraine", "L'Ukraine", "die Ukraine"), C("Germany", "L'Allemagne", "Deutschland"), C("Russia", "La Russie", "Russland")]],
  ["hard", "goulash", { en: "goulash", qc: "le goulash", de: "Gulasch" }, C("Hungary", "La Hongrie", "Ungarn"), [C("Austria", "L'Autriche", "Österreich"), C("Germany", "L'Allemagne", "Deutschland"), C("Czechia", "La Tchéquie", "Tschechien")]],
  ["easy", "fish-chips", { en: "fish and chips", qc: "le fish and chips", de: "Fish and Chips" }, C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), [C("Ireland", "L'Irlande", "Irland"), C("Australia", "L'Australie", "Australien"), C("Canada", "Le Canada", "Kanada")]],
  ["hard", "fondue", { en: "cheese fondue", qc: "la fondue au fromage", de: "Käsefondue" }, C("Switzerland", "La Suisse", "die Schweiz"), [C("France", "La France", "Frankreich"), C("Italy", "L'Italie", "Italien"), C("Austria", "L'Autriche", "Österreich")]],
  ["hard", "feta", { en: "feta cheese", qc: "le fromage feta", de: "Fetakäse" }, C("Greece", "La Grèce", "Griechenland"), [C("Italy", "L'Italie", "Italien"), C("Turkey", "La Turquie", "die Türkei"), C("Bulgaria", "La Bulgarie", "Bulgarien")]],
  ["easy", "maple", { en: "maple syrup", qc: "le sirop d'érable", de: "Ahornsirup" }, C("Canada", "Le Canada", "Kanada"), [C("the United States", "Les États-Unis", "die Vereinigten Staaten"), C("France", "La France", "Frankreich"), C("Sweden", "La Suède", "Schweden")]],
  ["hard", "injera", { en: "injera", qc: "l'injera", de: "Injera" }, C("Ethiopia", "L'Éthiopie", "Äthiopien"), [C("Kenya", "Le Kenya", "Kenia"), C("Morocco", "Le Maroc", "Marokko"), C("Nigeria", "Le Nigeria", "Nigeria")]],
  ["hard", "tagine", { en: "tagine", qc: "le tajine", de: "Tajine" }, C("Morocco", "Le Maroc", "Marokko"), [C("Tunisia", "La Tunisie", "Tunesien"), C("Egypt", "L'Égypte", "Ägypten"), C("Spain", "L'Espagne", "Spanien")]],
  ["easy", "croissant-skip", { en: "dim sum", qc: "les dim sum", de: "Dim Sum" }, C("China", "La Chine", "China"), [C("Japan", "Le Japon", "Japan"), C("Vietnam", "Le Vietnam", "Vietnam"), C("Thailand", "La Thaïlande", "Thailand")]],
  ["hard", "ceviche", { en: "ceviche", qc: "le ceviche", de: "Ceviche" }, C("Peru", "Le Pérou", "Peru"), [C("Mexico", "Le Mexique", "Mexiko"), C("Spain", "L'Espagne", "Spanien"), C("Chile", "Le Chili", "Chile")]],
  ["easy", "pad-thai", { en: "pad Thai", qc: "le pad thaï", de: "Pad Thai" }, C("Thailand", "La Thaïlande", "Thailand"), [C("Vietnam", "Le Vietnam", "Vietnam"), C("Laos", "Le Laos", "Laos"), C("Malaysia", "La Malaisie", "Malaysia")]],
  ["hard", "feijoada", { en: "feijoada", qc: "la feijoada", de: "Feijoada" }, C("Brazil", "Le Brésil", "Brasilien"), [C("Portugal", "Le Portugal", "Portugal"), C("Angola", "L'Angola", "Angola"), C("Mexico", "Le Mexique", "Mexiko")]],
  ["easy", "tourtiere", { en: "tourtière", qc: "la tourtière", de: "Tourtière" }, C("Canada", "Le Canada", "Kanada"), [C("France", "La France", "Frankreich"), C("Belgium", "La Belgique", "Belgien"), C("Switzerland", "La Suisse", "die Schweiz")]],
];
for (const [tier, slug, dish, country, wrongs] of FOODS) food(tier, slug, dish, country, wrongs);

const INVENT = [
  ["easy", "penicillin", { en: "the discovery of penicillin", qc: "la découverte de la pénicilline", de: "die Entdeckung des Penicillins" }, "Alexander Fleming", ["Louis Pasteur", "Marie Curie", "Joseph Lister"]],
  ["easy", "telephone", { en: "patenting the telephone", qc: "le brevet du téléphone", de: "das Patent auf das Telefon" }, "Alexander Graham Bell", ["Thomas Edison", "Nikola Tesla", "Guglielmo Marconi"]],
  ["easy", "relativity", { en: "the theory of special relativity", qc: "la théorie de la relativité restreinte", de: "die spezielle Relativitätstheorie" }, "Albert Einstein", ["Isaac Newton", "Niels Bohr", "Max Planck"]],
  ["hard", "www", { en: "proposing the World Wide Web", qc: "la proposition du World Wide Web", de: "den Vorschlag des World Wide Web" }, "Tim Berners-Lee", ["Vint Cerf", "Steve Jobs", "Bill Gates"]],
  ["hard", "xray", { en: "the discovery of X-rays", qc: "la découverte des rayons X", de: "die Entdeckung der Röntgenstrahlen" }, "Wilhelm Röntgen", ["Henri Becquerel", "Marie Curie", "Ernest Rutherford"]],
  ["hard", "pasteur", { en: "the process called pasteurization", qc: "le procédé appelé pasteurisation", de: "das Verfahren namens Pasteurisierung" }, "Louis Pasteur", ["Robert Koch", "Alexander Fleming", "Edward Jenner"]],
  ["difficult", "photo51", { en: "taking Photo 51, a key image of DNA", qc: "la photo 51, une image clé de l'ADN", de: "Foto 51, ein Schlüsselbild der DNA" }, "Rosalind Franklin", ["Marie Curie", "Barbara McClintock", "Ada Lovelace"]],
  ["hard", "smallpox", { en: "the first smallpox vaccine", qc: "le premier vaccin contre la variole", de: "den ersten Pockenimpfstoff" }, "Edward Jenner", ["Louis Pasteur", "Jonas Salk", "Alexander Fleming"]],
  ["easy", "polio", { en: "the first successful injected polio vaccine", qc: "le premier vaccin injectable efficace contre la polio", de: "den ersten erfolgreichen Polio-Impfstoff zum Spritzen" }, "Jonas Salk", ["Albert Sabin", "Edward Jenner", "Louis Pasteur"]],
  ["hard", "braille", { en: "inventing the braille reading system", qc: "l'invention du système de lecture braille", de: "die Erfindung der Brailleschrift" }, "Louis Braille", ["Helen Keller", "Valentin Haüy", "Samuel Morse"]],
  ["difficult", "lovelace", { en: "writing what is often called the first computer algorithm", qc: "ce qu'on appelle souvent le premier algorithme pour une machine", de: "das, was oft der erste Computer-Algorithmus genannt wird" }, "Ada Lovelace", ["Charles Babbage", "Alan Turing", "Grace Hopper"]],
  ["hard", "periodic", { en: "publishing the first widely used periodic table", qc: "la publication du premier tableau périodique largement utilisé", de: "die Veröffentlichung des ersten weit genutzten Periodensystems" }, "Dmitri Mendeleev", ["Antoine Lavoisier", "John Dalton", "Marie Curie"]],
  ["easy", "gravity-law", { en: "the law of universal gravitation", qc: "la loi de la gravitation universelle", de: "das Gesetz der allgemeinen Gravitation" }, "Isaac Newton", ["Galileo Galilei", "Johannes Kepler", "Albert Einstein"]],
  ["hard", "radioactivity", { en: "coining the study of radioactivity with Pierre Curie", qc: "l'étude de la radioactivité avec Pierre Curie", de: "die Erforschung der Radioaktivität mit Pierre Curie" }, "Marie Curie", ["Lise Meitner", "Irène Joliot-Curie", "Wilhelm Röntgen"]],
  ["difficult", "dynamite", { en: "inventing dynamite", qc: "l'invention de la dynamite", de: "die Erfindung des Dynamits" }, "Alfred Nobel", ["Thomas Edison", "Robert Fulton", "James Watt"]],
];
for (const [tier, slug, thing, person, wrongs] of INVENT) inventor(tier, slug, thing, person, wrongs);

const FORMULAS = [
  ["easy", "water", { en: "water", fr: "de l'eau", de: "Wasser" }, "H2O", ["CO2", "NaCl", "O2"]],
  ["easy", "salt", { en: "table salt", fr: "du sel de table", de: "Kochsalz" }, "NaCl", ["H2O", "KCl", "NaOH"]],
  ["easy", "co2", { en: "carbon dioxide", fr: "du dioxyde de carbone", de: "Kohlenstoffdioxid" }, "CO2", ["CO", "O2", "CH4"]],
  ["hard", "ammonia", { en: "ammonia", fr: "de l'ammoniac", de: "Ammoniak" }, "NH3", ["NO2", "H2O", "CH4"]],
  ["hard", "methane", { en: "methane", fr: "du méthane", de: "Methan" }, "CH4", ["CO2", "C2H6", "NH3"]],
  ["hard", "ozone", { en: "ozone", fr: "de l'ozone", de: "Ozon" }, "O3", ["O2", "CO2", "H2O"]],
  ["difficult", "glucose", { en: "glucose", fr: "du glucose", de: "Glucose" }, "C6H12O6", ["C2H5OH", "CH4", "NaHCO3"]],
  ["hard", "hcl", { en: "hydrogen chloride", fr: "du chlorure d'hydrogène", de: "Chlorwasserstoff" }, "HCl", ["NaCl", "H2SO4", "HF"]],
  ["difficult", "soda", { en: "baking soda", fr: "du bicarbonate de soude", de: "Natron" }, "NaHCO3", ["NaCl", "Na2CO3", "CaCO3"]],
  ["extreme", "quartz", { en: "quartz", fr: "du quartz", de: "Quarz" }, "SiO2", ["CO2", "CaCO3", "Al2O3"]],
];
for (const [tier, slug, name, text, wrongs] of FORMULAS) formula(tier, slug, name, text, wrongs);

const GODS = [
  ["easy", "sea", { en: "the sea", qc: "de la mer", de: "des Meeres" }, "Poseidon", ["Zeus", "Hades", "Apollo"]],
  ["easy", "sky", { en: "the sky", qc: "du ciel", de: "des Himmels" }, "Zeus", ["Poseidon", "Ares", "Hermes"]],
  ["hard", "under", { en: "the underworld", qc: "des enfers", de: "der Unterwelt" }, "Hades", ["Zeus", "Poseidon", "Ares"]],
  ["easy", "wisdom", { en: "wisdom", qc: "de la sagesse", de: "der Weisheit" }, "Athena", ["Aphrodite", "Hera", "Artemis"]],
  ["hard", "hunt", { en: "the hunt", qc: "de la chasse", de: "der Jagd" }, "Artemis", ["Athena", "Apollo", "Demeter"]],
  ["easy", "music-god", { en: "music", qc: "de la musique", de: "der Musik" }, "Apollo", ["Hermes", "Dionysus", "Ares"]],
  ["hard", "war", { en: "war", qc: "de la guerre", de: "des Krieges" }, "Ares", ["Athena", "Zeus", "Hermes"]],
  ["easy", "love", { en: "love", qc: "de l'amour", de: "der Liebe" }, "Aphrodite", ["Hera", "Athena", "Artemis"]],
  ["hard", "messenger", { en: "messengers", qc: "des messagers", de: "der Boten" }, "Hermes", ["Apollo", "Iris", "Ares"]],
  ["difficult", "harvest", { en: "the harvest", qc: "de la moisson", de: "der Ernte" }, "Demeter", ["Hera", "Persephone", "Artemis"]],
  ["difficult", "forge", { en: "the forge", qc: "de la forge", de: "der Schmiede" }, "Hephaestus", ["Ares", "Hermes", "Apollo"]],
  ["hard", "wine", { en: "wine", qc: "du vin", de: "des Weines" }, "Dionysus", ["Apollo", "Hermes", "Poseidon"]],
];
for (const [tier, slug, domain, name, wrongs] of GODS) god(tier, slug, domain, name, wrongs);

const SCHOOL = [
  ["easy", "calf", "What is a baby cow called?", "Comment on appelle un bébé vache?", "Wie heißt ein Kuhbaby?", "A calf", "Un veau", "Ein Kalb", ["A lamb", "Un agneau", "Ein Lamm"], ["A foal", "Un poulain", "Ein Fohlen"], ["A kid", "Un chevreau", "Ein Kitz"]],
  ["easy", "lamb", "What is a baby sheep called?", "Comment on appelle un bébé mouton?", "Wie heißt ein Schafbaby?", "A lamb", "Un agneau", "Ein Lamm", ["A calf", "Un veau", "Ein Kalb"], ["A piglet", "Un porcelet", "Ein Ferkel"], ["A kid", "Un chevreau", "Ein Kitz"]],
  ["easy", "foal", "What is a baby horse called?", "Comment on appelle un bébé cheval?", "Wie heißt ein Pferdebaby?", "A foal", "Un poulain", "Ein Fohlen", ["A calf", "Un veau", "Ein Kalb"], ["A lamb", "Un agneau", "Ein Lamm"], ["A cub", "Un petit", "Ein Junges"]],
  ["easy", "puppy", "What is a baby dog called?", "Comment on appelle un bébé chien?", "Wie heißt ein Hundebaby?", "A puppy", "Un chiot", "Ein Welpe", ["A kitten", "Un chaton", "Ein Kätzchen"], ["A cub", "Un petit", "Ein Junges"], ["A calf", "Un veau", "Ein Kalb"]],
  ["easy", "kitten", "What is a baby cat called?", "Comment on appelle un bébé chat?", "Wie heißt ein Katzenbaby?", "A kitten", "Un chaton", "Ein Kätzchen", ["A puppy", "Un chiot", "Ein Welpe"], ["A cub", "Un petit", "Ein Junges"], ["A chick", "Un poussin", "Ein Küken"]],
  ["easy", "duckling", "What is a baby duck called?", "Comment on appelle un bébé canard?", "Wie heißt ein Entenbaby?", "A duckling", "Un caneton", "Ein Entenküken", ["A chick", "Un poussin", "Ein Küken"], ["A gosling", "Un oison", "Eine Gansjunges"], ["A cygnet", "Un cygneau", "Ein Schwanenküken"]],
  ["easy", "piglet", "What is a baby pig called?", "Comment on appelle un bébé cochon?", "Wie heißt ein Schweinebaby?", "A piglet", "Un porcelet", "Ein Ferkel", ["A calf", "Un veau", "Ein Kalb"], ["A kid", "Un chevreau", "Ein Kitz"], ["A lamb", "Un agneau", "Ein Lamm"]],
  ["hard", "joey", "What is a baby kangaroo called?", "Comment on appelle un bébé kangourou?", "Wie heißt ein Kängurubaby?", "A joey", "Un joey", "Ein Joey", ["A cub", "Un petit", "Ein Junges"], ["A calf", "Un veau", "Ein Kalb"], ["A fawn", "Un faon", "Ein Kitz"]],
  ["hard", "cygnet", "What is a baby swan called?", "Comment on appelle un bébé cygne?", "Wie heißt ein Schwanenbaby?", "A cygnet", "Un cygneau", "Ein Schwanenküken", ["A duckling", "Un caneton", "Ein Entenküken"], ["A gosling", "Un oison", "Eine Gansjunges"], ["A chick", "Un poussin", "Ein Küken"]],
  ["easy", "pride", "What is a group of lions called?", "Comment on appelle un groupe de lions?", "Wie heißt eine Gruppe Löwen?", "A pride", "Une troupe", "Ein Löwenrudel", ["A pack", "Une meute", "Ein Wolfsrudel"], ["A flock", "Un troupeau", "Eine Herde"], ["A school", "Un banc", "Ein Fischschwarm"]],
  ["easy", "pack", "What is a group of wolves called?", "Comment on appelle un groupe de loups?", "Wie heißt eine Gruppe Wölfe?", "A pack", "Une meute", "Ein Rudel", ["A pride", "Une troupe", "Ein Löwenrudel"], ["A herd", "Un troupeau", "Eine Herde"], ["A swarm", "Un essaim", "Ein Schwarm"]],
  ["easy", "school-fish", "What is a group of fish called?", "Comment on appelle un groupe de poissons?", "Wie heißt eine Gruppe Fische?", "A school", "Un banc", "Ein Schwarm", ["A flock", "Une volée", "Ein Vogelschwarm"], ["A herd", "Un troupeau", "Eine Herde"], ["A pack", "Une meute", "Ein Rudel"]],
  ["hard", "gaggle", "What is a group of geese on the ground called?", "Comment on appelle un groupe d'oies au sol?", "Wie heißt eine Gruppe Gänse am Boden?", "A gaggle", "Une bande", "Eine Schar", ["A school", "Un banc", "Ein Schwarm"], ["A pride", "Une troupe", "Ein Rudel"], ["A pack", "Une meute", "Ein Wolfsrudel"]],
  ["easy", "rooster", "What is an adult male chicken called?", "Comment on appelle un poulet mâle adulte?", "Wie heißt ein erwachsenes männliches Huhn?", "A rooster", "Un coq", "Ein Hahn", ["A hen", "Une poule", "Eine Henne"], ["A chick", "Un poussin", "Ein Küken"], ["A drake", "Un malard", "Ein Erpel"]],
  ["easy", "hen", "What is an adult female chicken called?", "Comment on appelle une poule adulte?", "Wie heißt ein erwachsenes weibliches Huhn?", "A hen", "Une poule", "Eine Henne", ["A rooster", "Un coq", "Ein Hahn"], ["A chick", "Un poussin", "Ein Küken"], ["A goose", "Une oie", "Eine Gans"]],
  ["easy", "tadpole", "What does a tadpole become?", "Un têtard devient quoi?", "Was wird aus einer Kaulquappe?", "A frog", "Une grenouille", "Ein Frosch", ["A fish", "Un poisson", "Ein Fisch"], ["A snake", "Un serpent", "Eine Schlange"], ["A turtle", "Une tortue", "Eine Schildkröte"]],
  ["easy", "caterpillar", "What does a caterpillar become?", "Une chenille devient quoi?", "Was wird aus einer Raupe?", "A butterfly", "Un papillon", "Ein Schmetterling", ["A moth only", "Seulement un papillon de nuit", "Nur eine Motte"], ["A beetle", "Un scarabée", "Ein Käfer"], ["A bee", "Une abeille", "Eine Biene"]],
  ["easy", "ice", "What is solid water called?", "Comment on appelle l'eau solide?", "Wie heißt festes Wasser?", "Ice", "La glace", "Eis", ["Steam", "La vapeur", "Dampf"], ["Dew", "La rosée", "Tau"], ["Fog", "Le brouillard", "Nebel"]],
  ["easy", "steam", "What is water vapor often called when it rises from a kettle?", "Comment on appelle souvent la vapeur d'eau qui sort d'une bouilloire?", "Wie nennt man Wasserdampf oft, wenn er aus einem Kessel steigt?", "Steam", "La vapeur", "Dampf", ["Ice", "La glace", "Eis"], ["Snow", "La neige", "Schnee"], ["Hail", "La grêle", "Hagel"]],
  ["easy", "orbits-sun", "What does Earth orbit?", "La Terre tourne autour de quoi?", "Was umkreist die Erde?", "The Sun", "Le Soleil", "Die Sonne", ["The Moon", "La Lune", "Den Mond"], ["Mars", "Mars", "Mars"], ["Jupiter", "Jupiter", "Jupiter"]],
  ["easy", "moon-orbits", "What does the Moon orbit?", "La Lune tourne autour de quoi?", "Was umkreist der Mond?", "Earth", "La Terre", "Die Erde", ["The Sun only", "Seulement le Soleil", "Nur die Sonne"], ["Mars", "Mars", "Mars"], ["Venus", "Vénus", "Die Venus"]],
  ["easy", "equator", "What is the name of the line around the middle of Earth?", "Comment on appelle la ligne autour du milieu de la Terre?", "Wie heißt die Linie um die Mitte der Erde?", "The equator", "L'équateur", "Der Äquator", ["The prime meridian", "Le méridien de Greenwich", "Der Nullmeridian"], ["The tropic", "Le tropique", "Der Wendekreis"], ["The pole", "Le pôle", "Der Pol"]],
  ["easy", "island", "What is land with water all around it called?", "Comment on appelle une terre entourée d'eau de tous les côtés?", "Wie heißt Land, das rundum von Wasser umgeben ist?", "An island", "Une île", "Eine Insel", ["A peninsula", "Une presqu'île", "Eine Halbinsel"], ["A delta", "Un delta", "Ein Delta"], ["A cape", "Un cap", "Ein Kap"]],
  ["hard", "peninsula", "What is land with water on most sides, but not all, called?", "Comment on appelle une terre entourée d'eau sur presque tous les côtés?", "Wie heißt Land, das fast überall, aber nicht ganz, von Wasser umgeben ist?", "A peninsula", "Une presqu'île", "Eine Halbinsel", ["An island", "Une île", "Eine Insel"], ["An isthmus", "Un isthme", "Eine Landenge"], ["A strait", "Un détroit", "Eine Meerenge"]],
  ["easy", "february", "Which month usually has 28 days?", "C'est quel mois qui a d'habitude 28 jours?", "Welcher Monat hat gewöhnlich 28 Tage?", "February", "Février", "Februar", ["April", "Avril", "April"], ["June", "Juin", "Juni"], ["November", "Novembre", "November"]],
  ["easy", "canada-day", "In which month is Canada Day?", "Le jour du Canada est dans quel mois?", "In welchem Monat ist der Canada Day?", "July", "Juillet", "Juli", ["June", "Juin", "Juni"], ["August", "Août", "August"], ["May", "Mai", "Mai"]],
  ["easy", "jean-baptiste", "In which month is Quebec's Saint-Jean-Baptiste Day?", "La Saint-Jean-Baptiste, au Québec, est dans quel mois?", "In welchem Monat ist in Quebec der Saint-Jean-Baptiste-Tag?", "June", "Juin", "Juni", ["July", "Juillet", "Juli"], ["May", "Mai", "Mai"], ["August", "Août", "August"]],
  ["easy", "halloween", "In which month is Halloween?", "L'Halloween est dans quel mois?", "In welchem Monat ist Halloween?", "October", "Octobre", "Oktober", ["September", "Septembre", "September"], ["November", "Novembre", "November"], ["December", "Décembre", "Dezember"]],
  ["easy", "thanks-ca", "In which month is Thanksgiving Day in Canada?", "L'Action de grâce au Canada est dans quel mois?", "In welchem Monat ist Thanksgiving in Kanada?", "October", "Octobre", "Oktober", ["November", "Novembre", "November"], ["September", "Septembre", "September"], ["December", "Décembre", "Dezember"]],
  ["easy", "wednesday", "Which day comes after Tuesday?", "C'est quel jour qui vient après mardi?", "Welcher Tag kommt nach Dienstag?", "Wednesday", "Mercredi", "Mittwoch", ["Thursday", "Jeudi", "Donnerstag"], ["Monday", "Lundi", "Montag"], ["Friday", "Vendredi", "Freitag"]],
  ["easy", "freezing", "At what temperature, in Celsius, does water freeze?", "À quelle température, en Celsius, l'eau gèle?", "Bei welcher Temperatur in Celsius gefriert Wasser?", "0", "0", "0", ["32", "32", "32"], ["100", "100", "100"], ["-10", "-10", "-10"]],
  ["easy", "boiling", "At what temperature, in Celsius, does water boil at sea level?", "À quelle température, en Celsius, l'eau bout au niveau de la mer?", "Bei welcher Temperatur in Celsius kocht Wasser auf Meereshöhe?", "100", "100", "100", ["90", "90", "90"], ["212", "212", "212"], ["0", "0", "0"]],
  ["hard", "body-temp", "About what temperature, in Celsius, is a healthy human body?", "C'est autour de quelle température, en Celsius, un corps humain en santé?", "Wie viel Grad Celsius hat ungefähr ein gesunder menschlicher Körper?", "37", "37", "37", ["35", "35", "35"], ["40", "40", "40"], ["32", "32", "32"]],
  ["easy", "primary", "In art class, which set is the three traditional primary colours?", "En arts plastiques, c'est quel trio de couleurs primaires traditionnelles?", "Welche drei Farben sind im Kunstunterricht die klassischen Grundfarben?", "Red, yellow, and blue", "Rouge, jaune et bleu", "Rot, Gelb und Blau", ["Red, green, and blue", "Rouge, vert et bleu", "Rot, Grün und Blau"], ["Orange, green, and purple", "Orange, vert et violet", "Orange, Grün und Violett"], ["Black, white, and grey", "Noir, blanc et gris", "Schwarz, Weiß und Grau"]],
  ["easy", "seasons", "How many seasons does a temperate year usually have?", "Une année tempérée a d'habitude combien de saisons?", "Wie viele Jahreszeiten hat ein gemäßigtes Jahr gewöhnlich?", "4", "4", "4", ["3", "3", "3"], ["2", "2", "2"], ["12", "12", "12"]],
  ["easy", "weekdays", "How many days are in one week?", "Il y a combien de jours dans une semaine?", "Wie viele Tage hat eine Woche?", "7", "7", "7", ["5", "5", "5"], ["10", "10", "10"], ["12", "12", "12"]],
  ["easy", "months-year", "How many months are in one year?", "Il y a combien de mois dans une année?", "Wie viele Monate hat ein Jahr?", "12", "12", "12", ["10", "10", "10"], ["52", "52", "52"], ["7", "7", "7"]],
  ["easy", "hours-day", "How many hours are in one day?", "Il y a combien d'heures dans une journée?", "Wie viele Stunden hat ein Tag?", "24", "24", "24", ["12", "12", "12"], ["60", "60", "60"], ["48", "48", "48"]],
  ["easy", "minutes", "How many minutes are in one hour?", "Il y a combien de minutes dans une heure?", "Wie viele Minuten hat eine Stunde?", "60", "60", "60", ["24", "24", "24"], ["100", "100", "100"], ["30", "30", "30"]],
  ["hard", "leap", "How many days are in a leap year?", "Il y a combien de jours dans une année bissextile?", "Wie viele Tage hat ein Schaltjahr?", "366", "366", "366", ["365", "365", "365"], ["364", "364", "364"], ["360", "360", "360"]],
];

for (const [tier, slug, en, qc, de, a, aq, ad, b, c, d] of SCHOOL) {
  add(q(tier, "culture", `kid-${slug}`, { en, qc, de }, trio(a, aq, ad), [trio(b[0], b[1], b[2]), trio(c[0], c[1], c[2]), trio(d[0], d[1], d[2])], T.who, H.straight));
}

const EXTRA_CAPS = [
  ["easy", "ottawa", "Canada", "du Canada", "Kanada", "Ottawa", ["Toronto", "Montreal", "Vancouver"]],
  ["easy", "washington", "the United States", "des États-Unis", "den Vereinigten Staaten", "Washington, D.C.", ["New York", "Chicago", "Los Angeles"]],
  ["easy", "canberra", "Australia", "de l'Australie", "Australien", "Canberra", ["Sydney", "Melbourne", "Brisbane"]],
  ["hard", "andorra", "Andorra", "d'Andorre", "Andorra", "Andorra la Vella", ["Escaldes", "La Massana", "Encamp"]],
  ["extreme", "vaduz", "Liechtenstein", "du Liechtenstein", "Liechtenstein", "Vaduz", ["Schaan", "Balzers", "Triesen"]],
  ["hard", "monaco", "Monaco", "de Monaco", "Monaco", "Monaco", ["Nice", "Menton", "Cannes"]],
  ["difficult", "san-marino", "San Marino", "de Saint-Marin", "San Marino", "San Marino", ["Rimini", "Serravalle", "Borgo Maggiore"]],
  ["hard", "vatican", "Vatican City", "de la Cité du Vatican", "der Vatikanstadt", "Vatican City", ["Rome", "Assisi", "Naples"]],
  ["hard", "barbados", "Barbados", "de la Barbade", "Barbados", "Bridgetown", ["Speightstown", "Oistins", "Holetown"]],
  ["hard", "bahamas", "the Bahamas", "des Bahamas", "den Bahamas", "Nassau", ["Freeport", "Marsh Harbour", "George Town"]],
  ["difficult", "belize", "Belize", "du Belize", "Belize", "Belmopan", ["Belize City", "San Ignacio", "Orange Walk"]],
  ["difficult", "sri", "Sri Lanka", "du Sri Lanka", "Sri Lanka", "Sri Jayawardenepura Kotte", ["Colombo", "Kandy", "Galle"]],
  ["extreme", "timor", "Timor-Leste", "du Timor oriental", "Osttimor", "Dili", ["Baucau", "Maliana", "Suai"]],
  ["difficult", "benin", "Benin", "du Bénin", "Benin", "Porto-Novo", ["Cotonou", "Parakou", "Abomey"]],
  ["extreme", "lesotho", "Lesotho", "du Lesotho", "Lesotho", "Maseru", ["Teyateyaneng", "Mafeteng", "Hlotse"]],
  ["difficult", "liberia", "Liberia", "du Libéria", "Liberia", "Monrovia", ["Gbarnga", "Buchanan", "Kakata"]],
  ["extreme", "malawi", "Malawi", "du Malawi", "Malawi", "Lilongwe", ["Blantyre", "Mzuzu", "Zomba"]],
  ["extreme", "maldives", "the Maldives", "des Maldives", "den Malediven", "Malé", ["Addu", "Fuvahmulah", "Kulhudhuffushi"]],
  ["difficult", "mauritania", "Mauritania", "de la Mauritanie", "Mauretanien", "Nouakchott", ["Nouadhibou", "Rosso", "Kaédi"]],
  ["difficult", "mauritius", "Mauritius", "de Maurice", "Mauritius", "Port Louis", ["Curepipe", "Vacoas", "Mahébourg"]],
  ["extreme", "nauru", "Nauru", "de Nauru", "Nauru", "Yaren", ["Aiwo", "Denigomodu", "Meneng"]],
  ["difficult", "sierra", "Sierra Leone", "de la Sierra Leone", "Sierra Leone", "Freetown", ["Bo", "Kenema", "Makeni"]],
  ["hard", "somalia", "Somalia", "de la Somalie", "Somalia", "Mogadishu", ["Hargeisa", "Kismayo", "Berbera"]],
  ["difficult", "south-sudan", "South Sudan", "du Soudan du Sud", "Südsudan", "Juba", ["Wau", "Malakal", "Bor"]],
  ["hard", "syria", "Syria", "de la Syrie", "Syrien", "Damascus", ["Aleppo", "Homs", "Latakia"]],
  ["extreme", "togo", "Togo", "du Togo", "Togo", "Lomé", ["Sokodé", "Kara", "Atakpamé"]],
  ["extreme", "tonga", "Tonga", "des Tonga", "Tonga", "Nukuʻalofa", ["Neiafu", "Pangai", "Haveluloto"]],
  ["hard", "trinidad", "Trinidad and Tobago", "de Trinité-et-Tobago", "Trinidad und Tobago", "Port of Spain", ["San Fernando", "Chaguanas", "Scarborough"]],
  ["difficult", "turkmen", "Turkmenistan", "du Turkménistan", "Turkmenistan", "Ashgabat", ["Türkmenabat", "Daşoguz", "Mary"]],
  ["extreme", "vanuatu", "Vanuatu", "du Vanuatu", "Vanuatu", "Port Vila", ["Luganville", "Norsup", "Isangel"]],
  ["hard", "yemen", "Yemen", "du Yémen", "Jemen", "Sana'a", ["Aden", "Taiz", "Hodeidah"]],
  ["difficult", "djibouti", "Djibouti", "de Djibouti", "Dschibuti", "Djibouti", ["Ali Sabieh", "Tadjoura", "Obock"]],
  ["extreme", "gambia", "The Gambia", "de la Gambie", "Gambia", "Banjul", ["Serekunda", "Brikama", "Bakau"]],
  ["difficult", "gabon", "Gabon", "du Gabon", "Gabun", "Libreville", ["Port-Gentil", "Franceville", "Oyem"]],
  ["extreme", "comoros", "the Comoros", "des Comores", "den Komoren", "Moroni", ["Mutsamudu", "Fomboni", "Domoni"]],
  ["hard", "drc", "the Democratic Republic of the Congo", "de la République démocratique du Congo", "der Demokratischen Republik Kongo", "Kinshasa", ["Lubumbashi", "Goma", "Kisangani"]],
  ["difficult", "congo", "the Republic of the Congo", "de la République du Congo", "der Republik Kongo", "Brazzaville", ["Pointe-Noire", "Dolisie", "Nkayi"]],
  ["extreme", "car", "the Central African Republic", "de la République centrafricaine", "der Zentralafrikanischen Republik", "Bangui", ["Bimbo", "Berbérati", "Bambari"]],
  ["difficult", "chad", "Chad", "du Tchad", "Tschad", "N'Djamena", ["Moundou", "Sarh", "Abéché"]],
  ["extreme", "burundi", "Burundi", "du Burundi", "Burundi", "Gitega", ["Bujumbura", "Ngozi", "Rumonge"]],
];
for (const [tier, slug, en, fr, de, city, wrongs] of EXTRA_CAPS) {
  add(q(tier, "geography", `cap3-${slug}`, {
    en: `What is the capital of ${en}?`,
    qc: `C'est quoi la capitale ${fr}?`,
    de: `Was ist die Hauptstadt von ${de}?`,
  }, city, wrongs, T.geo, H.place));
}

export function moreSet3Facts() {
  return rows;
}
