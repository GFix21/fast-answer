/**
 * Closes the week: the slots still open after capitals, counts, and names.
 */
import { q } from "./fill-lib.js";

const HINT = {
  en: "The plain answer is the one that scores.",
  fr: "La réponse simple est celle qui compte.",
  qc: "La réponse simple, c'est celle qui compte.",
  de: "Die schlichte Antwort ist die gezählte.",
};
const TITLE = {
  en: "Fast fact",
  fr: "Fait net",
  qc: "Fait clair",
  de: "Klare Tatsache",
};

function row(tier, topic, slug, prompts, choices) {
  return q(null, tier, topic, slug, TITLE, prompts, choices, HINT);
}

/** "de le Japon" is not French. Contract the article that follows "de". */
function dePhrase(fr) {
  if (fr.startsWith("le ")) return `du ${fr.slice(3)}`;
  if (fr.startsWith("les ")) return `des ${fr.slice(4)}`;
  if (fr.startsWith("la ") || fr.startsWith("l'")) return `de ${fr}`;
  if (/^[AEIOUÉÈÊÂÎÔÛÀaeiouéèêâîôûà]/.test(fr)) return `d'${fr}`;
  return `de ${fr}`;
}

const continents = [
  ["Egypt", "l'Égypte", "Ägypten", "Africa", "Afrique", "Afrika"],
  ["Nigeria", "le Nigeria", "Nigeria", "Africa", "Afrique", "Afrika"],
  ["Kenya", "le Kenya", "Kenia", "Africa", "Afrique", "Afrika"],
  ["Morocco", "le Maroc", "Marokko", "Africa", "Afrique", "Afrika"],
  ["Ghana", "le Ghana", "Ghana", "Africa", "Afrique", "Afrika"],
  ["Ethiopia", "l'Éthiopie", "Äthiopien", "Africa", "Afrique", "Afrika"],
  ["Pretoria", "Pretoria", "Pretoria", "Africa", "Afrique", "Afrika"],
  ["China", "la Chine", "China", "Asia", "Asie", "Asien"],
  ["India", "l'Inde", "Indien", "Asia", "Asie", "Asien"],
  ["Japan", "le Japon", "Japan", "Asia", "Asie", "Asien"],
  ["Thailand", "la Thaïlande", "Thailand", "Asia", "Asie", "Asien"],
  ["Vietnam", "le Vietnam", "Vietnam", "Asia", "Asie", "Asien"],
  ["Saudi Arabia", "l'Arabie saoudite", "Saudi-Arabien", "Asia", "Asie", "Asien"],
  ["Iran", "l'Iran", "Iran", "Asia", "Asie", "Asien"],
  ["Italy", "l'Italie", "Italien", "Europe", "Europe", "Europa"],
  ["Germany", "l'Allemagne", "Deutschland", "Europe", "Europe", "Europa"],
  ["Spain", "l'Espagne", "Spanien", "Europe", "Europe", "Europa"],
  ["Poland", "la Pologne", "Polen", "Europe", "Europe", "Europa"],
  ["Sweden", "la Suède", "Schweden", "Europe", "Europe", "Europa"],
  ["Greece", "la Grèce", "Griechenland", "Europe", "Europe", "Europa"],
  ["Portugal", "le Portugal", "Portugal", "Europe", "Europe", "Europa"],
  ["Mexico", "le Mexique", "Mexiko", "North America", "Amérique du Nord", "Nordamerika"],
  ["Canada", "le Canada", "Kanada", "North America", "Amérique du Nord", "Nordamerika"],
  ["Cuba", "Cuba", "Kuba", "North America", "Amérique du Nord", "Nordamerika"],
  ["Jamaica", "la Jamaïque", "Jamaika", "North America", "Amérique du Nord", "Nordamerika"],
  ["Brazil", "le Brésil", "Brasilien", "South America", "Amérique du Sud", "Südamerika"],
  ["Argentina", "l'Argentine", "Argentinien", "South America", "Amérique du Sud", "Südamerika"],
  ["Chile", "le Chili", "Chile", "South America", "Amérique du Sud", "Südamerika"],
  ["Peru", "le Pérou", "Peru", "South America", "Amérique du Sud", "Südamerika"],
  ["Colombia", "la Colombie", "Kolumbien", "South America", "Amérique du Sud", "Südamerika"],
  ["Australia", "l'Australie", "Australien", "Oceania", "Océanie", "Ozeanien"],
  ["New Zealand", "la Nouvelle-Zélande", "Neuseeland", "Oceania", "Océanie", "Ozeanien"],
  ["Fiji", "les Fidji", "Fidschi", "Oceania", "Océanie", "Ozeanien"],
  ["Iceland", "l'Islande", "Island", "Europe", "Europe", "Europa"],
  ["Madagascar", "Madagascar", "Madagaskar", "Africa", "Afrique", "Afrika"],
  ["Indonesia", "l'Indonésie", "Indonesien", "Asia", "Asie", "Asien"],
  ["Turkey", "la Turquie", "die Türkei", "Asia", "Asie", "Asien"],
  ["Norway", "la Norvège", "Norwegen", "Europe", "Europe", "Europa"],
  ["Finland", "la Finlande", "Finnland", "Europe", "Europe", "Europa"],
  ["Philippines", "les Philippines", "die Philippinen", "Asia", "Asie", "Asien"],
];

const WRONG_CONTINENT = {
  Africa: ["Europe", "Asia", "South America"],
  Asia: ["Europe", "Africa", "North America"],
  Europe: ["Asia", "Africa", "South America"],
  "North America": ["South America", "Europe", "Africa"],
  "South America": ["North America", "Africa", "Europe"],
  Oceania: ["Asia", "Africa", "Europe"],
};
const FR_CONTINENT = {
  Africa: "Afrique",
  Asia: "Asie",
  Europe: "Europe",
  "North America": "Amérique du Nord",
  "South America": "Amérique du Sud",
  Oceania: "Océanie",
};
const DE_CONTINENT = {
  Africa: "Afrika",
  Asia: "Asien",
  Europe: "Europa",
  "North America": "Nordamerika",
  "South America": "Südamerika",
  Oceania: "Ozeanien",
};

const currencies = [
  ["Japan", "le Japon", "Japan", "the yen", "le yen", "der Yen"],
  ["the United Kingdom", "le Royaume-Uni", "dem Vereinigten Königreich", "the pound sterling", "la livre sterling", "das Pfund Sterling"],
  ["the United States", "les États-Unis", "den Vereinigten Staaten", "the dollar", "le dollar", "der Dollar"],
  ["China", "la Chine", "China", "the yuan", "le yuan", "der Yuan"],
  ["India", "l'Inde", "Indien", "the rupee", "la roupie", "die Rupie"],
  ["Mexico", "le Mexique", "Mexiko", "the peso", "le peso", "der Peso"],
  ["Brazil", "le Brésil", "Brasilien", "the real", "le real", "der Real"],
  ["South Korea", "la Corée du Sud", "Südkorea", "the won", "le won", "der Won"],
  ["Sweden", "la Suède", "Schweden", "the krona", "la couronne", "die Krone"],
  ["Norway", "la Norvège", "Norwegen", "the krone", "la couronne", "die Krone"],
  ["Denmark", "le Danemark", "Dänemark", "the krone", "la couronne", "die Krone"],
  ["Switzerland", "la Suisse", "der Schweiz", "the franc", "le franc", "der Franken"],
  ["Canada", "le Canada", "Kanada", "the dollar", "le dollar", "der Dollar"],
  ["Australia", "l'Australie", "Australien", "the dollar", "le dollar", "der Dollar"],
  ["Russia", "la Russie", "Russland", "the ruble", "le rouble", "der Rubel"],
  ["Poland", "la Pologne", "Polen", "the zloty", "le zloty", "der Zloty"],
  ["Thailand", "la Thaïlande", "Thailand", "the baht", "le baht", "der Baht"],
  ["Indonesia", "l'Indonésie", "Indonesien", "the rupiah", "la roupie", "die Rupiah"],
  ["South Africa", "l'Afrique du Sud", "Südafrika", "the rand", "le rand", "der Rand"],
  ["Nigeria", "le Nigeria", "Nigeria", "the naira", "le naira", "der Naira"],
  ["Egypt", "l'Égypte", "Ägypten", "the pound", "la livre", "das Pfund"],
  ["Israel", "Israël", "Israel", "the shekel", "le shekel", "der Schekel"],
  ["Saudi Arabia", "l'Arabie saoudite", "Saudi-Arabien", "the riyal", "le riyal", "der Riyal"],
  ["Argentina", "l'Argentine", "Argentinien", "the peso", "le peso", "der Peso"],
  ["Kenya", "le Kenya", "Kenia", "the shilling", "le shilling", "der Schilling"],
  ["Turkey", "la Turquie", "der Türkei", "the lira", "la livre", "die Lira"],
  ["Vietnam", "le Vietnam", "Vietnam", "the dong", "le dong", "der Dong"],
  ["Czechia", "la Tchéquie", "Tschechien", "the koruna", "la couronne", "die Krone"],
  ["Hungary", "la Hongrie", "Ungarn", "the forint", "le forint", "der Forint"],
  ["Morocco", "le Maroc", "Marokko", "the dirham", "le dirham", "der Dirham"],
];

