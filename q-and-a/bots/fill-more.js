/**
 * The rest of the week, after the capital tables.
 * Tiers are claimed in order so the pack lands on 150 per generation.
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

function howMany(tier, slug, thing, answer, wrongs) {
  return row(tier, "culture", slug, {
    en: `How many ${thing.en}?`,
    fr: `Combien ${thing.fr} ?`,
    qc: `Il y a combien ${thing.qc} ?`,
    de: `Wie viele ${thing.de}?`,
  }, [String(answer), ...wrongs.map(String)]);
}

function whoMade(tier, topic, slug, work, person, wrongs) {
  return row(tier, topic, slug, {
    en: `Who created ${work.en}?`,
    fr: `Qui a créé ${work.fr} ?`,
    qc: `C'est qui qui a créé ${work.qc} ?`,
    de: `Wer hat ${work.de} geschaffen?`,
  }, [person, ...wrongs]);
}

function where(tier, topic, slug, thing, place, wrongs) {
  return row(tier, topic, slug, {
    en: `In which country is ${thing.en}?`,
    fr: `Dans quel pays se trouve ${thing.fr} ?`,
    qc: `C'est dans quel pays, ${thing.qc} ?`,
    de: `In welchem Land steht ${thing.de}?`,
  }, [place.en, ...wrongs]);
}

function year(tier, topic, slug, event, answer, wrongs) {
  return row(tier, topic, slug, {
    en: `In which year ${event.en}?`,
    fr: `En quelle année ${event.fr} ?`,
    qc: `C'est en quelle année que ${event.qc} ?`,
    de: `In welchem Jahr ${event.de}?`,
  }, [String(answer), ...wrongs.map(String)]);
}

function which(tier, topic, slug, prompts, choices) {
  return row(tier, topic, slug, prompts, choices);
}

const n = (en, fr, qc, de) => ({ en, fr, qc: qc || fr, de });

const easyCounts = [
  ["us-stars", n("stars are on the flag of the United States", "d'étoiles compte le drapeau des États-Unis", "d'étoiles il y a sur le drapeau des États-Unis", "Sterne hat die Flagge der Vereinigten Staaten"), "50", ["48", "13", "52"]],
  ["us-stripes", n("stripes are on the flag of the United States", "de bandes compte le drapeau des États-Unis", "de bandes il y a sur le drapeau des États-Unis", "Streifen hat die Flagge der Vereinigten Staaten"), "13", ["10", "15", "50"]],
  ["alphabet", n("letters are in the English alphabet", "de lettres compte l'alphabet anglais", "de lettres il y a dans l'alphabet anglais", "Buchstaben hat das englische Alphabet"), "26", ["24", "28", "21"]],
  ["greek-letters", n("letters are in the Greek alphabet", "de lettres compte l'alphabet grec", "de lettres il y a dans l'alphabet grec", "Buchstaben hat das griechische Alphabet"), "24", ["22", "26", "20"]],
  ["week-days", n("days are in a week", "de jours compte une semaine", "de jours il y a dans une semaine", "Tage hat eine Woche"), "7", ["5", "6", "8"]],
  ["year-months", n("months are in a year", "de mois compte une année", "de mois il y a dans une année", "Monate hat ein Jahr"), "12", ["10", "11", "13"]],
  ["day-hours", n("hours are in a day", "d'heures compte une journée", "d'heures il y a dans une journée", "Stunden hat ein Tag"), "24", ["12", "20", "36"]],
  ["hour-minutes", n("minutes are in an hour", "de minutes compte une heure", "de minutes il y a dans une heure", "Minuten hat eine Stunde"), "60", ["30", "100", "24"]],
  ["minute-seconds", n("seconds are in a minute", "de secondes compte une minute", "de secondes il y a dans une minute", "Sekunden hat eine Minute"), "60", ["30", "100", "45"]],
  ["circle-degrees", n("degrees are in a full circle", "de degrés compte un cercle complet", "de degrés il y a dans un cercle complet", "Grad hat ein voller Kreis"), "360", ["180", "90", "100"]],
  ["right-angle", n("degrees are in a right angle", "de degrés compte un angle droit", "de degrés il y a dans un angle droit", "Grad hat ein rechter Winkel"), "90", ["45", "180", "60"]],
  ["triangle-sides", n("sides does a triangle have", "de côtés a un triangle", "de côtés il y a sur un triangle", "Seiten hat ein Dreieck"), "3", ["4", "5", "6"]],
  ["pentagon-sides", n("sides does a pentagon have", "de côtés a un pentagone", "de côtés il y a sur un pentagone", "Seiten hat ein Fünfeck"), "5", ["4", "6", "8"]],
  ["hexagon-sides", n("sides does a hexagon have", "de côtés a un hexagone", "de côtés il y a sur un hexagone", "Seiten hat ein Sechseck"), "6", ["5", "8", "4"]],
  ["octagon-sides", n("sides does an octagon have", "de côtés a un octogone", "de côtés il y a sur un octogone", "Seiten hat ein Achteck"), "8", ["6", "10", "4"]],
  ["cube-faces", n("faces does a cube have", "de faces a un cube", "de faces il y a sur un cube", "Flächen hat ein Würfel"), "6", ["4", "8", "12"]],
  ["cube-edges", n("edges does a cube have", "d'arêtes a un cube", "d'arêtes il y a sur un cube", "Kanten hat ein Würfel"), "12", ["6", "8", "16"]],
  ["cube-corners", n("corners does a cube have", "de sommets a un cube", "de sommets il y a sur un cube", "Ecken hat ein Würfel"), "8", ["6", "4", "12"]],
  ["die-faces", n("faces does a standard die have", "de faces a un dé standard", "de faces il y a sur un dé ordinaire", "Flächen hat ein gewöhnlicher Würfel"), "6", ["4", "8", "12"]],
  ["deck-cards", n("cards are in a standard deck, without jokers", "de cartes compte un jeu standard, sans jokers", "de cartes il y a dans un jeu standard, sans jokers", "Karten hat ein normales Blatt, ohne Joker"), "52", ["48", "54", "36"]],
  ["deck-suits", n("suits are in a standard deck of cards", "d'enseignes compte un jeu de cartes standard", "d'enseignes il y a dans un jeu de cartes standard", "Farben hat ein normales Kartenspiel"), "4", ["2", "3", "5"]],
  ["chess-squares", n("squares are on a chessboard", "de cases compte un échiquier", "de cases il y a sur un échiquier", "Felder hat ein Schachbrett"), "64", ["32", "81", "100"]],
  ["chess-pieces", n("pieces does each chess player start with", "de pièces a chaque joueur d'échecs au départ", "de pièces chaque joueur d'échecs a au départ", "Figuren hat jeder Schachspieler am Anfang"), "16", ["8", "12", "32"]],
  ["checkers-pieces", n("pieces does each checkers player start with", "de pions a chaque joueur de dames au départ", "de pions chaque joueur de dames a au départ", "Steine hat jeder Dame-Spieler am Anfang"), "12", ["8", "16", "10"]],
  ["rainbow-colors", n("colours are in a traditional rainbow", "de couleurs compte un arc-en-ciel traditionnel", "de couleurs il y a dans un arc-en-ciel traditionnel", "Farben hat ein traditioneller Regenbogen"), "7", ["5", "6", "8"]],
  ["olympic-rings", n("rings are on the Olympic flag", "d'anneaux compte le drapeau olympique", "d'anneaux il y a sur le drapeau olympique", "Ringe hat die olympische Flagge"), "5", ["4", "6", "7"]],
  ["us-colonies", n("colonies joined to become the original United States", "de colonies ont formé les premiers États-Unis", "de colonies ont formé les premiers États-Unis", "Kolonien bildeten die ersten Vereinigten Staaten"), "13", ["10", "12", "50"]],
  ["bill-rights", n("amendments are in the U.S. Bill of Rights", "d'amendements compte la Déclaration des droits américaine", "d'amendements il y a dans la Déclaration des droits américaine", "Zusätze hat die amerikanische Bill of Rights"), "10", ["8", "12", "27"]],
  ["supreme-court", n("justices sit on the U.S. Supreme Court", "de juges siègent à la Cour suprême des États-Unis", "de juges il y a à la Cour suprême des États-Unis", "Richter sitzen am Obersten Gerichtshof der USA"), "9", ["7", "8", "12"]],
  ["us-states-n", n("states are in the United States", "d'États compte les États-Unis", "d'États il y a dans les États-Unis", "Bundesstaaten haben die Vereinigten Staaten"), "50", ["48", "52", "13"]],
  ["uk-nations", n("countries make up the United Kingdom", "de pays forment le Royaume-Uni", "de pays il y a dans le Royaume-Uni", "Länder bilden das Vereinigte Königreich"), "4", ["3", "5", "2"]],
  ["canada-regions", n("provinces and territories does Canada have", "de provinces et territoires le Canada compte-t-il", "de provinces et de territoires il y a au Canada", "Provinzen und Territorien hat Kanada"), "13", ["10", "12", "15"]],
  ["heart-chambers", n("chambers does the human heart have", "de cavités a le cœur humain", "de cavités il y a dans le cœur humain", "Kammern hat das menschliche Herz"), "4", ["2", "3", "6"]],
  ["adult-teeth", n("teeth does a full adult set have, including wisdom teeth", "de dents compte une dentition adulte complète, avec les dents de sagesse", "de dents il y a dans une dentition adulte complète, avec les dents de sagesse", "Zähne hat ein volles Erwachsenengebiss, inklusive Weisheitszähne"), "32", ["28", "30", "36"]],
  ["insect-legs", n("legs does an insect have", "de pattes a un insecte", "de pattes il y a sur un insecte", "Beine hat ein Insekt"), "6", ["4", "8", "10"]],
  ["spider-legs", n("legs does a spider have", "de pattes a une araignée", "de pattes il y a sur une araignée", "Beine hat eine Spinne"), "8", ["6", "10", "4"]],
  ["butterfly-wings", n("wings does a butterfly have", "d'ailes a un papillon", "d'ailes il y a sur un papillon", "Flügel hat ein Schmetterling"), "4", ["2", "6", "8"]],
  ["earth-moon", n("moons does Earth have", "de lunes a la Terre", "de lunes il y a autour de la Terre", "Monde hat die Erde"), "1", ["0", "2", "4"]],
  ["mars-moons", n("moons does Mars have", "de lunes a Mars", "de lunes il y a autour de Mars", "Monde hat der Mars"), "2", ["1", "4", "8"]],
  ["galilean", n("large moons did Galileo see around Jupiter", "de grandes lunes Galilée a-t-il vues autour de Jupiter", "de grandes lunes Galilée a vues autour de Jupiter", "große Monde sah Galilei um den Jupiter"), "4", ["2", "8", "12"]],
  ["basketball-five", n("players from one team are on a basketball court", "de joueurs d'une équipe sont sur un terrain de basket", "de joueurs d'une équipe il y a sur un terrain de basket", "Spieler einer Mannschaft stehen auf einem Basketballfeld"), "5", ["6", "7", "11"]],
  ["baseball-nine", n("players from one team take the field in baseball", "de joueurs d'une équipe entrent sur le terrain au baseball", "de joueurs d'une équipe il y a sur le terrain au baseball", "Spieler einer Mannschaft stehen beim Baseball auf dem Feld"), "9", ["8", "10", "11"]],
  ["baseball-bases", n("bases are on a baseball diamond", "de bases compte un diamant de baseball", "de buts il y a sur un terrain de baseball", "Bases hat ein Baseballfeld"), "4", ["3", "5", "6"]],
  ["baseball-innings", n("innings are in a standard baseball game", "de manches compte un match de baseball standard", "de manches il y a dans un match de baseball standard", "Innings hat ein normales Baseballspiel"), "9", ["7", "8", "10"]],
  ["baseball-strikes", n("strikes make an out in baseball", "de prises font un retrait au baseball", "de prises font un retrait au baseball", "Strikes ergeben ein Aus beim Baseball"), "3", ["2", "4", "5"]],
  ["hockey-skaters", n("skaters from one team are on the ice in ice hockey, including the goalkeeper", "de patineurs d'une équipe sont sur la glace au hockey, gardien compris", "de patineurs d'une équipe il y a sur la glace au hockey, gardien compris", "Läufer einer Mannschaft sind beim Eishockey auf dem Eis, inklusive Torwart"), "6", ["5", "7", "11"]],
  ["hockey-periods", n("periods are in a standard ice hockey game", "de périodes compte un match de hockey standard", "de périodes il y a dans un match de hockey standard", "Drittel hat ein normales Eishockeyspiel"), "3", ["2", "4", "5"]],
  ["volleyball-six", n("players from one team are on an indoor volleyball court", "de joueurs d'une équipe sont sur un terrain de volley en salle", "de joueurs d'une équipe il y a sur un terrain de volley en salle", "Spieler einer Mannschaft stehen auf einem Hallenvolleyballfeld"), "6", ["5", "7", "4"]],
  ["golf-holes", n("holes are in a standard round of golf", "de trous compte un parcours de golf standard", "de trous il y a dans une ronde de golf standard", "Löcher hat eine normale Golfrunde"), "18", ["9", "12", "16"]],
  ["nba-quarters", n("quarters are in an NBA game", "de quart-temps compte un match de NBA", "de quarts il y a dans un match de la NBA", "Viertel hat ein NBA-Spiel"), "4", ["2", "3", "5"]],
  ["football-yards", n("yards long is an American football field between the goal lines", "de yards mesure un terrain de football américain entre les lignes de but", "de verges mesure un terrain de football américain entre les lignes de but", "Yards lang ist ein American-Football-Feld zwischen den Goallinien"), "100", ["50", "90", "120"]],
  ["touchdown-points", n("points is a touchdown worth in American football, before the kick", "de points vaut un touché au football américain, avant le botté", "de points vaut un touché au football américain, avant le botté", "Punkte bringt ein Touchdown im American Football, vor dem Kick"), "6", ["3", "7", "1"]],
  ["field-goal-points", n("points is a field goal worth in American football", "de points vaut un field goal au football américain", "de points vaut un botté de précision au football américain", "Punkte bringt ein Field Goal im American Football"), "3", ["1", "2", "6"]],
  ["rugby-union", n("players are on a rugby union team", "de joueurs compte une équipe de rugby à XV", "de joueurs il y a dans une équipe de rugby à XV", "Spieler hat eine Rugby-Union-Mannschaft"), "15", ["13", "11", "7"]],
  ["cricket-eleven", n("players are on a cricket team", "de joueurs compte une équipe de cricket", "de joueurs il y a dans une équipe de cricket", "Spieler hat eine Cricket-Mannschaft"), "11", ["9", "13", "15"]],
  ["both-soccer", n("players start a soccer match on the pitch, counting both teams", "de joueurs commencent un match de soccer sur le terrain, les deux équipes", "de joueurs commencent un match de soccer sur le terrain, les deux équipes", "Spieler beginnen ein Fußballspiel auf dem Platz, beide Mannschaften"), "22", ["11", "20", "18"]],
  ["nfl-teams", n("teams are in the NFL", "d'équipes compte la NFL", "d'équipes il y a dans la NFL", "Teams hat die NFL"), "32", ["30", "28", "16"]],
  ["nba-teams", n("teams are in the NBA", "d'équipes compte la NBA", "d'équipes il y a dans la NBA", "Teams hat die NBA"), "30", ["32", "28", "16"]],
  ["mlb-teams", n("teams are in Major League Baseball", "d'équipes compte la Ligue majeure de baseball", "d'équipes il y a dans la Ligue majeure de baseball", "Teams hat die Major League Baseball"), "30", ["32", "28", "16"]],
  ["nhl-teams", n("teams are in the NHL", "d'équipes compte la LNH", "d'équipes il y a dans la LNH", "Teams hat die NHL"), "32", ["30", "31", "16"]],
  ["premier-league", n("clubs are in the English Premier League", "de clubs compte la Premier League anglaise", "de clubs il y a dans la Premier League anglaise", "Klubs hat die englische Premier League"), "20", ["18", "16", "22"]],
  ["grand-slams", n("Grand Slam tennis tournaments are played each year", "de tournois du Grand Chelem de tennis ont lieu chaque année", "de tournois du Grand Chelem de tennis il y a chaque année", "Grand-Slam-Tennisturniere gibt es jedes Jahr"), "4", ["3", "5", "2"]],
  ["curling-team", n("players are on a curling team", "de joueurs compte une équipe de curling", "de joueurs il y a dans une équipe de curling", "Spieler hat ein Curling-Team"), "4", ["2", "6", "8"]],
  ["water-polo", n("players from one team are in the water in water polo", "de joueurs d'une équipe sont dans l'eau au water-polo", "de joueurs d'une équipe il y a dans l'eau au water-polo", "Spieler einer Mannschaft sind beim Wasserball im Wasser"), "7", ["6", "5", "11"]],
  ["handball-seven", n("players from one team are on a handball court", "de joueurs d'une équipe sont sur un terrain de handball", "de joueurs d'une équipe il y a sur un terrain de handball", "Spieler einer Mannschaft stehen auf einem Handballfeld"), "7", ["6", "5", "11"]],
  ["piano-white", n("white keys are on a standard piano", "de touches blanches a un piano standard", "de touches blanches il y a sur un piano standard", "weiße Tasten hat ein gewöhnliches Klavier"), "52", ["36", "48", "88"]],
  ["piano-black", n("black keys are on a standard piano", "de touches noires a un piano standard", "de touches noires il y a sur un piano standard", "schwarze Tasten hat ein gewöhnliches Klavier"), "36", ["52", "32", "24"]],
  ["staff-lines", n("lines are on a standard music staff", "de lignes compte une portée musicale standard", "de lignes il y a sur une portée musicale standard", "Linien hat ein normales Notensystem"), "5", ["4", "6", "8"]],
  ["bass-strings", n("strings does a standard bass guitar have", "de cordes a une basse standard", "de cordes il y a sur une basse standard", "Saiten hat eine normale Bassgitarre"), "4", ["6", "5", "8"]],
  ["ukulele-strings", n("strings does a standard soprano ukulele have", "de cordes a un ukulélé soprano standard", "de cordes il y a sur un ukulélé soprano standard", "Saiten hat eine normale Sopran-Ukulele"), "4", ["6", "3", "8"]],
  ["mandolin-strings", n("strings does a standard mandolin have", "de cordes a une mandoline standard", "de cordes il y a sur une mandoline standard", "Saiten hat eine normale Mandoline"), "8", ["4", "6", "12"]],
  ["trumpet-valves", n("valves does a standard trumpet have", "de pistons a une trompette standard", "de pistons il y a sur une trompette standard", "Ventile hat eine normale Trompete"), "3", ["2", "4", "5"]],
  ["haiku-lines", n("lines are in a haiku", "de vers compte un haïku", "de vers il y a dans un haïku", "Zeilen hat ein Haiku"), "3", ["4", "5", "17"]],
  ["haiku-syllables", n("syllables are in a traditional haiku", "de syllabes compte un haïku traditionnel", "de syllabes il y a dans un haïku traditionnel", "Silben hat ein traditionelles Haiku"), "17", ["14", "15", "19"]],
  ["named-oceans", n("oceans are commonly named on a world map", "d'océans sont couramment nommés sur une carte du monde", "d'océans on nomme d'habitude sur une carte du monde", "Ozeane werden auf einer Weltkarte gewöhnlich genannt"), "5", ["4", "6", "7"]],
  ["freeze-f", n("degrees Fahrenheit is the freezing point of water", "de degrés Fahrenheit marque le gel de l'eau", "de degrés Fahrenheit marque le gel de l'eau", "Grad Fahrenheit ist der Gefrierpunkt von Wasser"), "32", ["0", "100", "212"]],
  ["boil-f", n("degrees Fahrenheit is the boiling point of water at sea level", "de degrés Fahrenheit marque l'ébullition de l'eau au niveau de la mer", "de degrés Fahrenheit marque l'ébullition de l'eau au niveau de la mer", "Grad Fahrenheit ist der Siedepunkt von Wasser auf Meereshöhe"), "212", ["100", "180", "32"]],
  ["km-meters", n("meters are in a kilometer", "de mètres compte un kilomètre", "de mètres il y a dans un kilomètre", "Meter hat ein Kilometer"), "1000", ["100", "500", "1609"]],
  ["kg-grams", n("grams are in a kilogram", "de grammes compte un kilogramme", "de grammes il y a dans un kilogramme", "Gramm hat ein Kilogramm"), "1000", ["100", "500", "16"]],
  ["meter-cm", n("centimeters are in a meter", "de centimètres compte un mètre", "de centimètres il y a dans un mètre", "Zentimeter hat ein Meter"), "100", ["10", "1000", "12"]],
  ["cm-mm", n("millimeters are in a centimeter", "de millimètres compte un centimètre", "de millimètres il y a dans un centimètre", "Millimeter hat ein Zentimeter"), "10", ["100", "12", "5"]],
  ["decade-years", n("years are in a decade", "d'années compte une décennie", "d'années il y a dans une décennie", "Jahre hat ein Jahrzehnt"), "10", ["12", "100", "5"]],
  ["century-years", n("years are in a century", "d'années compte un siècle", "d'années il y a dans un siècle", "Jahre hat ein Jahrhundert"), "100", ["10", "1000", "50"]],
  ["year-days", n("days are in a common year that is not a leap year", "de jours compte une année commune, sans jour intercalaire", "de jours il y a dans une année ordinaire, sans jour de plus", "Tage hat ein gewöhnliches Jahr, das kein Schaltjahr ist"), "365", ["364", "366", "360"]],
  ["week-hours", n("hours are in a week", "d'heures compte une semaine", "d'heures il y a dans une semaine", "Stunden hat eine Woche"), "168", ["144", "120", "240"]],
  ["world-cup-2022", n("teams played in the 2022 FIFA World Cup finals", "d'équipes ont joué la phase finale de la Coupe du monde 2022", "d'équipes ont joué la phase finale de la Coupe du monde 2022", "Teams spielten bei der Endrunde der Fußball-WM 2022"), "32", ["24", "16", "48"]],
  ["motorcycle-wheels", n("wheels does a typical motorcycle have", "de roues a une moto typique", "de roues il y a sur une moto typique", "Räder hat ein typisches Motorrad"), "2", ["3", "4", "1"]],
  ["bicycle-wheels", n("wheels does a typical bicycle have", "de roues a un vélo typique", "de roues il y a sur un vélo typique", "Räder hat ein typisches Fahrrad"), "2", ["1", "3", "4"]],
  ["traffic-light", n("colours does a standard traffic light cycle show", "de couleurs montre un feu de circulation standard", "de couleurs un feu de circulation standard montre", "Farben zeigt eine normale Ampel"), "3", ["2", "4", "5"]],
];

const landmarks = [
  ["eiffel-country", n("the Eiffel Tower", "la tour Eiffel", "la tour Eiffel", "der Eiffelturm"), n("France", "France", "France", "Frankreich"), ["Italy", "Spain", "Belgium"]],
  ["colosseum-country", n("the Colosseum", "le Colisée", "le Colisée", "das Kolosseum"), n("Italy", "Italie", "Italie", "Italien"), ["Greece", "Spain", "France"]],
  ["machu-country", n("Machu Picchu", "le Machu Picchu", "le Machu Picchu", "Machu Picchu"), n("Peru", "Pérou", "Pérou", "Peru"), ["Mexico", "Chile", "Bolivia"]],
  ["taj-country", n("the Taj Mahal", "le Taj Mahal", "le Taj Mahal", "das Taj Mahal"), n("India", "Inde", "Inde", "Indien"), ["Pakistan", "Nepal", "Iran"]],
  ["petra-country", n("the ancient city of Petra", "la cité antique de Pétra", "la cité antique de Pétra", "die antike Stadt Petra"), n("Jordan", "Jordanie", "Jordanie", "Jordanien"), ["Egypt", "Israel", "Syria"]],
  ["stonehenge-country", n("Stonehenge", "Stonehenge", "Stonehenge", "Stonehenge"), n("the United Kingdom", "Royaume-Uni", "Royaume-Uni", "Vereinigtes Königreich"), ["Ireland", "France", "Denmark"]],
  ["acropolis-country", n("the Acropolis of Athens", "l'Acropole d'Athènes", "l'Acropole d'Athènes", "die Akropolis von Athen"), n("Greece", "Grèce", "Grèce", "Griechenland"), ["Italy", "Turkey", "Egypt"]],
  ["christ-country", n("the statue Christ the Redeemer", "la statue du Christ Rédempteur", "la statue du Christ Rédempteur", "die Statue Christus der Erlöser"), n("Brazil", "Brésil", "Brésil", "Brasilien"), ["Portugal", "Argentina", "Spain"]],
  ["opera-country", n("the Sydney Opera House", "l'Opéra de Sydney", "l'Opéra de Sydney", "das Opernhaus von Sydney"), n("Australia", "Australie", "Australie", "Australien"), ["New Zealand", "the United Kingdom", "Canada"]],
  ["kremlin-country", n("the Moscow Kremlin", "le Kremlin de Moscou", "le Kremlin de Moscou", "der Moskauer Kreml"), n("Russia", "Russie", "Russie", "Russland"), ["Ukraine", "Poland", "Finland"]],
  ["chichen-country", n("Chichén Itzá", "Chichén Itzá", "Chichén Itzá", "Chichén Itzá"), n("Mexico", "Mexique", "Mexique", "Mexiko"), ["Guatemala", "Peru", "Spain"]],
  ["angkor-country", n("Angkor Wat", "Angkor Wat", "Angkor Wat", "Angkor Wat"), n("Cambodia", "Cambodge", "Cambodge", "Kambodscha"), ["Thailand", "Vietnam", "Laos"]],
  ["forbidden-country", n("the Forbidden City", "la Cité interdite", "la Cité interdite", "die Verbotene Stadt"), n("China", "Chine", "Chine", "China"), ["Japan", "South Korea", "Mongolia"]],
  ["neuschwanstein-country", n("Neuschwanstein Castle", "le château de Neuschwanstein", "le château de Neuschwanstein", "Schloss Neuschwanstein"), n("Germany", "Allemagne", "Allemagne", "Deutschland"), ["Austria", "Switzerland", "France"]],
  ["cn-tower-country", n("the CN Tower", "la Tour CN", "la Tour CN", "der CN Tower"), n("Canada", "Canada", "Canada", "Kanada"), ["the United States", "the United Kingdom", "France"]],
  ["burj-country", n("the Burj Khalifa", "la Burj Khalifa", "la Burj Khalifa", "der Burj Khalifa"), n("the United Arab Emirates", "Émirats arabes unis", "Émirats arabes unis", "Vereinigte Arabische Emirate"), ["Saudi Arabia", "Qatar", "India"]],
  ["fuji-country", n("Mount Fuji", "le mont Fuji", "le mont Fuji", "der Berg Fuji"), n("Japan", "Japon", "Japon", "Japan"), ["China", "South Korea", "Indonesia"]],
  ["kili-country", n("Mount Kilimanjaro", "le Kilimandjaro", "le Kilimandjaro", "der Kilimandscharo"), n("Tanzania", "Tanzanie", "Tanzanie", "Tansania"), ["Kenya", "Ethiopia", "Uganda"]],
  ["alps-continent", n("the Alps", "les Alpes", "les Alpes", "die Alpen"), n("Europe", "Europe", "Europe", "Europa"), ["Asia", "Africa", "South America"]],
  ["andes-continent", n("the Andes", "les Andes", "les Andes", "die Anden"), n("South America", "Amérique du Sud", "Amérique du Sud", "Südamerika"), ["North America", "Africa", "Europe"]],
  ["sahara-continent", n("the Sahara", "le Sahara", "le Sahara", "die Sahara"), n("Africa", "Afrique", "Afrique", "Afrika"), ["Asia", "Australia", "Europe"]],
  ["canyon-country", n("the Grand Canyon", "le Grand Canyon", "le Grand Canyon", "der Grand Canyon"), n("the United States", "États-Unis", "États-Unis", "Vereinigte Staaten"), ["Mexico", "Canada", "Australia"]],
  ["reef-country", n("the Great Barrier Reef", "la Grande Barrière de corail", "la Grande Barrière de corail", "das Great Barrier Reef"), n("Australia", "Australie", "Australie", "Australien"), ["Indonesia", "Fiji", "Brazil"]],
  ["niagara-country", n("Niagara Falls, on the side shared with New York", "les chutes du Niagara, du côté partagé avec New York", "les chutes du Niagara, du côté partagé avec New York", "die Niagarafälle, auf der Seite mit New York"), n("Canada", "Canada", "Canada", "Kanada"), ["Mexico", "the United Kingdom", "France"]],
  ["victoria-country", n("Victoria Falls", "les chutes Victoria", "les chutes Victoria", "die Victoriafälle"), n("on the Zambia–Zimbabwe border", "à la frontière Zambie-Zimbabwe", "à la frontière Zambie-Zimbabwe", "an der Grenze Sambia–Simbabwe"), ["Kenya", "Egypt", "South Africa"]],
  ["liberty-country", n("the Statue of Liberty", "la statue de la Liberté", "la statue de la Liberté", "die Freiheitsstatue"), n("the United States", "États-Unis", "États-Unis", "Vereinigte Staaten"), ["France", "the United Kingdom", "Canada"]],
  ["bigben-country", n("the bell called Big Ben", "la cloche appelée Big Ben", "la cloche appelée Big Ben", "die Glocke Big Ben"), n("the United Kingdom", "Royaume-Uni", "Royaume-Uni", "Vereinigtes Königreich"), ["the United States", "France", "Ireland"]],
  ["sagrada-country", n("the Sagrada Família", "la Sagrada Família", "la Sagrada Família", "die Sagrada Família"), n("Spain", "Espagne", "Espagne", "Spanien"), ["Italy", "Portugal", "France"]],
  ["great-wall-country", n("the Great Wall", "la Grande Muraille", "la Grande Muraille", "die Große Mauer"), n("China", "Chine", "Chine", "China"), ["Mongolia", "Japan", "India"]],
  ["sphinx-country", n("the Great Sphinx of Giza", "le Grand Sphinx de Gizeh", "le Grand Sphinx de Gizeh", "die Große Sphinx von Gizeh"), n("Egypt", "Égypte", "Égypte", "Ägypten"), ["Sudan", "Greece", "Iraq"]],
];

const painters = [
  ["scream-paint", "The Scream", "Edvard Munch", ["Vincent van Gogh", "Claude Monet", "Edvard Grieg"]],
  ["pearl-paint", "Girl with a Pearl Earring", "Johannes Vermeer", ["Rembrandt", "Johannes Brahms", "Jan van Eyck"]],
  ["clocks-paint", "The Persistence of Memory", "Salvador Dalí", ["Pablo Picasso", "Joan Miró", "René Magritte"]],
  ["guernica-paint", "Guernica", "Pablo Picasso", ["Salvador Dalí", "Francisco Goya", "Diego Velázquez"]],
  ["venus-paint", "The Birth of Venus", "Sandro Botticelli", ["Leonardo da Vinci", "Raphael", "Michelangelo"]],
  ["gothic-paint", "American Gothic", "Grant Wood", ["Edward Hopper", "Norman Rockwell", "Andrew Wyeth"]],
  ["nightwatch-paint", "The Night Watch", "Rembrandt", ["Johannes Vermeer", "Frans Hals", "Peter Paul Rubens"]],
  ["lilies-paint", "the Water Lilies series", "Claude Monet", ["Pierre-Auguste Renoir", "Edgar Degas", "Paul Cézanne"]],
  ["kiss-paint", "the painting The Kiss", "Gustav Klimt", ["Egon Schiele", "August Rodin", "Alphonse Mucha"]],
  ["soup-paint", "the Campbell's Soup Cans", "Andy Warhol", ["Roy Lichtenstein", "Keith Haring", "Jean-Michel Basquiat"]],
  ["son-man-paint", "The Son of Man", "René Magritte", ["Salvador Dalí", "Max Ernst", "Giorgio de Chirico"]],
  ["nighthawks-paint", "Nighthawks", "Edward Hopper", ["Grant Wood", "Norman Rockwell", "Andrew Wyeth"]],
  ["wave-paint", "The Great Wave off Kanagawa", "Hokusai", ["Hiroshige", "Utamaro", "Yayoi Kusama"]],
  ["meninas-paint", "Las Meninas", "Diego Velázquez", ["Francisco Goya", "El Greco", "Bartolomé Murillo"]],
  ["athens-paint", "The School of Athens", "Raphael", ["Michelangelo", "Leonardo da Vinci", "Titian"]],
  ["adam-paint", "The Creation of Adam", "Michelangelo", ["Raphael", "Donatello", "Leonardo da Vinci"]],
  ["sunflowers-paint", "the Sunflowers still lifes", "Vincent van Gogh", ["Paul Gauguin", "Claude Monet", "Paul Cézanne"]],
  ["whistler-paint", "Arrangement in Grey and Black No. 1, often called Whistler's Mother", "James McNeill Whistler", ["John Singer Sargent", "Winslow Homer", "Thomas Eakins"]],
  ["bosch-paint", "The Garden of Earthly Delights", "Hieronymus Bosch", ["Pieter Bruegel the Elder", "Albrecht Dürer", "Jan van Eyck"]],
  ["birth-paint", "The Starry Night is already famous. Who painted Café Terrace at Night?", "Vincent van Gogh", ["Paul Gauguin", "Henri de Toulouse-Lautrec", "Edgar Degas"]],
];

const books = [
  ["romeo-book", "the play Romeo and Juliet", "William Shakespeare", ["Christopher Marlowe", "Ben Jonson", "John Milton"]],
  ["hamlet-book", "the play Hamlet", "William Shakespeare", ["Christopher Marlowe", "Molière", "Henrik Ibsen"]],
  ["1984-book", "the novel 1984", "George Orwell", ["Aldous Huxley", "Ray Bradbury", "H. G. Wells"]],
  ["farm-book", "the novel Animal Farm", "George Orwell", ["George Eliot", "Aldous Huxley", "John Steinbeck"]],
  ["pride-book", "the novel Pride and Prejudice", "Jane Austen", ["Charlotte Brontë", "Emily Brontë", "Mary Shelley"]],
  ["frank-book", "the novel Frankenstein", "Mary Shelley", ["Bram Stoker", "Edgar Allan Poe", "Jane Austen"]],
  ["dracula-book", "the novel Dracula", "Bram Stoker", ["Mary Shelley", "Edgar Allan Poe", "Robert Louis Stevenson"]],
  ["hobbit-book", "the novel The Hobbit", "J. R. R. Tolkien", ["C. S. Lewis", "J. K. Rowling", "George R. R. Martin"]],
  ["potter-author", "the Harry Potter novels", "J. K. Rowling", ["Roald Dahl", "Philip Pullman", "Rick Riordan"]],
  ["prince-book", "the book The Little Prince", "Antoine de Saint-Exupéry", ["Jules Verne", "Victor Hugo", "Albert Camus"]],
  ["quixote-book", "the novel Don Quixote", "Miguel de Cervantes", ["Lope de Vega", "Gabriel García Márquez", "Federico García Lorca"]],
  ["crime-book", "the novel Crime and Punishment", "Fyodor Dostoevsky", ["Leo Tolstoy", "Anton Chekhov", "Ivan Turgenev"]],
  ["solitude-book", "the novel One Hundred Years of Solitude", "Gabriel García Márquez", ["Isabel Allende", "Jorge Luis Borges", "Pablo Neruda"]],
  ["odyssey-book", "the epic poem the Odyssey", "Homer", ["Virgil", "Ovid", "Sophocles"]],
  ["iliad-book", "the epic poem the Iliad", "Homer", ["Virgil", "Hesiod", "Aeschylus"]],
  ["gatsby-book", "the novel The Great Gatsby", "F. Scott Fitzgerald", ["Ernest Hemingway", "John Steinbeck", "William Faulkner"]],
  ["mockingbird-book", "the novel To Kill a Mockingbird", "Harper Lee", ["Truman Capote", "Toni Morrison", "Flannery O'Connor"]],
  ["charlotte-book", "the book Charlotte's Web", "E. B. White", ["Roald Dahl", "Beatrix Potter", "A. A. Milne"]],
  ["matilda-book", "the book Matilda", "Roald Dahl", ["Enid Blyton", "J. K. Rowling", "Dr. Seuss"]],
  ["charlie-book", "the book Charlie and the Chocolate Factory", "Roald Dahl", ["Roald Amundsen", "C. S. Lewis", "Lewis Carroll"]],
  ["cat-hat-book", "the book The Cat in the Hat", "Dr. Seuss", ["Maurice Sendak", "Eric Carle", "Shel Silverstein"]],
  ["wild-book", "the book Where the Wild Things Are", "Maurice Sendak", ["Dr. Seuss", "Eric Carle", "Crockett Johnson"]],
  ["gables-book", "the book Anne of Green Gables", "L. M. Montgomery", ["Lucy Maud who is the same writer under initials", "Louisa May Alcott", "Laura Ingalls Wilder"]],
];

// Fix Anne of Green Gables wrong answer - "Lucy Maud who is the same writer" is a bad distractor.
// I'll replace that entry's wrongs below by not using this tuple's third wrong as a joke about the author.
// Overwrite after map if needed. I'll filter this one out and add a clean version.

const booksClean = books.filter((row) => row[0] !== "gables-book");
booksClean.push(["gables-book", "the book Anne of Green Gables", "L. M. Montgomery", ["Louisa May Alcott", "Laura Ingalls Wilder", "Lucy Maud is the author's full name, so the scored name is L. M. Montgomery"]]);
// That third choice gives away the answer. Use a real other author.
booksClean.pop();
booksClean.push(["gables-book", "the book Anne of Green Gables", "L. M. Montgomery", ["Louisa May Alcott", "Laura Ingalls Wilder", "Frances Hodgson Burnett"]]);
booksClean.push(["diary-book", "The Diary of a Young Girl", "Anne Frank", ["Elie Wiesel", "Primo Levi", "Corrie ten Boom"]]);
booksClean.push(["achebe-book", "the novel Things Fall Apart", "Chinua Achebe", ["Wole Soyinka", "Ngũgĩ wa Thiong'o", "Ben Okri"]]);
booksClean.push(["alchemist-book", "the novel The Alchemist", "Paulo Coelho", ["Gabriel García Márquez", "Isabel Allende", "Jorge Luis Borges"]]);
booksClean.push(["metamorphosis-book", "the story The Metamorphosis", "Franz Kafka", ["Thomas Mann", "Hermann Hesse", "Stefan Zweig"]]);
booksClean.push(["faust-book", "the play Faust", "Johann Wolfgang von Goethe", ["Friedrich Schiller", "Heinrich Heine", "Bertolt Brecht"]]);
booksClean.push(["stranger-book", "the novel The Stranger", "Albert Camus", ["Jean-Paul Sartre", "Simone de Beauvoir", "André Gide"]]);
booksClean.push(["miserables-book", "the novel Les Misérables", "Victor Hugo", ["Alexandre Dumas", "Émile Zola", "Gustave Flaubert"]]);
booksClean.push(["musketeers-book", "the novel The Three Musketeers", "Alexandre Dumas", ["Victor Hugo", "Honoré de Balzac", "Jules Verne"]]);
booksClean.push(["leagues-book", "the novel Twenty Thousand Leagues Under the Seas", "Jules Verne", ["H. G. Wells", "Robert Louis Stevenson", "Herman Melville"]]);
booksClean.push(["eighty-book", "the novel Around the World in Eighty Days", "Jules Verne", ["Mark Twain", "Agatha Christie", "H. G. Wells"]]);
booksClean.push(["sherlock-book", "the Sherlock Holmes stories", "Arthur Conan Doyle", ["Agatha Christie", "G. K. Chesterton", "Edgar Allan Poe"]]);
booksClean.push(["none-book", "the novel And Then There Were None", "Agatha Christie", ["Arthur Conan Doyle", "Dorothy L. Sayers", "Ngaio Marsh"]]);
booksClean.push(["orient-book", "the novel Murder on the Orient Express", "Agatha Christie", ["Arthur Conan Doyle", "Ruth Rendell", "P. D. James"]]);
booksClean.push(["little-women", "the novel Little Women", "Louisa May Alcott", ["L. M. Montgomery", "Jane Austen", "Emily Brontë"]]);
booksClean.push(["wonderland-book", "Alice's Adventures in Wonderland", "Lewis Carroll", ["J. M. Barrie", "Roald Dahl", "A. A. Milne"]]);
booksClean.push(["treasure-book", "the novel Treasure Island", "Robert Louis Stevenson", ["Daniel Defoe", "Jonathan Swift", "Jules Verne"]]);
booksClean.push(["gulliver-book", "Gulliver's Travels", "Jonathan Swift", ["Daniel Defoe", "Voltaire", "Laurence Sterne"]]);
booksClean.push(["crusoe-book", "the novel Robinson Crusoe", "Daniel Defoe", ["Jonathan Swift", "Robert Louis Stevenson", "Herman Melville"]]);
booksClean.push(["moby-book", "the novel Moby-Dick", "Herman Melville", ["Nathaniel Hawthorne", "Jack London", "Joseph Conrad"]]);
booksClean.push(["tale-cities", "the novel A Tale of Two Cities", "Charles Dickens", ["Thomas Hardy", "William Makepeace Thackeray", "George Eliot"]]);
booksClean.push(["oliver-book", "the novel Oliver Twist", "Charles Dickens", ["Charlotte Brontë", "Jane Austen", "Thomas Hardy"]]);
booksClean.push(["war-peace", "the novel War and Peace", "Leo Tolstoy", ["Fyodor Dostoevsky", "Ivan Turgenev", "Anton Chekhov"]]);
booksClean.push(["anna-book", "the novel Anna Karenina", "Leo Tolstoy", ["Fyodor Dostoevsky", "Gustave Flaubert", "Thomas Mann"]]);
booksClean.push(["madame-book", "the novel Madame Bovary", "Gustave Flaubert", ["Émile Zola", "Victor Hugo", "Honoré de Balzac"]]);
booksClean.push(["old-man-book", "the novel The Old Man and the Sea", "Ernest Hemingway", ["F. Scott Fitzgerald", "John Steinbeck", "William Faulkner"]]);
booksClean.push(["grapes-book", "the novel The Grapes of Wrath", "John Steinbeck", ["Ernest Hemingway", "William Faulkner", "Harper Lee"]]);
booksClean.push(["beloved-book", "the novel Beloved", "Toni Morrison", ["Maya Angelou", "Alice Walker", "Zora Neale Hurston"]]);
booksClean.push(["color-purple", "the novel The Color Purple", "Alice Walker", ["Toni Morrison", "Maya Angelou", "Octavia Butler"]]);
booksClean.push(["handmaid-book", "the novel The Handmaid's Tale", "Margaret Atwood", ["Ursula K. Le Guin", "Doris Lessing", "Alice Munro"]]);
booksClean.push(["left-hand", "the novel The Left Hand of Darkness", "Ursula K. Le Guin", ["Octavia Butler", "Margaret Atwood", "Philip K. Dick"]]);
booksClean.push(["kindred-book", "the novel Kindred", "Octavia E. Butler", ["Toni Morrison", "Ursula K. Le Guin", "N. K. Jemisin"]]);
booksClean.push(["narnia-book", "The Lion, the Witch and the Wardrobe", "C. S. Lewis", ["J. R. R. Tolkien", "Roald Dahl", "Philip Pullman"]]);
booksClean.push(["peter-pan", "the story Peter Pan", "J. M. Barrie", ["Lewis Carroll", "A. A. Milne", "Kenneth Grahame"]]);
booksClean.push(["wind-willows", "the book The Wind in the Willows", "Kenneth Grahame", ["A. A. Milne", "Beatrix Potter", "E. B. White"]]);

const music = [
  ["seasons-music", "The Four Seasons", "Antonio Vivaldi", ["Johann Sebastian Bach", "George Frideric Handel", "Arcangelo Corelli"]],
  ["ode-music", "the symphony that contains the Ode to Joy finale", "Ludwig van Beethoven", ["Wolfgang Amadeus Mozart", "Franz Schubert", "Johannes Brahms"]],
  ["flute-music", "the opera The Magic Flute", "Wolfgang Amadeus Mozart", ["Ludwig van Beethoven", "Joseph Haydn", "Christoph Willibald Gluck"]],
  ["nutcracker-music", "the ballet The Nutcracker", "Pyotr Ilyich Tchaikovsky", ["Igor Stravinsky", "Sergei Prokofiev", "Maurice Ravel"]],
  ["swan-music", "the ballet Swan Lake", "Pyotr Ilyich Tchaikovsky", ["Igor Stravinsky", "Adolphe Adam", "Léo Delibes"]],
  ["carmen-music", "the opera Carmen", "Georges Bizet", ["Giuseppe Verdi", "Giacomo Puccini", "Richard Wagner"]],
  ["messiah-music", "the oratorio Messiah", "George Frideric Handel", ["Johann Sebastian Bach", "Henry Purcell", "Antonio Vivaldi"]],
  ["brandenburg-music", "the Brandenburg Concertos", "Johann Sebastian Bach", ["George Frideric Handel", "Antonio Vivaldi", "Georg Philipp Telemann"]],
  ["rhapsody-music", "Rhapsody in Blue", "George Gershwin", ["Aaron Copland", "Leonard Bernstein", "Duke Ellington"]],
  ["rite-music", "the ballet The Rite of Spring", "Igor Stravinsky", ["Sergei Prokofiev", "Béla Bartók", "Claude Debussy"]],
  ["bolero-music", "the orchestral piece Boléro", "Maurice Ravel", ["Claude Debussy", "Camille Saint-Saëns", "Gabriel Fauré"]],
  ["peer-music", "the incidental music Peer Gynt", "Edvard Grieg", ["Jean Sibelius", "Carl Nielsen", "Edvard Munch"]],
  ["thriller-music", "the song Thriller", "Michael Jackson", ["Prince", "Stevie Wonder", "Lionel Richie"]],
  ["purple-music", "the song Purple Rain", "Prince", ["Michael Jackson", "David Bowie", "Rick James"]],
  ["bohemian-music", "the song Bohemian Rhapsody", "Queen", ["The Beatles", "Led Zeppelin", "The Who"]],
  ["imagine-music", "the song Imagine", "John Lennon", ["Paul McCartney", "George Harrison", "Bob Dylan"]],
  ["respect-music", "the song Respect, in the famous 1967 recording", "Aretha Franklin", ["Diana Ross", "Tina Turner", "Etta James"]],
  ["no-woman-music", "the song No Woman, No Cry", "Bob Marley", ["Peter Tosh", "Jimmy Cliff", "Toots Hibbert"]],
  ["blowin-music", "the song Blowin' in the Wind", "Bob Dylan", ["Woody Guthrie", "Joan Baez", "Pete Seeger"]],
  ["born-usa-music", "the song Born in the U.S.A.", "Bruce Springsteen", ["Bob Seger", "Tom Petty", "John Mellencamp"]],
  ["rolling-music", "the song Like a Rolling Stone", "Bob Dylan", ["The Rolling Stones", "Mick Jagger", "Neil Young"]],
  ["hey-ya-music", "the song Hey Ya!", "OutKast", ["Kanye West", "Beyoncé", "Usher"]],
  ["single-music", "the song Single Ladies (Put a Ring on It)", "Beyoncé", ["Rihanna", "Alicia Keys", "Jennifer Lopez"]],
  ["bad-guy-music", "the song bad guy", "Billie Eilish", ["Olivia Rodrigo", "Lorde", "Dua Lipa"]],
  ["blinding-music", "the song Blinding Lights", "The Weeknd", ["Drake", "Bruno Mars", "Post Malone"]],
  ["shape-music", "the song Shape of You", "Ed Sheeran", ["Shawn Mendes", "Justin Bieber", "Sam Smith"]],
  ["gangnam-music", "the song Gangnam Style", "Psy", ["BTS", "Blackpink", "Rain"]],
  ["old-town-music", "the song Old Town Road", "Lil Nas X", ["Post Malone", "Travis Scott", "Drake"]],
  ["license-music", "the song drivers license", "Olivia Rodrigo", ["Billie Eilish", "Taylor Swift", "Sabrina Carpenter"]],
  ["as-it-was", "the song As It Was", "Harry Styles", ["Niall Horan", "Louis Tomlinson", "Ed Sheeran"]],
  ["anti-hero", "the song Anti-Hero", "Taylor Swift", ["Billie Eilish", "Adele", "Lana Del Rey"]],
  ["espresso-music", "the 2024 song Espresso", "Sabrina Carpenter", ["Olivia Rodrigo", "Dua Lipa", "Chappell Roan"]],
  ["u2-voice", "the band U2, as lead singer", "Bono", ["The Edge", "Adam Clayton", "Larry Mullen Jr."]],
  ["coldplay-voice", "the band Coldplay, as lead singer", "Chris Martin", ["Jonny Buckland", "Guy Berryman", "Will Champion"]],
  ["radiohead-voice", "the band Radiohead, as lead singer", "Thom Yorke", ["Jonny Greenwood", "Ed O'Brien", "Colin Greenwood"]],
  ["nirvana-voice", "the band Nirvana, as lead singer", "Kurt Cobain", ["Dave Grohl", "Krist Novoselic", "Eddie Vedder"]],
  ["kind-blue", "the album Kind of Blue", "Miles Davis", ["John Coltrane", "Duke Ellington", "Louis Armstrong"]],
  ["wonderful-world", "the song What a Wonderful World, in the famous recording", "Louis Armstrong", ["Frank Sinatra", "Nat King Cole", "Ella Fitzgerald"]],
  ["pepper-year-song", "the album Sgt. Pepper's Lonely Hearts Club Band", "The Beatles", ["The Rolling Stones", "The Beach Boys", "The Kinks"]],
  ["rumours-album", "the album Rumours", "Fleetwood Mac", ["The Eagles", "ABBA", "The Carpenters"]],
];

const films = [
  ["jaws-film", "the film Jaws", "Steven Spielberg", ["George Lucas", "Ridley Scott", "James Cameron"]],
  ["et-film", "the film E.T. the Extra-Terrestrial", "Steven Spielberg", ["George Lucas", "Robert Zemeckis", "Chris Columbus"]],
  ["jurassic-film", "the 1993 film Jurassic Park", "Steven Spielberg", ["James Cameron", "Peter Jackson", "Roland Emmerich"]],
  ["schindler-film", "the film Schindler's List", "Steven Spielberg", ["Roman Polanski", "Martin Scorsese", "Francis Ford Coppola"]],
  ["titanic-film", "the 1997 film Titanic", "James Cameron", ["Steven Spielberg", "Ridley Scott", "Kathryn Bigelow"]],
  ["avatar-film", "the 2009 film Avatar", "James Cameron", ["Peter Jackson", "George Lucas", "Jon Favreau"]],
  ["pulp-film", "the film Pulp Fiction", "Quentin Tarantino", ["Martin Scorsese", "Joel Coen", "Guy Ritchie"]],
  ["godfather-film", "the 1972 film The Godfather", "Francis Ford Coppola", ["Martin Scorsese", "Brian De Palma", "Sergio Leone"]],
  ["psycho-film", "the 1960 film Psycho", "Alfred Hitchcock", ["Orson Welles", "Billy Wilder", "John Ford"]],
  ["vertigo-film", "the film Vertigo", "Alfred Hitchcock", ["Orson Welles", "Howard Hawks", "Fritz Lang"]],
  ["2001-film", "the film 2001: A Space Odyssey", "Stanley Kubrick", ["Ridley Scott", "Andrei Tarkovsky", "George Lucas"]],
  ["shining-film", "the 1980 film The Shining", "Stanley Kubrick", ["Brian De Palma", "David Lynch", "John Carpenter"]],
  ["spirited-film", "the film Spirited Away", "Hayao Miyazaki", ["Isao Takahata", "Makoto Shinkai", "Satoshi Kon"]],
  ["parasite-director", "the film Parasite", "Bong Joon-ho", ["Park Chan-wook", "Hirokazu Kore-eda", "Wong Kar-wai"]],
  ["get-out-film", "the film Get Out", "Jordan Peele", ["Ryan Coogler", "Barry Jenkins", "Boots Riley"]],
  ["budapest-film", "the film The Grand Budapest Hotel", "Wes Anderson", ["Noah Baumbach", "Sofia Coppola", "Paul Thomas Anderson"]],
  ["amelie-film", "the film Amélie", "Jean-Pierre Jeunet", ["Luc Besson", "François Ozon", "Michel Gondry"]],
  ["pan-film", "the film Pan's Labyrinth", "Guillermo del Toro", ["Alfonso Cuarón", "Alejandro G. Iñárritu", "Pedro Almodóvar"]],
  ["tiger-film", "the film Crouching Tiger, Hidden Dragon", "Ang Lee", ["Zhang Yimou", "Wong Kar-wai", "John Woo"]],
  ["slumdog-film", "the film Slumdog Millionaire", "Danny Boyle", ["Guy Ritchie", "Christopher Nolan", "Ridley Scott"]],
  ["dark-knight-film", "the 2008 film The Dark Knight", "Christopher Nolan", ["Zack Snyder", "Tim Burton", "Matt Reeves"]],
  ["nemo-director", "the film Finding Nemo", "Andrew Stanton", ["John Lasseter", "Pete Docter", "Brad Bird"]],
  ["toy-story-director", "the 1995 film Toy Story", "John Lasseter", ["Andrew Stanton", "Pete Docter", "Brad Bird"]],
  ["lion-king-director", "the 1994 film The Lion King", "Roger Allers and Rob Minkoff", ["John Musker and Ron Clements", "Chris Buck and Jennifer Lee", "Andrew Adamson"]],
  ["shrek-director", "the 2001 film Shrek", "Andrew Adamson and Vicky Jenson", ["John Lasseter", "Pete Docter", "Chris Miller"]],
  ["frozen-director", "the 2013 film Frozen", "Chris Buck and Jennifer Lee", ["John Musker and Ron Clements", "Byron Howard and Rich Moore", "Jennifer Yuh Nelson"]],
  ["moana-director", "the 2016 film Moana", "Ron Clements and John Musker", ["Chris Buck and Jennifer Lee", "Don Hall and Chris Williams", "Lee Unkrich"]],
  ["fury-film", "the 2015 film Mad Max: Fury Road", "George Miller", ["Denis Villeneuve", "Ridley Scott", "Kathryn Bigelow"]],
  ["arrival-film", "the 2016 film Arrival", "Denis Villeneuve", ["Christopher Nolan", "Alex Garland", "Neill Blomkamp"]],
  ["dune-film", "the 2021 film Dune", "Denis Villeneuve", ["Christopher Nolan", "Ridley Scott", "David Lynch"]],
];

const scienceWho = [
  ["relativity-who", "the theory of relativity, as its main author", "Albert Einstein", ["Isaac Newton", "Niels Bohr", "Stephen Hawking"]],
  ["gravity-who", "the law of universal gravitation in the Principia", "Isaac Newton", ["Galileo Galilei", "Johannes Kepler", "Albert Einstein"]],
  ["heliocentric-who", "the book On the Revolutions of the Heavenly Spheres", "Nicolaus Copernicus", ["Galileo Galilei", "Johannes Kepler", "Tycho Brahe"]],
  ["penicillin-who", "the discovery of penicillin", "Alexander Fleming", ["Louis Pasteur", "Jonas Salk", "Marie Curie"]],
  ["periodic-who", "the first widely used periodic table", "Dmitri Mendeleev", ["Antoine Lavoisier", "John Dalton", "Niels Bohr"]],
  ["telephone-who", "the telephone patent of 1876", "Alexander Graham Bell", ["Thomas Edison", "Nikola Tesla", "Guglielmo Marconi"]],
  ["bulb-who", "a practical incandescent light bulb sold widely in the United States", "Thomas Edison", ["Nikola Tesla", "Alexander Graham Bell", "George Westinghouse"]],
  ["plane-who", "the first powered airplane flight, in 1903", "the Wright brothers", ["Alberto Santos-Dumont", "Charles Lindbergh", "Amelia Earhart"]],
  ["press-who", "the movable-type printing press in Europe", "Johannes Gutenberg", ["William Caxton", "Martin Luther", "Aldus Manutius"]],
  ["dna-who", "the 1953 model of the DNA double helix, with the scored pair", "James Watson and Francis Crick", ["Rosalind Franklin and Maurice Wilkins", "Linus Pauling", "Gregor Mendel"]],
  ["evolution-who", "On the Origin of Species", "Charles Darwin", ["Alfred Russel Wallace", "Gregor Mendel", "Jean-Baptiste Lamarck"]],
  ["radium-who", "the discovery of radium, shared with Pierre Curie", "Marie Curie", ["Lise Meitner", "Irene Joliot-Curie", "Dorothy Hodgkin"]],
  ["smallpox-who", "the first smallpox vaccine", "Edward Jenner", ["Louis Pasteur", "Jonas Salk", "Alexander Fleming"]],
  ["pasteur-who", "the process called pasteurization", "Louis Pasteur", ["Robert Koch", "Joseph Lister", "Edward Jenner"]],
  ["tesla-who", "the alternating-current induction motor, as its inventor", "Nikola Tesla", ["Thomas Edison", "George Westinghouse", "Michael Faraday"]],
  ["faraday-who", "electromagnetic induction, as a key experimenter", "Michael Faraday", ["James Clerk Maxwell", "André-Marie Ampère", "Nikola Tesla"]],
  ["maxwell-who", "the equations that united electricity and magnetism", "James Clerk Maxwell", ["Michael Faraday", "Heinrich Hertz", "Oliver Heaviside"]],
  ["hertz-who", "radio waves produced in the laboratory", "Heinrich Hertz", ["Guglielmo Marconi", "James Clerk Maxwell", "Nikola Tesla"]],
  ["marconi-who", "the first practical radio system across distance", "Guglielmo Marconi", ["Heinrich Hertz", "Thomas Edison", "Lee de Forest"]],
  ["turing-who", "the idea of a universal computing machine in 1936", "Alan Turing", ["John von Neumann", "Ada Lovelace", "Charles Babbage"]],
  ["lovelace-who", "the notes often called the first computer program, on Babbage's engine", "Ada Lovelace", ["Charles Babbage", "Alan Turing", "Grace Hopper"]],
  ["hopper-who", "the compiler work that helped create COBOL", "Grace Hopper", ["Ada Lovelace", "Margaret Hamilton", "Katherine Johnson"]],
  ["hamilton-who", "the onboard flight software for the Apollo missions", "Margaret Hamilton", ["Katherine Johnson", "Grace Hopper", "Dorothy Vaughan"]],
  ["johnson-who", "the orbital calculations celebrated in Hidden Figures", "Katherine Johnson", ["Dorothy Vaughan", "Mary Jackson", "Margaret Hamilton"]],
  ["jemison-who", "the first Black woman to travel in space", "Mae Jemison", ["Sally Ride", "Guion Bluford", "Katherine Johnson"]],
  ["ride-who", "the first American woman in space", "Sally Ride", ["Mae Jemison", "Valentina Tereshkova", "Eileen Collins"]],
  ["tereshkova-who", "the first woman in space", "Valentina Tereshkova", ["Sally Ride", "Svetlana Savitskaya", "Mae Jemison"]],
  ["shepard-who", "the first American in space", "Alan Shepard", ["John Glenn", "Neil Armstrong", "Gus Grissom"]],
  ["glenn-who", "the first American to orbit Earth", "John Glenn", ["Alan Shepard", "Neil Armstrong", "Scott Carpenter"]],
  ["gagarin-who", "the first person to orbit Earth", "Yuri Gagarin", ["Neil Armstrong", "Alexei Leonov", "Gherman Titov"]],
];

const symbols = [
  ["sym-h", "hydrogen", "H", ["He", "O", "N"]],
  ["sym-he", "helium", "He", ["H", "Ne", "Li"]],
  ["sym-o", "oxygen", "O", ["N", "C", "H"]],
  ["sym-c", "carbon", "C", ["Ca", "Cl", "Co"]],
  ["sym-n", "nitrogen", "N", ["Na", "Ne", "Ni"]],
  ["sym-na", "sodium", "Na", ["S", "N", "K"]],
  ["sym-k", "potassium", "K", ["P", "Ca", "Na"]],
  ["sym-fe", "iron", "Fe", ["Ir", "I", "F"]],
  ["sym-cu", "copper", "Cu", ["Co", "C", "Cr"]],
  ["sym-ag", "silver", "Ag", ["Au", "Si", "Al"]],
  ["sym-pb", "lead", "Pb", ["Li", "Pt", "Pd"]],
  ["sym-hg", "mercury", "Hg", ["Mg", "H", "Me"]],
  ["sym-sn", "tin", "Sn", ["Ti", "Si", "Sb"]],
  ["sym-u", "uranium", "U", ["Un", "Ur", "Pu"]],
  ["sym-cl", "chlorine", "Cl", ["C", "Cr", "Ca"]],
  ["sym-ca", "calcium", "Ca", ["C", "Cl", "K"]],
  ["sym-mg", "magnesium", "Mg", ["Mn", "Hg", "Mo"]],
  ["sym-al", "aluminum", "Al", ["Au", "Ag", "Ar"]],
  ["sym-si", "silicon", "Si", ["S", "Ag", "Sn"]],
  ["sym-p", "phosphorus", "P", ["K", "Po", "Pt"]],
  ["sym-s", "sulfur", "S", ["Si", "Na", "Sr"]],
  ["sym-ne", "neon", "Ne", ["N", "Ni", "Na"]],
  ["sym-ar", "argon", "Ar", ["Ag", "Au", "Al"]],
  ["sym-ti", "titanium", "Ti", ["Sn", "Tl", "Te"]],
  ["sym-ni", "nickel", "Ni", ["N", "Na", "Ne"]],
  ["sym-zn", "zinc", "Zn", ["Zr", "Sn", "Ze"]],
  ["sym-i", "iodine", "I", ["Ir", "In", "Fe"]],
  ["sym-w", "tungsten", "W", ["Tu", "Tg", "Sn"]],
  ["sym-co", "cobalt", "Co", ["Cu", "C", "Ca"]],
  ["sym-cr", "chromium", "Cr", ["Cl", "Cu", "Co"]],
];

const cars = [
  ["ford-founder", "Ford Motor Company", "Henry Ford", ["Walter Chrysler", "William Durant", "Ransom Olds"]],
  ["model-t", "the Model T", "Ford", ["General Motors", "Chrysler", "Volkswagen"]],
  ["vw-country", "Volkswagen", "Germany", ["the United States", "Italy", "Sweden"]],
  ["ferrari-country", "Ferrari", "Italy", ["Germany", "France", "the United Kingdom"]],
  ["toyota-country", "Toyota", "Japan", ["South Korea", "China", "the United States"]],
  ["volvo-country", "Volvo Cars", "Sweden", ["Germany", "Norway", "the United States"]],
  ["hyundai-country", "Hyundai", "South Korea", ["Japan", "China", "Germany"]],
  ["porsche-founder", "Porsche", "Ferdinand Porsche", ["Enzo Ferrari", "Henry Ford", "Karl Benz"]],
  ["benz-car", "the Benz Patent-Motorwagen", "Karl Benz", ["Gottlieb Daimler", "Henry Ford", "Nikolaus Otto"]],
  ["suv-mean", "SUV", "sport utility vehicle", ["standard urban van", "super utility volt", "speed under vacuum"]],
  ["rpm-mean", "RPM, on a tachometer", "revolutions per minute", ["rounds per mile", "rotations per meter", "revolutions per mile"]],
  ["mph-mean", "MPH, on a speedometer", "miles per hour", ["meters per hour", "minutes per hour", "miles per hectare"]],
  ["beetle-country", "the original Volkswagen Beetle", "Germany", ["the United States", "Italy", "Japan"]],
  ["mini-country", "the original Mini, launched in 1959", "the United Kingdom", ["Italy", "Germany", "France"]],
  ["honda-country", "Honda", "Japan", ["South Korea", "China", "the United States"]],
  ["bmw-country", "BMW", "Germany", ["Austria", "Sweden", "Italy"]],
  ["mercedes-country", "Mercedes-Benz", "Germany", ["France", "Italy", "Sweden"]],
  ["peugeot-country", "Peugeot", "France", ["Italy", "Spain", "Germany"]],
  ["fiat-country", "Fiat", "Italy", ["France", "Spain", "Germany"]],
  ["kia-country", "Kia", "South Korea", ["Japan", "China", "Germany"]],
];

const languages = [
  ["lang-brazil", "Brazil", "Portuguese", ["Spanish", "French", "English"]],
  ["lang-mexico", "Mexico", "Spanish", ["Portuguese", "English", "French"]],
  ["lang-egypt", "Egypt", "Arabic", ["French", "English", "Hebrew"]],
  ["lang-japan", "Japan", "Japanese", ["Chinese", "Korean", "Thai"]],
  ["lang-germany", "Germany", "German", ["Dutch", "English", "French"]],
  ["lang-france", "France", "French", ["Spanish", "Italian", "German"]],
  ["lang-china", "China, as the most widely spoken language", "Mandarin", ["Cantonese", "Japanese", "Korean"]],
  ["lang-quebec", "the province of Quebec", "French", ["English", "Spanish", "German"]],
  ["lang-austria", "Austria", "German", ["Hungarian", "Italian", "French"]],
  ["lang-argentina", "Argentina", "Spanish", ["Portuguese", "Italian", "English"]],
  ["lang-iran", "Iran", "Persian", ["Arabic", "Turkish", "Hebrew"]],
  ["lang-greece", "Greece", "Greek", ["Latin", "Turkish", "Italian"]],
  ["lang-poland", "Poland", "Polish", ["Russian", "German", "Czech"]],
  ["lang-turkey", "Turkey", "Turkish", ["Arabic", "Persian", "Greek"]],
  ["lang-vietnam", "Vietnam", "Vietnamese", ["Chinese", "Thai", "French"]],
  ["lang-thailand", "Thailand", "Thai", ["Vietnamese", "Lao", "Malay"]],
  ["lang-korea", "South Korea", "Korean", ["Japanese", "Chinese", "Thai"]],
  ["lang-norway", "Norway", "Norwegian", ["Swedish", "Danish", "Finnish"]],
  ["lang-netherlands", "the Netherlands", "Dutch", ["German", "French", "English"]],
  ["lang-sweden", "Sweden", "Swedish", ["Norwegian", "Danish", "Finnish"]],
  ["lang-finland", "Finland, as the language of the majority", "Finnish", ["Swedish", "Norwegian", "Russian"]],
  ["lang-kenya", "Kenya, alongside English, as an official language", "Swahili", ["Zulu", "Amharic", "Arabic"]],
  ["lang-israel", "Israel, as the main official language", "Hebrew", ["Arabic", "English", "Yiddish"]],
  ["lang-ethiopia", "Ethiopia, as the federal working language", "Amharic", ["Swahili", "Arabic", "Somali"]],
  ["lang-pakistan", "Pakistan, as the national language", "Urdu", ["Hindi", "Arabic", "Persian"]],
];

const years = [
  ["y-magna", "was Magna Carta sealed", "1215", ["1066", "1492", "1776"]],
  ["y-columbus", "did Christopher Columbus reach the Americas", "1492", ["1498", "1519", "1607"]],
  ["y-shakespeare", "was William Shakespeare born", "1564", ["1616", "1500", "1660"]],
  ["y-bastille", "was the Bastille stormed in Paris", "1789", ["1776", "1815", "1848"]],
  ["y-independence", "was the U.S. Declaration of Independence adopted", "1776", ["1787", "1789", "1812"]],
  ["y-constitution", "was the U.S. Constitution signed in Philadelphia", "1787", ["1776", "1791", "1783"]],
  ["y-civil-start", "did the American Civil War begin", "1861", ["1865", "1850", "1848"]],
  ["y-civil-end", "did the American Civil War end", "1865", ["1861", "1863", "1870"]],
  ["y-gettysburg", "did Abraham Lincoln deliver the Gettysburg Address", "1863", ["1861", "1865", "1850"]],
  ["y-ww1-start", "did World War I begin", "1914", ["1918", "1939", "1905"]],
  ["y-ww1-end", "did the World War I armistice take effect", "1918", ["1914", "1919", "1945"]],
  ["y-revolution-ru", "did the October Revolution take place in Russia", "1917", ["1905", "1914", "1922"]],
  ["y-crash", "did the Wall Street crash open the Great Depression", "1929", ["1920", "1933", "1919"]],
  ["y-new-deal", "did Franklin D. Roosevelt first take office as president", "1933", ["1929", "1939", "1945"]],
  ["y-dday", "did the D-Day landings begin in Normandy", "1944", ["1941", "1945", "1943"]],
  ["y-ve", "did Victory in Europe Day mark the end of the war in Europe", "1945", ["1944", "1941", "1950"]],
  ["y-india", "did India become independent", "1947", ["1945", "1950", "1948"]],
  ["y-china-prc", "was the People's Republic of China proclaimed", "1949", ["1945", "1912", "1950"]],
  ["y-missile", "was the Cuban Missile Crisis", "1962", ["1961", "1963", "1959"]],
  ["y-voting", "did the United States pass the Voting Rights Act", "1965", ["1963", "1964", "1968"]],
  ["y-saigon", "did Saigon fall, ending the Vietnam War", "1975", ["1973", "1968", "1979"]],
  ["y-nixon", "did Richard Nixon resign the presidency", "1974", ["1972", "1976", "1969"]],
  ["y-mandela", "was Nelson Mandela released from prison", "1990", ["1994", "1986", "1964"]],
  ["y-election-sa", "did South Africa hold its first election with universal adult suffrage", "1994", ["1990", "1986", "2000"]],
  ["y-good-friday", "was the Good Friday Agreement signed", "1998", ["1994", "2001", "1990"]],
  ["y-soviet", "did the Soviet Union dissolve", "1991", ["1989", "1990", "1993"]],
  ["y-reunify", "did Germany reunify", "1990", ["1989", "1991", "1949"]],
  ["y-hongkong", "was Hong Kong handed over to China", "1997", ["1999", "1984", "2000"]],
  ["y-nine-eleven", "were the September 11 attacks in the United States", "2001", ["2000", "2003", "1999"]],
  ["y-beijing-olympics", "were the Beijing Summer Olympics held", "2008", ["2004", "2012", "2000"]],
  ["y-london-olympics", "were the London Summer Olympics held", "2012", ["2008", "2016", "2004"]],
  ["y-paris-olympics", "were the Paris Summer Olympics held", "2024", ["2020", "2016", "2028"]],
  ["y-pandemic", "did the World Health Organization call COVID-19 a pandemic", "2020", ["2019", "2021", "2018"]],
  ["y-brexit-vote", "did the United Kingdom vote to leave the European Union", "2016", ["2020", "2015", "2005"]],
  ["y-brexit-leave", "did the United Kingdom leave the European Union", "2020", ["2016", "2019", "2021"]],
  ["y-pluto", "did the International Astronomical Union reclassify Pluto as a dwarf planet", "2006", ["2003", "2015", "1999"]],
  ["y-higgs", "was the Higgs boson announced at CERN", "2012", ["2008", "2015", "2019"]],
  ["y-black-hole", "was the first image of a black hole published", "2019", ["2015", "2012", "2022"]],
  ["y-paris-agree", "was the Paris Agreement adopted", "2015", ["2016", "2009", "1997"]],
  ["y-wright", "did the Wright brothers fly at Kitty Hawk", "1903", ["1896", "1914", "1927"]],
  ["y-model-t", "did Ford begin selling the Model T", "1908", ["1903", "1914", "1920"]],
  ["y-panama", "did the Panama Canal open to traffic", "1914", ["1904", "1869", "1898"]],
  ["y-liberty-dedicated", "was the Statue of Liberty dedicated", "1886", ["1876", "1889", "1776"]],
  ["y-eiffel", "was the Eiffel Tower completed", "1889", ["1886", "1900", "1789"]],
  ["y-suez-open", "did the Suez Canal open", "1869", ["1956", "1914", "1859"]],
  ["y-olympics-first", "were the first modern Olympic Games held", "1896", ["1900", "776", "1912"]],
  ["y-world-cup-first", "was the first FIFA World Cup held", "1930", ["1924", "1950", "1934"]],
  ["y-superbowl", "was the first Super Bowl played", "1967", ["1960", "1970", "1958"]],
  ["y-live-aid", "was the Live Aid concert held", "1985", ["1980", "1975", "1990"]],
  ["y-womens-cup", "was the first FIFA Women's World Cup held", "1991", ["1995", "1999", "1985"]],
];

const geoWhich = [
  ["amazon-volume", "Which river carries the greatest volume of water?", "the Amazon", ["the Nile", "the Mississippi", "the Yangtze"], "Quel fleuve transporte le plus grand volume d'eau ?", "C'est quel fleuve qui transporte le plus grand volume d'eau ?", "Welcher Fluss führt das größte Wasservolumen?"],
  ["arctic-ocean", "Which ocean is the smallest of the five commonly named oceans?", "the Arctic Ocean", ["the Indian Ocean", "the Atlantic Ocean", "the Southern Ocean"], "Quel océan est le plus petit des cinq océans couramment nommés ?", "C'est quel océan, le plus petit des cinq océans nommés ?", "Welcher Ozean ist der kleinste der fünf gewöhnlich genannten?"],
  ["sahara-hot", "Which desert is the largest hot desert on Earth?", "the Sahara", ["the Gobi", "the Kalahari", "the Arabian Desert"], "Quel désert est le plus grand désert chaud de la Terre ?", "C'est quel désert, le plus grand désert chaud de la Terre ?", "Welche Wüste ist die größte heiße Wüste der Erde?"],
  ["highest-peak", "Which mountain has the highest summit above sea level?", "Mount Everest", ["K2", "Kangchenjunga", "Denali"], "Quelle montagne a le plus haut sommet au-dessus du niveau de la mer ?", "C'est quelle montagne qui a le plus haut sommet au-dessus de la mer ?", "Welcher Berg hat den höchsten Gipfel über dem Meeresspiegel?"],
  ["largest-planet", "Which planet is the largest in the solar system?", "Jupiter", ["Saturn", "Neptune", "Earth"], "Quelle planète est la plus grande du système solaire ?", "C'est quelle planète, la plus grande du système solaire ?", "Welcher Planet ist der größte im Sonnensystem?"],
  ["smallest-planet", "Which planet is the smallest in the solar system?", "Mercury", ["Mars", "Venus", "Pluto"], "Quelle planète est la plus petite du système solaire ?", "C'est quelle planète, la plus petite du système solaire ?", "Welcher Planet ist der kleinste im Sonnensystem?"],
  ["hottest-planet", "Which planet is the hottest in the solar system?", "Venus", ["Mercury", "Mars", "Jupiter"], "Quelle planète est la plus chaude du système solaire ?", "C'est quelle planète, la plus chaude du système solaire ?", "Welcher Planet ist der heißeste im Sonnensystem?"],
  ["ring-planet", "Which planet is famous for a bright ring system seen from Earth?", "Saturn", ["Jupiter", "Uranus", "Neptune"], "Quelle planète est célèbre pour un système d'anneaux brillant vu de la Terre ?", "C'est quelle planète qui est connue pour ses anneaux brillants vus de la Terre ?", "Welcher Planet ist für ein helles Ringsystem bekannt, das man von der Erde sieht?"],
  ["red-planet", "Which planet is called the Red Planet?", "Mars", ["Venus", "Mercury", "Jupiter"], "Quelle planète est appelée la planète rouge ?", "C'est quelle planète qu'on appelle la planète rouge ?", "Welcher Planet wird der rote Planet genannt?"],
  ["closest-sun", "Which planet orbits closest to the Sun?", "Mercury", ["Venus", "Earth", "Mars"], "Quelle planète orbite le plus près du Soleil ?", "C'est quelle planète qui orbite le plus près du Soleil ?", "Welcher Planet kreist der Sonne am nächsten?"],
  ["farthest-eight", "Which of the eight planets orbits farthest from the Sun?", "Neptune", ["Uranus", "Saturn", "Pluto"], "Laquelle des huit planètes orbite le plus loin du Soleil ?", "Des huit planètes, c'est laquelle qui orbite le plus loin du Soleil ?", "Welcher der acht Planeten kreist am weitesten von der Sonne?"],
  ["our-galaxy", "What is the name of the galaxy that contains our solar system?", "the Milky Way", ["Andromeda", "the Triangulum Galaxy", "the Large Magellanic Cloud"], "Comment s'appelle la galaxie qui contient notre système solaire ?", "C'est quoi le nom de la galaxie qui contient notre système solaire ?", "Wie heißt die Galaxie, die unser Sonnensystem enthält?"],
  ["our-star", "What star sits at the center of our solar system?", "the Sun", ["Polaris", "Sirius", "Alpha Centauri"], "Quelle étoile est au centre de notre système solaire ?", "C'est quelle étoile qui est au centre de notre système solaire ?", "Welcher Stern steht im Zentrum unseres Sonnensystems?"],
  ["photosynthesis-out", "What gas do plants release during photosynthesis?", "oxygen", ["carbon dioxide", "nitrogen", "hydrogen"], "Quel gaz les plantes libèrent-elles pendant la photosynthèse ?", "C'est quel gaz que les plantes libèrent pendant la photosynthèse ?", "Welches Gas geben Pflanzen bei der Photosynthese ab?"],
  ["hardest-after", "On the Mohs scale, which mineral is just below diamond?", "corundum", ["quartz", "topaz", "talc"], "Sur l'échelle de Mohs, quel minéral est juste sous le diamant ?", "Sur l'échelle de Mohs, c'est quel minéral juste sous le diamant ?", "Welches Mineral liegt auf der Mohs-Skala direkt unter Diamant?"],
];

function pushHow(list, tier) {
  return list.map(([slug, thing, answer, wrongs]) => howMany(tier, slug, thing, answer, wrongs));
}

function pushWhere(list, tier) {
  return list.map(([slug, thing, place, wrongs]) => where(tier, "geography", slug, thing, place, wrongs.map((name) => {
    if (typeof name === "string") return name;
    return name.en;
  })));
}

function pushWho(list, tier, topic, verbEn, verbFr, verbQc, verbDe) {
  return list.map(([slug, work, person, wrongs]) => row(tier, topic, slug, {
    en: `${verbEn} ${work}?`,
    fr: `${verbFr} ${work} ?`,
    qc: `${verbQc} ${work} ?`,
    de: `${verbDe} ${work}?`,
  }, [person, ...wrongs]));
}

function pushYear(list, tier) {
  return list.map(([slug, event, answer, wrongs]) => year(tier, "culture", slug, {
    en: event,
    fr: event.replace(/^was /, "").replace(/^did /, "").replace(/^were /, ""),
    qc: event,
    de: event,
  }, answer, wrongs));
}

// Year translations need real French and German. The pushYear above leaves English in fr/de.
// Build years with explicit translations instead.

const yearText = {
  "y-magna": ["Magna Carta was sealed", "la Magna Carta a été scellée", "la Magna Carta a été scellée", "die Magna Carta besiegelt wurde"],
  "y-columbus": ["Christopher Columbus reached the Americas", "Christophe Colomb a atteint les Amériques", "Christophe Colomb a atteint les Amériques", "Christoph Kolumbus Amerika erreichte"],
  "y-shakespeare": ["William Shakespeare was born", "William Shakespeare est né", "William Shakespeare est né", "William Shakespeare geboren wurde"],
  "y-bastille": ["the Bastille was stormed in Paris", "la Bastille a été prise à Paris", "la Bastille a été prise à Paris", "die Bastille in Paris gestürmt wurde"],
  "y-independence": ["the U.S. Declaration of Independence was adopted", "la Déclaration d'indépendance des États-Unis a été adoptée", "la Déclaration d'indépendance des États-Unis a été adoptée", "die Unabhängigkeitserklärung der USA angenommen wurde"],
  "y-constitution": ["the U.S. Constitution was signed in Philadelphia", "la Constitution des États-Unis a été signée à Philadelphie", "la Constitution des États-Unis a été signée à Philadelphie", "die US-Verfassung in Philadelphia unterzeichnet wurde"],
  "y-civil-start": ["the American Civil War began", "la guerre de Sécession a commencé", "la guerre de Sécession a commencé", "der Amerikanische Bürgerkrieg begann"],
  "y-civil-end": ["the American Civil War ended", "la guerre de Sécession s'est terminée", "la guerre de Sécession a fini", "der Amerikanische Bürgerkrieg endete"],
  "y-gettysburg": ["Abraham Lincoln delivered the Gettysburg Address", "Abraham Lincoln a prononcé le discours de Gettysburg", "Abraham Lincoln a prononcé le discours de Gettysburg", "Abraham Lincoln die Gettysburg Address hielt"],
  "y-ww1-start": ["World War I began", "la Première Guerre mondiale a commencé", "la Première Guerre mondiale a commencé", "der Erste Weltkrieg begann"],
  "y-ww1-end": ["the World War I armistice took effect", "l'armistice de la Première Guerre mondiale est entré en vigueur", "l'armistice de la Première Guerre mondiale est entré en vigueur", "der Waffenstillstand des Ersten Weltkriegs in Kraft trat"],
  "y-revolution-ru": ["the October Revolution took place in Russia", "la révolution d'Octobre a eu lieu en Russie", "la révolution d'Octobre a eu lieu en Russie", "die Oktoberrevolution in Russland stattfand"],
  "y-crash": ["the Wall Street crash opened the Great Depression", "le krach de Wall Street a ouvert la Grande Dépression", "le krach de Wall Street a ouvert la Grande Dépression", "der Wall-Street-Crash die Große Depression einleitete"],
  "y-new-deal": ["Franklin D. Roosevelt first took office as president", "Franklin D. Roosevelt est devenu président pour la première fois", "Franklin D. Roosevelt est devenu président pour la première fois", "Franklin D. Roosevelt erstmals Präsident wurde"],
  "y-dday": ["the D-Day landings began in Normandy", "le débarquement de Normandie a commencé", "le débarquement de Normandie a commencé", "die Landung in der Normandie begann"],
  "y-ve": ["Victory in Europe Day marked the end of the war in Europe", "le jour de la Victoire en Europe a marqué la fin de la guerre en Europe", "le jour de la Victoire en Europe a marqué la fin de la guerre en Europe", "der Tag des Sieges in Europa das Ende des Krieges in Europa markierte"],
  "y-india": ["India became independent", "l'Inde est devenue indépendante", "l'Inde est devenue indépendante", "Indien unabhängig wurde"],
  "y-china-prc": ["the People's Republic of China was proclaimed", "la République populaire de Chine a été proclamée", "la République populaire de Chine a été proclamée", "die Volksrepublik China ausgerufen wurde"],
  "y-missile": ["the Cuban Missile Crisis took place", "la crise des missiles de Cuba a eu lieu", "la crise des missiles de Cuba a eu lieu", "die Kubakrise stattfand"],
  "y-voting": ["the United States passed the Voting Rights Act", "les États-Unis ont adopté le Voting Rights Act", "les États-Unis ont adopté le Voting Rights Act", "die USA den Voting Rights Act verabschiedeten"],
  "y-saigon": ["Saigon fell, ending the Vietnam War", "Saigon est tombée, ce qui a mis fin à la guerre du Vietnam", "Saigon est tombée, ce qui a mis fin à la guerre du Vietnam", "Saigon fiel und der Vietnamkrieg endete"],
  "y-nixon": ["Richard Nixon resigned the presidency", "Richard Nixon a démissionné de la présidence", "Richard Nixon a démissionné de la présidence", "Richard Nixon vom Präsidentenamt zurücktrat"],
  "y-mandela": ["Nelson Mandela was released from prison", "Nelson Mandela a été libéré de prison", "Nelson Mandela a été libéré de prison", "Nelson Mandela aus dem Gefängnis entlassen wurde"],
  "y-election-sa": ["South Africa held its first election with universal adult suffrage", "l'Afrique du Sud a tenu sa première élection au suffrage universel adulte", "l'Afrique du Sud a tenu sa première élection au suffrage universel adulte", "Südafrika die erste Wahl mit allgemeinem Erwachsenenwahlrecht abhielt"],
  "y-good-friday": ["the Good Friday Agreement was signed", "l'accord du Vendredi saint a été signé", "l'accord du Vendredi saint a été signé", "das Karfreitagsabkommen unterzeichnet wurde"],
  "y-soviet": ["the Soviet Union dissolved", "l'Union soviétique s'est dissoute", "l'Union soviétique s'est dissoute", "die Sowjetunion aufgelöst wurde"],
  "y-reunify": ["Germany reunified", "l'Allemagne s'est réunifiée", "l'Allemagne s'est réunifiée", "Deutschland wiedervereinigt wurde"],
  "y-hongkong": ["Hong Kong was handed over to China", "Hong Kong a été remis à la Chine", "Hong Kong a été remis à la Chine", "Hongkong an China übergeben wurde"],
  "y-nine-eleven": ["the September 11 attacks took place in the United States", "les attentats du 11 septembre ont eu lieu aux États-Unis", "les attentats du 11 septembre ont eu lieu aux États-Unis", "die Anschläge vom 11. September in den USA stattfanden"],
  "y-beijing-olympics": ["the Beijing Summer Olympics were held", "les Jeux olympiques d'été de Pékin ont eu lieu", "les Jeux olympiques d'été de Pékin ont eu lieu", "die Olympischen Sommerspiele in Peking stattfanden"],
  "y-london-olympics": ["the London Summer Olympics were held", "les Jeux olympiques d'été de Londres ont eu lieu", "les Jeux olympiques d'été de Londres ont eu lieu", "die Olympischen Sommerspiele in London stattfanden"],
  "y-paris-olympics": ["the Paris Summer Olympics were held", "les Jeux olympiques d'été de Paris ont eu lieu", "les Jeux olympiques d'été de Paris ont eu lieu", "die Olympischen Sommerspiele in Paris stattfanden"],
  "y-pandemic": ["the World Health Organization called COVID-19 a pandemic", "l'Organisation mondiale de la santé a qualifié la COVID-19 de pandémie", "l'Organisation mondiale de la santé a qualifié la COVID-19 de pandémie", "die Weltgesundheitsorganisation COVID-19 zur Pandemie erklärte"],
  "y-brexit-vote": ["the United Kingdom voted to leave the European Union", "le Royaume-Uni a voté pour quitter l'Union européenne", "le Royaume-Uni a voté pour quitter l'Union européenne", "das Vereinigte Königreich für den Austritt aus der Europäischen Union stimmte"],
  "y-brexit-leave": ["the United Kingdom left the European Union", "le Royaume-Uni a quitté l'Union européenne", "le Royaume-Uni a quitté l'Union européenne", "das Vereinigte Königreich die Europäische Union verließ"],
  "y-pluto": ["the International Astronomical Union reclassified Pluto as a dwarf planet", "l'Union astronomique internationale a reclassé Pluton comme planète naine", "l'Union astronomique internationale a reclassé Pluton comme planète naine", "die Internationale Astronomische Union Pluto zum Zwergplaneten erklärte"],
  "y-higgs": ["the Higgs boson was announced at CERN", "le boson de Higgs a été annoncé au CERN", "le boson de Higgs a été annoncé au CERN", "das Higgs-Boson am CERN bekannt gegeben wurde"],
  "y-black-hole": ["the first image of a black hole was published", "la première image d'un trou noir a été publiée", "la première image d'un trou noir a été publiée", "das erste Bild eines Schwarzen Lochs veröffentlicht wurde"],
  "y-paris-agree": ["the Paris Agreement was adopted", "l'Accord de Paris a été adopté", "l'Accord de Paris a été adopté", "das Übereinkommen von Paris angenommen wurde"],
  "y-wright": ["the Wright brothers flew at Kitty Hawk", "les frères Wright ont volé à Kitty Hawk", "les frères Wright ont volé à Kitty Hawk", "die Gebrüder Wright bei Kitty Hawk flogen"],
  "y-model-t": ["Ford began selling the Model T", "Ford a commencé à vendre la Model T", "Ford a commencé à vendre la Model T", "Ford den Model T zu verkaufen begann"],
  "y-panama": ["the Panama Canal opened to traffic", "le canal de Panama a été ouvert à la circulation", "le canal de Panama a été ouvert à la circulation", "der Panamakanal für den Verkehr geöffnet wurde"],
  "y-liberty-dedicated": ["the Statue of Liberty was dedicated", "la statue de la Liberté a été inaugurée", "la statue de la Liberté a été inaugurée", "die Freiheitsstatue eingeweiht wurde"],
  "y-eiffel": ["the Eiffel Tower was completed", "la tour Eiffel a été achevée", "la tour Eiffel a été achevée", "der Eiffelturm fertiggestellt wurde"],
  "y-suez-open": ["the Suez Canal opened", "le canal de Suez a été ouvert", "le canal de Suez a été ouvert", "der Suezkanal eröffnet wurde"],
  "y-olympics-first": ["the first modern Olympic Games were held", "les premiers Jeux olympiques modernes ont eu lieu", "les premiers Jeux olympiques modernes ont eu lieu", "die ersten modernen Olympischen Spiele stattfanden"],
  "y-world-cup-first": ["the first FIFA World Cup was held", "la première Coupe du monde de la FIFA a eu lieu", "la première Coupe du monde de la FIFA a eu lieu", "die erste FIFA-Weltmeisterschaft stattfand"],
  "y-superbowl": ["the first Super Bowl was played", "le premier Super Bowl a été joué", "le premier Super Bowl a été joué", "der erste Super Bowl gespielt wurde"],
  "y-live-aid": ["the Live Aid concert was held", "le concert Live Aid a eu lieu", "le concert Live Aid a eu lieu", "das Live-Aid-Konzert stattfand"],
  "y-womens-cup": ["the first FIFA Women's World Cup was held", "la première Coupe du monde féminine de la FIFA a eu lieu", "la première Coupe du monde féminine de la FIFA a eu lieu", "die erste FIFA-Frauen-Weltmeisterschaft stattfand"],
};

function buildYears(tier, ids) {
  return ids.map((id) => {
    const found = years.find((row) => row[0] === id);
    const text = yearText[id];
    return year(tier, "culture", id, { en: text[0], fr: text[1], qc: text[2], de: text[3] }, found[2], found[3]);
  });
}

const out = [];

for (const item of pushHow(easyCounts, "easy")) out.push(item);
for (const [slug, thing, place, wrongs] of landmarks) {
  out.push(where("easy", "geography", slug, thing, place, wrongs));
}
for (const item of pushWho(painters, "easy", "art", "Who painted", "Qui a peint", "C'est qui qui a peint", "Wer hat gemalt")) out.push(item);
for (const item of pushWho(booksClean, "hard", "culture", "Who wrote", "Qui a écrit", "C'est qui qui a écrit", "Wer hat geschrieben")) out.push(item);
for (const item of pushWho(music, "hard", "music", "Who made", "Qui a fait", "C'est qui qui a fait", "Wer hat gemacht")) out.push(item);
for (const item of pushWho(films, "hard", "film-tv", "Who directed", "Qui a réalisé", "C'est qui qui a réalisé", "Wer hat inszeniert")) out.push(item);
for (const item of pushWho(scienceWho, "difficult", "sci-fi", "Who is credited with", "À qui attribue-t-on", "On attribue à qui", "Wem schreibt man zu")) out.push(item);
for (const [slug, element, sym, wrongs] of symbols) {
  out.push(row("hard", "sci-fi", slug, {
    en: `What is the chemical symbol for ${element}?`,
    fr: `Quel est le symbole chimique de l'élément ${element} ?`,
    qc: `C'est quoi le symbole chimique de l'élément ${element} ?`,
    de: `Welches chemische Symbol hat das Element ${element}?`,
  }, [sym, ...wrongs]));
}
for (const [slug, thing, answer, wrongs] of cars) {
  const countryLike = ["Germany", "Italy", "Japan", "Sweden", "South Korea", "the United Kingdom", "France"].includes(answer);
  if (countryLike || answer === "Germany") {
    out.push(row("easy", "cars", slug, {
      en: `Which country is the home of ${thing}?`,
      fr: `Quel pays est le berceau de ${thing} ?`,
      qc: `C'est quel pays, le berceau de ${thing} ?`,
      de: `Welches Land ist die Heimat von ${thing}?`,
    }, [answer, ...wrongs]));
  } else if (answer.includes(" ")) {
    out.push(row("hard", "cars", slug, {
      en: `What does ${thing} stand for?`,
      fr: `Que signifie ${thing} ?`,
      qc: `Ça veut dire quoi, ${thing} ?`,
      de: `Wofür steht ${thing}?`,
    }, [answer, ...wrongs]));
  } else {
    out.push(row("hard", "cars", slug, {
      en: `Who founded ${thing}, or which company made it when the question names a car?`,
      fr: `Qui est lié à ${thing} dans cette question de marque ?`,
      qc: `C'est qui, pour ${thing}, dans cette question de marque ?`,
      de: `Wer steht bei dieser Markenfrage hinter ${thing}?`,
    }, [answer, ...wrongs]));
  }
}

// The generic car prompts above are muddy for founder vs country vs acronym.
// Replace the muddy ones with clean prompts by filtering slugs.

const muddy = new Set(["ford-founder", "model-t", "porsche-founder", "benz-car", "suv-mean", "rpm-mean", "mph-mean"]);
const cleanCars = out.filter((row) => !muddy.has(row.slug));
const dropped = out.length - cleanCars.length;

const preciseCars = [
  row("hard", "cars", "ford-founder", {
    en: "Who founded the Ford Motor Company?",
    fr: "Qui a fondé la Ford Motor Company ?",
    qc: "C'est qui qui a fondé la Ford Motor Company ?",
    de: "Wer gründete die Ford Motor Company?",
  }, ["Henry Ford", "Walter Chrysler", "William Durant", "Ransom Olds"]),
  row("easy", "cars", "model-t", {
    en: "Which company sold the Model T?",
    fr: "Quelle entreprise a vendu la Model T ?",
    qc: "C'est quelle entreprise qui a vendu la Model T ?",
    de: "Welches Unternehmen verkaufte den Model T?",
  }, ["Ford", "General Motors", "Chrysler", "Volkswagen"]),
  row("hard", "cars", "porsche-founder", {
    en: "Who founded the car company Porsche?",
    fr: "Qui a fondé l'entreprise automobile Porsche ?",
    qc: "C'est qui qui a fondé l'entreprise automobile Porsche ?",
    de: "Wer gründete das Autounternehmen Porsche?",
  }, ["Ferdinand Porsche", "Enzo Ferrari", "Henry Ford", "Karl Benz"]),
  row("difficult", "cars", "benz-car", {
    en: "Who built the Benz Patent-Motorwagen?",
    fr: "Qui a construit la Benz Patent-Motorwagen ?",
    qc: "C'est qui qui a construit la Benz Patent-Motorwagen ?",
    de: "Wer baute den Benz Patent-Motorwagen?",
  }, ["Karl Benz", "Gottlieb Daimler", "Henry Ford", "Nikolaus Otto"]),
  row("easy", "cars", "suv-mean", {
    en: "What does SUV stand for?",
    fr: "Que signifie SUV ?",
    qc: "SUV, ça veut dire quoi ?",
    de: "Wofür steht SUV?",
  }, ["sport utility vehicle", "standard urban van", "super utility volt", "speed under vacuum"]),
  row("easy", "cars", "rpm-mean", {
    en: "What does RPM stand for on a tachometer?",
    fr: "Que signifie RPM sur un compte-tours ?",
    qc: "RPM sur un compte-tours, ça veut dire quoi ?",
    de: "Wofür steht RPM auf einem Drehzahlmesser?",
  }, ["revolutions per minute", "rounds per mile", "rotations per meter", "revolutions per mile"]),
  row("easy", "cars", "mph-mean", {
    en: "What does MPH stand for on a speedometer?",
    fr: "Que signifie MPH sur un compteur de vitesse ?",
    qc: "MPH sur un compteur de vitesse, ça veut dire quoi ?",
    de: "Wofür steht MPH auf einem Tacho?",
  }, ["miles per hour", "meters per hour", "minutes per hour", "miles per hectare"]),
];

const languageRows = languages.map(([slug, place, answer, wrongs]) => row("easy", "culture", slug, {
  en: `What is the main language associated with ${place} in this question?`,
  fr: `Quelle est la langue principale associée à ${place} dans cette question ?`,
  qc: `C'est quoi la langue principale associée à ${place} dans cette question ?`,
  de: `Welche Hauptsprache ist in dieser Frage mit ${place} verbunden?`,
}, [answer, ...wrongs]));

const geoRows = geoWhich.map(([slug, en, answer, wrongs, fr, qc, de]) => row("hard", "geography", slug, {
  en, fr, qc, de,
}, [answer, ...wrongs]));

const yearRows = buildYears("difficult", years.map((item) => item[0]));

const more = [
  ...cleanCars,
  ...preciseCars,
  ...languageRows,
  ...geoRows,
  ...yearRows,
];

const NEED = { easy: 350, hard: 227, difficult: 94, extreme: 11 };
const extremeRows = [
  row("extreme", "sci-fi", "atomic-u", {
    en: "What is the atomic number of uranium?",
    fr: "Quel est le numéro atomique de l'uranium ?",
    qc: "C'est quoi le numéro atomique de l'uranium ?",
    de: "Welche Ordnungszahl hat Uran?",
  }, ["92", "79", "82", "88"]),
  row("extreme", "sci-fi", "atomic-au", {
    en: "What is the atomic number of gold?",
    fr: "Quel est le numéro atomique de l'or ?",
    qc: "C'est quoi le numéro atomique de l'or ?",
    de: "Welche Ordnungszahl hat Gold?",
  }, ["79", "47", "82", "29"]),
  row("extreme", "sci-fi", "atomic-pb", {
    en: "What is the atomic number of lead?",
    fr: "Quel est le numéro atomique du plomb ?",
    qc: "C'est quoi le numéro atomique du plomb ?",
    de: "Welche Ordnungszahl hat Blei?",
  }, ["82", "80", "26", "50"]),
  row("extreme", "sci-fi", "atomic-ag", {
    en: "What is the atomic number of silver?",
    fr: "Quel est le numéro atomique de l'argent ?",
    qc: "C'est quoi le numéro atomique de l'argent ?",
    de: "Welche Ordnungszahl hat Silber?",
  }, ["47", "79", "29", "50"]),
  row("extreme", "sci-fi", "atomic-w", {
    en: "What is the atomic number of tungsten?",
    fr: "Quel est le numéro atomique du tungstène ?",
    qc: "C'est quoi le numéro atomique du tungstène ?",
    de: "Welche Ordnungszahl hat Wolfram?",
  }, ["74", "78", "42", "26"]),
  row("extreme", "sci-fi", "atomic-hg", {
    en: "What is the atomic number of mercury?",
    fr: "Quel est le numéro atomique du mercure ?",
    qc: "C'est quoi le numéro atomique du mercure ?",
    de: "Welche Ordnungszahl hat Quecksilber?",
  }, ["80", "79", "82", "30"]),
  row("extreme", "culture", "y-magna-x", {
    en: "In which year was Magna Carta sealed?",
    fr: "En quelle année la Magna Carta a-t-elle été scellée ?",
    qc: "La Magna Carta a été scellée en quelle année ?",
    de: "In welchem Jahr wurde die Magna Carta besiegelt?",
  }, ["1215", "1066", "1492", "1776"]),
  row("extreme", "culture", "feet-mile", {
    en: "How many feet are in a mile?",
    fr: "Combien de pieds compte un mile ?",
    qc: "Il y a combien de pieds dans un mile ?",
    de: "Wie viele Fuß hat eine Meile?",
  }, ["5280", "1760", "1000", "1609"]),
  row("extreme", "music", "harp-strings", {
    en: "How many strings does a concert pedal harp usually have?",
    fr: "Combien de cordes une harpe à pédales de concert a-t-elle d'habitude ?",
    qc: "Une harpe à pédales de concert a d'habitude combien de cordes ?",
    de: "Wie viele Saiten hat eine Konzertpedalharfe gewöhnlich?",
  }, ["47", "88", "46", "40"]),
  row("extreme", "sci-fi", "bones-adult", {
    en: "About how many bones are in an adult human skeleton?",
    fr: "Environ combien d'os compte un squelette humain adulte ?",
    qc: "Un squelette humain adulte compte environ combien d'os ?",
    de: "Ungefähr wie viele Knochen hat ein erwachsenes menschliches Skelett?",
  }, ["206", "186", "256", "180"]),
  row("extreme", "sci-fi", "chromosomes", {
    en: "How many chromosomes are in a typical human body cell?",
    fr: "Combien de chromosomes compte une cellule humaine typique ?",
    qc: "Une cellule humaine typique compte combien de chromosomes ?",
    de: "Wie viele Chromosomen hat eine typische menschliche Körperzelle?",
  }, ["46", "23", "48", "44"]),
];

// y-magna is also in year list as difficult. Extreme uses y-magna-x so the slug differs.
// The fact year 1215 would duplicate if both ask the same English prompt.
// extreme prompt "In which year was Magna Carta sealed?" vs difficult "In which year Magna Carta was sealed" from year().
// year() uses "In which year ${event}" and event is "Magna Carta was sealed" => "In which year Magna Carta was sealed?"
// That's awkward English and may normalize similarly. I'll drop y-magna from the difficult year list.

const yearRowsSafe = yearRows.filter((item) => item.slug !== "y-magna");

const combined = [...more.filter((item) => item.slug !== "y-magna"), ...extremeRows].filter((item) => item.slug !== "y-magna");
// more already includes yearRows which include y-magna. Filter it.
const withoutMagna = more.filter((item) => item.slug !== "y-magna");
const all = [...withoutMagna, ...extremeRows];

const left = { ...NEED };
const placed = [];
const spill = ["extreme", "difficult", "hard", "easy"];
for (const item of all) {
  const preferred = item.tier;
  const order = [preferred, ...spill.filter((tier) => tier !== preferred)];
  let chosen = null;
  for (const tier of order) {
    if (left[tier] > 0) {
      left[tier] -= 1;
      chosen = tier;
      break;
    }
  }
  if (!chosen) continue;
  placed.push({ ...item, tier: chosen });
}

export const moreFacts = placed;
export const moreLeft = left;
export const moreCount = { made: all.length, kept: placed.length, left };
