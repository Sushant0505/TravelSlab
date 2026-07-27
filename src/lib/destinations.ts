export interface Destination {
  slug: string;
  name: string;
  region: string;
  /** "India" | "World" — used to group in the mega menu. */
  scope: "India" | "World";
  image: string;
  video?: string;
  tagline: string;
  startingFrom: number;
  trending?: boolean;
  /** 2–3 sentence brief shown on the destination page. */
  brief: string;
  knownFor: string[];
  highlights: string[];
  bestTime: string;
  idealDays: string;
}

export const DESTINATIONS: Destination[] = [
  {
    slug: "goa",
    name: "Goa",
    region: "West India",
    scope: "India",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80",
    tagline: "Beaches, shacks & sunsets",
    startingFrom: 7999,
    trending: true,
    brief:
      "India's favourite beach escape mixes Portuguese-era churches, buzzing night markets and long stretches of golden sand. North Goa brings the parties and cafés; South Goa keeps it slow with quiet, palm-fringed coves.",
    knownFor: ["Beaches", "Nightlife", "Seafood", "Water sports"],
    highlights: [
      "Sunset at Palolem & Anjuna beaches",
      "Saturday night market at Arpora",
      "Dudhsagar waterfalls day trip",
      "Old Goa churches & Fontainhas quarter",
    ],
    bestTime: "November – February",
    idealDays: "3–5 days",
  },
  {
    slug: "bali",
    name: "Bali",
    region: "Indonesia",
    scope: "World",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80",
    tagline: "Rice terraces & temples",
    startingFrom: 54999,
    trending: true,
    brief:
      "The Island of the Gods pairs emerald rice terraces with clifftop temples and a world-class café culture. Ubud is the spiritual, jungle-clad heart, while Uluwatu and Canggu deliver surf, sunsets and beach clubs.",
    knownFor: ["Temples", "Rice terraces", "Surf", "Wellness"],
    highlights: [
      "Tegalalang rice terraces at sunrise",
      "Uluwatu temple & Kecak fire dance",
      "Nusa Penida island day trip",
      "Ubud monkey forest & art villages",
    ],
    bestTime: "April – October",
    idealDays: "6–8 days",
  },
  {
    slug: "dubai",
    name: "Dubai",
    region: "UAE",
    scope: "World",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
    tagline: "Skylines & desert safaris",
    startingFrom: 62999,
    brief:
      "A futuristic city where the world's tallest tower looks out over the desert. Dubai blends record-breaking architecture, luxury shopping and gold souks with dune-bashing safaris just minutes from downtown.",
    knownFor: ["Skyscrapers", "Desert safari", "Shopping", "Luxury"],
    highlights: [
      "Burj Khalifa 'At the Top' observation deck",
      "Evening desert safari with BBQ",
      "Dubai Marina & Palm Jumeirah",
      "Old Dubai souks + abra ride",
    ],
    bestTime: "November – March",
    idealDays: "4–6 days",
  },
  {
    slug: "thailand",
    name: "Thailand",
    region: "South-East Asia",
    scope: "World",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&q=80",
    tagline: "Islands, food & nightlife",
    startingFrom: 38999,
    trending: true,
    brief:
      "From the temple-studded chaos of Bangkok to the limestone islands of Krabi and Phuket, Thailand is an easy-going first taste of South-East Asia. Expect street food, full-moon parties and turquoise bays.",
    knownFor: ["Islands", "Street food", "Nightlife", "Temples"],
    highlights: [
      "Phi Phi & James Bond island hopping",
      "Grand Palace & Wat Arun, Bangkok",
      "Krabi's Railay Beach & lagoons",
      "Full Moon Party at Koh Phangan",
    ],
    bestTime: "November – March",
    idealDays: "5–7 days",
  },
  {
    slug: "kashmir",
    name: "Kashmir",
    region: "North India",
    scope: "India",
    image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=1200&q=80",
    tagline: "Dal Lake & snow valleys",
    startingFrom: 9999,
    brief:
      "Often called 'paradise on earth', the Kashmir Valley is all mirror-still lakes, houseboats and meadows ringed by snow peaks. Gulmarg's gondola and Sonamarg's glaciers make it a year-round favourite.",
    knownFor: ["Dal Lake", "Meadows", "Shikara rides", "Skiing"],
    highlights: [
      "Shikara ride & houseboat stay on Dal Lake",
      "Gulmarg Gondola — one of the world's highest",
      "Meadows of Sonamarg & Pahalgam",
      "Mughal gardens of Srinagar",
    ],
    bestTime: "March – October (snow: Dec – Feb)",
    idealDays: "5–7 days",
  },
  {
    slug: "leh-ladakh",
    name: "Leh Ladakh",
    region: "North India",
    scope: "India",
    image: "https://images.unsplash.com/photo-1589793907316-f94025b46850?w=1200&q=80",
    tagline: "High passes & monasteries",
    startingFrom: 24999,
    trending: true,
    brief:
      "A high-altitude desert of moonscape mountains, cobalt lakes and ancient Buddhist monasteries. Ladakh is the ultimate road-trip and biking destination, crossing some of the highest motorable passes on earth.",
    knownFor: ["Bike trips", "Pangong Lake", "Monasteries", "High passes"],
    highlights: [
      "Pangong Tso & Nubra Valley",
      "Khardung La — top of the world",
      "Thiksey & Hemis monasteries",
      "Magnetic Hill & Sangam confluence",
    ],
    bestTime: "May – September",
    idealDays: "6–9 days",
  },
  {
    slug: "andaman",
    name: "Andaman",
    region: "Islands",
    scope: "India",
    image: "https://images.unsplash.com/photo-1586053288055-2136d7fb3a95?w=1200&q=80",
    tagline: "Turquoise water & corals",
    startingFrom: 18999,
    brief:
      "India's own tropical archipelago, where powder-white beaches meet some of the country's best scuba and snorkelling. Havelock's Radhanagar Beach is regularly ranked among Asia's finest.",
    knownFor: ["Scuba diving", "White beaches", "Snorkelling", "History"],
    highlights: [
      "Radhanagar Beach, Havelock Island",
      "Scuba & sea-walking at Elephant Beach",
      "Cellular Jail light-and-sound show",
      "Neil Island's natural rock bridge",
    ],
    bestTime: "October – May",
    idealDays: "5–6 days",
  },
  {
    slug: "kerala",
    name: "Kerala",
    region: "South India",
    scope: "India",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80",
    tagline: "Backwaters & houseboats",
    startingFrom: 14999,
    brief:
      "'God's Own Country' unfolds as palm-lined backwaters, misty tea hills and Ayurvedic calm. Cruise Alleppey on a houseboat, then climb to Munnar's endless green tea estates.",
    knownFor: ["Backwaters", "Tea gardens", "Ayurveda", "Beaches"],
    highlights: [
      "Overnight houseboat on Alleppey backwaters",
      "Munnar tea estates & Eravikulam park",
      "Fort Kochi's Chinese fishing nets",
      "Wildlife at Thekkady / Periyar",
    ],
    bestTime: "September – March",
    idealDays: "5–7 days",
  },
  {
    slug: "europe",
    name: "Europe",
    region: "Continent",
    scope: "World",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80",
    tagline: "Multi-country grand tours",
    startingFrom: 129999,
    brief:
      "A grand tour of Europe strings together iconic capitals, Alpine scenery and centuries of art in a single trip. Classic circuits cover Paris, Switzerland, Italy and the Netherlands with fast rail links between.",
    knownFor: ["Grand tours", "Alps", "Art & history", "Rail travel"],
    highlights: [
      "Eiffel Tower & the Louvre, Paris",
      "Jungfraujoch & Swiss Alps",
      "Venice canals & Rome's Colosseum",
      "Amsterdam canals & tulip season",
    ],
    bestTime: "April – September",
    idealDays: "9–14 days",
  },
  {
    slug: "vietnam",
    name: "Vietnam",
    region: "South-East Asia",
    scope: "World",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80",
    tagline: "Halong Bay & lanterns",
    startingFrom: 41999,
    brief:
      "A slender country of limestone bays, lantern-lit old towns and terraced rice valleys. Cruise the karsts of Halong Bay, wander Hoi An after dark and ride the passes of the north.",
    knownFor: ["Halong Bay", "Lantern towns", "Street food", "Motorbiking"],
    highlights: [
      "Overnight cruise on Halong Bay",
      "Hoi An old town & lantern festival",
      "Hanoi's Old Quarter & egg coffee",
      "Sapa's terraced rice fields",
    ],
    bestTime: "February – April, August – October",
    idealDays: "6–9 days",
  },
  {
    slug: "arunachal-pradesh",
    name: "Arunachal Pradesh",
    region: "North-East India",
    scope: "India",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80",
    tagline: "Ziro valley & tribal fests",
    startingFrom: 21999,
    trending: true,
    brief:
      "India's remote, mountainous far east, where pine-clad valleys and Buddhist monasteries meet vibrant tribal culture. The Ziro Music Festival and the high monastery of Tawang are the headline draws.",
    knownFor: ["Ziro festival", "Tawang monastery", "Tribal culture", "Offbeat"],
    highlights: [
      "Ziro Valley & its music festival",
      "Tawang Monastery — India's largest",
      "Sela Pass & Madhuri Lake",
      "Apatani tribal villages",
    ],
    bestTime: "March – October",
    idealDays: "6–8 days",
  },
  {
    slug: "meghalaya",
    name: "Meghalaya",
    region: "North-East India",
    scope: "India",
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1200&q=80",
    tagline: "Living root bridges & falls",
    startingFrom: 16999,
    brief:
      "The 'abode of clouds' is a lush plateau of waterfalls, caves and the famous living root bridges hand-woven by Khasi tribes. Cherrapunji and Dawki's glass-clear river are unmissable.",
    knownFor: ["Root bridges", "Waterfalls", "Caves", "Crystal rivers"],
    highlights: [
      "Double-decker living root bridge, Nongriat",
      "Crystal-clear Umngot River at Dawki",
      "Nohkalikai & Seven Sisters falls",
      "Mawlynnong — Asia's cleanest village",
    ],
    bestTime: "October – May",
    idealDays: "5–6 days",
  },
];

export function getDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}

export const TRIP_TYPES = [
  "Backpacking",
  "Family",
  "Honeymoon",
  "Group / Friends",
  "Solo",
  "Luxury",
  "Adventure",
  "Workation",
] as const;

export type TripType = (typeof TRIP_TYPES)[number];