const foods = [
  ["pizza", "pizza", "Pizza", "Italy", "Italie", "Italien"],
  ["sushi", "les sushis", "Sushi", "Japan", "Japon", "Japan"],
  ["tacos", "les tacos", "Tacos", "Mexico", "Mexique", "Mexiko"],
  ["croissants", "les croissants", "Croissants", "France", "France", "Frankreich"],
  ["paella", "la paella", "Paella", "Spain", "Espagne", "Spanien"],
  ["pho", "le pho", "Pho", "Vietnam", "Vietnam", "Vietnam"],
  ["pad thai", "le pad thaï", "Pad Thai", "Thailand", "Thaïlande", "Thailand"],
  ["kimchi", "le kimchi", "Kimchi", "South Korea", "Corée du Sud", "Südkorea"],
  ["maple syrup", "le sirop d'érable", "Ahornsirup", "Canada", "Canada", "Kanada"],
  ["pretzels", "les bretzels", "Brezeln", "Germany", "Allemagne", "Deutschland"],
  ["fish and chips", "le fish and chips", "Fish and Chips", "the United Kingdom", "Royaume-Uni", "Vereinigtes Königreich"],
  ["poutine", "la poutine", "Poutine", "Canada", "Canada", "Kanada"],
  ["dim sum", "les dim sum", "Dim Sum", "China", "Chine", "China"],
  ["goulash", "le goulash", "Gulasch", "Hungary", "Hongrie", "Ungarn"],
  ["borscht", "le bortsch", "Borschtsch", "Ukraine", "Ukraine", "Ukraine"],
  ["haggis", "le haggis", "Haggis", "Scotland", "Écosse", "Schottland"],
  ["jerk chicken", "le poulet jerk", "Jerk-Hähnchen", "Jamaica", "Jamaïque", "Jamaika"],
  ["ceviche", "le ceviche", "Ceviche", "Peru", "Pérou", "Peru"],
  ["ramen", "les ramen", "Ramen", "Japan", "Japon", "Japan"],
  ["gelato", "le gelato", "Gelato", "Italy", "Italie", "Italien"],
  ["churros", "les churros", "Churros", "Spain", "Espagne", "Spanien"],
  ["tiramisu", "le tiramisu", "Tiramisu", "Italy", "Italie", "Italien"],
  ["moussaka", "la moussaka", "Moussaka", "Greece", "Grèce", "Griechenland"],
  ["Wiener schnitzel", "l'escalope viennoise", "Wiener Schnitzel", "Austria", "Autriche", "Österreich"],
  ["cheese fondue", "la fondue au fromage", "Käsefondue", "Switzerland", "Suisse", "Schweiz"],
  ["pierogi", "les pierogi", "Pierogi", "Poland", "Pologne", "Polen"],
  ["gyoza", "les gyoza", "Gyoza", "Japan", "Japon", "Japan"],
  ["injera", "l'injera", "Injera", "Ethiopia", "Éthiopie", "Äthiopien"],
  ["feijoada", "la feijoada", "Feijoada", "Brazil", "Brésil", "Brasilien"],
  ["baklava", "le baklava", "Baklava", "Turkey", "Turquie", "Türkei"],
];

const animals = [
  ["fastest land animal", "l'animal terrestre le plus rapide", "das schnellste Landtier", "the cheetah", "le guépard", "der Gepard", ["the lion", "the horse", "the gazelle"]],
  ["largest bird", "le plus grand oiseau", "der größte Vogel", "the ostrich", "l'autruche", "der Strauß", ["the eagle", "the penguin", "the swan"]],
  ["largest animal", "le plus grand animal", "das größte Tier", "the blue whale", "la baleine bleue", "der Blauwal", ["the elephant", "the giraffe", "the great white shark"]],
  ["tallest land animal", "l'animal terrestre le plus grand", "das höchste Landtier", "the giraffe", "la girafe", "die Giraffe", ["the elephant", "the ostrich", "the camel"]],
  ["mammal that truly flies", "le mammifère qui vole vraiment", "das Säugetier, das wirklich fliegt", "the bat", "la chauve-souris", "die Fledermaus", ["the flying squirrel", "the owl", "the penguin"]],
  ["Australian hopper", "le sauteur australien", "der australische Hüpfer", "the kangaroo", "le kangourou", "das Känguru", ["the koala", "the wombat", "the emu"]],
  ["black-and-white Asian bear", "l'ours noir et blanc d'Asie", "der schwarz-weiße asiatische Bär", "the giant panda", "le panda géant", "der Große Panda", ["the polar bear", "the zebra", "the skunk"]],
  ["animal famous for changing colour", "l'animal connu pour changer de couleur", "das Tier, das für den Farbwechsel bekannt ist", "the chameleon", "le caméléon", "das Chamäleon", ["the octopus", "the frog", "the parrot"]],
  ["largest wild cat", "le plus grand félin sauvage", "die größte Wildkatze", "the tiger", "le tigre", "der Tiger", ["the lion", "the jaguar", "the leopard"]],
  ["one-humped camel", "le chameau à une bosse", "das einhöckrige Kamel", "the dromedary", "le dromadaire", "das Dromedar", ["the Bactrian camel", "the llama", "the horse"]],
  ["two-humped camel", "le chameau à deux bosses", "das zweihöckrige Kamel", "the Bactrian camel", "le chameau de Bactriane", "das Trampeltier", ["the dromedary", "the llama", "the alpaca"]],
  ["insect that makes honey", "l'insecte qui fait le miel", "das Insekt, das Honig macht", "the honeybee", "l'abeille", "die Honigbiene", ["the wasp", "the butterfly", "the ant"]],
  ["bird used as a sign of peace", "l'oiseau signe de paix", "der Vogel als Friedenszeichen", "the dove", "la colombe", "die Taube", ["the eagle", "the crow", "the owl"]],
  ["animal with a trunk", "l'animal à trompe", "das Tier mit einem Rüssel", "the elephant", "l'éléphant", "der Elefant", ["the rhinoceros", "the hippopotamus", "the walrus"]],
  ["striped horse-like animal", "l'animal rayé proche du cheval", "das gestreifte pferdeartige Tier", "the zebra", "le zèbre", "das Zebra", ["the horse", "the donkey", "the okapi"]],
  ["bird that swims and does not fly", "l'oiseau qui nage et ne vole pas", "der Vogel, der schwimmt und nicht fliegt", "the penguin", "le manchot", "der Pinguin", ["the seagull", "the duck", "the swan"]],
  ["reptile with a shell", "le reptile à carapace", "das Reptil mit einem Panzer", "the turtle", "la tortue", "die Schildkröte", ["the crocodile", "the lizard", "the snake"]],
  ["animal that builds dams", "l'animal qui construit des barrages", "das Tier, das Dämme baut", "the beaver", "le castor", "der Biber", ["the otter", "the muskrat", "the platypus"]],
  ["primate closest to humans in common lessons", "le primate le plus proche dans les leçons courantes", "der Primat, der in der Schule dem Menschen am nächsten steht", "the chimpanzee", "le chimpanzé", "der Schimpanse", ["the gorilla", "the orangutan", "the lemur"]],
  ["nocturnal bird of proverb", "l'oiseau nocturne du proverbe", "der nächtliche Vogel des Sprichworts", "the owl", "le hibou", "die Eule", ["the bat", "the crow", "the robin"]],
  ["animal with a pouch, besides the kangaroo", "l'animal à poche, à part le kangourou", "das Beuteltier neben dem Känguru", "the koala", "le koala", "der Koala", ["the panda", "the sloth", "the wombat is also one, and the scored answer here is the koala"]],
];

const animalsClean = animals.filter((row) => row[0] !== "animal with a pouch, besides the kangaroo");
animalsClean.push(["small Australian eucalyptus animal", "le petit animal australien de l'eucalyptus", "das kleine australische Eukalyptustier", "the koala", "le koala", "der Koala", ["the panda", "the sloth", "the wombat"]]);
animalsClean.push(["spiny anteater of Australia", "le fourmilier épineux d'Australie", "der australische Ameisenigel", "the echidna", "l'échidné", "der Ameisenigel", ["the platypus", "the hedgehog", "the porcupine"]]);
animalsClean.push(["egg-laying mammal with a bill", "le mammifère à bec qui pond des œufs", "das eierlegende Säugetier mit einem Schnabel", "the platypus", "l'ornithorynque", "das Schnabeltier", ["the echidna", "the duck", "the beaver"]]);
animalsClean.push(["largest fish", "le plus grand poisson", "der größte Fisch", "the whale shark", "le requin-baleine", "der Walhai", ["the great white shark", "the blue whale", "the manta ray"]]);
animalsClean.push(["a baby kangaroo", "le nom des petits du kangourou", "der Name der Känguru-Jungen", "joeys", "des joeys", "Joeys", ["cubs", "calves", "pups"]]);

