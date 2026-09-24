/**
 * Second wording for a banked fact.
 * The answer and the choice order stay. The prompt must not match the live line.
 * Colour and "when" questions keep the words the checker looks for.
 */

const EN = [
  [/^What is the capital of /i, "Which city is the capital of "],
  [/^What is the chemical symbol for /i, "Which symbol stands for "],
  [/^What is the /i, "Which is the "],
  [/^In which year /i, "When, in which year, "],
  [/^Who wrote the /i, "Which writer wrote the "],
  [/^Which country is /i, "What country is "],
  [/^On which continent /i, "Which continent holds "],
  [/^Who made the /i, "Which maker produced the "],
  [/^In which country /i, "Which country is the setting for "],
  [/^Who is credited /i, "Which person is credited "],
  [/^Who directed the /i, "Which director made the "],
  [/^Which animal is /i, "What animal is "],
  [/^How many /i, "What number of "],
  [/^Who painted /i, "Which artist painted "],
  [/^What colou?r is /i, "What colour is "],
  [/^Which planet is /i, "What planet is "],
  [/^Who founded /i, "Which person founded "],
  [/^Who was the /i, "Which person was the "],
  [/^Why did the /i, "What made the "],
];

const QC = [
  [/^C'est quoi la capitale /i, "Quelle ville est la capitale "],
  [/^C'est quoi la couleur /i, "C'est quoi la couleur "],
  [/^C'est quoi la /i, "Laquelle est la "],
  [/^C'est qui qui /i, "Qui est-ce qui "],
  [/^Il y a /i, "On compte "],
  [/^C'est en quelle année /i, "Quand, en quelle année, "],
  [/^C'est en quelle /i, "En quelle "],
  [/^C'est quoi le /i, "Quel est le "],
  [/^On attribue à /i, "Le crédit va à "],
  [/^C'est dans quel /i, "Dans quel "],
  [/^En quelle année /i, "Quand, en quelle année, "],
  [/^Comment on appelle /i, "Quel nom donne-t-on à "],
];

const DE = [
  [/^Was ist die Hauptstadt von /i, "Welche Stadt ist die Hauptstadt von "],
  [/^Was ist die /i, "Wie lautet die "],
  [/^In welchem Jahr /i, "Wann, in welchem Jahr, "],
  [/^Wer hat geschrieben /i, "Welche Person hat geschrieben "],
  [/^Auf welchem Kontinent /i, "Welcher Kontinent trägt "],
  [/^Wer hat gemacht /i, "Wer hat hervorgebracht "],
  [/^In welchem Land /i, "Welches Land gilt für "],
  [/^Wem schreibt man /i, "Wen nennt man bei "],
  [/^Welches Land verbindet /i, "Welches Land verknüpft "],
  [/^Wer hat inszeniert /i, "Welche Regie hat inszeniert "],
  [/^Welches chemische Symbol /i, "Welches Zeichen ist das chemische Symbol "],
  [/^Welches Tier ist /i, "Welches Lebewesen ist "],
  [/^Welche Farbe hat /i, "Welche Farbe hat "],
  [/^Wie viele /i, "Welche Zahl gilt für "],
  [/^Welcher Planet ist /i, "Welcher Planet wäre "],
  [/^Wer hat gemalt /i, "Welche Person hat gemalt "],
];

const RULES = { en: EN, "fr-CA": QC, de: DE };
const TAIL = { en: " this round", "fr-CA": " cette fois", de: " diesmal" };

export function rewordPrompt(prompt, locale = "en") {
  const text = String(prompt || "").trim();
  const rules = RULES[locale] || RULES.en;
  let next = text;
  for (const [from, to] of rules) {
    if (from.test(text)) {
      next = text.replace(from, to);
      break;
    }
  }
  if (next === text) {
    const tail = TAIL[locale] || TAIL.en;
    next = text.endsWith("?") ? `${text.slice(0, -1)}${tail}?` : `${text}${tail}`;
  }
  return next;
}
