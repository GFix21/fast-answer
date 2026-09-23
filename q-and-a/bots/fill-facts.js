/**
 * Original questions that bring week 2026-W39 to 150 in every generation.
 * Prompts stay factual. Slang is added later, beside the ask.
 */
import { anyCapital, assemble, place, q, report, stateCapital } from "./fill-lib.js";
import { moreFacts, moreCount } from "./fill-more.js";
import { restFacts } from "./fill-rest.js";

const city = (en, fr = en, de = en) => ({ en, fr, qc: fr, de });
const land = (en, frPhrase, de) => ({ en, fr: frPhrase, qc: frPhrase, de });

function cap(tier, slug, country, town, a, b, c) {
  return anyCapital(tier, slug, country, town, [a, b, c]);
}

function same(tier, topic, slug, titles, prompts, choices, hints) {
  return q(null, tier, topic, slug, titles, prompts, choices, hints);
}

const T = {
  count: { en: "How many", fr: "Combien", qc: "Combien", de: "Wie viele" },
  who: { en: "Who", fr: "Qui", qc: "Qui", de: "Wer" },
  which: { en: "Which", fr: "Lequel", qc: "Lequel", de: "Welches" },
  where: { en: "Where", fr: "Où", qc: "Où", de: "Wo" },
  year: { en: "Which year", fr: "Quelle année", qc: "Quelle année", de: "Welches Jahr" },
};

function howMany(tier, topic, slug, thing, answer, wrongs) {
  const [b, c, d] = wrongs;
  return same(
    tier,
    topic,
    slug,
    T.count,
    {
      en: `How many ${thing.en}?`,
      fr: `Combien ${thing.fr} ?`,
      qc: `Il y a combien ${thing.qc} ?`,
      de: `Wie viele ${thing.de}?`,
    },
    [answer, b, c, d],
    {
      en: "Count the usual set, not a special case.",
      fr: "Compte l'ensemble habituel, pas un cas spécial.",
      qc: "Compte l'ensemble habituel, pas un cas à part.",
      de: "Zähl die übliche Menge, nicht einen Sonderfall.",
    },
  );
}

function who(tier, topic, slug, prompts, choices, hints) {
  return same(tier, topic, slug, T.who, prompts, choices, hints);
}

const facts = [];

function add(row) {
  facts.push(row);
}

const LONDON = city("London", "Londres", "London");
const PARIS = city("Paris", "Paris", "Paris");
const ROME = city("Rome", "Rome", "Rom");
const MADRID = city("Madrid");
const BERLIN = city("Berlin", "Berlin", "Berlin");
const CAIRO = city("Cairo", "Le Caire", "Kairo");
const MOSCOW = city("Moscow", "Moscou", "Moskau");
const BEIJING = city("Beijing", "Pékin", "Peking");
const DELHI = city("New Delhi", "New Delhi", "Neu-Delhi");

add(cap("easy", "it-capital", land("Italy", "de l'Italie", "Italien"), ROME, MADRID, PARIS, BERLIN));
add(cap("easy", "de-capital", land("Germany", "de l'Allemagne", "Deutschland"), BERLIN, city("Munich", "Munich", "München"), city("Hamburg", "Hambourg", "Hamburg"), city("Frankfurt", "Francfort", "Frankfurt")));
add(cap("easy", "es-capital", land("Spain", "de l'Espagne", "Spanien"), MADRID, city("Barcelona", "Barcelone", "Barcelona"), city("Seville", "Séville", "Sevilla"), city("Valencia", "Valence", "Valencia")));
add(cap("easy", "uk-capital", land("the United Kingdom", "du Royaume-Uni", "dem Vereinigten Königreich"), LONDON, city("Manchester"), city("Edinburgh", "Édimbourg", "Edinburgh"), city("Birmingham")));
add(cap("easy", "ie-capital", land("Ireland", "de l'Irlande", "Irland"), city("Dublin"), LONDON, city("Cork", "Cork", "Cork"), city("Galway", "Galway", "Galway")));
add(cap("easy", "pt-capital", land("Portugal", "du Portugal", "Portugal"), city("Lisbon", "Lisbonne", "Lissabon"), MADRID, city("Porto", "Porto", "Porto"), PARIS));
add(cap("easy", "gr-capital", land("Greece", "de la Grèce", "Griechenland"), city("Athens", "Athènes", "Athen"), ROME, city("Thessaloniki", "Thessalonique", "Thessaloniki"), city("Sparta", "Sparte", "Sparta")));
add(cap("easy", "nl-capital", land("the Netherlands", "des Pays-Bas", "den Niederlanden"), city("Amsterdam"), city("The Hague", "La Haye", "Den Haag"), city("Rotterdam"), city("Utrecht")));
add(cap("easy", "be-capital", land("Belgium", "de la Belgique", "Belgien"), city("Brussels", "Bruxelles", "Brüssel"), city("Antwerp", "Anvers", "Antwerpen"), city("Bruges", "Bruges", "Brügge"), AMSTERDAM_SAFE()));

function AMSTERDAM_SAFE() {
  return city("Amsterdam");
}