const easyExtra = [
  ["seasons-four", "How many seasons do temperate regions usually name?", "Combien de saisons les régions tempérées nomment-elles d'habitude ?", "Les régions tempérées nomment d'habitude combien de saisons ?", "Wie viele Jahreszeiten nennen gemäßigte Regionen gewöhnlich?", ["4", "3", "2", "5"]],
  ["primary-colors", "How many primary colours are in the classic pigment set of red, yellow, and blue?", "Combien de couleurs primaires compte l'ensemble classique rouge, jaune et bleu ?", "L'ensemble classique rouge, jaune et bleu compte combien de couleurs primaires ?", "Wie viele Grundfarben hat der klassische Satz Rot, Gelb und Blau?", ["3", "2", "4", "7"]],
  ["compass-points", "How many main points does a simple compass rose name: north, south, east, and west?", "Combien de points principaux une rose des vents simple nomme-t-elle : nord, sud, est et ouest ?", "Une rose des vents simple nomme combien de points principaux : nord, sud, est et ouest ?", "Wie viele Hauptpunkte nennt eine einfache Windrose: Norden, Süden, Osten und Westen?", ["4", "8", "2", "6"]],
  ["human-lungs", "How many lungs does a typical human have?", "Combien de poumons a un humain typique ?", "Un humain typique a combien de poumons ?", "Wie viele Lungen hat ein typischer Mensch?", ["2", "1", "3", "4"]],
  ["human-kidneys", "How many kidneys does a typical human have?", "Combien de reins a un humain typique ?", "Un humain typique a combien de reins ?", "Wie viele Nieren hat ein typischer Mensch?", ["2", "1", "3", "4"]],
  ["human-eyes", "How many eyes does a typical human have?", "Combien d'yeux a un humain typique ?", "Un humain typique a combien d'yeux ?", "Wie viele Augen hat ein typischer Mensch?", ["2", "1", "3", "4"]],
  ["human-ears", "How many ears does a typical human have?", "Combien d'oreilles a un humain typique ?", "Un humain typique a combien d'oreilles ?", "Wie viele Ohren hat ein typischer Mensch?", ["2", "1", "3", "4"]],
  ["fingers-hand", "How many fingers, counting the thumb, are on one human hand?", "Combien de doigts, pouce compris, compte une main humaine ?", "Une main humaine compte combien de doigts, pouce compris ?", "Wie viele Finger, den Daumen mitgezählt, hat eine menschliche Hand?", ["5", "4", "6", "10"]],
  ["toes-foot", "How many toes are on one human foot?", "Combien d'orteils compte un pied humain ?", "Un pied humain compte combien d'orteils ?", "Wie viele Zehen hat ein menschlicher Fuß?", ["5", "4", "6", "10"]],
  ["week-weekend", "How many days are usually called the weekend?", "Combien de jours appelle-t-on d'habitude la fin de semaine ?", "On appelle d'habitude combien de jours la fin de semaine ?", "Wie viele Tage nennt man gewöhnlich das Wochenende?", ["2", "1", "3", "5"]],
  ["sense-classic", "How many senses are in the classic school list of sight, hearing, smell, taste, and touch?", "Combien de sens compte la liste scolaire classique : vue, ouïe, odorat, goût et toucher ?", "La liste scolaire classique compte combien de sens : vue, ouïe, odorat, goût et toucher ?", "Wie viele Sinne hat die klassische Schulliste: Sehen, Hören, Riechen, Schmecken und Tasten?", ["5", "4", "6", "3"]],
  ["vowels-en", "How many vowels are usually listed in English: a, e, i, o, and u?", "Combien de voyelles liste-t-on d'habitude en anglais : a, e, i, o et u ?", "En anglais, on liste d'habitude combien de voyelles : a, e, i, o et u ?", "Wie viele Vokale listet man im Englischen gewöhnlich: a, e, i, o und u?", ["5", "4", "6", "7"]],
  ["snow-white-dwarfs", "How many dwarfs live with Snow White in the classic tale?", "Combien de nains vivent avec Blanche-Neige dans le conte classique ?", "Dans le conte classique, combien de nains vivent avec Blanche-Neige ?", "Wie viele Zwerge leben im klassischen Märchen bei Schneewittchen?", ["7", "3", "5", "9"]],
  ["goldilocks-bears", "How many bears does Goldilocks meet in the classic tale?", "Combien d'ours Boucle d'Or rencontre-t-elle dans le conte classique ?", "Dans le conte classique, Boucle d'Or rencontre combien d'ours ?", "Wie vielen Bären begegnet Goldlöckchen im klassischen Märchen?", ["3", "1", "2", "7"]],
  ["little-pigs", "How many little pigs are in the classic house-building tale?", "Combien de petits cochons compte le conte classique des maisons ?", "Le conte classique des maisons compte combien de petits cochons ?", "Wie viele kleine Schweinchen gibt es im klassischen Märchen von den Häusern?", ["3", "2", "4", "5"]],
  ["billy-goats", "How many billy goats cross the bridge in the classic tale?", "Combien de boucs traversent le pont dans le conte classique ?", "Dans le conte classique, combien de boucs traversent le pont ?", "Wie viele Ziegenböcke überqueren im klassischen Märchen die Brücke?", ["3", "2", "4", "7"]],
  ["wonders-ancient", "How many wonders are in the classic list of the ancient world?", "Combien de merveilles compte la liste classique du monde antique ?", "La liste classique du monde antique compte combien de merveilles ?", "Wie viele Weltwunder hat die klassische Liste der Antike?", ["7", "5", "8", "10"]],
  ["notes-scale", "How many different letter names are in a musical scale before the names repeat: A through G?", "Combien de noms de notes une gamme compte-t-elle avant de recommencer, de la à sol ?", "Une gamme compte combien de noms de notes avant de recommencer, de la à sol ?", "Wie viele Buchstabennamen hat eine Tonleiter, bevor sie sich wiederholen: A bis G?", ["7", "8", "5", "12"]],
  ["semitones-octave", "How many semitones are in an octave on a piano?", "Combien de demi-tons compte une octave au piano ?", "Une octave au piano compte combien de demi-tons ?", "Wie viele Halbtöne hat eine Oktave auf dem Klavier?", ["12", "7", "8", "6"]],
  ["strings-violin-family-viola", "How many strings does a standard viola have?", "Combien de cordes a un alto standard ?", "Un alto standard a combien de cordes ?", "Wie viele Saiten hat eine normale Bratsche?", ["4", "6", "5", "8"]],
  ["strings-cello", "How many strings does a standard cello have?", "Combien de cordes a un violoncelle standard ?", "Un violoncelle standard a combien de cordes ?", "Wie viele Saiten hat ein normales Cello?", ["4", "6", "5", "8"]],
  ["pedals-piano-grand", "How many pedals does a typical grand piano have?", "Combien de pédales a un piano à queue typique ?", "Un piano à queue typique a combien de pédales ?", "Wie viele Pedale hat ein typischer Flügel?", ["3", "2", "1", "4"]],
  ["frets-ukulele-skip", "How many valves does a standard tuba use in the common three-valve design?", "Combien de pistons un tuba standard à trois pistons utilise-t-il ?", "Un tuba standard à trois pistons utilise combien de pistons ?", "Wie viele Ventile hat eine normale dreiventilige Tuba?", ["3", "4", "2", "5"]],
  ["soccer-halves", "How many halves are in a standard soccer match?", "Combien de mi-temps compte un match de soccer standard ?", "Un match de soccer standard compte combien de mi-temps ?", "Wie viele Halbzeiten hat ein normales Fußballspiel?", ["2", "3", "4", "1"]],
];

