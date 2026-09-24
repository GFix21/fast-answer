import { q, trio, T, H } from "./set3-facts.js";

const rows = [];
const C = (en, qc, de) => trio(en, qc, de);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
for (let i = 0; i < 12; i += 1) {
  const n = (i + 1) % 12;
  const wrong = [1, 2, 3].map((k) => {
    const j = (i + 1 + k) % 12;
    return C(MONTHS[j], MOIS[j], MONATE[j]);
  });
  rows.push(q(i < 6 ? "easy" : "hard", "culture", `month-${i}`, {
    en: `Which month comes right after ${MONTHS[i]}?`,
    qc: `C'est quel mois qui vient juste après ${MOIS[i]}?`,
    de: `Welcher Monat kommt direkt nach ${MONATE[i]}?`,
  }, C(MONTHS[n], MOIS[n], MONATE[n]), wrong, T.year, H.straight));
}

const OPP = [
  ["hot", "hot", "chaud", "heiß", "Cold", "Froid", "Kalt", "Warm", "Tiède", "Warm", "Wet", "Mouillé", "Nass", "Fast", "Rapide", "Schnell"],
  ["up", "up", "en haut", "oben", "Down", "En bas", "Unten", "Left", "À gauche", "Links", "Far", "Loin", "Weit", "Open", "Ouvert", "Offen"],
  ["day", "day", "le jour", "der Tag", "Night", "La nuit", "Die Nacht", "Morning", "Le matin", "Der Morgen", "Winter", "L'hiver", "Der Winter", "Noon", "Le midi", "Der Mittag"],
  ["open", "open", "ouvert", "offen", "Closed", "Fermé", "Geschlossen", "Full", "Plein", "Voll", "Wide", "Large", "Breit", "New", "Nouveau", "Neu"],
  ["fast", "fast", "vite", "schnell", "Slow", "Lent", "Langsam", "Late", "En retard", "Spät", "Loud", "Fort", "Laut", "Hard", "Dur", "Hart"],
  ["full", "full", "plein", "voll", "Empty", "Vide", "Leer", "Heavy", "Lourd", "Schwer", "New", "Nouveau", "Neu", "Open", "Ouvert", "Offen"],
  ["wet", "wet", "mouillé", "nass", "Dry", "Sec", "Trocken", "Cold", "Froid", "Kalt", "Dark", "Sombre", "Dunkel", "Soft", "Mou", "Weich"],
  ["early", "early", "tôt", "früh", "Late", "Tard", "Spät", "Slow", "Lent", "Langsam", "Far", "Loin", "Weit", "Low", "Bas", "Niedrig"],
  ["big", "big", "grand", "groß", "Small", "Petit", "Klein", "Tall", "Grand", "Hoch", "Wide", "Large", "Breit", "Fast", "Rapide", "Schnell"],
  ["left", "left", "à gauche", "links", "Right", "À droite", "Rechts", "Up", "En haut", "Oben", "Down", "En bas", "Unten", "Back", "Derrière", "Hinten"],
];
for (const [slug, en, qc, de, a, aq, ad, b, bq, bd, c, cq, cd, d, dq, dd] of OPP) {
  rows.push(q("easy", "culture", `opp-${slug}`, {
    en: `What is the opposite of ${en}?`,
    qc: `C'est quoi le contraire de ${qc}?`,
    de: `Was ist das Gegenteil von ${de}?`,
  }, C(a, aq, ad), [C(b, bq, bd), C(c, cq, cd), C(d, dq, dd)], T.who, H.straight));
}

