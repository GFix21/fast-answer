/**
 * Flexer, game support. The cancel control is never behind these questions.
 * No discount. No required survey.
 */

const PACKS = {
  en: {
    hello: "I'm Flexer. I can help with the game, or with leaving. The cancel button on this screen works now. You do not have to answer me.",
    why: "Why are you cancelling?",
    choices: [
      ["tech", "Something is broken"],
      ["price", "The price"],
      ["quiet", "I'm not using it"],
      ["leave", "Just cancel"],
    ],
    tech: "Try these, in order. One browser tab. Refresh. The TV and the phones use the same room code. The TV is the host, the phone is only a buzzer. If a seat is stuck, leave the room and join again.",
    techNext: "Did that fix it?",
    techChoices: [
      ["fixed", "Yes, it's working"],
      ["mail", "No. Send TECH SUPPORT"],
    ],
    fixed: "Good. Stay if you want. Cancel is still there if you don't.",
    mailed: "I sent TECH SUPPORT to the house. They reply to your email. Cancel is still there.",
    mailFail: "The house mail did not go. Write gmgbrandlabel@gmail.com with the subject TECH SUPPORT. Cancel is still there.",
    price: "I can't change the price or offer a discount. If a law where you live lets you stop today and get unused days back, the cancel button does that. Otherwise the period you already paid runs to its end.",
    quiet: "You can leave the account and come back later with the same email. Uncheck mail consent if you don't want letters. Cancel is still there.",
    leave: "Cancel is the button below. It works whether or not you answered.",
    cancel: "Cancel now",
    support: "Game help",
  },
  fr: {
    hello: "Je suis Flexer. Je peux aider pour le jeu, ou pour partir. Le bouton d'annulation sur cet écran marche déjà. Tu n'as pas à me répondre.",
    why: "Pourquoi annules-tu ?",
    choices: [
      ["tech", "Quelque chose est brisé"],
      ["price", "Le prix"],
      ["quiet", "Je ne m'en sers pas"],
      ["leave", "Annuler seulement"],
    ],
    tech: "Essaie dans l'ordre. Un seul onglet. Actualise. Le téléviseur et les téléphones utilisent le même code. Le téléviseur est l'hôte, le téléphone n'est que le buzzer. Si un siège bloque, quitte le salon et rejoins.",
    techNext: "Est-ce que ça a réglé le problème ?",
    techChoices: [
      ["fixed", "Oui, ça marche"],
      ["mail", "Non. Envoyer TECH SUPPORT"],
    ],
    fixed: "Bien. Tu peux rester. Annuler est encore là.",
    mailed: "J'ai envoyé TECH SUPPORT à la maison. Ils répondent à ton courriel. Annuler est encore là.",
    mailFail: "Le courriel n'est pas parti. Écris à gmgbrandlabel@gmail.com, sujet TECH SUPPORT. Annuler est encore là.",
    price: "Je ne change pas le prix et je n'offre pas de rabais. Si la loi chez toi permet d'arrêter aujourd'hui et de revoir les jours non utilisés, le bouton le fait. Sinon, la période déjà payée va à son terme.",
    quiet: "Tu peux fermer le compte et revenir plus tard avec le même courriel. Décoche le consentement au courrier si tu ne veux pas de lettres. Annuler est encore là.",
    leave: "Annuler est le bouton ci-dessous. Il marche même si tu n'as pas répondu.",
    cancel: "Annuler maintenant",
    support: "Aide de jeu",
  },
  "fr-CA": {
    hello: "Je suis Flexer. Je peux aider pour le jeu, ou pour partir. Le bouton pour annuler sur cet écran marche déjà. T'es pas obligé de me répondre.",
    why: "Pourquoi tu annules ?",
    choices: [
      ["tech", "Quelque chose est brisé"],
      ["price", "Le prix"],
      ["quiet", "Je m'en sers pas"],
      ["leave", "Annuler, c'est tout"],
    ],
    tech: "Essaie dans l'ordre. Un seul onglet. Rafraîchis. Le téléviseur et les téléphones utilisent le même code. Le téléviseur est l'hôte, le téléphone est juste le buzzer. Si un siège bloque, sors du salon et reviens.",
    techNext: "Est-ce que ça l'a réglé ?",
    techChoices: [
      ["fixed", "Oui, ça marche"],
      ["mail", "Non. Envoyer TECH SUPPORT"],
    ],
    fixed: "Correct. Tu peux rester. Annuler est encore là.",
    mailed: "J'ai envoyé TECH SUPPORT à la maison. Ils répondent à ton courriel. Annuler est encore là.",
    mailFail: "Le courriel est pas parti. Écris à gmgbrandlabel@gmail.com, sujet TECH SUPPORT. Annuler est encore là.",
    price: "Je change pas le prix et j'offre pas de rabais. Si la loi au Québec te permet d'arrêter aujourd'hui, le bouton le fait. L'indemnité est plafonnée. Ce n'est pas moi qui décide du montant.",
    quiet: "Tu peux fermer le compte et revenir plus tard avec le même courriel. Décoche le consentement si tu veux plus de lettres. Annuler est encore là.",
    leave: "Annuler est le bouton en bas. Il marche même si t'as pas répondu.",
    cancel: "Annuler maintenant",
    support: "Aide de jeu",
  },
  de: {
    hello: "Ich bin Flexer. Ich helfe beim Spiel oder beim Gehen. Der Knopf auf diesem Schirm gilt jetzt. Du musst mir nicht antworten.",
    why: "Warum kündigst du?",
    choices: [
      ["tech", "Etwas ist kaputt"],
      ["price", "Der Preis"],
      ["quiet", "Ich nutze es nicht"],
      ["leave", "Einfach kündigen"],
    ],
    tech: "Der Reihe nach. Ein Tab. Neu laden. Fernseher und Telefone nutzen denselben Code. Der Fernseher ist der Host, das Telefon nur der Buzzer. Wenn ein Platz klemmt, Raum verlassen und neu beitreten.",
    techNext: "Hat das geholfen?",
    techChoices: [
      ["fixed", "Ja, es geht"],
      ["mail", "Nein. TECH SUPPORT senden"],
    ],
    fixed: "Gut. Du kannst bleiben. Kündigen geht immer noch.",
    mailed: "TECH SUPPORT ist an das Haus raus. Sie antworten an deine E-Mail. Kündigen geht immer noch.",
    mailFail: "Die Mail ging nicht. Schreib an gmgbrandlabel@gmail.com, Betreff TECH SUPPORT. Kündigen geht immer noch.",
    price: "Ich ändere den Preis nicht und gebe keinen Rabatt. Wenn das Recht bei dir ein Ende heute erlaubt, macht das der Knopf. Sonst läuft die schon gezahlte Zeit zu Ende.",
    quiet: "Du kannst gehen und später mit derselben E-Mail wiederkommen. Mail-Einwilligung aus, wenn du keine Briefe willst. Kündigen geht immer noch.",
    leave: "Kündigen ist der Knopf unten. Er gilt auch ohne Antwort.",
    cancel: "Jetzt kündigen",
    support: "Spielhilfe",
  },
};

export function flexerPack(locale) {
  if (locale === "fr-CA") return PACKS["fr-CA"];
  if (locale === "fr") return PACKS.fr;
  if (locale === "de") return PACKS.de;
  return PACKS.en;
}

export function flexerAnswer(locale, choice) {
  const pack = flexerPack(locale);
  if (choice === "tech") return { text: `${pack.tech}\n\n${pack.techNext}`, choices: pack.techChoices };
  if (choice === "fixed") return { text: pack.fixed, choices: [] };
  if (choice === "price") return { text: pack.price, choices: [] };
  if (choice === "quiet") return { text: pack.quiet, choices: [] };
  if (choice === "leave") return { text: pack.leave, choices: [] };
  return { text: pack.why, choices: pack.choices };
}