const hardRows = [
  ["invent-paper", "Who is credited in China with the early papermaking process of the Han era?", "Cai Lun", ["Johannes Gutenberg", "Bi Sheng", "Zhang Heng"], "À qui attribue-t-on en Chine le procédé de papier de l'époque Han ?", "En Chine, on attribue à qui le procédé de papier de l'époque Han ?", "Wem schreibt man in China das Papierverfahren der Han-Zeit zu?"],
  ["invent-gunpowder", "Which civilization first developed gunpowder?", "China", ["Europe", "India", "the Middle East"], "Quelle civilisation a d'abord mis au point la poudre à canon ?", "C'est quelle civilisation qui a d'abord mis au point la poudre ?", "Welche Zivilisation entwickelte zuerst das Schießpulver?"],
  ["invent-compass", "Which civilization first used the magnetic compass for navigation?", "China", ["Portugal", "Italy", "Greece"], "Quelle civilisation a d'abord utilisé la boussole magnétique pour naviguer ?", "C'est quelle civilisation qui a d'abord utilisé la boussole pour naviguer ?", "Welche Zivilisation nutzte zuerst den Magnetkompass zur Navigation?"],
  ["origin-coffee", "Which country is treated as the origin of coffee plants?", "Ethiopia", ["Brazil", "Colombia", "Italy"], "Quel pays est tenu pour l'origine du caféier ?", "C'est quel pays qu'on tient pour l'origine du caféier ?", "Welches Land gilt als Herkunft der Kaffeepflanze?"],
  ["origin-tea", "Which country is treated as the origin of tea drinking?", "China", ["India", "Japan", "the United Kingdom"], "Quel pays est tenu pour l'origine du thé ?", "C'est quel pays qu'on tient pour l'origine du thé ?", "Welches Land gilt als Herkunft des Teetrinkens?"],
  ["origin-potato", "In which region were potatoes first cultivated?", "the Andes", ["Europe", "China", "West Africa"], "Dans quelle région la pomme de terre a-t-elle d'abord été cultivée ?", "La pomme de terre a d'abord été cultivée dans quelle région ?", "In welcher Region wurde die Kartoffel zuerst angebaut?"],
  ["origin-tomato", "In which region were tomatoes first cultivated?", "the Americas", ["Italy", "India", "China"], "Dans quelle région la tomate a-t-elle d'abord été cultivée ?", "La tomate a d'abord été cultivée dans quelle région ?", "In welcher Region wurde die Tomate zuerst angebaut?"],
  ["origin-cacao", "In which region was cacao first cultivated?", "Mesoamerica", ["West Africa", "Europe", "India"], "Dans quelle région le cacao a-t-il d'abord été cultivé ?", "Le cacao a d'abord été cultivé dans quelle région ?", "In welcher Region wurde Kakao zuerst angebaut?"],
  ["origin-silk", "Which country is famous for first making silk?", "China", ["India", "Italy", "Japan"], "Quel pays est célèbre pour avoir d'abord fabriqué la soie ?", "C'est quel pays qui est connu pour avoir d'abord fait de la soie ?", "Welches Land ist dafür bekannt, Seide zuerst hergestellt zu haben?"],
  ["denim-city", "The word denim comes from a fabric of which French city?", "Nîmes", ["Lyon", "Paris", "Marseille"], "Le mot denim vient d'un tissu de quelle ville française ?", "Le mot denim vient d'un tissu de quelle ville française ?", "Das Wort Denim kommt von einem Stoff aus welcher französischen Stadt?"],
  ["diesel-who", "Who invented the diesel engine?", "Rudolf Diesel", ["Karl Benz", "Nikolaus Otto", "Henry Ford"], "Qui a inventé le moteur Diesel ?", "C'est qui qui a inventé le moteur Diesel ?", "Wer erfand den Dieselmotor?"],
  ["otto-who", "Who built the four-stroke engine that carries his cycle's name?", "Nikolaus Otto", ["Rudolf Diesel", "Karl Benz", "James Watt"], "Qui a construit le moteur à quatre temps qui porte son nom ?", "C'est qui qui a construit le moteur à quatre temps qui porte son nom ?", "Wer baute den Viertaktmotor, dessen Taktfolge seinen Namen trägt?"],
  ["watt-who", "Who improved the steam engine into a widely used industrial machine?", "James Watt", ["Thomas Newcomen", "George Stephenson", "Isambard Kingdom Brunel"], "Qui a amélioré la machine à vapeur pour l'industrie ?", "C'est qui qui a amélioré la machine à vapeur pour l'industrie ?", "Wer verbesserte die Dampfmaschine zu einer weit genutzten Industriemaschine?"],
  ["stephenson-who", "Who built the locomotive Rocket?", "George Stephenson", ["James Watt", "Isambard Kingdom Brunel", "Richard Trevithick"], "Qui a construit la locomotive Rocket ?", "C'est qui qui a construit la locomotive Rocket ?", "Wer baute die Lokomotive Rocket?"],
  ["trevithick-who", "Who built an early high-pressure steam road locomotive?", "Richard Trevithick", ["George Stephenson", "James Watt", "Robert Fulton"], "Qui a construit une des premières locomotives à vapeur à haute pression ?", "C'est qui qui a construit une des premières locomotives à vapeur à haute pression ?", "Wer baute eine frühe Hochdruck-Dampflokomotive?"],
  ["fulton-who", "Who is credited with a successful commercial steamboat in the United States?", "Robert Fulton", ["James Watt", "George Stephenson", "Samuel Morse"], "À qui attribue-t-on un bateau à vapeur commercial réussi aux États-Unis ?", "On attribue à qui un bateau à vapeur commercial réussi aux États-Unis ?", "Wem schreibt man ein erfolgreiches kommerzielles Dampfboot in den USA zu?"],
  ["morse-who", "Who developed the telegraph code of dots and dashes that carries his name?", "Samuel Morse", ["Alexander Graham Bell", "Thomas Edison", "Guglielmo Marconi"], "Qui a mis au point le code télégraphique de points et de traits qui porte son nom ?", "C'est qui qui a mis au point le code télégraphique de points et de traits qui porte son nom ?", "Wer entwickelte den Telegraphencode aus Punkten und Strichen, der seinen Namen trägt?"],
  ["braille-who", "Who invented the raised-dot reading system called Braille?", "Louis Braille", ["Helen Keller", "Samuel Morse", "Alexander Graham Bell"], "Qui a inventé le système de lecture à points en relief appelé braille ?", "C'est qui qui a inventé le système de lecture à points en relief appelé braille ?", "Wer erfand das erhabene Punktschriftsystem Braille?"],
  ["daguerre-who", "Who gave his name to an early photographic process, the daguerreotype?", "Louis Daguerre", ["George Eastman", "Nicéphore Niépce", "Ansel Adams"], "Qui a donné son nom à un procédé photo ancien, le daguerréotype ?", "C'est qui qui a donné son nom à un vieux procédé photo, le daguerréotype ?", "Wer gab einem frühen Fotoverfahren, der Daguerreotypie, seinen Namen?"],
  ["eastman-who", "Who founded the company that sold Kodak cameras?", "George Eastman", ["Louis Daguerre", "Thomas Edison", "Ansel Adams"], "Qui a fondé l'entreprise qui a vendu les appareils Kodak ?", "C'est qui qui a fondé l'entreprise qui a vendu les appareils Kodak ?", "Wer gründete das Unternehmen, das Kodak-Kameras verkaufte?"],
  ["berners-org", "At which organization was Tim Berners-Lee working when he proposed the World Wide Web?", "CERN", ["NASA", "MIT", "IBM"], "Dans quelle organisation Tim Berners-Lee travaillait-il quand il a proposé le Web ?", "Tim Berners-Lee travaillait dans quelle organisation quand il a proposé le Web ?", "Bei welcher Organisation arbeitete Tim Berners-Lee, als er das World Wide Web vorschlug?"],
  ["nobel-prize-country", "In which country are the Nobel Prizes awarded, except the Peace Prize?", "Sweden", ["Norway", "Switzerland", "Denmark"], "Dans quel pays les prix Nobel sont-ils remis, sauf le prix de la paix ?", "Les prix Nobel sont remis dans quel pays, sauf le prix de la paix ?", "In welchem Land werden die Nobelpreise verliehen, außer dem Friedenspreis?"],
  ["peace-nobel-country", "In which country is the Nobel Peace Prize awarded?", "Norway", ["Sweden", "Switzerland", "Finland"], "Dans quel pays le prix Nobel de la paix est-il remis ?", "Le prix Nobel de la paix est remis dans quel pays ?", "In welchem Land wird der Friedensnobelpreis verliehen?"],
  ["red-cross-founder", "Who founded the Red Cross movement after Solferino?", "Henry Dunant", ["Florence Nightingale", "Clara Barton", "Henri Dunant is the scored name"], "Qui a fondé le mouvement de la Croix-Rouge après Solférino ?", "C'est qui qui a fondé le mouvement de la Croix-Rouge après Solférino ?", "Wer gründete die Rotkreuz-Bewegung nach Solferino?"],
];

const hardClean = hardRows.filter((row) => row[0] !== "red-cross-founder");
hardClean.push(["red-cross-founder", "Who founded the Red Cross movement after the battle of Solferino?", "Henry Dunant", ["Florence Nightingale", "Clara Barton", "Jean-Henri Fabre"], "Qui a fondé le mouvement de la Croix-Rouge après la bataille de Solférino ?", "C'est qui qui a fondé le mouvement de la Croix-Rouge après la bataille de Solférino ?", "Wer gründete die Rotkreuz-Bewegung nach der Schlacht von Solferino?"]);
hardClean.push(["nightingale-who", "Who became famous for nursing in the Crimean War?", "Florence Nightingale", ["Clara Barton", "Mary Seacole", "Elizabeth Blackwell"], "Qui est devenue célèbre pour les soins pendant la guerre de Crimée ?", "C'est qui qui est devenue célèbre pour les soins pendant la guerre de Crimée ?", "Wer wurde durch die Pflege im Krimkrieg berühmt?"]);
hardClean.push(["barton-who", "Who founded the American Red Cross?", "Clara Barton", ["Florence Nightingale", "Dorothea Dix", "Helen Keller"], "Qui a fondé la Croix-Rouge américaine ?", "C'est qui qui a fondé la Croix-Rouge américaine ?", "Wer gründete das Amerikanische Rote Kreuz?"]);
hardClean.push(["seacole-who", "Who was the Jamaican nurse celebrated for care in the Crimean War, alongside the fame of Nightingale?", "Mary Seacole", ["Florence Nightingale", "Clara Barton", "Mary Seacole is the scored name"], "Qui est l'infirmière jamaïcaine célébrée pour ses soins pendant la guerre de Crimée ?", "C'est qui, l'infirmière jamaïcaine célébrée pour ses soins pendant la guerre de Crimée ?", "Wer war die jamaikanische Krankenschwester, die für ihre Pflege im Krimkrieg gefeiert wird?"]);

