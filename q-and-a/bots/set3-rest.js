/** Third wave of original SET00003 facts. */
import { q, trio, T, H, cityHost } from "./set3-facts.js";

const rows = [];
const add = (row) => rows.push(row);
const C = (en, qc, de) => trio(en, qc, de);

function cityCountry(tier, slug, city, country, wrongs) {
  add(q(tier, "geography", `city-${slug}`, {
    en: `In which country is the city of ${city.en}?`,
    qc: `La ville de ${city.qc} est dans quel pays?`,
    de: `In welchem Land liegt die Stadt ${city.de}?`,
  }, country, wrongs, T.geo, H.country));
}
function airport(tier, slug, code, city, wrongs) {
  add(q(tier, "geography", `air-${slug}`, {
    en: `Which city is served by the airport code ${code}?`,
    qc: `C'est quelle ville que dessert le code d'aéroport ${code}?`,
    de: `Welche Stadt bedient der Flughafencode ${code}?`,
  }, city, wrongs, T.geo, H.place));
}
function sea(tier, slug, ask, water, wrongs) {
  add(q(tier, "geography", `sea-${slug}`, ask, water, wrongs, T.geo, H.straight));
}
function play(tier, slug, who, title, wrongs) {
  add(q(tier, "culture", `play-${slug}`, {
    en: `In which Shakespeare play is ${who}?`,
    qc: `Dans quelle pièce de Shakespeare est ${who}?`,
    de: `In welchem Shakespeare-Stück kommt ${who} vor?`,
  }, title, wrongs, T.art, H.straight));
}