add(cap("easy", "at-capital", land("Austria", "de l'Autriche", "Österreich"), city("Vienna", "Vienne", "Wien"), city("Salzburg", "Salzbourg", "Salzburg"), city("Innsbruck"), BERLIN));
add(cap("easy", "se-capital", land("Sweden", "de la Suède", "Schweden"), city("Stockholm"), city("Gothenburg", "Göteborg", "Göteborg"), city("Malmö", "Malmö", "Malmö"), city("Oslo")));
add(cap("easy", "no-capital", land("Norway", "de la Norvège", "Norwegen"), city("Oslo"), city("Bergen"), city("Stockholm"), city("Tromsø", "Tromsø", "Tromsö")));
add(cap("easy", "dk-capital", land("Denmark", "du Danemark", "Dänemark"), city("Copenhagen", "Copenhague", "Kopenhagen"), city("Aarhus"), city("Oslo"), city("Stockholm")));
add(cap("easy", "pl-capital", land("Poland", "de la Pologne", "Polen"), city("Warsaw", "Varsovie", "Warschau"), city("Krakow", "Cracovie", "Krakau"), city("Gdansk", "Gdansk", "Danzig"), BERLIN));
add(cap("easy", "ru-capital", land("Russia", "de la Russie", "Russland"), MOSCOW, city("Saint Petersburg", "Saint-Pétersbourg", "Sankt Petersburg"), city("Sochi", "Sotchi", "Sotschi"), city("Kazan", "Kazan", "Kasan")));
add(cap("easy", "cn-capital", land("China", "de la Chine", "China"), BEIJING, city("Shanghai"), city("Hong Kong", "Hong Kong", "Hongkong"), city("Guangzhou", "Canton", "Guangzhou")));
add(cap("easy", "in-capital", land("India", "de l'Inde", "Indien"), DELHI, city("Mumbai"), city("Kolkata", "Calcutta", "Kalkutta"), city("Chennai")));
add(cap("easy", "kr-capital", land("South Korea", "de la Corée du Sud", "Südkorea"), city("Seoul", "Séoul", "Seoul"), city("Busan", "Busan", "Busan"), city("Incheon"), city("Pyongyang", "Pyongyang", "Pjöngjang")));
add(cap("easy", "mx-capital", land("Mexico", "du Mexique", "Mexiko"), city("Mexico City", "Mexico", "Mexiko-Stadt"), city("Guadalajara"), city("Cancún", "Cancún", "Cancún"), city("Monterrey")));
add(cap("easy", "br-capital", land("Brazil", "du Brésil", "Brasilien"), city("Brasília", "Brasilia", "Brasília"), city("Rio de Janeiro"), city("São Paulo", "São Paulo", "São Paulo"), city("Salvador")));
add(cap("easy", "ar-capital", land("Argentina", "de l'Argentine", "Argentinien"), city("Buenos Aires"), city("Córdoba", "Córdoba", "Córdoba"), city("Rosario"), city("Mendoza")));
add(cap("easy", "eg-capital", land("Egypt", "de l'Égypte", "Ägypten"), CAIRO, city("Alexandria", "Alexandrie", "Alexandria"), city("Giza", "Gizeh", "Gizeh"), city("Luxor", "Louxor", "Luxor")));
add(cap("easy", "th-capital", land("Thailand", "de la Thaïlande", "Thailand"), city("Bangkok"), city("Phuket"), city("Chiang Mai"), city("Pattaya")));
add(cap("easy", "cu-capital", land("Cuba", "de Cuba", "Kuba"), city("Havana", "La Havane", "Havanna"), city("Santiago de Cuba"), city("Varadero"), city("Miami")));
add(cap("easy", "cl-capital", land("Chile", "du Chili", "Chile"), city("Santiago"), city("Valparaíso", "Valparaíso", "Valparaíso"), city("Concepción", "Concepción", "Concepción"), city("Lima", "Lima", "Lima")));
add(cap("easy", "pe-capital", land("Peru", "du Pérou", "Peru"), city("Lima", "Lima", "Lima"), city("Cusco", "Cusco", "Cusco"), city("Arequipa"), city("Santiago")));
add(cap("easy", "co-capital", land("Colombia", "de la Colombie", "Kolumbien"), city("Bogotá", "Bogota", "Bogotá"), city("Medellín", "Medellín", "Medellín"), city("Cartagena", "Carthagène", "Cartagena"), city("Cali")));
add(cap("easy", "ke-capital", land("Kenya", "du Kenya", "Kenia"), city("Nairobi"), city("Mombasa"), city("Kisumu"), CAIRO));
add(cap("easy", "cz-capital", land("Czechia", "de la Tchéquie", "Tschechien"), city("Prague", "Prague", "Prag"), city("Brno"), city("Vienna", "Vienne", "Wien"), city("Bratislava")));
add(cap("easy", "hu-capital", land("Hungary", "de la Hongrie", "Ungarn"), city("Budapest"), city("Vienna", "Vienne", "Wien"), city("Debrecen"), city("Prague", "Prague", "Prag")));
add(cap("easy", "fi-capital", land("Finland", "de la Finlande", "Finnland"), city("Helsinki"), city("Tampere"), city("Turku"), city("Stockholm")));
add(cap("easy", "is-capital", land("Iceland", "de l'Islande", "Island"), city("Reykjavík", "Reykjavik", "Reykjavík"), city("Akureyri"), city("Oslo"), city("Copenhagen", "Copenhague", "Kopenhagen")));
add(cap("easy", "sg-capital", land("Singapore", "de Singapour", "Singapur"), city("Singapore", "Singapour", "Singapur"), city("Kuala Lumpur"), city("Jakarta"), city("Bangkok")));
add(cap("easy", "id-capital", land("Indonesia", "de l'Indonésie", "Indonesien"), city("Jakarta"), city("Bali"), city("Surabaya"), city("Bandung")));
add(cap("easy", "ph-capital", land("the Philippines", "des Philippines", "den Philippinen"), city("Manila", "Manille", "Manila"), city("Cebu"), city("Davao"), city("Quezon City", "Quezon City", "Quezon City")));
add(cap("easy", "tr-capital", land("Turkey", "de la Turquie", "der Türkei"), city("Ankara"), city("Istanbul"), city("Izmir", "Izmir", "Izmir"), city("Antalya")));
add(cap("easy", "nz-capital", land("New Zealand", "de la Nouvelle-Zélande", "Neuseeland"), city("Wellington"), city("Auckland"), city("Christchurch"), city("Queenstown")));
add(cap("easy", "ng-capital", land("Nigeria", "du Nigeria", "Nigeria"), city("Abuja"), city("Lagos"), city("Kano"), city("Ibadan")));
add(same(
  "easy",
  "geography",
  "za-capital",
  { en: "Capital", fr: "Capitale", qc: "Capitale", de: "Hauptstadt" },
  {
    en: "What is the administrative capital of South Africa?",
    fr: "Quelle est la capitale administrative de l'Afrique du Sud ?",
    qc: "C'est quoi la capitale administrative de l'Afrique du Sud ?",
    de: "Was ist die Verwaltungshauptstadt von Südafrika?",
  },
  {
    en: ["Pretoria", "Cape Town", "Johannesburg", "Durban"],
    fr: ["Pretoria", "Le Cap", "Johannesburg", "Durban"],
    qc: ["Pretoria", "Le Cap", "Johannesburg", "Durban"],
    de: ["Pretoria", "Kapstadt", "Johannesburg", "Durban"],
  },
  {
    en: "South Africa also has a legislative capital and a judicial capital.",
    fr: "L'Afrique du Sud a aussi une capitale législative et une capitale judiciaire.",
    qc: "L'Afrique du Sud a aussi une capitale législative et une capitale judiciaire.",
    de: "Südafrika hat auch eine gesetzgebende und eine richterliche Hauptstadt.",
  },
));
add(cap("hard", "ch-capital", land("Switzerland", "de la Suisse", "der Schweiz"), city("Bern", "Berne", "Bern"), city("Zurich", "Zurich", "Zürich"), city("Geneva", "Genève", "Genf"), city("Basel", "Bâle", "Basel")));
add(cap("hard", "ma-capital", land("Morocco", "du Maroc", "Marokko"), city("Rabat"), city("Casablanca"), city("Marrakesh", "Marrakech", "Marrakesch"), city("Fes", "Fès", "Fes")));
add(cap("hard", "vn-capital", land("Vietnam", "du Vietnam", "Vietnam"), city("Hanoi", "Hanoï", "Hanoi"), city("Ho Chi Minh City", "Hô Chi Minh-Ville", "Ho-Chi-Minh-Stadt"), city("Da Nang"), city("Hue", "Huê", "Hue")));
add(cap("hard", "pk-capital", land("Pakistan", "du Pakistan", "Pakistan"), city("Islamabad"), city("Karachi"), city("Lahore"), city("Rawalpindi")));
add(cap("hard", "sa-capital", land("Saudi Arabia", "de l'Arabie saoudite", "Saudi-Arabien"), city("Riyadh", "Riyad", "Riad"), city("Jeddah", "Djedda", "Dschidda"), city("Mecca", "La Mecque", "Mekka"), city("Medina", "Médine", "Medina")));
add(cap("hard", "ae-capital", land("the United Arab Emirates", "des Émirats arabes unis", "den Vereinigten Arabischen Emiraten"), city("Abu Dhabi", "Abou Dhabi", "Abu Dhabi"), city("Dubai", "Dubaï", "Dubai"), city("Sharjah"), city("Doha")));
add(cap("hard", "ir-capital", land("Iran", "de l'Iran", "Iran"), city("Tehran", "Téhéran", "Teheran"), city("Isfahan", "Ispahan", "Isfahan"), city("Shiraz"), city("Mashhad")));
add(cap("hard", "iq-capital", land("Iraq", "de l'Irak", "Irak"), city("Baghdad", "Bagdad", "Bagdad"), city("Basra", "Bassora", "Basra"), city("Mosul", "Mossoul", "Mosul"), city("Erbil")));
add(cap("hard", "ua-capital", land("Ukraine", "de l'Ukraine", "der Ukraine"), city("Kyiv", "Kyiv", "Kiew"), city("Kharkiv", "Kharkiv", "Charkiw"), city("Odesa", "Odessa", "Odessa"), city("Lviv", "Lviv", "Lwiw")));
add(cap("hard", "ro-capital", land("Romania", "de la Roumanie", "Rumänien"), city("Bucharest", "Bucarest", "Bukarest"), city("Cluj-Napoca"), city("Timisoara", "Timișoara", "Temeswar"), city("Budapest")));
add(cap("hard", "bg-capital", land("Bulgaria", "de la Bulgarie", "Bulgarien"), city("Sofia"), city("Plovdiv"), city("Varna"), city("Bucharest", "Bucarest", "Bukarest")));
add(cap("hard", "hr-capital", land("Croatia", "de la Croatie", "Kroatien"), city("Zagreb"), city("Split"), city("Dubrovnik"), city("Rijeka")));
add(cap("hard", "rs-capital", land("Serbia", "de la Serbie", "Serbien"), city("Belgrade", "Belgrade", "Belgrad"), city("Novi Sad"), city("Niš", "Niš", "Niš"), city("Zagreb")));
add(cap("hard", "sk-capital", land("Slovakia", "de la Slovaquie", "der Slowakei"), city("Bratislava"), city("Kosice", "Košice", "Kaschau"), city("Prague", "Prague", "Prag"), city("Vienna", "Vienne", "Wien")));
add(cap("hard", "my-capital", land("Malaysia", "de la Malaisie", "Malaysia"), city("Kuala Lumpur"), city("George Town"), city("Johor Bahru"), city("Singapore", "Singapour", "Singapur")));
add(cap("hard", "qa-capital", land("Qatar", "du Qatar", "Katar"), city("Doha"), city("Dubai", "Dubaï", "Dubai"), city("Abu Dhabi", "Abou Dhabi", "Abu Dhabi"), city("Manama")));
add(cap("hard", "kw-capital", land("Kuwait", "du Koweït", "Kuwait"), city("Kuwait City", "Koweït", "Kuwait-Stadt"), city("Doha"), city("Manama"), city("Riyadh", "Riyad", "Riad")));
add(cap("hard", "jo-capital", land("Jordan", "de la Jordanie", "Jordanien"), city("Amman"), city("Petra", "Pétra", "Petra"), city("Aqaba"), city("Jerusalem", "Jérusalem", "Jerusalem")));
add(cap("hard", "lb-capital", land("Lebanon", "du Liban", "Libanon"), city("Beirut", "Beyrouth", "Beirut"), city("Tripoli", "Tripoli", "Tripoli"), city("Sidon", "Sidon", "Sidon"), city("Damascus", "Damas", "Damaskus")));
add(cap("hard", "et-capital", land("Ethiopia", "de l'Éthiopie", "Äthiopien"), city("Addis Ababa", "Addis-Abeba", "Addis Abeba"), city("Dire Dawa"), city("Nairobi"), city("Gondar")));
add(cap("hard", "gh-capital", land("Ghana", "du Ghana", "Ghana"), city("Accra"), city("Kumasi"), city("Lagos"), city("Tamale")));
add(cap("hard", "sn-capital", land("Senegal", "du Sénégal", "Senegal"), city("Dakar"), city("Saint-Louis"), city("Thiès", "Thiès", "Thiès"), city("Bamako")));
add(cap("hard", "tz-capital", land("Tanzania", "de la Tanzanie", "Tansania"), city("Dodoma"), city("Dar es Salaam"), city("Arusha"), city("Zanzibar", "Zanzibar", "Sansibar")));
add(cap("hard", "mm-capital", land("Myanmar", "du Myanmar", "Myanmar"), city("Naypyidaw"), city("Yangon"), city("Mandalay"), city("Bangkok")));
add(cap("difficult", "kh-capital", land("Cambodia", "du Cambodge", "Kambodscha"), city("Phnom Penh"), city("Siem Reap"), city("Bangkok"), city("Vientiane")));
add(cap("difficult", "la-capital", land("Laos", "du Laos", "Laos"), city("Vientiane"), city("Luang Prabang"), city("Phnom Penh"), city("Hanoi", "Hanoï", "Hanoi")));
add(cap("difficult", "np-capital", land("Nepal", "du Népal", "Nepal"), city("Kathmandu"), city("Pokhara"), city("Lalitpur"), DELHI));
add(cap("difficult", "bd-capital", land("Bangladesh", "du Bangladesh", "Bangladesch"), city("Dhaka"), city("Chittagong"), city("Khulna"), city("Kolkata", "Calcutta", "Kalkutta")));
add(cap("difficult", "af-capital", land("Afghanistan", "de l'Afghanistan", "Afghanistan"), city("Kabul"), city("Kandahar"), city("Herat"), city("Mazar-i-Sharif")));
add(cap("difficult", "uz-capital", land("Uzbekistan", "de l'Ouzbékistan", "Usbekistan"), city("Tashkent"), city("Samarkand", "Samarcande", "Samarkand"), city("Bukhara", "Boukhara", "Buchara"), city("Astana")));
add(cap("difficult", "kz-capital", land("Kazakhstan", "du Kazakhstan", "Kasachstan"), city("Astana"), city("Almaty"), city("Shymkent"), city("Tashkent")));
add(cap("difficult", "mn-capital", land("Mongolia", "de la Mongolie", "der Mongolei"), city("Ulaanbaatar"), city("Erdenet"), city("Darkhan"), BEIJING));
add(cap("difficult", "bt-capital", land("Bhutan", "du Bhoutan", "Bhutan"), city("Thimphu"), city("Paro"), city("Punakha"), city("Kathmandu")));
add(cap("difficult", "kg-capital", land("Kyrgyzstan", "du Kirghizistan", "Kirgisistan"), city("Bishkek"), city("Osh"), city("Tashkent"), city("Almaty")));
add(cap("difficult", "tj-capital", land("Tajikistan", "du Tadjikistan", "Tadschikistan"), city("Dushanbe"), city("Khujand"), city("Tashkent"), city("Bishkek")));
add(cap("difficult", "mg-capital", land("Madagascar", "de Madagascar", "Madagaskar"), city("Antananarivo"), city("Toamasina"), city("Antsirabe"), city("Nairobi")));
add(cap("difficult", "ci-capital", land("Côte d'Ivoire", "de la Côte d'Ivoire", "der Elfenbeinküste"), city("Yamoussoukro"), city("Abidjan"), city("Bouaké", "Bouaké", "Bouaké"), city("Accra")));
add(cap("difficult", "ao-capital", land("Angola", "de l'Angola", "Angola"), city("Luanda"), city("Huambo"), city("Lobito"), city("Kinshasa")));
add(cap("difficult", "mz-capital", land("Mozambique", "du Mozambique", "Mosambik"), city("Maputo"), city("Beira"), city("Nampula"), city("Johannesburg")));
add(cap("difficult", "na-capital", land("Namibia", "de la Namibie", "Namibia"), city("Windhoek"), city("Swakopmund"), city("Walvis Bay", "Walvis Bay", "Walfischbucht"), city("Gaborone")));
add(cap("difficult", "bw-capital", land("Botswana", "du Botswana", "Botswana"), city("Gaborone"), city("Francistown"), city("Maun"), city("Windhoek")));
add(cap("difficult", "zw-capital", land("Zimbabwe", "du Zimbabwe", "Simbabwe"), city("Harare"), city("Bulawayo"), city("Gaborone"), city("Lusaka")));
add(cap("difficult", "zm-capital", land("Zambia", "de la Zambie", "Sambia"), city("Lusaka"), city("Ndola"), city("Kitwe"), city("Harare")));
add(cap("extreme", "uy-capital", land("Uruguay", "de l'Uruguay", "Uruguay"), city("Montevideo"), city("Punta del Este"), city("Salto"), city("Buenos Aires")));
add(cap("extreme", "py-capital", land("Paraguay", "du Paraguay", "Paraguay"), city("Asunción", "Asunción", "Asunción"), city("Ciudad del Este"), city("Encarnación", "Encarnación", "Encarnación"), city("Montevideo")));
add(cap("extreme", "ec-capital", land("Ecuador", "de l'Équateur", "Ecuador"), city("Quito"), city("Guayaquil"), city("Cuenca"), city("Lima", "Lima", "Lima")));
add(cap("extreme", "ve-capital", land("Venezuela", "du Venezuela", "Venezuela"), city("Caracas"), city("Maracaibo"), city("Valencia"), city("Bogotá", "Bogota", "Bogotá")));
add(same(
  "extreme",
  "geography",
  "bo-capital",
  { en: "Capital", fr: "Capitale", qc: "Capitale", de: "Hauptstadt" },
  {
    en: "What is the constitutional capital of Bolivia?",
    fr: "Quelle est la capitale constitutionnelle de la Bolivie ?",
    qc: "C'est quoi la capitale constitutionnelle de la Bolivie ?",
    de: "Was ist die verfassungsmäßige Hauptstadt von Bolivien?",
  },
  {
    en: ["Sucre", "La Paz", "Santa Cruz", "Cochabamba"],
    fr: ["Sucre", "La Paz", "Santa Cruz", "Cochabamba"],
    qc: ["Sucre", "La Paz", "Santa Cruz", "Cochabamba"],
    de: ["Sucre", "La Paz", "Santa Cruz", "Cochabamba"],
  },
  {
    en: "The seat of government is a different city.",
    fr: "Le siège du gouvernement est une autre ville.",
    qc: "Le siège du gouvernement est une autre ville.",
    de: "Der Regierungssitz ist eine andere Stadt.",
  },
));
add(cap("extreme", "sr-capital", land("Suriname", "du Suriname", "Suriname"), city("Paramaribo"), city("Georgetown"), city("Cayenne", "Cayenne", "Cayenne"), city("Caracas")));
add(cap("extreme", "gy-capital", land("Guyana", "du Guyana", "Guyana"), city("Georgetown"), city("Paramaribo"), city("Cayenne", "Cayenne", "Cayenne"), city("Linden")));
add(cap("extreme", "ht-capital", land("Haiti", "d'Haïti", "Haiti"), city("Port-au-Prince"), city("Cap-Haïtien", "Cap-Haïtien", "Cap-Haïtien"), city("Santo Domingo"), city("Kingston")));
add(cap("extreme", "jm-capital", land("Jamaica", "de la Jamaïque", "Jamaika"), city("Kingston"), city("Montego Bay"), city("Spanish Town"), city("Port-au-Prince")));
add(cap("extreme", "do-capital", land("the Dominican Republic", "de la République dominicaine", "der Dominikanischen Republik"), city("Santo Domingo"), city("Santiago de los Caballeros"), city("Punta Cana"), city("Port-au-Prince")));
add(cap("extreme", "cr-capital", land("Costa Rica", "du Costa Rica", "Costa Rica"), city("San José", "San José", "San José"), city("Liberia"), city("Limón", "Limón", "Limón"), city("Panama City", "Panama", "Panama-Stadt")));
add(cap("extreme", "pa-capital", land("Panama", "du Panama", "Panama"), city("Panama City", "Panama", "Panama-Stadt"), city("Colón", "Colón", "Colón"), city("David"), city("San José", "San José", "San José")));
add(cap("extreme", "gt-capital", land("Guatemala", "du Guatemala", "Guatemala"), city("Guatemala City", "Guatemala", "Guatemala-Stadt"), city("Antigua"), city("Quetzaltenango"), city("San Salvador")));
add(cap("extreme", "hn-capital", land("Honduras", "du Honduras", "Honduras"), city("Tegucigalpa"), city("San Pedro Sula"), city("La Ceiba"), city("San Salvador")));
add(cap("extreme", "sv-capital", land("El Salvador", "du Salvador", "El Salvador"), city("San Salvador"), city("Santa Ana"), city("Tegucigalpa"), city("Guatemala City", "Guatemala", "Guatemala-Stadt")));
add(cap("extreme", "ni-capital", land("Nicaragua", "du Nicaragua", "Nicaragua"), city("Managua"), city("León", "León", "León"), city("Granada"), city("San José", "San José", "San José")));
add(cap("extreme", "fj-capital", land("Fiji", "des Fidji", "Fidschi"), city("Suva"), city("Nadi"), city("Lautoka"), city("Wellington")));
add(cap("extreme", "pg-capital", land("Papua New Guinea", "de la Papouasie-Nouvelle-Guinée", "Papua-Neuguinea"), city("Port Moresby"), city("Lae"), city("Mount Hagen"), city("Suva")));
add(cap("extreme", "ws-capital", land("Samoa", "des Samoa", "Samoa"), city("Apia"), city("Suva"), city("Nukuʻalofa", "Nuku'alofa", "Nuku'alofa"), city("Pago Pago")));
add(cap("extreme", "si-capital", land("Slovenia", "de la Slovénie", "Slowenien"), city("Ljubljana"), city("Maribor"), city("Zagreb"), city("Trieste", "Trieste", "Triest")));
add(cap("extreme", "ee-capital", land("Estonia", "de l'Estonie", "Estland"), city("Tallinn"), city("Tartu"), city("Riga"), city("Helsinki")));
add(cap("extreme", "lv-capital", land("Latvia", "de la Lettonie", "Lettland"), city("Riga"), city("Daugavpils"), city("Tallinn"), city("Vilnius")));
add(cap("extreme", "lt-capital", land("Lithuania", "de la Lituanie", "Litauen"), city("Vilnius"), city("Kaunas"), city("Riga"), city("Warsaw", "Varsovie", "Warschau")));
add(cap("extreme", "lu-capital", land("Luxembourg", "du Luxembourg", "Luxemburg"), city("Luxembourg", "Luxembourg", "Luxemburg"), city("Esch-sur-Alzette"), city("Brussels", "Bruxelles", "Brüssel"), city("Metz")));
add(cap("extreme", "mt-capital", land("Malta", "de Malte", "Malta"), city("Valletta", "La Valette", "Valletta"), city("Mdina"), city("Sliema"), city("Rome", "Rome", "Rom")));
add(cap("extreme", "al-capital", land("Albania", "de l'Albanie", "Albanien"), city("Tirana"), city("Durrës", "Durrës", "Durrës"), city("Vlorë", "Vlorë", "Vlora"), city("Podgorica")));
add(cap("extreme", "mk-capital", land("North Macedonia", "de la Macédoine du Nord", "Nordmazedonien"), city("Skopje"), city("Ohrid"), city("Bitola"), city("Tirana")));
add(cap("extreme", "me-capital", land("Montenegro", "du Monténégro", "Montenegro"), city("Podgorica"), city("Kotor"), city("Budva"), city("Belgrade", "Belgrade", "Belgrad")));
add(cap("extreme", "ba-capital", land("Bosnia and Herzegovina", "de la Bosnie-Herzégovine", "Bosnien und Herzegowina"), city("Sarajevo"), city("Mostar"), city("Banja Luka"), city("Zagreb")));
add(cap("extreme", "md-capital", land("Moldova", "de la Moldavie", "der Republik Moldau"), city("Chișinău", "Chișinău", "Chișinău"), city("Bălți", "Bălți", "Bălți"), city("Tiraspol"), city("Bucharest", "Bucarest", "Bukarest")));
add(cap("extreme", "by-capital", land("Belarus", "de la Biélorussie", "Belarus"), city("Minsk"), city("Brest"), city("Gomel"), MOSCOW));
add(cap("extreme", "am-capital", land("Armenia", "de l'Arménie", "Armenien"), city("Yerevan"), city("Gyumri"), city("Tbilisi", "Tbilissi", "Tiflis"), city("Baku", "Bakou", "Baku")));
add(cap("extreme", "ge-capital", land("Georgia", "de la Géorgie", "Georgien"), city("Tbilisi", "Tbilissi", "Tiflis"), city("Batumi"), city("Yerevan"), city("Baku", "Bakou", "Baku")));
add(cap("extreme", "az-capital", land("Azerbaijan", "de l'Azerbaïdjan", "Aserbaidschan"), city("Baku", "Bakou", "Baku"), city("Ganja"), city("Tbilisi", "Tbilissi", "Tiflis"), city("Yerevan")));
add(cap("extreme", "cy-capital", land("Cyprus", "de Chypre", "Zypern"), city("Nicosia", "Nicosie", "Nikosia"), city("Limassol"), city("Larnaca"), city("Athens", "Athènes", "Athen")));
add(cap("extreme", "om-capital", land("Oman", "d'Oman", "Oman"), city("Muscat", "Mascate", "Maskat"), city("Salalah"), city("Sohar"), city("Dubai", "Dubaï", "Dubai")));
add(cap("extreme", "bh-capital", land("Bahrain", "de Bahreïn", "Bahrain"), city("Manama"), city("Riffa"), city("Doha"), city("Kuwait City", "Koweït", "Kuwait-Stadt")));
add(cap("extreme", "rw-capital", land("Rwanda", "du Rwanda", "Ruanda"), city("Kigali"), city("Butare"), city("Gisenyi"), city("Kampala")));
add(cap("extreme", "ug-capital", land("Uganda", "de l'Ouganda", "Uganda"), city("Kampala"), city("Entebbe"), city("Gulu"), city("Nairobi")));
add(cap("extreme", "cm-capital", land("Cameroon", "du Cameroun", "Kamerun"), city("Yaoundé", "Yaoundé", "Yaoundé"), city("Douala"), city("Garoua"), city("Lagos")));
add(cap("extreme", "ml-capital", land("Mali", "du Mali", "Mali"), city("Bamako"), city("Timbuktu", "Tombouctou", "Timbuktu"), city("Sikasso"), city("Dakar")));
add(cap("extreme", "ne-capital", land("Niger", "du Niger", "Niger"), city("Niamey"), city("Zinder"), city("Agadez"), city("Bamako")));
add(cap("extreme", "tn-capital", land("Tunisia", "de la Tunisie", "Tunesien"), city("Tunis"), city("Sfax"), city("Sousse"), city("Carthage", "Carthage", "Karthago")));
add(cap("extreme", "dz-capital", land("Algeria", "de l'Algérie", "Algerien"), city("Algiers", "Alger", "Algier"), city("Oran", "Oran", "Oran"), city("Constantine", "Constantine", "Constantine"), city("Tunis")));
add(cap("extreme", "ly-capital", land("Libya", "de la Libye", "Libyen"), city("Tripoli", "Tripoli", "Tripolis"), city("Benghazi", "Benghazi", "Bengasi"), city("Misrata"), city("Tunis")));
add(cap("extreme", "sd-capital", land("Sudan", "du Soudan", "Sudan"), city("Khartoum", "Khartoum", "Khartum"), city("Omdurman"), city("Port Sudan", "Port-Soudan", "Port Sudan"), CAIRO));
add(cap("extreme", "er-capital", land("Eritrea", "de l'Érythrée", "Eritrea"), city("Asmara"), city("Massawa"), city("Addis Ababa", "Addis-Abeba", "Addis Abeba"), city("Khartoum", "Khartoum", "Khartum")));