const hardClean2 = hardClean.filter((row) => row[0] !== "seacole-who");
hardClean2.push(["seacole-who", "Who was the Jamaican nurse celebrated for care in the Crimean War?", "Mary Seacole", ["Florence Nightingale", "Clara Barton", "Elizabeth Garrett Anderson"], "Qui est l'infirmière jamaïcaine célébrée pour ses soins pendant la guerre de Crimée ?", "C'est qui, l'infirmière jamaïcaine célébrée pour ses soins pendant la guerre de Crimée ?", "Wer war die jamaikanische Krankenschwester, die für ihre Pflege im Krimkrieg gefeiert wird?"]);
hardClean2.push(["blackwell-who", "Who was the first woman to receive a medical degree in the United States?", "Elizabeth Blackwell", ["Elizabeth Garrett Anderson", "Florence Nightingale", "Marie Curie"], "Qui a été la première femme à recevoir un diplôme de médecine aux États-Unis ?", "C'est qui, la première femme à recevoir un diplôme de médecine aux États-Unis ?", "Wer war die erste Frau mit einem medizinischen Abschluss in den USA?"]);
hardClean2.push(["garrett-who", "Who was the first woman to qualify as a physician and surgeon in Britain?", "Elizabeth Garrett Anderson", ["Elizabeth Blackwell", "Florence Nightingale", "Marie Curie"], "Qui a été la première femme qualifiée comme médecin et chirurgienne en Grande-Bretagne ?", "C'est qui, la première femme qualifiée comme médecin et chirurgienne en Grande-Bretagne ?", "Wer war die erste Frau, die sich in Großbritannien als Ärztin und Chirurgin qualifizierte?"]);
hardClean2.push(["curie-element", "Which element is named after Marie and Pierre Curie?", "curium", ["polonium", "radium", "uranium"], "Quel élément porte le nom de Marie et Pierre Curie ?", "C'est quel élément qui porte le nom de Marie et Pierre Curie ?", "Welches Element ist nach Marie und Pierre Curie benannt?"]);
hardClean2.push(["polonium-name", "Which element did Marie Curie name after her homeland?", "polonium", ["radium", "curium", "francium"], "Quel élément Marie Curie a-t-elle nommé d'après son pays d'origine ?", "Marie Curie a nommé quel élément d'après son pays d'origine ?", "Welches Element benannte Marie Curie nach ihrer Heimat?"]);
hardClean2.push(["radium-element", "Which element did the Curies discover along with polonium?", "radium", ["uranium", "plutonium", "curium"], "Quel élément les Curie ont-ils découvert avec le polonium ?", "Les Curie ont découvert quel élément avec le polonium ?", "Welches Element entdeckten die Curies zusammen mit Polonium?"]);
hardClean2.push(["channel-year", "In which year did the Channel Tunnel open to passengers?", "1994", ["1990", "1988", "2000"], "En quelle année le tunnel sous la Manche a-t-il ouvert aux passagers ?", "Le tunnel sous la Manche a ouvert aux passagers en quelle année ?", "In welchem Jahr wurde der Kanaltunnel für Fahrgäste geöffnet?"]);
hardClean2.push(["heart-year", "In which year did Christiaan Barnard lead the first human heart transplant?", "1967", ["1954", "1975", "1963"], "En quelle année Christiaan Barnard a-t-il mené la première greffe d'un cœur humain ?", "Christiaan Barnard a mené la première greffe d'un cœur humain en quelle année ?", "In welchem Jahr leitete Christiaan Barnard die erste Transplantation eines menschlichen Herzens?"]);
hardClean2.push(["email-year", "In which year did Ray Tomlinson send the first networked email?", "1971", ["1969", "1983", "1991"], "En quelle année Ray Tomlinson a-t-il envoyé le premier courriel en réseau ?", "Ray Tomlinson a envoyé le premier courriel en réseau en quelle année ?", "In welchem Jahr sandte Ray Tomlinson die erste vernetzte E-Mail?"]);
hardClean2.push(["genome-year", "In which year was the Human Genome Project's completion announced?", "2003", ["1990", "2001", "2012"], "En quelle année l'achèvement du Projet génome humain a-t-il été annoncé ?", "L'achèvement du Projet génome humain a été annoncé en quelle année ?", "In welchem Jahr wurde der Abschluss des Humangenomprojekts bekannt gegeben?"]);
hardClean2.push(["airlift-year", "In which year did the Berlin Airlift begin?", "1948", ["1945", "1949", "1961"], "En quelle année le pont aérien de Berlin a-t-il commencé ?", "Le pont aérien de Berlin a commencé en quelle année ?", "In welchem Jahr begann die Berliner Luftbrücke?"]);
hardClean2.push(["euro-account", "In which year was the euro introduced as book money, before the notes?", "1999", ["2002", "1995", "2000"], "En quelle année l'euro a-t-il été introduit comme monnaie scripturale, avant les billets ?", "L'euro a été introduit comme monnaie scripturale, avant les billets, en quelle année ?", "In welchem Jahr wurde der Euro als Buchgeld eingeführt, vor den Scheinen?"]);
hardClean2.push(["nitrogen-air", "Which gas makes up most of Earth's atmosphere?", "nitrogen", ["oxygen", "carbon dioxide", "argon"], "Quel gaz compose la plus grande part de l'atmosphère terrestre ?", "C'est quel gaz qui compose la plus grande part de l'atmosphère terrestre ?", "Welches Gas macht den größten Teil der Erdatmosphäre aus?"]);
hardClean2.push(["water-cover", "About what percentage of Earth's surface is covered by water?", "71", ["50", "90", "30"], "Environ quel pourcentage de la surface de la Terre est couvert d'eau ?", "Quel pourcentage environ de la surface de la Terre est couvert d'eau ?", "Ungefähr wie viel Prozent der Erdoberfläche sind von Wasser bedeckt?"]);
hardClean2.push(["ph-water", "What is the pH of pure water at room temperature?", "7", ["0", "14", "1"], "Quel est le pH de l'eau pure à température ambiante ?", "C'est quoi le pH de l'eau pure à température ambiante ?", "Welchen pH-Wert hat reines Wasser bei Raumtemperatur?"]);
hardClean2.push(["absolute-zero", "What is absolute zero on the Celsius scale, to the nearest degree?", "-273", ["-100", "0", "-460"], "Quel est le zéro absolu sur l'échelle Celsius, au degré près ?", "Le zéro absolu sur l'échelle Celsius, au degré près, c'est quoi ?", "Wie viel Grad Celsius ist der absolute Nullpunkt, auf ein Grad gerundet?"]);
hardClean2.push(["light-speed", "About how fast does light travel in a vacuum, in kilometers per second?", "300000", ["3000", "300", "150000"], "À environ quelle vitesse la lumière voyage-t-elle dans le vide, en kilomètres par seconde ?", "La lumière voyage à environ quelle vitesse dans le vide, en kilomètres par seconde ?", "Ungefähr wie schnell ist Licht im Vakuum, in Kilometern pro Sekunde?"]);
hardClean2.push(["sound-speed", "About how fast does sound travel in air at room temperature, in meters per second?", "343", ["123", "1000", "299"], "À environ quelle vitesse le son voyage-t-il dans l'air à température ambiante, en mètres par seconde ?", "Le son voyage à environ quelle vitesse dans l'air à température ambiante, en mètres par seconde ?", "Ungefähr wie schnell ist Schall in Luft bei Raumtemperatur, in Metern pro Sekunde?"]);
hardClean2.push(["protons-oxygen", "How many protons are in an oxygen atom?", "8", ["6", "16", "2"], "Combien de protons compte un atome d'oxygène ?", "Un atome d'oxygène compte combien de protons ?", "Wie viele Protonen hat ein Sauerstoffatom?"]);
hardClean2.push(["protons-carbon", "How many protons are in a carbon atom?", "6", ["12", "8", "4"], "Combien de protons compte un atome de carbone ?", "Un atome de carbone compte combien de protons ?", "Wie viele Protonen hat ein Kohlenstoffatom?"]);
hardClean2.push(["first-element", "Which element is number 1 on the periodic table?", "hydrogen", ["helium", "oxygen", "lithium"], "Quel élément porte le numéro 1 dans le tableau périodique ?", "C'est quel élément, le numéro 1 du tableau périodique ?", "Welches Element hat die Nummer 1 im Periodensystem?"]);
hardClean2.push(["balloon-gas", "Which gas is commonly used to make party balloons float?", "helium", ["hydrogen", "oxygen", "nitrogen"], "Quel gaz sert souvent à faire flotter les ballons de fête ?", "C'est quel gaz qu'on utilise souvent pour faire flotter les ballons de fête ?", "Welches Gas lässt Partyluftballons gewöhnlich schweben?"]);
hardClean2.push(["diamond-carbon", "Diamond is a form of which element?", "carbon", ["silicon", "calcium", "quartz"], "Le diamant est une forme de quel élément ?", "Le diamant est une forme de quel élément ?", "Diamant ist eine Form welches Elements?"]);
hardClean2.push(["table-salt", "Table salt is mostly which compound?", "sodium chloride", ["sodium bicarbonate", "calcium carbonate", "potassium iodide"], "Le sel de table est surtout quel composé ?", "Le sel de table est surtout quel composé ?", "Tafelsalz ist vor allem welche Verbindung?"]);
hardClean2.push(["dry-ice", "Dry ice is the solid form of which gas?", "carbon dioxide", ["nitrogen", "oxygen", "water vapor"], "La glace sèche est la forme solide de quel gaz ?", "La glace sèche, c'est la forme solide de quel gaz ?", "Trockeneis ist die feste Form welches Gases?"]);
hardClean2.push(["rust-metal", "Rust forms mainly on which metal?", "iron", ["copper", "aluminum", "gold"], "La rouille se forme surtout sur quel métal ?", "La rouille se forme surtout sur quel métal ?", "Rost bildet sich vor allem auf welchem Metall?"]);
hardClean2.push(["quartz-mineral", "Sand on many beaches is mostly which mineral?", "quartz", ["diamond", "calcite", "mica"], "Le sable de beaucoup de plages est surtout quel minéral ?", "Le sable de beaucoup de plages est surtout quel minéral ?", "Sand an vielen Stränden besteht vor allem aus welchem Mineral?"]);
hardClean2.push(["amber-origin", "Amber is fossilized what?", "tree resin", ["coral", "lava", "seashell"], "L'ambre est la forme fossile de quoi ?", "L'ambre, c'est la forme fossile de quoi ?", "Bernstein ist versteinertes was?"]);
hardClean2.push(["pearl-origin", "A pearl forms inside what?", "an oyster", ["a clam only", "a snail", "a crab"], "Une perle se forme à l'intérieur de quoi ?", "Une perle se forme à l'intérieur de quoi ?", "Eine Perle entsteht worin?"]);
hardClean2.push(["cork-tree", "Cork comes from the bark of which tree?", "the cork oak", ["the pine", "the maple", "the birch"], "Le liège vient de l'écorce de quel arbre ?", "Le liège vient de l'écorce de quel arbre ?", "Kork kommt von der Rinde welches Baumes?"]);
hardClean2.push(["rubber-tree", "Natural rubber comes mainly from which tree?", "the rubber tree", ["the oak", "the palm", "the pine"], "Le caoutchouc naturel vient surtout de quel arbre ?", "Le caoutchouc naturel vient surtout de quel arbre ?", "Naturkautschuk kommt vor allem von welchem Baum?"]);
hardClean2.push(["maple-tree", "Maple syrup comes from the sap of which tree?", "the maple", ["the birch", "the oak", "the pine"], "Le sirop d'érable vient de la sève de quel arbre ?", "Le sirop d'érable vient de la sève de quel arbre ?", "Ahornsirup kommt vom Saft welches Baumes?"]);
hardClean2.push(["olive-region", "Olive oil is a classic product of which sea's shores?", "the Mediterranean", ["the Baltic", "the Caribbean", "the North Sea"], "L'huile d'olive est un produit classique des rives de quelle mer ?", "L'huile d'olive est un produit classique des rives de quelle mer ?", "Olivenöl ist ein klassisches Erzeugnis der Küsten welchen Meeres?"]);
hardClean2.push(["saffron-flower", "Saffron comes from which flower?", "the crocus", ["the rose", "the tulip", "the sunflower"], "Le safran vient de quelle fleur ?", "Le safran vient de quelle fleur ?", "Safran kommt von welcher Blume?"]);
hardClean2.push(["vanilla-orchid", "Vanilla comes from which kind of plant?", "an orchid", ["a bean tree", "a cactus", "a vine of grapes"], "La vanille vient de quel type de plante ?", "La vanille vient de quel type de plante ?", "Vanille kommt von welcher Pflanzenart?"]);
hardClean2.push(["cinnamon-bark", "Cinnamon is the bark of which kind of tree?", "a cinnamon tree", ["an oak", "a pine", "a birch"], "La cannelle est l'écorce de quel type d'arbre ?", "La cannelle est l'écorce de quel type d'arbre ?", "Zimt ist die Rinde welcher Baumart?"]);
hardClean2.push(["pepper-vine", "Black pepper comes from which kind of plant?", "a vine", ["a grass", "a tree nut", "a root"], "Le poivre noir vient de quel type de plante ?", "Le poivre noir vient de quel type de plante ?", "Schwarzer Pfeffer kommt von welcher Pflanzenart?"]);