const CITIES = [
  ["easy", "montreal", C("Montreal", "Montréal", "Montreal"), C("Canada", "Le Canada", "Kanada"), [C("France", "La France", "Frankreich"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), C("Belgium", "La Belgique", "Belgien")]],
  ["easy", "vancouver", C("Vancouver", "Vancouver", "Vancouver"), C("Canada", "Le Canada", "Kanada"), [C("the United States", "Les États-Unis", "die Vereinigten Staaten"), C("Australia", "L'Australie", "Australien"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich")]],
  ["easy", "calgary", C("Calgary", "Calgary", "Calgary"), C("Canada", "Le Canada", "Kanada"), [C("the United States", "Les États-Unis", "die Vereinigten Staaten"), C("Australia", "L'Australie", "Australien"), C("Ireland", "L'Irlande", "Irland")]],
  ["easy", "chicago", C("Chicago", "Chicago", "Chicago"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), [C("Canada", "Le Canada", "Kanada"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), C("Australia", "L'Australie", "Australien")]],
  ["easy", "boston", C("Boston", "Boston", "Boston"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), [C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), C("Ireland", "L'Irlande", "Irland"), C("Canada", "Le Canada", "Kanada")]],
  ["easy", "new-orleans", C("New Orleans", "La Nouvelle-Orléans", "New Orleans"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), [C("France", "La France", "Frankreich"), C("Canada", "Le Canada", "Kanada"), C("Haiti", "Haïti", "Haiti")]],
  ["easy", "san-francisco", C("San Francisco", "San Francisco", "San Francisco"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), [C("Mexico", "Le Mexique", "Mexiko"), C("Spain", "L'Espagne", "Spanien"), C("Canada", "Le Canada", "Kanada")]],
  ["easy", "miami", C("Miami", "Miami", "Miami"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), [C("Cuba", "Cuba", "Kuba"), C("Spain", "L'Espagne", "Spanien"), C("Mexico", "Le Mexique", "Mexiko")]],
  ["easy", "seattle", C("Seattle", "Seattle", "Seattle"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), [C("Canada", "Le Canada", "Kanada"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), C("Australia", "L'Australie", "Australien")]],
  ["easy", "honolulu", C("Honolulu", "Honolulu", "Honolulu"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), [C("Japan", "Le Japon", "Japan"), C("Australia", "L'Australie", "Australien"), C("Mexico", "Le Mexique", "Mexiko")]],
  ["easy", "lyon", C("Lyon", "Lyon", "Lyon"), C("France", "La France", "Frankreich"), [C("Belgium", "La Belgique", "Belgien"), C("Switzerland", "La Suisse", "die Schweiz"), C("Italy", "L'Italie", "Italien")]],
  ["easy", "marseille", C("Marseille", "Marseille", "Marseille"), C("France", "La France", "Frankreich"), [C("Spain", "L'Espagne", "Spanien"), C("Italy", "L'Italie", "Italien"), C("Algeria", "L'Algérie", "Algerien")]],
  ["easy", "venice", C("Venice", "Venise", "Venedig"), C("Italy", "L'Italie", "Italien"), [C("Croatia", "La Croatie", "Kroatien"), C("Greece", "La Grèce", "Griechenland"), C("France", "La France", "Frankreich")]],
  ["easy", "milan", C("Milan", "Milan", "Mailand"), C("Italy", "L'Italie", "Italien"), [C("Switzerland", "La Suisse", "die Schweiz"), C("France", "La France", "Frankreich"), C("Austria", "L'Autriche", "Österreich")]],
  ["easy", "florence", C("Florence", "Florence", "Florenz"), C("Italy", "L'Italie", "Italien"), [C("France", "La France", "Frankreich"), C("Spain", "L'Espagne", "Spanien"), C("Greece", "La Grèce", "Griechenland")]],
  ["easy", "naples", C("Naples", "Naples", "Neapel"), C("Italy", "L'Italie", "Italien"), [C("Greece", "La Grèce", "Griechenland"), C("Spain", "L'Espagne", "Spanien"), C("France", "La France", "Frankreich")]],
  ["easy", "barcelona", C("Barcelona", "Barcelone", "Barcelona"), C("Spain", "L'Espagne", "Spanien"), [C("France", "La France", "Frankreich"), C("Italy", "L'Italie", "Italien"), C("Portugal", "Le Portugal", "Portugal")]],
  ["hard", "seville", C("Seville", "Séville", "Sevilla"), C("Spain", "L'Espagne", "Spanien"), [C("Portugal", "Le Portugal", "Portugal"), C("Morocco", "Le Maroc", "Marokko"), C("Italy", "L'Italie", "Italien")]],
  ["hard", "porto", C("Porto", "Porto", "Porto"), C("Portugal", "Le Portugal", "Portugal"), [C("Spain", "L'Espagne", "Spanien"), C("Brazil", "Le Brésil", "Brasilien"), C("France", "La France", "Frankreich")]],
  ["easy", "munich", C("Munich", "Munich", "München"), C("Germany", "L'Allemagne", "Deutschland"), [C("Austria", "L'Autriche", "Österreich"), C("Switzerland", "La Suisse", "die Schweiz"), C("Czechia", "La Tchéquie", "Tschechien")]],
  ["hard", "hamburg", C("Hamburg", "Hambourg", "Hamburg"), C("Germany", "L'Allemagne", "Deutschland"), [C("Denmark", "Le Danemark", "Dänemark"), C("the Netherlands", "Les Pays-Bas", "die Niederlande"), C("Poland", "La Pologne", "Polen")]],
  ["hard", "frankfurt", C("Frankfurt", "Francfort", "Frankfurt"), C("Germany", "L'Allemagne", "Deutschland"), [C("France", "La France", "Frankreich"), C("Austria", "L'Autriche", "Österreich"), C("Belgium", "La Belgique", "Belgien")]],
  ["hard", "salzburg", C("Salzburg", "Salzbourg", "Salzburg"), C("Austria", "L'Autriche", "Österreich"), [C("Germany", "L'Allemagne", "Deutschland"), C("Switzerland", "La Suisse", "die Schweiz"), C("Italy", "L'Italie", "Italien")]],
  ["hard", "zurich", C("Zurich", "Zurich", "Zürich"), C("Switzerland", "La Suisse", "die Schweiz"), [C("Germany", "L'Allemagne", "Deutschland"), C("Austria", "L'Autriche", "Österreich"), C("France", "La France", "Frankreich")]],
  ["hard", "geneva", C("Geneva", "Genève", "Genf"), C("Switzerland", "La Suisse", "die Schweiz"), [C("France", "La France", "Frankreich"), C("Italy", "L'Italie", "Italien"), C("Germany", "L'Allemagne", "Deutschland")]],
  ["hard", "antwerp", C("Antwerp", "Anvers", "Antwerpen"), C("Belgium", "La Belgique", "Belgien"), [C("the Netherlands", "Les Pays-Bas", "die Niederlande"), C("France", "La France", "Frankreich"), C("Germany", "L'Allemagne", "Deutschland")]],
  ["hard", "bruges", C("Bruges", "Bruges", "Brügge"), C("Belgium", "La Belgique", "Belgien"), [C("France", "La France", "Frankreich"), C("the Netherlands", "Les Pays-Bas", "die Niederlande"), C("Germany", "L'Allemagne", "Deutschland")]],
  ["hard", "rotterdam", C("Rotterdam", "Rotterdam", "Rotterdam"), C("the Netherlands", "Les Pays-Bas", "die Niederlande"), [C("Belgium", "La Belgique", "Belgien"), C("Germany", "L'Allemagne", "Deutschland"), C("Denmark", "Le Danemark", "Dänemark")]],
  ["easy", "edinburgh", C("Edinburgh", "Édimbourg", "Edinburgh"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), [C("Ireland", "L'Irlande", "Irland"), C("France", "La France", "Frankreich"), C("Denmark", "Le Danemark", "Dänemark")]],
  ["hard", "glasgow", C("Glasgow", "Glasgow", "Glasgow"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), [C("Ireland", "L'Irlande", "Irland"), C("Canada", "Le Canada", "Kanada"), C("Australia", "L'Australie", "Australien")]],
  ["hard", "krakow", C("Krakow", "Cracovie", "Krakau"), C("Poland", "La Pologne", "Polen"), [C("Czechia", "La Tchéquie", "Tschechien"), C("Austria", "L'Autriche", "Österreich"), C("Ukraine", "L'Ukraine", "die Ukraine")]],
  ["hard", "dubrovnik", C("Dubrovnik", "Dubrovnik", "Dubrovnik"), C("Croatia", "La Croatie", "Kroatien"), [C("Italy", "L'Italie", "Italien"), C("Montenegro", "Le Monténégro", "Montenegro"), C("Greece", "La Grèce", "Griechenland")]],
  ["easy", "kyoto", C("Kyoto", "Kyoto", "Kyoto"), C("Japan", "Le Japon", "Japan"), [C("China", "La Chine", "China"), C("South Korea", "La Corée du Sud", "Südkorea"), C("Taiwan", "Taïwan", "Taiwan")]],
  ["hard", "osaka", C("Osaka", "Osaka", "Osaka"), C("Japan", "Le Japon", "Japan"), [C("South Korea", "La Corée du Sud", "Südkorea"), C("China", "La Chine", "China"), C("the Philippines", "Les Philippines", "die Philippinen")]],
  ["hard", "busan", C("Busan", "Busan", "Busan"), C("South Korea", "La Corée du Sud", "Südkorea"), [C("Japan", "Le Japon", "Japan"), C("China", "La Chine", "China"), C("North Korea", "La Corée du Nord", "Nordkorea")]],
  ["easy", "shanghai", C("Shanghai", "Shanghai", "Shanghai"), C("China", "La Chine", "China"), [C("Japan", "Le Japon", "Japan"), C("South Korea", "La Corée du Sud", "Südkorea"), C("Vietnam", "Le Vietnam", "Vietnam")]],
  ["hard", "xian", C("Xi'an", "Xi'an", "Xi'an"), C("China", "La Chine", "China"), [C("Mongolia", "La Mongolie", "die Mongolei"), C("Japan", "Le Japon", "Japan"), C("Kazakhstan", "Le Kazakhstan", "Kasachstan")]],
  ["easy", "mumbai", C("Mumbai", "Mumbai", "Mumbai"), C("India", "L'Inde", "Indien"), [C("Pakistan", "Le Pakistan", "Pakistan"), C("Bangladesh", "Le Bangladesh", "Bangladesch"), C("Sri Lanka", "Le Sri Lanka", "Sri Lanka")]],
  ["hard", "kolkata", C("Kolkata", "Calcutta", "Kalkutta"), C("India", "L'Inde", "Indien"), [C("Bangladesh", "Le Bangladesh", "Bangladesch"), C("Nepal", "Le Népal", "Nepal"), C("Myanmar", "Le Myanmar", "Myanmar")]],
  ["hard", "lahore", C("Lahore", "Lahore", "Lahore"), C("Pakistan", "Le Pakistan", "Pakistan"), [C("India", "L'Inde", "Indien"), C("Afghanistan", "L'Afghanistan", "Afghanistan"), C("Iran", "L'Iran", "Iran")]],
  ["hard", "alexandria", C("Alexandria", "Alexandrie", "Alexandria"), C("Egypt", "L'Égypte", "Ägypten"), [C("Greece", "La Grèce", "Griechenland"), C("Libya", "La Libye", "Libyen"), C("Italy", "L'Italie", "Italien")]],
  ["hard", "luxor", C("Luxor", "Louxor", "Luxor"), C("Egypt", "L'Égypte", "Ägypten"), [C("Sudan", "Le Soudan", "Sudan"), C("Jordan", "La Jordanie", "Jordanien"), C("Morocco", "Le Maroc", "Marokko")]],
  ["hard", "marrakesh", C("Marrakesh", "Marrakech", "Marrakesch"), C("Morocco", "Le Maroc", "Marokko"), [C("Algeria", "L'Algérie", "Algerien"), C("Spain", "L'Espagne", "Spanien"), C("Tunisia", "La Tunisie", "Tunesien")]],
  ["hard", "fez", C("Fez", "Fès", "Fès"), C("Morocco", "Le Maroc", "Marokko"), [C("Tunisia", "La Tunisie", "Tunesien"), C("Algeria", "L'Algérie", "Algerien"), C("Spain", "L'Espagne", "Spanien")]],
  ["easy", "cape-town", C("Cape Town", "Le Cap", "Kapstadt"), C("South Africa", "L'Afrique du Sud", "Südafrika"), [C("Namibia", "La Namibie", "Namibia"), C("Australia", "L'Australie", "Australien"), C("Kenya", "Le Kenya", "Kenia")]],
  ["hard", "johannesburg", C("Johannesburg", "Johannesburg", "Johannesburg"), C("South Africa", "L'Afrique du Sud", "Südafrika"), [C("Zimbabwe", "Le Zimbabwe", "Simbabwe"), C("Botswana", "Le Botswana", "Botswana"), C("Namibia", "La Namibie", "Namibia")]],
  ["easy", "rio", C("Rio de Janeiro", "Rio de Janeiro", "Rio de Janeiro"), C("Brazil", "Le Brésil", "Brasilien"), [C("Portugal", "Le Portugal", "Portugal"), C("Argentina", "L'Argentine", "Argentinien"), C("Mexico", "Le Mexique", "Mexiko")]],
  ["easy", "sao-paulo", C("São Paulo", "São Paulo", "São Paulo"), C("Brazil", "Le Brésil", "Brasilien"), [C("Portugal", "Le Portugal", "Portugal"), C("Argentina", "L'Argentine", "Argentinien"), C("Spain", "L'Espagne", "Spanien")]],
  ["hard", "cusco", C("Cusco", "Cusco", "Cusco"), C("Peru", "Le Pérou", "Peru"), [C("Bolivia", "La Bolivie", "Bolivien"), C("Ecuador", "L'Équateur", "Ecuador"), C("Mexico", "Le Mexique", "Mexiko")]],
  ["hard", "valparaiso", C("Valparaíso", "Valparaíso", "Valparaíso"), C("Chile", "Le Chili", "Chile"), [C("Peru", "Le Pérou", "Peru"), C("Argentina", "L'Argentine", "Argentinien"), C("Spain", "L'Espagne", "Spanien")]],
  ["hard", "guadalajara", C("Guadalajara", "Guadalajara", "Guadalajara"), C("Mexico", "Le Mexique", "Mexiko"), [C("Spain", "L'Espagne", "Spanien"), C("Colombia", "La Colombie", "Kolumbien"), C("Cuba", "Cuba", "Kuba")]],
  ["easy", "cancun", C("Cancún", "Cancún", "Cancún"), C("Mexico", "Le Mexique", "Mexiko"), [C("Cuba", "Cuba", "Kuba"), C("Spain", "L'Espagne", "Spanien"), C("Belize", "Le Belize", "Belize")]],
  ["easy", "sydney", C("Sydney", "Sydney", "Sydney"), C("Australia", "L'Australie", "Australien"), [C("New Zealand", "La Nouvelle-Zélande", "Neuseeland"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), C("Canada", "Le Canada", "Kanada")]],
  ["easy", "melbourne", C("Melbourne", "Melbourne", "Melbourne"), C("Australia", "L'Australie", "Australien"), [C("New Zealand", "La Nouvelle-Zélande", "Neuseeland"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), C("Canada", "Le Canada", "Kanada")]],
  ["hard", "auckland", C("Auckland", "Auckland", "Auckland"), C("New Zealand", "La Nouvelle-Zélande", "Neuseeland"), [C("Australia", "L'Australie", "Australien"), C("Fiji", "Les Fidji", "Fidschi"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich")]],
  ["hard", "christchurch", C("Christchurch", "Christchurch", "Christchurch"), C("New Zealand", "La Nouvelle-Zélande", "Neuseeland"), [C("Australia", "L'Australie", "Australien"), C("the United Kingdom", "Le Royaume-Uni", "das Vereinigte Königreich"), C("Canada", "Le Canada", "Kanada")]],
  ["easy", "las-vegas", C("Las Vegas", "Las Vegas", "Las Vegas"), C("the United States", "Les États-Unis", "die Vereinigten Staaten"), [C("Mexico", "Le Mexique", "Mexiko"), C("Canada", "Le Canada", "Kanada"), C("Spain", "L'Espagne", "Spanien")]],
  ["hard", "medellin", C("Medellín", "Medellín", "Medellín"), C("Colombia", "La Colombie", "Kolumbien"), [C("Spain", "L'Espagne", "Spanien"), C("Mexico", "Le Mexique", "Mexiko"), C("Venezuela", "Le Venezuela", "Venezuela")]],
  ["hard", "cartagena", C("Cartagena", "Carthagène", "Cartagena"), C("Colombia", "La Colombie", "Kolumbien"), [C("Spain", "L'Espagne", "Spanien"), C("Venezuela", "Le Venezuela", "Venezuela"), C("Panama", "Le Panama", "Panama")]],
];
for (const [tier, slug, city, country, wrongs] of CITIES) cityCountry(tier, slug, city, country, wrongs);

const AIR = [
  ["easy", "yul", "YUL", "Montreal", ["Toronto", "Ottawa", "Quebec City"]],
  ["easy", "yyz", "YYZ", "Toronto", ["Montreal", "Ottawa", "Vancouver"]],
  ["easy", "yvr", "YVR", "Vancouver", ["Victoria", "Calgary", "Seattle"]],
  ["hard", "yow", "YOW", "Ottawa", ["Toronto", "Montreal", "Quebec City"]],
  ["easy", "jfk", "JFK", "New York", ["Boston", "Washington", "Philadelphia"]],
  ["easy", "lax", "LAX", "Los Angeles", ["San Francisco", "San Diego", "Las Vegas"]],
  ["hard", "ord", "ORD", "Chicago", ["Detroit", "Milwaukee", "St. Louis"]],
  ["easy", "lhr", "LHR", "London", ["Manchester", "Paris", "Dublin"]],
  ["easy", "cdg", "CDG", "Paris", ["Lyon", "Brussels", "Geneva"]],
  ["hard", "fra", "FRA", "Frankfurt", ["Munich", "Berlin", "Zurich"]],
  ["hard", "nrt", "NRT", "Tokyo", ["Osaka", "Seoul", "Taipei"]],
  ["easy", "syd", "SYD", "Sydney", ["Melbourne", "Brisbane", "Auckland"]],
  ["hard", "dxb", "DXB", "Dubai", ["Abu Dhabi", "Doha", "Riyadh"]],
  ["hard", "ams", "AMS", "Amsterdam", ["Rotterdam", "Brussels", "Frankfurt"]],
  ["hard", "mad", "MAD", "Madrid", ["Barcelona", "Lisbon", "Seville"]],
  ["hard", "fco", "FCO", "Rome", ["Milan", "Naples", "Venice"]],
  ["difficult", "gru", "GRU", "São Paulo", ["Rio de Janeiro", "Brasília", "Buenos Aires"]],
  ["hard", "mex", "MEX", "Mexico City", ["Guadalajara", "Cancún", "Monterrey"]],
  ["difficult", "icn", "ICN", "Seoul", ["Busan", "Tokyo", "Beijing"]],
  ["difficult", "sin", "SIN", "Singapore", ["Kuala Lumpur", "Jakarta", "Bangkok"]],
  ["hard", "hkg", "HKG", "Hong Kong", ["Macau", "Taipei", "Guangzhou"]],
  ["difficult", "del", "DEL", "Delhi", ["Mumbai", "Kolkata", "Bengaluru"]],
  ["hard", "zrh", "ZRH", "Zurich", ["Geneva", "Basel", "Munich"]],
  ["hard", "vie", "VIE", "Vienna", ["Salzburg", "Budapest", "Prague"]],
  ["hard", "bru", "BRU", "Brussels", ["Antwerp", "Amsterdam", "Paris"]],
  ["difficult", "lis", "LIS", "Lisbon", ["Porto", "Madrid", "Faro"]],
  ["hard", "ath", "ATH", "Athens", ["Thessaloniki", "Rome", "Istanbul"]],
  ["hard", "dub", "DUB", "Dublin", ["Cork", "London", "Belfast"]],
  ["difficult", "akl", "AKL", "Auckland", ["Wellington", "Christchurch", "Sydney"]],
  ["difficult", "jnb", "JNB", "Johannesburg", ["Cape Town", "Durban", "Nairobi"]],
  ["difficult", "cai", "CAI", "Cairo", ["Alexandria", "Luxor", "Tunis"]],
  ["hard", "ist", "IST", "Istanbul", ["Ankara", "Athens", "Izmir"]],
  ["hard", "bcn", "BCN", "Barcelona", ["Madrid", "Valencia", "Marseille"]],
  ["hard", "muc", "MUC", "Munich", ["Frankfurt", "Stuttgart", "Vienna"]],
  ["hard", "ber", "BER", "Berlin", ["Hamburg", "Leipzig", "Warsaw"]],
];
for (const [tier, slug, code, city, wrongs] of AIR) airport(tier, slug, code, city, wrongs);

const SUMMER = [
  ["difficult", "1900", "the 1900 Summer Olympics", "les Jeux olympiques d'été de 1900", "der Olympischen Sommerspiele 1900", "Paris"],
  ["extreme", "1904", "the 1904 Summer Olympics", "les Jeux olympiques d'été de 1904", "der Olympischen Sommerspiele 1904", "St. Louis"],
  ["hard", "1908", "the 1908 Summer Olympics", "les Jeux olympiques d'été de 1908", "der Olympischen Sommerspiele 1908", "London"],
  ["difficult", "1912", "the 1912 Summer Olympics", "les Jeux olympiques d'été de 1912", "der Olympischen Sommerspiele 1912", "Stockholm"],
  ["hard", "1932", "the 1932 Summer Olympics", "les Jeux olympiques d'été de 1932", "der Olympischen Sommerspiele 1932", "Los Angeles"],
  ["difficult", "1936", "the 1936 Summer Olympics", "les Jeux olympiques d'été de 1936", "der Olympischen Sommerspiele 1936", "Berlin"],
  ["hard", "1948", "the 1948 Summer Olympics", "les Jeux olympiques d'été de 1948", "der Olympischen Sommerspiele 1948", "London"],
  ["difficult", "1952", "the 1952 Summer Olympics", "les Jeux olympiques d'été de 1952", "der Olympischen Sommerspiele 1952", "Helsinki"],
  ["hard", "1960", "the 1960 Summer Olympics", "les Jeux olympiques d'été de 1960", "der Olympischen Sommerspiele 1960", "Rome"],
  ["hard", "1972", "the 1972 Summer Olympics", "les Jeux olympiques d'été de 1972", "der Olympischen Sommerspiele 1972", "Munich"],
  ["difficult", "1980", "the 1980 Summer Olympics", "les Jeux olympiques d'été de 1980", "der Olympischen Sommerspiele 1980", "Moscow"],
  ["hard", "1988s", "the 1988 Summer Olympics", "les Jeux olympiques d'été de 1988", "der Olympischen Sommerspiele 1988", "Seoul"],
  ["easy", "1996", "the 1996 Summer Olympics", "les Jeux olympiques d'été de 1996", "der Olympischen Sommerspiele 1996", "Atlanta"],
  ["easy", "2004", "the 2004 Summer Olympics", "les Jeux olympiques d'été de 2004", "der Olympischen Sommerspiele 2004", "Athens"],
  ["easy", "2021", "the Summer Olympics held in 2021", "les Jeux olympiques d'été tenus en 2021", "der Olympischen Sommerspiele, die 2021 stattfanden", "Tokyo"],
  ["easy", "2024", "the 2024 Summer Olympics", "les Jeux olympiques d'été de 2024", "der Olympischen Sommerspiele 2024", "Paris"],
];
const HOST_WRONG = ["London", "Paris", "Rome", "Tokyo"];
for (const [tier, slug, en, qc, de, city] of SUMMER) {
  add(cityHost(tier, `s-${slug}`, { en, qc, de }, city, HOST_WRONG.filter((w) => w !== city).slice(0, 3)));
}
const WINTER = [
  ["extreme", "1924", "the 1924 Winter Olympics", "les Jeux olympiques d'hiver de 1924", "der Olympischen Winterspiele 1924", "Chamonix"],
  ["extreme", "1928", "the 1928 Winter Olympics", "les Jeux olympiques d'hiver de 1928", "der Olympischen Winterspiele 1928", "St. Moritz"],
  ["difficult", "1932w", "the 1932 Winter Olympics", "les Jeux olympiques d'hiver de 1932", "der Olympischen Winterspiele 1932", "Lake Placid"],
  ["extreme", "1936w", "the 1936 Winter Olympics", "les Jeux olympiques d'hiver de 1936", "der Olympischen Winterspiele 1936", "Garmisch-Partenkirchen"],
  ["difficult", "1952w", "the 1952 Winter Olympics", "les Jeux olympiques d'hiver de 1952", "der Olympischen Winterspiele 1952", "Oslo"],
  ["extreme", "1956w", "the 1956 Winter Olympics", "les Jeux olympiques d'hiver de 1956", "der Olympischen Winterspiele 1956", "Cortina d'Ampezzo"],
  ["difficult", "1964w", "the 1964 Winter Olympics", "les Jeux olympiques d'hiver de 1964", "der Olympischen Winterspiele 1964", "Innsbruck"],
  ["difficult", "1968w", "the 1968 Winter Olympics", "les Jeux olympiques d'hiver de 1968", "der Olympischen Winterspiele 1968", "Grenoble"],
  ["hard", "1972w", "the 1972 Winter Olympics", "les Jeux olympiques d'hiver de 1972", "der Olympischen Winterspiele 1972", "Sapporo"],
  ["difficult", "1980w", "the 1980 Winter Olympics", "les Jeux olympiques d'hiver de 1980", "der Olympischen Winterspiele 1980", "Lake Placid"],
  ["difficult", "1984w", "the 1984 Winter Olympics", "les Jeux olympiques d'hiver de 1984", "der Olympischen Winterspiele 1984", "Sarajevo"],
  ["hard", "1992w", "the 1992 Winter Olympics", "les Jeux olympiques d'hiver de 1992", "der Olympischen Winterspiele 1992", "Albertville"],
  ["hard", "1994w", "the 1994 Winter Olympics", "les Jeux olympiques d'hiver de 1994", "der Olympischen Winterspiele 1994", "Lillehammer"],
  ["hard", "1998w", "the 1998 Winter Olympics", "les Jeux olympiques d'hiver de 1998", "der Olympischen Winterspiele 1998", "Nagano"],
  ["easy", "2002w", "the 2002 Winter Olympics", "les Jeux olympiques d'hiver de 2002", "der Olympischen Winterspiele 2002", "Salt Lake City"],
  ["hard", "2006w", "the 2006 Winter Olympics", "les Jeux olympiques d'hiver de 2006", "der Olympischen Winterspiele 2006", "Turin"],
  ["hard", "2014w", "the 2014 Winter Olympics", "les Jeux olympiques d'hiver de 2014", "der Olympischen Winterspiele 2014", "Sochi"],
  ["easy", "2018w", "the 2018 Winter Olympics", "les Jeux olympiques d'hiver de 2018", "der Olympischen Winterspiele 2018", "Pyeongchang"],
  ["easy", "2022w", "the 2022 Winter Olympics", "les Jeux olympiques d'hiver de 2022", "der Olympischen Winterspiele 2022", "Beijing"],
];
const WWRONG = ["Oslo", "Innsbruck", "Turin", "Sochi"];
for (const [tier, slug, en, qc, de, city] of WINTER) {
  add(cityHost(tier, `w-${slug}`, { en, qc, de }, city, WWRONG.filter((w) => w !== city).slice(0, 3)));
}

const SEAS = [
  ["easy", "med", { en: "Which sea lies between Europe and Africa?", qc: "C'est quelle mer qui est entre l'Europe et l'Afrique?", de: "Welches Meer liegt zwischen Europa und Afrika?" }, C("The Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer"), [C("The Red Sea", "La mer Rouge", "Das Rote Meer"), C("The Baltic Sea", "La mer Baltique", "Die Ostsee"), C("The Black Sea", "La mer Noire", "Das Schwarze Meer")]],
  ["hard", "red", { en: "Which sea lies between Africa and the Arabian Peninsula?", qc: "C'est quelle mer qui est entre l'Afrique et la péninsule arabique?", de: "Welches Meer liegt zwischen Afrika und der Arabischen Halbinsel?" }, C("The Red Sea", "La mer Rouge", "Das Rote Meer"), [C("The Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer"), C("The Black Sea", "La mer Noire", "Das Schwarze Meer"), C("The Caspian Sea", "La mer Caspienne", "Das Kaspische Meer")]],
  ["easy", "channel", { en: "Which narrow sea lies between Britain and France?", qc: "C'est quel bras de mer qui est entre la Grande-Bretagne et la France?", de: "Welcher schmale Meeresarm liegt zwischen Großbritannien und Frankreich?" }, C("The English Channel", "La Manche", "Der Ärmelkanal"), [C("The Irish Sea", "La mer d'Irlande", "Die Irische See"), C("The North Sea", "La mer du Nord", "Die Nordsee"), C("The Baltic Sea", "La mer Baltique", "Die Ostsee")]],
  ["hard", "black", { en: "Which sea is north of Turkey?", qc: "C'est quelle mer qui est au nord de la Turquie?", de: "Welches Meer liegt nördlich der Türkei?" }, C("The Black Sea", "La mer Noire", "Das Schwarze Meer"), [C("The Mediterranean Sea", "La mer Méditerranée", "Das Mittelmeer"), C("The Red Sea", "La mer Rouge", "Das Rote Meer"), C("The Caspian Sea", "La mer Caspienne", "Das Kaspische Meer")]],
  ["difficult", "adriatic", { en: "Which sea lies between Italy and the Balkan Peninsula?", qc: "C'est quelle mer qui est entre l'Italie et la péninsule balkanique?", de: "Welches Meer liegt zwischen Italien und der Balkanhalbinsel?" }, C("The Adriatic Sea", "La mer Adriatique", "Die Adria"), [C("The Tyrrhenian Sea", "La mer Tyrrhénienne", "Das Tyrrhenische Meer"), C("The Aegean Sea", "La mer Égée", "Die Ägäis"), C("The Black Sea", "La mer Noire", "Das Schwarze Meer")]],
  ["hard", "baltic", { en: "Which sea is east of Sweden and south of Finland?", qc: "C'est quelle mer qui est à l'est de la Suède et au sud de la Finlande?", de: "Welches Meer liegt östlich von Schweden und südlich von Finnland?" }, C("The Baltic Sea", "La mer Baltique", "Die Ostsee"), [C("The North Sea", "La mer du Nord", "Die Nordsee"), C("The Norwegian Sea", "La mer de Norvège", "Das Europäische Nordmeer"), C("The Barents Sea", "La mer de Barents", "Die Barentssee")]],
  ["easy", "pacific-ca", { en: "Which ocean is on the west coast of Canada?", qc: "C'est quel océan qui borde l'ouest du Canada?", de: "Welcher Ozean liegt an der Westküste Kanadas?" }, C("The Pacific Ocean", "L'océan Pacifique", "Der Pazifik"), [C("The Atlantic Ocean", "L'océan Atlantique", "Der Atlantik"), C("The Arctic Ocean", "L'océan Arctique", "Das Nordpolarmeer"), C("The Indian Ocean", "L'océan Indien", "Der Indische Ozean")]],
  ["easy", "atlantic-ca", { en: "Which ocean is on the east coast of Canada?", qc: "C'est quel océan qui borde l'est du Canada?", de: "Welcher Ozean liegt an der Ostküste Kanadas?" }, C("The Atlantic Ocean", "L'océan Atlantique", "Der Atlantik"), [C("The Pacific Ocean", "L'océan Pacifique", "Der Pazifik"), C("The Indian Ocean", "L'océan Indien", "Der Indische Ozean"), C("The Arctic Ocean", "L'océan Arctique", "Das Nordpolarmeer")]],
  ["difficult", "tasman", { en: "Which sea lies between Australia and New Zealand?", qc: "C'est quelle mer qui est entre l'Australie et la Nouvelle-Zélande?", de: "Welches Meer liegt zwischen Australien und Neuseeland?" }, C("The Tasman Sea", "La mer de Tasman", "Die Tasmansee"), [C("The Coral Sea", "La mer de Corail", "Das Korallenmeer"), C("The Arafura Sea", "La mer d'Arafura", "Die Arafurasee"), C("The Timor Sea", "La mer de Timor", "Die Timorsee")]],
  ["hard", "gulf-mx", { en: "Which gulf is south of the United States and east of Mexico?", qc: "C'est quel golfe qui est au sud des États-Unis et à l'est du Mexique?", de: "Welcher Golf liegt südlich der USA und östlich von Mexiko?" }, C("The Gulf of Mexico", "Le golfe du Mexique", "Der Golf von Mexiko"), [C("The Gulf of California", "Le golfe de Californie", "Der Golf von Kalifornien"), C("Hudson Bay", "La baie d'Hudson", "Die Hudson Bay"), C("The Caribbean Sea", "La mer des Caraïbes", "Die Karibik")]],
];
for (const [tier, slug, ask, water, wrongs] of SEAS) sea(tier, slug, ask, water, wrongs);

const PLAYS = [
  ["easy", "ophelia", "Ophelia", "Hamlet", ["Macbeth", "Othello", "King Lear"]],
  ["easy", "juliet", "Juliet", "Romeo and Juliet", ["Hamlet", "The Tempest", "Othello"]],
  ["easy", "iago", "Iago", "Othello", ["Hamlet", "Macbeth", "King Lear"]],
  ["hard", "prospero", "Prospero", "The Tempest", ["Hamlet", "Macbeth", "A Midsummer Night's Dream"]],
  ["hard", "puck", "Puck", "A Midsummer Night's Dream", ["The Tempest", "Twelfth Night", "Hamlet"]],
  ["hard", "shylock", "Shylock", "The Merchant of Venice", ["Othello", "Hamlet", "King Lear"]],
  ["difficult", "viola", "Viola", "Twelfth Night", ["Hamlet", "The Tempest", "Macbeth"]],
  ["easy", "cordelia", "Cordelia", "King Lear", ["Hamlet", "Othello", "Macbeth"]],
  ["hard", "banquo", "Banquo", "Macbeth", ["Hamlet", "Othello", "King Lear"]],
  ["difficult", "miranda", "Miranda", "The Tempest", ["Romeo and Juliet", "Hamlet", "Othello"]],
];
for (const [tier, slug, who, title, wrongs] of PLAYS) play(tier, slug, who, title, wrongs);

const HOMES = [
  ["easy", "nest", "Where does a bird usually lay its eggs?", "Un oiseau pond d'habitude ses œufs où?", "Wo legt ein Vogel gewöhnlich seine Eier?", "In a nest", "Dans un nid", "In einem Nest", ["In a den", "Dans une tanière", "In einer Höhle"], ["In a hive", "Dans une ruche", "In einem Stock"], ["In a web", "Dans une toile", "In einem Netz"]],
  ["easy", "hive", "Where do honeybees live?", "Les abeilles à miel vivent où?", "Wo leben Honigbienen?", "In a hive", "Dans une ruche", "In einem Stock", ["In a nest", "Dans un nid", "In einem Nest"], ["In a dam", "Dans un barrage", "In einem Damm"], ["In a burrow", "Dans un terrier", "In einem Bau"]],
  ["easy", "web", "What does a spider spin to catch prey?", "Une araignée tisse quoi pour attraper une proie?", "Was spinnt eine Spinne, um Beute zu fangen?", "A web", "Une toile", "Ein Netz", ["A hive", "Une ruche", "Einen Stock"], ["A nest", "Un nid", "Ein Nest"], ["A dam", "Un barrage", "Einen Damm"]],
  ["hard", "lodge", "What does a beaver build in a stream?", "Un castor construit quoi dans un cours d'eau?", "Was baut ein Biber in einem Bach?", "A lodge", "Une hutte", "Eine Biberburg", ["A hive", "Une ruche", "Einen Stock"], ["A web", "Une toile", "Ein Netz"], ["A nest of sticks only in a tree", "Seulement un nid dans un arbre", "Nur ein Nest im Baum"]],
  ["easy", "den", "Where does a bear often sleep through winter?", "Un ours dort souvent l'hiver où?", "Wo schläft ein Bär oft den Winter über?", "In a den", "Dans une tanière", "In einer Höhle", ["In a hive", "Dans une ruche", "In einem Stock"], ["In a web", "Dans une toile", "In einem Netz"], ["In a shell", "Dans une coquille", "In einer Schale"]],
];
for (const [tier, slug, en, qc, de, a, aq, ad, b, c, d] of HOMES) {
  add(q(tier, "culture", `home-${slug}`, { en, qc, de }, trio(a, aq, ad), [trio(b[0], b[1], b[2]), trio(c[0], c[1], c[2]), trio(d[0], d[1], d[2])], T.who, H.straight));
}

const INSTR = [
  ["easy", "violin", "violin", "un violon", "eine Geige", "Strings", "Les cordes", "Streicher", ["Brass", "Les cuivres", "Blechbläser"], ["Woodwind", "Les bois", "Holzbläser"], ["Percussion", "Les percussions", "Schlagzeug"]],
  ["easy", "trumpet", "trumpet", "une trompette", "eine Trompete", "Brass", "Les cuivres", "Blechbläser", ["Strings", "Les cordes", "Streicher"], ["Woodwind", "Les bois", "Holzbläser"], ["Percussion", "Les percussions", "Schlagzeug"]],
  ["easy", "flute", "flute", "une flûte", "eine Flöte", "Woodwind", "Les bois", "Holzbläser", ["Brass", "Les cuivres", "Blechbläser"], ["Strings", "Les cordes", "Streicher"], ["Percussion", "Les percussions", "Schlagzeug"]],
  ["easy", "drum", "drum", "un tambour", "eine Trommel", "Percussion", "Les percussions", "Schlagzeug", ["Strings", "Les cordes", "Streicher"], ["Brass", "Les cuivres", "Blechbläser"], ["Woodwind", "Les bois", "Holzbläser"]],
  ["hard", "cello", "cello", "un violoncelle", "ein Cello", "Strings", "Les cordes", "Streicher", ["Brass", "Les cuivres", "Blechbläser"], ["Woodwind", "Les bois", "Holzbläser"], ["Percussion", "Les percussions", "Schlagzeug"]],
  ["hard", "trombone", "trombone", "un trombone", "eine Posaune", "Brass", "Les cuivres", "Blechbläser", ["Strings", "Les cordes", "Streicher"], ["Woodwind", "Les bois", "Holzbläser"], ["Percussion", "Les percussions", "Schlagzeug"]],
  ["hard", "clarinet", "clarinet", "une clarinette", "eine Klarinette", "Woodwind", "Les bois", "Holzbläser", ["Brass", "Les cuivres", "Blechbläser"], ["Strings", "Les cordes", "Streicher"], ["Percussion", "Les percussions", "Schlagzeug"]],
  ["hard", "harp", "harp", "une harpe", "eine Harfe", "Strings", "Les cordes", "Streicher", ["Percussion", "Les percussions", "Schlagzeug"], ["Brass", "Les cuivres", "Blechbläser"], ["Woodwind", "Les bois", "Holzbläser"]],
  ["difficult", "oboe", "oboe", "un hautbois", "eine Oboe", "Woodwind", "Les bois", "Holzbläser", ["Brass", "Les cuivres", "Blechbläser"], ["Strings", "Les cordes", "Streicher"], ["Percussion", "Les percussions", "Schlagzeug"]],
  ["easy", "xylophone", "xylophone", "un xylophone", "ein Xylophon", "Percussion", "Les percussions", "Schlagzeug", ["Strings", "Les cordes", "Streicher"], ["Brass", "Les cuivres", "Blechbläser"], ["Woodwind", "Les bois", "Holzbläser"]],
];
for (const [tier, slug, en, qc, de, a, aq, ad, b, c, d] of INSTR) {
  add(q(tier, "music", `fam-${slug}`, {
    en: `Which instrument family includes the ${en}?`,
    qc: `La famille d'instruments qui comprend ${qc}, c'est laquelle?`,
    de: `Zu welcher Instrumentenfamilie gehört ${de}?`,
  }, trio(a, aq, ad), [trio(b[0], b[1], b[2]), trio(c[0], c[1], c[2]), trio(d[0], d[1], d[2])], T.art, H.straight));
}

const PROV = [
  ["easy", "calgary-p", "Calgary", "Alberta", ["British Columbia", "Saskatchewan", "Manitoba"]],
  ["easy", "vancouver-p", "Vancouver", "British Columbia", ["Alberta", "Ontario", "Quebec"]],
  ["easy", "ottawa-p", "Ottawa", "Ontario", ["Quebec", "Manitoba", "Alberta"]],
  ["easy", "montreal-p", "Montreal", "Quebec", ["Ontario", "New Brunswick", "Nova Scotia"]],
  ["easy", "winnipeg-p", "Winnipeg", "Manitoba", ["Saskatchewan", "Ontario", "Alberta"]],
  ["hard", "halifax-p", "Halifax", "Nova Scotia", ["New Brunswick", "Prince Edward Island", "Newfoundland and Labrador"]],
  ["hard", "saskatoon-p", "Saskatoon", "Saskatchewan", ["Alberta", "Manitoba", "British Columbia"]],
  ["easy", "quebec-city-p", "Quebec City", "Quebec", ["Ontario", "New Brunswick", "Nova Scotia"]],
  ["hard", "victoria-p", "Victoria", "British Columbia", ["Alberta", "Yukon", "Ontario"]],
  ["hard", "hamilton-p", "Hamilton", "Ontario", ["Quebec", "Manitoba", "Nova Scotia"]],
  ["difficult", "gatineau-p", "Gatineau", "Quebec", ["Ontario", "New Brunswick", "Manitoba"]],
  ["difficult", "regina-p", "Regina", "Saskatchewan", ["Alberta", "Manitoba", "Ontario"]],
  ["hard", "edmonton-p", "Edmonton", "Alberta", ["Saskatchewan", "British Columbia", "Manitoba"]],
  ["difficult", "fredericton-p", "Fredericton", "New Brunswick", ["Nova Scotia", "Prince Edward Island", "Quebec"]],
  ["difficult", "charlottetown-p", "Charlottetown", "Prince Edward Island", ["Nova Scotia", "New Brunswick", "Newfoundland and Labrador"]],
];
for (const [tier, slug, city, prov, wrongs] of PROV) {
  add(q(tier, "geography", `prov-${slug}`, {
    en: `In which Canadian province is ${city}?`,
    qc: `${city} est dans quelle province canadienne?`,
    de: `In welcher kanadischen Provinz liegt ${city}?`,
  }, prov, wrongs, T.geo, H.place));
}

export function restSet3Facts() {
  return rows;
}