const STATES = [
  ["easy", "ca-cap", "California", "Sacramento", ["Los Angeles", "San Francisco", "San Diego"]],
  ["easy", "ny-cap", "New York", "Albany", ["New York City", "Buffalo", "Rochester"]],
  ["easy", "tx-cap", "Texas", "Austin", ["Houston", "Dallas", "San Antonio"]],
  ["easy", "fl-cap", "Florida", "Tallahassee", ["Miami", "Orlando", "Tampa"]],
  ["easy", "il-cap", "Illinois", "Springfield", ["Chicago", "Aurora", "Naperville"]],
  ["easy", "pa-cap", "Pennsylvania", "Harrisburg", ["Philadelphia", "Pittsburgh", "Allentown"]],
  ["easy", "oh-cap", "Ohio", "Columbus", ["Cleveland", "Cincinnati", "Toledo"]],
  ["easy", "ga-cap", "Georgia", "Atlanta", ["Savannah", "Augusta", "Macon"]],
  ["easy", "co-cap", "Colorado", "Denver", ["Boulder", "Colorado Springs", "Aurora"]],
  ["easy", "hi-cap", "Hawaii", "Honolulu", ["Hilo", "Kailua", "Lahaina"]],
  ["easy", "ma-cap", "Massachusetts", "Boston", ["Cambridge", "Worcester", "Springfield"]],
  ["easy", "az-cap", "Arizona", "Phoenix", ["Tucson", "Flagstaff", "Sedona"]],
  ["easy", "wa-cap", "Washington", "Olympia", ["Seattle", "Spokane", "Tacoma"]],
  ["easy", "mi-cap", "Michigan", "Lansing", ["Detroit", "Ann Arbor", "Grand Rapids"]],
  ["easy", "nc-cap", "North Carolina", "Raleigh", ["Charlotte", "Asheville", "Durham"]],
  ["hard", "or-cap", "Oregon", "Salem", ["Portland", "Eugene", "Bend"]],
  ["hard", "nv-cap", "Nevada", "Carson City", ["Las Vegas", "Reno", "Henderson"]],
  ["hard", "ut-cap", "Utah", "Salt Lake City", ["Provo", "Park City", "Ogden"]],
  ["hard", "nm-cap", "New Mexico", "Santa Fe", ["Albuquerque", "Las Cruces", "Taos"]],
  ["hard", "la-cap", "Louisiana", "Baton Rouge", ["New Orleans", "Lafayette", "Shreveport"]],
  ["hard", "mo-cap", "Missouri", "Jefferson City", ["Kansas City", "St. Louis", "Springfield"]],
  ["hard", "mn-cap", "Minnesota", "Saint Paul", ["Minneapolis", "Duluth", "Rochester"]],
  ["hard", "wi-cap", "Wisconsin", "Madison", ["Milwaukee", "Green Bay", "Kenosha"]],
  ["hard", "tn-cap", "Tennessee", "Nashville", ["Memphis", "Knoxville", "Chattanooga"]],
  ["hard", "ky-cap", "Kentucky", "Frankfort", ["Louisville", "Lexington", "Bowling Green"]],
  ["hard", "al-cap", "Alabama", "Montgomery", ["Birmingham", "Mobile", "Huntsville"]],
  ["hard", "sc-cap", "South Carolina", "Columbia", ["Charleston", "Greenville", "Myrtle Beach"]],
  ["hard", "va-cap", "Virginia", "Richmond", ["Virginia Beach", "Norfolk", "Arlington"]],
  ["hard", "md-cap", "Maryland", "Annapolis", ["Baltimore", "Frederick", "Rockville"]],
  ["hard", "nj-cap", "New Jersey", "Trenton", ["Newark", "Jersey City", "Atlantic City"]],
  ["hard", "ct-cap", "Connecticut", "Hartford", ["New Haven", "Stamford", "Bridgeport"]],
  ["hard", "ri-cap", "Rhode Island", "Providence", ["Newport", "Warwick", "Pawtucket"]],
  ["hard", "me-cap", "Maine", "Augusta", ["Portland", "Bangor", "Bar Harbor"]],
  ["hard", "nh-cap", "New Hampshire", "Concord", ["Manchester", "Nashua", "Portsmouth"]],
  ["hard", "vt-cap", "Vermont", "Montpelier", ["Burlington", "Rutland", "Stowe"]],
  ["difficult", "ak-cap", "Alaska", "Juneau", ["Anchorage", "Fairbanks", "Nome"]],
  ["difficult", "de-cap", "Delaware", "Dover", ["Wilmington", "Newark", "Rehoboth Beach"]],
  ["difficult", "ia-cap", "Iowa", "Des Moines", ["Cedar Rapids", "Davenport", "Iowa City"]],
  ["difficult", "ks-cap", "Kansas", "Topeka", ["Wichita", "Kansas City", "Lawrence"]],
  ["difficult", "ne-cap", "Nebraska", "Lincoln", ["Omaha", "Bellevue", "Grand Island"]],
  ["difficult", "ok-cap", "Oklahoma", "Oklahoma City", ["Tulsa", "Norman", "Lawton"]],
  ["difficult", "ar-cap", "Arkansas", "Little Rock", ["Fayetteville", "Fort Smith", "Hot Springs"]],
  ["difficult", "ms-cap", "Mississippi", "Jackson", ["Biloxi", "Gulfport", "Oxford"]],
  ["difficult", "wv-cap", "West Virginia", "Charleston", ["Huntington", "Morgantown", "Wheeling"]],
  ["difficult", "id-cap", "Idaho", "Boise", ["Idaho Falls", "Coeur d'Alene", "Pocatello"]],
  ["extreme", "sd-cap", "South Dakota", "Pierre", ["Sioux Falls", "Rapid City", "Aberdeen"]],
  ["extreme", "nd-cap", "North Dakota", "Bismarck", ["Fargo", "Grand Forks", "Minot"]],
  ["extreme", "mt-cap", "Montana", "Helena", ["Billings", "Missoula", "Bozeman"]],
  ["extreme", "wy-cap", "Wyoming", "Cheyenne", ["Jackson", "Casper", "Laramie"]],
  ["extreme", "in-cap", "Indiana", "Indianapolis", ["Fort Wayne", "Evansville", "South Bend"]],
];

for (const [tier, slug, state, cityName, wrongs] of STATES) {
  add(stateCapital(tier, slug, state, cityName, wrongs));
}

export function draftFacts() {
  return [...facts, ...moreFacts, ...restFacts];
}

export function fillReport() {
  return { ...report([...facts, ...moreFacts, ...restFacts]), moreCount, rest: restFacts.length };
}

export function fillQuestions() {
  return assemble(place([...facts, ...moreFacts, ...restFacts]));
}