const difficultRows = [
  ["diff-speed-light", "About how many kilometers does light travel in one second in a vacuum?", "300000", ["3000", "186000", "150000"], "Environ combien de kilomètres la lumière parcourt-elle en une seconde dans le vide ?", "La lumière parcourt environ combien de kilomètres en une seconde dans le vide ?", "Ungefähr wie viele Kilometer legt Licht in einer Sekunde im Vakuum zurück?"],
  ["diff-absolute", "Absolute zero is about how many degrees Celsius?", "-273", ["-100", "0", "-460"], "Le zéro absolu est d'environ combien de degrés Celsius ?", "Le zéro absolu est d'environ combien de degrés Celsius ?", "Der absolute Nullpunkt liegt bei etwa wie viel Grad Celsius?"],
  ["diff-ph", "Pure water at room temperature has what pH?", "7", ["0", "1", "14"], "L'eau pure à température ambiante a quel pH ?", "L'eau pure à température ambiante a quel pH ?", "Welchen pH-Wert hat reines Wasser bei Raumtemperatur?"],
  ["diff-protons-o", "An oxygen atom has how many protons?", "8", ["16", "6", "2"], "Un atome d'oxygène a combien de protons ?", "Un atome d'oxygène a combien de protons ?", "Wie viele Protonen hat ein Sauerstoffatom?"],
  ["diff-electrons-neutral-c", "A neutral carbon atom has how many electrons?", "6", ["12", "8", "4"], "Un atome de carbone neutre a combien d'électrons ?", "Un atome de carbone neutre a combien d'électrons ?", "Wie viele Elektronen hat ein neutrales Kohlenstoffatom?"],
  ["diff-channel", "The Channel Tunnel opened to passengers in which year?", "1994", ["1990", "2004", "1981"], "Le tunnel sous la Manche a ouvert aux passagers en quelle année ?", "Le tunnel sous la Manche a ouvert aux passagers en quelle année ?", "In welchem Jahr öffnete der Kanaltunnel für Fahrgäste?"],
  ["diff-heart", "Christiaan Barnard led the first human heart transplant in which year?", "1967", ["1954", "1978", "1963"], "Christiaan Barnard a mené la première greffe cardiaque humaine en quelle année ?", "Christiaan Barnard a mené la première greffe cardiaque humaine en quelle année ?", "In welchem Jahr leitete Christiaan Barnard die erste Herztransplantation beim Menschen?"],
  ["diff-email", "Ray Tomlinson sent the first networked email in which year?", "1971", ["1965", "1983", "1995"], "Ray Tomlinson a envoyé le premier courriel en réseau en quelle année ?", "Ray Tomlinson a envoyé le premier courriel en réseau en quelle année ?", "In welchem Jahr sandte Ray Tomlinson die erste vernetzte E-Mail?"],
  ["diff-genome", "The completion of the Human Genome Project was announced in which year?", "2003", ["1990", "2010", "1998"], "L'achèvement du Projet génome humain a été annoncé en quelle année ?", "L'achèvement du Projet génome humain a été annoncé en quelle année ?", "In welchem Jahr wurde der Abschluss des Humangenomprojekts verkündet?"],
  ["diff-airlift", "The Berlin Airlift began in which year?", "1948", ["1945", "1953", "1961"], "Le pont aérien de Berlin a commencé en quelle année ?", "Le pont aérien de Berlin a commencé en quelle année ?", "In welchem Jahr begann die Berliner Luftbrücke?"],
  ["diff-euro-book", "The euro began as book money in which year, before the cash?", "1999", ["2002", "1992", "2004"], "L'euro a commencé comme monnaie scripturale en quelle année, avant les billets ?", "L'euro a commencé comme monnaie scripturale en quelle année, avant les billets ?", "In welchem Jahr begann der Euro als Buchgeld, vor dem Bargeld?"],
  ["diff-nitrogen", "Most of the air around Earth is which gas?", "nitrogen", ["oxygen", "argon", "carbon dioxide"], "La plus grande part de l'air autour de la Terre est quel gaz ?", "La plus grande part de l'air autour de la Terre est quel gaz ?", "Der größte Teil der Luft um die Erde ist welches Gas?"],
  ["diff-water-pct", "About what share of Earth's surface is water, in percent?", "71", ["51", "91", "30"], "Environ quelle part de la surface terrestre est de l'eau, en pourcentage ?", "Quelle part environ de la surface terrestre est de l'eau, en pourcentage ?", "Ungefähr welcher Anteil der Erdoberfläche ist Wasser, in Prozent?"],
  ["diff-sound", "Sound in room-temperature air travels at about how many meters each second?", "343", ["123", "1000", "1500"], "Le son dans l'air à température ambiante voyage à environ combien de mètres par seconde ?", "Le son dans l'air à température de la pièce voyage à environ combien de mètres chaque seconde ?", "Schall in Luft bei Raumtemperatur legt etwa wie viele Meter pro Sekunde zurück?"],
];

const out = [];

continents.forEach((item, index) => {
  const [en, fr, de, continent, frC, deC] = item;
  const wrongs = WRONG_CONTINENT[continent];
  out.push(row("easy", "geography", `cont-${index}`, {
    en: `On which continent is ${en}?`,
    fr: `Sur quel continent se trouve ${fr} ?`,
    qc: `${fr.charAt(0).toUpperCase()}${fr.slice(1)} est sur quel continent ?`,
    de: `Auf welchem Kontinent liegt ${de}?`,
  }, {
    en: [continent, ...wrongs],
    fr: [frC, ...wrongs.map((name) => FR_CONTINENT[name])],
    qc: [frC, ...wrongs.map((name) => FR_CONTINENT[name])],
    de: [deC, ...wrongs.map((name) => DE_CONTINENT[name])],
  }));
});