const CODES = [
  ["CA", "Canada", "le Canada", "Kanada"],
  ["MX", "Mexico", "le Mexique", "Mexiko"],
  ["GB", "the United Kingdom", "le Royaume-Uni", "das Vereinigte Königreich"],
  ["FR", "France", "la France", "Frankreich"],
  ["DE", "Germany", "l'Allemagne", "Deutschland"],
  ["IT", "Italy", "l'Italie", "Italien"],
  ["ES", "Spain", "l'Espagne", "Spanien"],
  ["PT", "Portugal", "le Portugal", "Portugal"],
  ["JP", "Japan", "le Japon", "Japan"],
  ["CN", "China", "la Chine", "China"],
  ["KR", "South Korea", "la Corée du Sud", "Südkorea"],
  ["IN", "India", "l'Inde", "Indien"],
  ["BR", "Brazil", "le Brésil", "Brasilien"],
  ["AU", "Australia", "l'Australie", "Australien"],
  ["NZ", "New Zealand", "la Nouvelle-Zélande", "Neuseeland"],
  ["ZA", "South Africa", "l'Afrique du Sud", "Südafrika"],
  ["SE", "Sweden", "la Suède", "Schweden"],
  ["NO", "Norway", "la Norvège", "Norwegen"],
  ["CH", "Switzerland", "la Suisse", "die Schweiz"],
  ["NL", "the Netherlands", "les Pays-Bas", "die Niederlande"],
  ["IE", "Ireland", "l'Irlande", "Irland"],
  ["GR", "Greece", "la Grèce", "Griechenland"],
  ["EG", "Egypt", "l'Égypte", "Ägypten"],
  ["MA", "Morocco", "le Maroc", "Marokko"],
  ["RU", "Russia", "la Russie", "Russland"],
];
const CODE_WRONG = ["US", "CA", "FR", "JP", "BR"];
CODES.forEach((item, i) => {
  const [code, en, qc, de] = item;
  const wrongs = CODE_WRONG.filter((c) => c !== code).slice(0, 3);
  rows.push(q(i < 12 ? "hard" : "difficult", "culture", `iso-${code.toLowerCase()}`, {
    en: `What is the two-letter country code for ${en}?`,
    qc: `C'est quoi le code de pays à deux lettres pour ${qc}?`,
    de: `Wie lautet der zweistellige Ländercode für ${de}?`,
  }, code, wrongs, T.geo, H.straight));
});

const FROM = [
  ["qc", "Quebec", "du Québec", "Quebec", "A Quebecer", "Un Québécois", "Ein Quebecer"],
  ["ca", "Canada", "du Canada", "Kanada", "A Canadian", "Un Canadien", "Ein Kanadier"],
  ["mx", "Mexico", "du Mexique", "Mexiko", "A Mexican", "Un Mexicain", "Ein Mexikaner"],
  ["fr", "France", "de la France", "Frankreich", "A French person", "Un Français", "Ein Franzose"],
  ["de", "Germany", "de l'Allemagne", "Deutschland", "A German", "Un Allemand", "Ein Deutscher"],
  ["it", "Italy", "de l'Italie", "Italien", "An Italian", "Un Italien", "Ein Italiener"],
  ["es", "Spain", "de l'Espagne", "Spanien", "A Spaniard", "Un Espagnol", "Ein Spanier"],
  ["jp", "Japan", "du Japon", "Japan", "A Japanese person", "Un Japonais", "Ein Japaner"],
  ["br", "Brazil", "du Brésil", "Brasilien", "A Brazilian", "Un Brésilien", "Ein Brasilianer"],
  ["eg", "Egypt", "de l'Égypte", "Ägypten", "An Egyptian", "Un Égyptien", "Ein Ägypter"],
];
for (const [slug, en, qc, de, a, aq, ad] of FROM) {
  rows.push(q("easy", "culture", `from-${slug}`, {
    en: `What do you call a person from ${en}?`,
    qc: `Comment on appelle une personne ${qc}?`,
    de: `Wie nennt man eine Person aus ${de}?`,
  }, C(a, aq, ad), [C("A tourist", "Un touriste", "Ein Tourist"), C("A neighbour", "Un voisin", "Ein Nachbar"), C("A captain", "Un capitaine", "Ein Kapitän")], T.who, H.straight));
}

export function padSet3Facts() {
  return rows;
}