const currencyWrongs = ["the yen", "the dollar", "the euro"];
currencies.forEach((item, index) => {
  const [en, fr, de, money, frM, deM] = item;
  const wrongEn = currencyWrongs.filter((name) => name !== money).slice(0, 2);
  while (wrongEn.length < 3) wrongEn.push(["the peso", "the franc", "the rupee"].find((name) => name !== money && !wrongEn.includes(name)));
  out.push(row("easy", "culture", `cur-${index}`, {
    en: `What is the currency of ${en}?`,
    fr: `Quelle est la monnaie ${fr.startsWith("le ") || fr.startsWith("la ") || fr.startsWith("les ") || fr.startsWith("l'") ? "de " : "de "}${fr} ?`,
    qc: `C'est quoi la monnaie de ${fr} ?`,
    de: `Was ist die Währung von ${de}?`,
  }, [money, ...wrongEn.slice(0, 3)]));
});

foods.forEach((item, index) => {
  const [en, fr, de, country, frC, deC] = item;
  out.push(row("easy", "culture", `food-${index}`, {
    en: `Which country is most closely associated with ${en}?`,
    fr: `Quel pays est le plus associé à ${fr} ?`,
    qc: `C'est quel pays le plus associé à ${fr} ?`,
    de: `Welches Land verbindet man am stärksten mit ${de}?`,
  }, [country, "Japan", "Brazil", "Canada"].filter((name, i, arr) => name !== country && arr.indexOf(name) === i).slice(0, 3).concat(country).filter((name, i, arr) => arr.indexOf(name) === i)));
});

// The food choice builder above is messy and may not have 4 choices or may put the answer not first.
// Rebuild foods cleanly.

const FOOD_POOL = [
  ["Italy", "Italie", "Italien"],
  ["Japan", "Japon", "Japan"],
  ["Mexico", "Mexique", "Mexiko"],
  ["France", "France", "Frankreich"],
  ["Spain", "Espagne", "Spanien"],
  ["Canada", "Canada", "Kanada"],
  ["China", "Chine", "China"],
  ["Greece", "Grèce", "Griechenland"],
];

const foodsFixed = foods.map((item, index) => {
  const [en, fr, de, country, frC, deC] = item;
  const wrongs = FOOD_POOL.filter((name) => name[0] !== country && name[1] !== frC && name[2] !== deC).slice(0, 3);
  return row("easy", "culture", `food-${index}`, {
    en: `Which country is most closely associated with ${en}?`,
    fr: `Quel pays est le plus associé à ${fr} ?`,
    qc: `${fr.charAt(0).toUpperCase()}${fr.slice(1)}, c'est associé surtout à quel pays ?`,
    de: `Welches Land verbindet man am stärksten mit ${de}?`,
  }, {
    en: [country, ...wrongs.map((name) => name[0])],
    fr: [frC, ...wrongs.map((name) => name[1])],
    qc: [frC, ...wrongs.map((name) => name[1])],
    de: [deC, ...wrongs.map((name) => name[2])],
  });
});

const ANIMAL = {
  "the lion": ["le lion", "der Löwe"],
  "the horse": ["le cheval", "das Pferd"],
  "the gazelle": ["la gazelle", "die Gazelle"],
  "the eagle": ["l'aigle", "der Adler"],
  "the penguin": ["le manchot", "der Pinguin"],
  "the swan": ["le cygne", "der Schwan"],
  "the elephant": ["l'éléphant", "der Elefant"],
  "the giraffe": ["la girafe", "die Giraffe"],
  "the great white shark": ["le grand requin blanc", "der Weiße Hai"],
  "the ostrich": ["l'autruche", "der Strauß"],
  "the camel": ["le chameau", "das Kamel"],
  "the flying squirrel": ["le polatouche", "das Flughörnchen"],
  "the owl": ["le hibou", "die Eule"],
  "the koala": ["le koala", "der Koala"],
  "the wombat": ["le wombat", "der Wombat"],
  "the emu": ["l'émeu", "der Emu"],
  "the polar bear": ["l'ours polaire", "der Eisbär"],
  "the zebra": ["le zèbre", "das Zebra"],
  "the skunk": ["la mouffette", "das Stinktier"],
  "the octopus": ["la pieuvre", "der Oktopus"],
  "the frog": ["la grenouille", "der Frosch"],
  "the parrot": ["le perroquet", "der Papagei"],
  "the jaguar": ["le jaguar", "der Jaguar"],
  "the leopard": ["le léopard", "der Leopard"],
  "the Bactrian camel": ["le chameau de Bactriane", "das Trampeltier"],
  "the llama": ["le lama", "das Lama"],
  "the dromedary": ["le dromadaire", "das Dromedar"],
  "the alpaca": ["l'alpaga", "das Alpaka"],
  "the wasp": ["la guêpe", "die Wespe"],
  "the butterfly": ["le papillon", "der Schmetterling"],
  "the ant": ["la fourmi", "die Ameise"],
  "the crow": ["la corneille", "die Krähe"],
  "the robin": ["le rouge-gorge", "das Rotkehlchen"],
  "the rhinoceros": ["le rhinocéros", "das Nashorn"],
  "the hippopotamus": ["l'hippopotame", "das Nilpferd"],
  "the walrus": ["le morse", "das Walross"],
  "the donkey": ["l'âne", "der Esel"],
  "the okapi": ["l'okapi", "das Okapi"],
  "the seagull": ["la mouette", "die Möwe"],
  "the duck": ["le canard", "die Ente"],
  "the crocodile": ["le crocodile", "das Krokodil"],
  "the lizard": ["le lézard", "die Eidechse"],
  "the snake": ["le serpent", "die Schlange"],
  "the otter": ["la loutre", "der Otter"],
  "the muskrat": ["le rat musqué", "die Bisamratte"],
  "the platypus": ["l'ornithorynque", "das Schnabeltier"],
  "the gorilla": ["le gorille", "der Gorilla"],
  "the orangutan": ["l'orang-outan", "der Orang-Utan"],
  "the lemur": ["le lémurien", "der Lemur"],
  "the bat": ["la chauve-souris", "die Fledermaus"],
  "the panda": ["le panda", "der Panda"],
  "the sloth": ["le paresseux", "das Faultier"],
  "the hedgehog": ["le hérisson", "der Igel"],
  "the porcupine": ["le porc-épic", "das Stachelschwein"],
  "the echidna": ["l'échidné", "der Ameisenigel"],
  "the beaver": ["le castor", "der Biber"],
  "the blue whale": ["la baleine bleue", "der Blauwal"],
  "the manta ray": ["la raie manta", "der Mantarochen"],
  cubs: ["des petits", "Junge"],
  calves: ["des veaux", "Kälber"],
  pups: ["des chiots", "Welpen"],
};

const animalsFixed = animalsClean.map((item, index) => {
  const [en, fr, de, answer, frA, deA, wrongs] = item;
  const translated = wrongs.map((name) => {
    const hit = ANIMAL[name];
    if (!hit) throw new Error(`missing animal translation: ${name}`);
    return hit;
  });
  return row("easy", "culture", `ani-${index}`, {
    en: `Which animal is ${en}?`,
    fr: `Quel animal est ${fr} ?`,
    qc: `${fr.charAt(0).toUpperCase()}${fr.slice(1)}, c'est quel animal ?`,
    de: `Welches Tier ist ${de}?`,
  }, {
    en: [answer, ...wrongs],
    fr: [frA, ...translated.map((name) => name[0])],
    qc: [frA, ...translated.map((name) => name[0])],
    de: [deA, ...translated.map((name) => name[1])],
  });
});

const extrasFixed = easyExtra.map(([slug, en, fr, qc, de, choices]) => row("easy", "culture", slug, { en, fr, qc, de }, choices));

const hardSkip = new Set([
  "channel-year", "heart-year", "email-year", "genome-year", "airlift-year", "euro-account",
  "nitrogen-air", "water-cover", "ph-water", "absolute-zero", "light-speed", "sound-speed",
  "protons-oxygen", "protons-carbon",
]);
const hardFixed = hardClean2
  .filter(([slug]) => !hardSkip.has(slug))
  .map(([slug, en, answer, wrongs, fr, qc, de]) => row("hard", "culture", slug, { en, fr, qc, de }, [answer, ...wrongs]));
const hardExtra = [
  ["hard-bi-sheng", "Who developed movable clay type in Song-dynasty China?", "Bi Sheng", ["Cai Lun", "Johannes Gutenberg", "Shen Kuo"], "Qui a mis au point les caractères mobiles d'argile dans la Chine des Song ?", "C'est qui qui a mis au point les caractères mobiles d'argile dans la Chine des Song ?", "Wer entwickelte bewegliche Tonlettern im China der Song-Zeit?"],
  ["hard-shen-kuo", "Who described the magnetic compass in the Dream Pool Essays?", "Shen Kuo", ["Cai Lun", "Bi Sheng", "Zhang Heng"], "Qui a décrit la boussole magnétique dans les Essais du bassin des rêves ?", "C'est qui qui a décrit la boussole dans les Essais du bassin des rêves ?", "Wer beschrieb den Magnetkompass in den Pinselunterhaltungen am Traumbach?"],
  ["hard-zhang-heng", "Who invented a seismoscope in Han-dynasty China?", "Zhang Heng", ["Cai Lun", "Bi Sheng", "Shen Kuo"], "Qui a inventé un sismographe dans la Chine des Han ?", "C'est qui qui a inventé un sismographe dans la Chine des Han ?", "Wer erfand ein Seismoskop im China der Han-Zeit?"],
  ["hard-figaro", "Who composed the opera The Marriage of Figaro?", "Wolfgang Amadeus Mozart", ["Giuseppe Verdi", "Gioachino Rossini", "Ludwig van Beethoven"], "Qui a composé l'opéra Les Noces de Figaro ?", "C'est qui qui a composé l'opéra Les Noces de Figaro ?", "Wer komponierte die Oper Die Hochzeit des Figaro?"],
].map(([slug, en, answer, wrongs, fr, qc, de]) => row("hard", "culture", slug, { en, fr, qc, de }, [answer, ...wrongs]));

const difficultFixed = difficultRows.map(([slug, en, answer, wrongs, fr, qc, de]) => row("difficult", "sci-fi", slug, { en, fr, qc, de }, [answer, ...wrongs]));

const easy = [
  ...continents.map((item, index) => out[index]),
  ...foodsFixed,
  ...animalsFixed,
  ...extrasFixed,
];

// currencies were pushed onto out after continents, so out is continents + currencies.
// Don't use out for easy. Build currencies separately.
const MONEY_POOL = [
  { en: "the yen", fr: "le yen", de: "der Yen" },
  { en: "the dollar", fr: "le dollar", de: "der Dollar" },
  { en: "the euro", fr: "l'euro", de: "der Euro" },
  { en: "the peso", fr: "le peso", de: "der Peso" },
  { en: "the franc", fr: "le franc", de: "der Franken" },
  { en: "the rupee", fr: "la roupie", de: "die Rupie" },
  { en: "the pound sterling", fr: "la livre sterling", de: "das Pfund Sterling" },
];

const currencyFixed = currencies.map((item, index) => {
  const [en, fr, de, money, frM, deM] = item;
  const wrongs = MONEY_POOL.filter((name) => name.en !== money && name.fr !== frM && name.de !== deM).slice(0, 3);
  return row("easy", "culture", `cur-${index}`, {
    en: `What is the main currency of ${en}?`,
    fr: `Quelle est la monnaie principale ${dePhrase(fr)} ?`,
    qc: `C'est quoi la monnaie principale ${dePhrase(fr)} ?`,
    de: `Was ist die wichtigste Währung von ${de}?`,
  }, {
    en: [money, ...wrongs.map((name) => name.en)],
    fr: [frM, ...wrongs.map((name) => name.fr)],
    qc: [frM, ...wrongs.map((name) => name.fr)],
    de: [deM, ...wrongs.map((name) => name.de)],
  });
});

const easyPad = [
  ["easy-sides-square", "How many sides does a square have?", "Combien de côtés a un carré ?", "Un carré a combien de côtés ?", "Wie viele Seiten hat ein Quadrat?", ["4", "3", "5", "6"]],
  ["easy-sides-rectangle", "How many sides does a rectangle have?", "Combien de côtés a un rectangle ?", "Un rectangle a combien de côtés ?", "Wie viele Seiten hat ein Rechteck?", ["4", "3", "6", "8"]],
  ["easy-angles-triangle", "How many angles does a triangle have?", "Combien d'angles a un triangle ?", "Un triangle a combien d'angles ?", "Wie viele Winkel hat ein Dreieck?", ["3", "4", "2", "6"]],
  ["easy-wheels-tricycle", "How many wheels does a typical tricycle have?", "Combien de roues a un tricycle typique ?", "Un tricycle typique a combien de roues ?", "Wie viele Räder hat ein typisches Dreirad?", ["3", "2", "4", "1"]],
  ["easy-wheels-unicycle", "How many wheels does a unicycle have?", "Combien de roues a un monocycle ?", "Un monocycle a combien de roues ?", "Wie viele Räder hat ein Einrad?", ["1", "2", "3", "4"]],
  ["easy-players-doubles", "How many players are on one side in doubles tennis?", "Combien de joueurs compte un camp en double au tennis ?", "Un camp en double au tennis compte combien de joueurs ?", "Wie viele Spieler hat eine Seite im Tennisdoppel?", ["2", "1", "4", "3"]],
  ["easy-players-singles", "How many players are on one side in singles tennis?", "Combien de joueurs compte un camp en simple au tennis ?", "Un camp en simple au tennis compte combien de joueurs ?", "Wie viele Spieler hat eine Seite im Tennis-Einzel?", ["1", "2", "4", "3"]],
  ["easy-chair-legs", "How many legs does a typical chair have?", "Combien de pieds a une chaise typique ?", "Une chaise typique a combien de pieds ?", "Wie viele Beine hat ein typischer Stuhl?", ["4", "3", "2", "6"]],
  ["easy-table-legs", "How many legs does a typical table have?", "Combien de pieds a une table typique ?", "Une table typique a combien de pieds ?", "Wie viele Beine hat ein typischer Tisch?", ["4", "3", "6", "8"]],
  ["easy-dice-pips", "What is the highest number on a standard die?", "Quel est le plus grand nombre sur un dé standard ?", "C'est quoi le plus grand nombre sur un dé ordinaire ?", "Was ist die höchste Zahl auf einem normalen Würfel?", ["6", "5", "8", "12"]],
  ["easy-clock-numbers", "How many numbers, from 1 to 12, are usually on a clock face?", "Combien de nombres, de 1 à 12, compte d'habitude un cadran ?", "Un cadran compte d'habitude combien de nombres, de 1 à 12 ?", "Wie viele Zahlen, von 1 bis 12, hat ein Zifferblatt gewöhnlich?", ["12", "10", "24", "6"]],
  ["easy-months-named", "April is which number of month in a year, if January is 1?", "Avril est quel numéro de mois, si janvier est 1 ?", "Avril est le combien du mois, si janvier est 1 ?", "Der wievielte Monat ist April, wenn Januar der erste ist?", ["4", "3", "5", "2"]],
  ["easy-days-fortnight", "How many days are in a fortnight?", "Combien de jours compte une quinzaine anglaise, un fortnight ?", "Un fortnight compte combien de jours ?", "Wie viele Tage hat ein Fortnight?", ["14", "7", "10", "15"]],
  ["easy-baker-dozen", "How many items are in a baker's dozen?", "Combien d'articles compte une douzaine du boulanger ?", "Une douzaine du boulanger compte combien d'articles ?", "Wie viele Stück hat ein Baker's Dozen?", ["13", "12", "14", "10"]],
  ["easy-dozen", "How many items are in a dozen?", "Combien d'articles compte une douzaine ?", "Une douzaine compte combien d'articles ?", "Wie viele Stück hat ein Dutzend?", ["12", "10", "13", "6"]],
  ["easy-score-twenty", "How many years are in a score, as in 'four score'?", "Combien d'années compte un score, comme dans « four score » ?", "Un score, comme dans « four score », compte combien d'années ?", "Wie viele Jahre hat ein Score, wie in „four score“?", ["20", "10", "12", "40"]],
  ["easy-pair", "How many items are in a pair?", "Combien d'articles compte une paire ?", "Une paire compte combien d'articles ?", "Wie viele Stück hat ein Paar?", ["2", "1", "4", "3"]],
  ["easy-trio", "How many items are in a trio?", "Combien d'articles compte un trio ?", "Un trio compte combien d'articles ?", "Wie viele Stück hat ein Trio?", ["3", "2", "4", "6"]],
  ["easy-quartet", "How many players are in a quartet?", "Combien de musiciens compte un quatuor ?", "Un quatuor compte combien de musiciens ?", "Wie viele Spieler hat ein Quartett?", ["4", "3", "5", "8"]],
  ["easy-octet", "How many bits are in a byte?", "Combien de bits compte un octet ?", "Un octet compte combien de bits ?", "Wie viele Bit hat ein Byte?", ["8", "4", "16", "10"]],
].map(([slug, en, fr, qc, de, choices]) => row("easy", "culture", slug, { en, fr, qc, de }, choices));
const easyAll = [...continents.map((_, index) => out[index]), ...currencyFixed, ...foodsFixed, ...animalsFixed, ...extrasFixed, ...easyPad];

const NEED = { easy: 169, hard: 53, difficult: 14 };
const buckets = { easy: easyAll, hard: [...hardFixed, ...hardExtra], difficult: difficultFixed };

for (const [tier, rows] of Object.entries(buckets)) {
  if (rows.length < NEED[tier]) {
    throw new Error(`${tier} short: ${rows.length} < ${NEED[tier]} hard ${hardFixed.length} difficult ${difficultFixed.length} easy ${easyAll.length}`);
  }
}

export const restFacts = [
  ...easyAll.slice(0, NEED.easy),
  ...[...hardFixed, ...hardExtra].slice(0, NEED.hard),
  ...difficultFixed.slice(0, NEED.difficult),
];
