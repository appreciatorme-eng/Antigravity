// Comprehensive Indian destinations database

export interface Destination {
  id: string
  name: string
  state: string
  region: 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast'
  type: ('heritage' | 'beach' | 'hill_station' | 'pilgrimage' | 'wildlife' | 'city' | 'backwater')[]
  peakMonths: number[] // 1-12
  offMonths: number[]  // shoulder/off-season months
  avgDailyRate: { budget: number; standard: number; premium: number; luxury: number }
  nearestAirport: string
  nearestAirportCode: string
  popularAttractions: string[]
  bestFor: string[]
  notes: string // operator tips
}

const destinations: Destination[] = [
  // ─── RAJASTHAN ───────────────────────────────────────────────────────────────
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    region: 'north',
    type: ['heritage', 'city'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [6, 7, 8],
    avgDailyRate: { budget: 1800, standard: 3500, premium: 7000, luxury: 15000 },
    nearestAirport: 'Jaipur International Airport',
    nearestAirportCode: 'JAI',
    popularAttractions: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Nahargarh Fort'],
    bestFor: ['heritage lovers', 'photography', 'shopping', 'first-time India visitors'],
    notes: 'Gateway to Rajasthan. Combine with Agra & Delhi for the Golden Triangle. Pushkar fair in Oct-Nov adds premium. Book palace hotels early for peak season.',
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    region: 'north',
    type: ['heritage', 'city'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [5, 6, 7, 8],
    avgDailyRate: { budget: 2000, standard: 4000, premium: 8000, luxury: 20000 },
    nearestAirport: 'Maharana Pratap Airport',
    nearestAirportCode: 'UDR',
    popularAttractions: ['Lake Pichola', 'City Palace', 'Jag Mandir', 'Saheliyon Ki Bari', 'Fateh Sagar Lake'],
    bestFor: ['honeymooners', 'heritage', 'romance', 'luxury travel'],
    notes: '"City of Lakes" — most romantic Rajasthan destination. Lake Palace hotel iconic but expensive. Boat rides on Lake Pichola at sunset. Premium surcharge 25% Oct-Feb.',
  },
  {
    id: 'jodhpur',
    name: 'Jodhpur',
    state: 'Rajasthan',
    region: 'north',
    type: ['heritage', 'city'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [5, 6, 7, 8],
    avgDailyRate: { budget: 1600, standard: 3200, premium: 6500, luxury: 14000 },
    nearestAirport: 'Jodhpur Airport',
    nearestAirportCode: 'JDH',
    popularAttractions: ['Mehrangarh Fort', 'Umaid Bhawan Palace', 'Jaswant Thada', 'Clock Tower Market'],
    bestFor: ['fort enthusiasts', 'photography', 'heritage walks', 'shopping for handicrafts'],
    notes: '"Blue City" — best photography in golden hour at Mehrangarh. Connects well with Jaisalmer for desert circuit. Avoid May-Jun (extreme heat 45°C+).',
  },
  {
    id: 'jaisalmer',
    name: 'Jaisalmer',
    state: 'Rajasthan',
    region: 'north',
    type: ['heritage'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [4, 5, 6, 7, 8],
    avgDailyRate: { budget: 1500, standard: 3000, premium: 6000, luxury: 12000 },
    nearestAirport: 'Jaisalmer Airport',
    nearestAirportCode: 'JSA',
    popularAttractions: ['Jaisalmer Fort', 'Sam Sand Dunes', 'Patwon Ki Haveli', 'Gadisar Lake', 'Desert Safari'],
    bestFor: ['desert lovers', 'camel safari', 'stargazing', 'adventure travellers'],
    notes: '"Golden City" — living fort with residents. Desert Festival in Jan-Feb premium event. Overnight desert camp highly recommended. Book tent camps early for peak season.',
  },
  {
    id: 'pushkar',
    name: 'Pushkar',
    state: 'Rajasthan',
    region: 'north',
    type: ['pilgrimage', 'heritage'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [5, 6, 7, 8],
    avgDailyRate: { budget: 1200, standard: 2500, premium: 5000, luxury: 10000 },
    nearestAirport: 'Kishangarh Airport',
    nearestAirportCode: 'KQH',
    popularAttractions: ['Pushkar Lake', 'Brahma Temple', 'Savitri Temple', 'Pushkar Camel Fair'],
    bestFor: ['pilgrimage', 'cultural immersion', 'camel fair', 'budget travellers'],
    notes: 'Pushkar Camel Fair (Kartik month, Oct-Nov) is a massive event — room rates 5x normal. Alcohol-free sacred town. Best paired with Jaipur or Jodhpur.',
  },

  // ─── GOA ─────────────────────────────────────────────────────────────────────
  {
    id: 'north-goa',
    name: 'North Goa',
    state: 'Goa',
    region: 'west',
    type: ['beach', 'city'],
    peakMonths: [11, 12, 1, 2, 3],
    offMonths: [6, 7, 8, 9],
    avgDailyRate: { budget: 1800, standard: 3500, premium: 7000, luxury: 18000 },
    nearestAirport: 'Goa International Airport (Dabolim)',
    nearestAirportCode: 'GOI',
    popularAttractions: ['Baga Beach', 'Calangute Beach', 'Fort Aguada', 'Anjuna Flea Market', 'Vagator Beach'],
    bestFor: ['beach holidays', 'nightlife', 'water sports', 'backpackers'],
    notes: 'Busier, more lively than South Goa. Christmas & New Year rates 3-4x normal. Monsoon (Jun-Sep) off-season but scenic. Taxis expensive; advise renting bikes/scooters.',
  },
  {
    id: 'south-goa',
    name: 'South Goa',
    state: 'Goa',
    region: 'west',
    type: ['beach'],
    peakMonths: [11, 12, 1, 2, 3],
    offMonths: [6, 7, 8, 9],
    avgDailyRate: { budget: 2000, standard: 4000, premium: 9000, luxury: 22000 },
    nearestAirport: 'Goa International Airport (Dabolim)',
    nearestAirportCode: 'GOI',
    popularAttractions: ['Palolem Beach', 'Colva Beach', 'Dudhsagar Falls', 'Cabo de Rama Fort', 'Benaulim Beach'],
    bestFor: ['honeymooners', 'luxury beach resorts', 'families', 'peaceful getaway'],
    notes: 'Quieter, more upscale than North Goa. Luxury resorts like Taj Exotica here. Dudhsagar Falls accessible Jun-Jan only. Ideal for couples and families.',
  },

  // ─── KERALA ──────────────────────────────────────────────────────────────────
  {
    id: 'munnar',
    name: 'Munnar',
    state: 'Kerala',
    region: 'south',
    type: ['hill_station'],
    peakMonths: [9, 10, 11, 12, 1, 2, 3],
    offMonths: [6, 7, 8],
    avgDailyRate: { budget: 1500, standard: 3000, premium: 6000, luxury: 14000 },
    nearestAirport: 'Cochin International Airport',
    nearestAirportCode: 'COK',
    popularAttractions: ['Tea Gardens', 'Eravikulam National Park', 'Top Station', 'Mattupetty Dam', 'Neelakurinji flowers'],
    bestFor: ['tea garden tours', 'nature lovers', 'hill station holiday', 'couples'],
    notes: 'Best tea estate experience in India. Neelakurinji blooms every 12 years (next 2030). Combine with Alleppey for Kerala circuit. Drive from Cochin ~3.5 hrs.',
  },
  {
    id: 'alleppey',
    name: 'Alleppey (Alappuzha)',
    state: 'Kerala',
    region: 'south',
    type: ['backwater'],
    peakMonths: [9, 10, 11, 12, 1, 2, 3],
    offMonths: [5, 6, 7],
    avgDailyRate: { budget: 2000, standard: 4500, premium: 9000, luxury: 20000 },
    nearestAirport: 'Cochin International Airport',
    nearestAirportCode: 'COK',
    popularAttractions: ['Backwater Houseboat', 'Vembanad Lake', 'Nehru Trophy Boat Race', 'Alappuzha Beach', 'Kumarakom'],
    bestFor: ['houseboat experience', 'backwater cruises', 'honeymooners', 'nature lovers'],
    notes: '"Venice of the East." Overnight houseboat is the signature experience — book minimum 2 nights. Nehru Trophy Boat Race (Aug) is crowded but spectacular. Rates include houseboat stay.',
  },
  {
    id: 'kovalam',
    name: 'Kovalam',
    state: 'Kerala',
    region: 'south',
    type: ['beach'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [6, 7, 8],
    avgDailyRate: { budget: 1600, standard: 3200, premium: 7000, luxury: 16000 },
    nearestAirport: 'Trivandrum International Airport',
    nearestAirportCode: 'TRV',
    popularAttractions: ['Lighthouse Beach', 'Hawa Beach', 'Samudra Beach', 'Vizhinjam Mosque', 'Ayurveda spas'],
    bestFor: ['beach holidays', 'Ayurveda retreats', 'water sports', 'international tourists'],
    notes: 'Most famous beach in Kerala. Excellent Ayurveda and wellness centres. Combine with Trivandrum (Padmanabhaswamy Temple). European tourists peak Dec-Jan.',
  },
  {
    id: 'thekkady',
    name: 'Thekkady (Periyar)',
    state: 'Kerala',
    region: 'south',
    type: ['wildlife'],
    peakMonths: [9, 10, 11, 12, 1, 2, 3, 4],
    offMonths: [6, 7, 8],
    avgDailyRate: { budget: 1800, standard: 3500, premium: 7000, luxury: 15000 },
    nearestAirport: 'Cochin International Airport',
    nearestAirportCode: 'COK',
    popularAttractions: ['Periyar Wildlife Sanctuary', 'Periyar Lake Boat Ride', 'Spice Plantation Tour', 'Elephant Camp', 'Bamboo Rafting'],
    bestFor: ['wildlife enthusiasts', 'nature lovers', 'adventure', 'spice plantation tours'],
    notes: 'Periyar Tiger Reserve. Morning boat rides best for wildlife sightings. Spice plantation tours very popular. Midway between Munnar and Kovalam — ideal circuit.',
  },

  // ─── HIMACHAL PRADESH ────────────────────────────────────────────────────────
  {
    id: 'shimla',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    region: 'north',
    type: ['hill_station', 'heritage'],
    peakMonths: [3, 4, 5, 6, 10, 11, 12],
    offMonths: [1, 2], // snow closes roads
    avgDailyRate: { budget: 1500, standard: 3000, premium: 6000, luxury: 13000 },
    nearestAirport: 'Shimla Airport / Chandigarh Airport',
    nearestAirportCode: 'SLV',
    popularAttractions: ['Mall Road', 'The Ridge', 'Christ Church', 'Jakhu Temple', 'Kufri', 'Toy Train'],
    bestFor: ['families', 'honeymoon', 'snow lovers', 'heritage rail fans'],
    notes: 'Former British summer capital. Toy Train (Kalka-Shimla) UNESCO heritage — book months ahead. Snowfall Dec-Feb; popular but road accessibility can be an issue.',
  },
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    region: 'north',
    type: ['hill_station', 'wildlife'],
    peakMonths: [3, 4, 5, 6, 9, 10],
    offMonths: [1, 2], // harsh winter
    avgDailyRate: { budget: 1600, standard: 3200, premium: 6500, luxury: 14000 },
    nearestAirport: 'Bhuntar Airport (Kullu)',
    nearestAirportCode: 'KUU',
    popularAttractions: ['Rohtang Pass', 'Solang Valley', 'Hadimba Temple', 'Old Manali', 'Beas River Rafting'],
    bestFor: ['adventure sports', 'snow activities', 'Leh highway', 'young travellers'],
    notes: 'Gateway to Leh-Ladakh. Rohtang Pass permit required (book online). Adventure activities — paragliding, skiing, rafting. Dec-Feb road closures possible.',
  },
  {
    id: 'dharamshala',
    name: 'Dharamshala (McLeod Ganj)',
    state: 'Himachal Pradesh',
    region: 'north',
    type: ['hill_station', 'pilgrimage'],
    peakMonths: [3, 4, 5, 6, 9, 10, 11],
    offMonths: [1, 2, 7, 8],
    avgDailyRate: { budget: 1200, standard: 2500, premium: 5000, luxury: 11000 },
    nearestAirport: 'Gaggal Airport (Kangra)',
    nearestAirportCode: 'DHM',
    popularAttractions: ['Dalai Lama Temple', 'Bhagsu Waterfall', 'Triund Trek', 'Namgyal Monastery', 'St. John Church'],
    bestFor: ['spiritual seekers', 'trekkers', 'Tibet culture', 'backpackers'],
    notes: 'Home of Dalai Lama. Strong Tibetan Buddhist culture. Triund trek (1 day) very popular. Good for yoga, meditation retreats. Cricket stadium with Himalayan backdrop iconic.',
  },

  // ─── UTTAR PRADESH / DELHI ───────────────────────────────────────────────────
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    region: 'north',
    type: ['heritage'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [5, 6, 7, 8],
    avgDailyRate: { budget: 1500, standard: 3000, premium: 6000, luxury: 14000 },
    nearestAirport: 'Agra Airport',
    nearestAirportCode: 'AGR',
    popularAttractions: ['Taj Mahal', 'Agra Fort', 'Fatehpur Sikri', 'Mehtab Bagh', 'Itmad-ud-Daulah'],
    bestFor: ['heritage tourism', 'Taj Mahal experience', 'Mughal history', 'photography'],
    notes: 'Taj Mahal closed Fridays. Sunrise visit most popular — book tickets online. Smog Oct-Nov can affect visibility. 2-3 hrs from Delhi by Gatimaan Express train.',
  },
  {
    id: 'delhi',
    name: 'Delhi (New Delhi)',
    state: 'Delhi',
    region: 'north',
    type: ['heritage', 'city'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [5, 6, 7, 8],
    avgDailyRate: { budget: 2000, standard: 4000, premium: 8000, luxury: 20000 },
    nearestAirport: 'Indira Gandhi International Airport',
    nearestAirportCode: 'DEL',
    popularAttractions: ['Red Fort', 'Qutub Minar', 'India Gate', 'Lotus Temple', 'Humayun Tomb', 'Chandni Chowk'],
    bestFor: ['history', 'food tours', 'shopping', 'gateway to North India tours'],
    notes: 'Hub for Golden Triangle. Air pollution Oct-Jan can be severe. Metro connectivity excellent. Old Delhi street food tours very popular. Republic Day parade 26 Jan.',
  },
  {
    id: 'varanasi',
    name: 'Varanasi (Kashi)',
    state: 'Uttar Pradesh',
    region: 'north',
    type: ['pilgrimage', 'heritage', 'city'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [6, 7, 8],
    avgDailyRate: { budget: 1200, standard: 2500, premium: 5500, luxury: 12000 },
    nearestAirport: 'Lal Bahadur Shastri Airport',
    nearestAirportCode: 'VNS',
    popularAttractions: ['Ganga Aarti at Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Sarnath', 'Boat Ride at Dawn', 'Manikarnika Ghat'],
    bestFor: ['spiritual seekers', 'pilgrimage', 'photography', 'cultural immersion'],
    notes: 'One of the oldest living cities in the world. Evening Ganga Aarti unmissable. Dawn boat ride essential. Mahashivaratri (Feb-Mar) — massive crowds. Combine with Sarnath (10km).',
  },
  {
    id: 'mathura-vrindavan',
    name: 'Mathura & Vrindavan',
    state: 'Uttar Pradesh',
    region: 'north',
    type: ['pilgrimage'],
    peakMonths: [1, 2, 3, 10, 11, 12],
    offMonths: [5, 6, 7, 8],
    avgDailyRate: { budget: 1000, standard: 2000, premium: 4500, luxury: 10000 },
    nearestAirport: 'Agra Airport',
    nearestAirportCode: 'AGR',
    popularAttractions: ['Krishna Janmabhoomi', 'Banke Bihari Temple', 'ISKCON Temple Vrindavan', 'Govardhan Hill', 'Holi celebration'],
    bestFor: ['Hindu pilgrims', 'Holi festival', 'Krishna devotees', 'cultural tour'],
    notes: 'Holi (March) in Mathura-Vrindavan is world-famous — 1 week of celebrations. Rates 3-5x during Holi. Sacred city; no meat/alcohol near temples. 50km from Agra.',
  },

  // ─── TAMIL NADU ──────────────────────────────────────────────────────────────
  {
    id: 'ooty',
    name: 'Ooty (Udhagamandalam)',
    state: 'Tamil Nadu',
    region: 'south',
    type: ['hill_station'],
    peakMonths: [1, 2, 3, 4, 5, 10, 11, 12],
    offMonths: [7, 8, 9],
    avgDailyRate: { budget: 1400, standard: 2800, premium: 6000, luxury: 13000 },
    nearestAirport: 'Coimbatore International Airport',
    nearestAirportCode: 'CJB',
    popularAttractions: ['Nilgiri Mountain Railway', 'Botanical Gardens', 'Ooty Lake', 'Rose Garden', 'Doddabetta Peak'],
    bestFor: ['families', 'couples', 'Nilgiri heritage train', 'tea plantation tours'],
    notes: '"Queen of Hill Stations." Nilgiri Mountain Railway (UNESCO) — pre-book. Flower Show May very popular. Kodaikanal nearby (3 hrs). Summer months (Apr-Jun) peak.',
  },
  {
    id: 'kodaikanal',
    name: 'Kodaikanal',
    state: 'Tamil Nadu',
    region: 'south',
    type: ['hill_station'],
    peakMonths: [4, 5, 6, 10, 11, 12],
    offMonths: [8, 9],
    avgDailyRate: { budget: 1400, standard: 2800, premium: 5500, luxury: 12000 },
    nearestAirport: 'Madurai Airport',
    nearestAirportCode: 'IXM',
    popularAttractions: ['Kodai Lake', 'Coakers Walk', 'Bryant Park', 'Silver Cascade Falls', 'Pillar Rocks'],
    bestFor: ['honeymoon', 'families', 'trekking', 'nature lovers'],
    notes: '"Princess of Hill Stations." Cooler and less crowded than Ooty. Star-shaped Kodai Lake is iconic. 3.5-hour drive from Madurai. Combine with Madurai temple visit.',
  },

  // ─── WEST BENGAL / NORTHEAST ─────────────────────────────────────────────────
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    state: 'West Bengal',
    region: 'east',
    type: ['hill_station'],
    peakMonths: [3, 4, 5, 9, 10, 11],
    offMonths: [7, 8], // heavy monsoon
    avgDailyRate: { budget: 1500, standard: 3000, premium: 6000, luxury: 13000 },
    nearestAirport: 'Bagdogra Airport',
    nearestAirportCode: 'IXB',
    popularAttractions: ['Tiger Hill Sunrise', 'Darjeeling Himalayan Railway', 'Tea Garden Tours', 'Batasia Loop', 'Peace Pagoda'],
    bestFor: ['tea lovers', 'Himalayan views', 'heritage rail', 'trekkers'],
    notes: 'Darjeeling Himalayan Railway (toy train) UNESCO heritage — pre-book. Tiger Hill sunrise (Kanchenjunga view) most popular. Tea estate tours include tasting. 3hr drive from Bagdogra.',
  },
  {
    id: 'sikkim',
    name: 'Gangtok (Sikkim)',
    state: 'Sikkim',
    region: 'northeast',
    type: ['hill_station', 'pilgrimage'],
    peakMonths: [3, 4, 5, 9, 10, 11],
    offMonths: [7, 8],
    avgDailyRate: { budget: 1600, standard: 3200, premium: 6500, luxury: 14000 },
    nearestAirport: 'Pakyong Airport / Bagdogra Airport',
    nearestAirportCode: 'PYG',
    popularAttractions: ['Rumtek Monastery', 'Tsomgo Lake', 'Nathula Pass', 'MG Marg', 'Pelling (Kanchenjunga)'],
    bestFor: ['Buddhist culture', 'mountain views', 'adventure', 'nature lovers'],
    notes: 'Inner Line Permit required for Nathula Pass (near China border). Clean, green state — minimal plastic. Nathula accessible May-Nov only. Combine with North Sikkim (Lachen/Lachung).',
  },

  // ─── WILDLIFE ────────────────────────────────────────────────────────────────
  {
    id: 'ranthambore',
    name: 'Ranthambore',
    state: 'Rajasthan',
    region: 'north',
    type: ['wildlife', 'heritage'],
    peakMonths: [10, 11, 12, 1, 2, 3, 4, 5],
    offMonths: [7, 8, 9], // park closed Jul-Sep
    avgDailyRate: { budget: 2500, standard: 5000, premium: 10000, luxury: 22000 },
    nearestAirport: 'Jaipur International Airport',
    nearestAirportCode: 'JAI',
    popularAttractions: ['Tiger Safari', 'Ranthambore Fort', 'Padam Lake', 'Jogi Mahal', 'Zone 3 Safari'],
    bestFor: ['tiger sightings', 'wildlife photography', 'safari enthusiasts', 'nature lovers'],
    notes: 'Best park for tiger sightings in India. Safari zone booking opens 90 days ahead — zones 3,4,5 most popular. Park closed Jul-Sep. Pair with Jaipur or Agra.',
  },
  {
    id: 'jim-corbett',
    name: 'Jim Corbett National Park',
    state: 'Uttarakhand',
    region: 'north',
    type: ['wildlife'],
    peakMonths: [11, 12, 1, 2, 3, 4, 5, 6],
    offMonths: [7, 8, 9, 10], // Dhikala zone closed monsoon
    avgDailyRate: { budget: 2000, standard: 4000, premium: 8000, luxury: 18000 },
    nearestAirport: 'Pantnagar Airport',
    nearestAirportCode: 'PGH',
    popularAttractions: ['Dhikala Zone Safari', 'Bijrani Zone', 'Corbett Museum', 'Garjiya Devi Temple', 'Kosi River'],
    bestFor: ['tiger & elephant sightings', 'birdwatching', 'nature stays', 'wildlife photography'],
    notes: 'India\'s oldest national park. Dhikala zone (overnight stays) most exclusive but limited permits. Bijrani zone good for day visits year-round. 250km from Delhi (6hr drive).',
  },
  {
    id: 'kaziranga',
    name: 'Kaziranga',
    state: 'Assam',
    region: 'northeast',
    type: ['wildlife'],
    peakMonths: [11, 12, 1, 2, 3, 4],
    offMonths: [6, 7, 8, 9], // park closed
    avgDailyRate: { budget: 2000, standard: 4000, premium: 8000, luxury: 16000 },
    nearestAirport: 'Lokpriya Gopinath Bordoloi International Airport (Guwahati)',
    nearestAirportCode: 'GAU',
    popularAttractions: ['One-Horned Rhino Safari', 'Elephant Safari', 'Tiger Spotting', 'Bird Watching', 'Kohora Zone'],
    bestFor: ['rhino spotting', 'UNESCO World Heritage Site', 'elephant safaris', 'birdwatching'],
    notes: 'UNESCO World Heritage Site. Highest density of Bengal tigers & one-horned rhinos. Elephant safari at dawn best for rhino sightings. Combine with Majuli island river island.',
  },

  // ─── ADDITIONAL DESTINATIONS ─────────────────────────────────────────────────
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    region: 'north',
    type: ['pilgrimage', 'wildlife'],
    peakMonths: [2, 3, 4, 9, 10, 11],
    offMonths: [7, 8],
    avgDailyRate: { budget: 1000, standard: 2200, premium: 4500, luxury: 10000 },
    nearestAirport: 'Jolly Grant Airport (Dehradun)',
    nearestAirportCode: 'DED',
    popularAttractions: ['Laxman Jhula', 'Ram Jhula', 'Triveni Ghat Aarti', 'River Rafting', 'Neelkanth Mahadev Temple', 'Beatles Ashram'],
    bestFor: ['yoga & meditation', 'river rafting', 'spiritual seekers', 'adventure sports'],
    notes: '"Yoga Capital of the World." White-water rafting Mar-May and Sep-Nov. International Yoga Festival in March (Feb end). Beatles Ashram Instagram-famous. Alcohol-free zone.',
  },
  {
    id: 'ladakh',
    name: 'Leh-Ladakh',
    state: 'Ladakh (UT)',
    region: 'north',
    type: ['hill_station', 'pilgrimage', 'wildlife'],
    peakMonths: [6, 7, 8, 9],
    offMonths: [12, 1, 2], // roads closed
    avgDailyRate: { budget: 2500, standard: 5000, premium: 10000, luxury: 22000 },
    nearestAirport: 'Kushok Bakula Rimpochhe Airport (Leh)',
    nearestAirportCode: 'IXL',
    popularAttractions: ['Pangong Tso Lake', 'Nubra Valley', 'Thiksey Monastery', 'Magnetic Hill', 'Khardung La Pass'],
    bestFor: ['high-altitude adventure', 'motorcycle trips', 'Buddhist monasteries', 'stargazing'],
    notes: 'Acclimatisation 2 days in Leh mandatory before activities (altitude 3500m+). Inner Line Permit required. Best Jun-Sep. Chandratal accessible only Jul-Aug. Pre-book all accommodation.',
  },
  {
    id: 'spiti-valley',
    name: 'Spiti Valley',
    state: 'Himachal Pradesh',
    region: 'north',
    type: ['hill_station', 'pilgrimage'],
    peakMonths: [6, 7, 8, 9],
    offMonths: [11, 12, 1, 2, 3],
    avgDailyRate: { budget: 2000, standard: 4000, premium: 8000, luxury: 16000 },
    nearestAirport: 'Bhuntar Airport (Kullu)',
    nearestAirportCode: 'KUU',
    popularAttractions: ['Key Monastery', 'Chandratal Lake', 'Kaza Town', 'Dhankar Fort', 'Pin Valley'],
    bestFor: ['offbeat travel', 'Buddhist culture', 'photography', 'backpackers'],
    notes: 'Remote cold desert — accessible Jun-Oct only. Roads treacherous; 4WD required. No ATMs in deep valley (carry cash). Basic accommodation only; glamping in Kaza.',
  },
  {
    id: 'andaman',
    name: 'Andaman Islands',
    state: 'Andaman & Nicobar Islands',
    region: 'east',
    type: ['beach', 'wildlife'],
    peakMonths: [10, 11, 12, 1, 2, 3, 4, 5],
    offMonths: [6, 7, 8, 9],
    avgDailyRate: { budget: 2500, standard: 5000, premium: 10000, luxury: 22000 },
    nearestAirport: 'Veer Savarkar International Airport (Port Blair)',
    nearestAirportCode: 'IXZ',
    popularAttractions: ['Radhanagar Beach', 'Cellular Jail', 'Havelock Island', 'Neil Island', 'Scuba Diving at Elephant Beach'],
    bestFor: ['snorkelling', 'scuba diving', 'beach holiday', 'island hopping'],
    notes: 'Flights from Chennai/Kolkata/Delhi. Ferry between islands — pre-book. Scuba diving world-class. Restricted areas near tribal reserves. Cellular Jail Sound & Light show unmissable.',
  },
  {
    id: 'kashmir',
    name: 'Srinagar (Kashmir)',
    state: 'Jammu & Kashmir (UT)',
    region: 'north',
    type: ['hill_station', 'heritage'],
    peakMonths: [4, 5, 6, 9, 10],
    offMonths: [1, 2], // harsh winter
    avgDailyRate: { budget: 2000, standard: 4000, premium: 8000, luxury: 18000 },
    nearestAirport: 'Sheikh ul-Alam International Airport (Srinagar)',
    nearestAirportCode: 'SXR',
    popularAttractions: ['Dal Lake Shikara Ride', 'Gulmarg Gondola', 'Pahalgam', 'Mughal Gardens', 'Betaab Valley'],
    bestFor: ['houseboat stays', 'skiing (Gulmarg)', 'tulip season', 'honeymooners'],
    notes: 'Dal Lake houseboat iconic. Gulmarg skiing Jan-Mar. Tulip Garden (Apr) Asia\'s largest. Check travel advisories before booking. Sonmarg and Yusmarg off the beaten path.',
  },
  {
    id: 'coorg',
    name: 'Coorg (Kodagu)',
    state: 'Karnataka',
    region: 'south',
    type: ['hill_station', 'wildlife'],
    peakMonths: [10, 11, 12, 1, 2, 3, 4],
    offMonths: [6, 7, 8],
    avgDailyRate: { budget: 1400, standard: 2800, premium: 6000, luxury: 13000 },
    nearestAirport: 'Mangaluru International Airport',
    nearestAirportCode: 'IXE',
    popularAttractions: ['Coffee Plantations', 'Abbey Falls', 'Raja Seat', 'Namdroling Monastery', 'Dubare Elephant Camp'],
    bestFor: ['coffee plantation stays', 'nature walks', 'short getaways', 'families'],
    notes: '"Scotland of India." Coffee and spice plantations; homestays very popular. 5hrs from Bangalore. Best for 3-4 day weekend getaways. Elephant bathing at Dubare popular activity.',
  },
  {
    id: 'hampi',
    name: 'Hampi',
    state: 'Karnataka',
    region: 'south',
    type: ['heritage', 'pilgrimage'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [5, 6, 7, 8],
    avgDailyRate: { budget: 1200, standard: 2500, premium: 5500, luxury: 11000 },
    nearestAirport: 'Hubli Airport',
    nearestAirportCode: 'HBX',
    popularAttractions: ['Virupaksha Temple', 'Vittala Temple (Stone Chariot)', 'Hampi Bazaar', 'Lotus Mahal', 'Elephant Stables'],
    bestFor: ['history enthusiasts', 'backpackers', 'photography', 'rock climbing'],
    notes: 'UNESCO World Heritage Site. Vijayanagara Empire ruins spread over 40 sq km. Mopeds/cycles best for exploring. Opposite bank (Hippie Island) popular with backpackers. Avoid peak summer.',
  },
  {
    id: 'mysore',
    name: 'Mysore (Mysuru)',
    state: 'Karnataka',
    region: 'south',
    type: ['heritage', 'city'],
    peakMonths: [10, 11, 12, 1, 2, 3],
    offMonths: [5, 6, 7, 8],
    avgDailyRate: { budget: 1500, standard: 3000, premium: 6500, luxury: 14000 },
    nearestAirport: 'Mysore Airport / Kempegowda International (Bangalore)',
    nearestAirportCode: 'MYQ',
    popularAttractions: ['Mysore Palace', 'Chamundeshwari Temple', 'Brindavan Gardens', 'Devaraja Market', 'St. Philomena Church'],
    bestFor: ['palace tourism', 'Dasara festival', 'silk shopping', 'cultural tours'],
    notes: 'Mysore Palace lit up on Sundays & during Dasara (Sep-Oct). Dasara (10-day festival) — massive crowds, book 6 months ahead. Famous for silk sarees and sandalwood. 3hr drive from Bangalore.',
  },
]

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

export function getDestinationById(id: string): Destination | undefined {
  return destinations.find((d) => d.id === id)
}

export function searchDestinations(query: string): Destination[] {
  if (!query || query.trim().length === 0) return destinations

  const q = query.toLowerCase().trim()

  return destinations.filter((d) => {
    return (
      d.name.toLowerCase().includes(q) ||
      d.state.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.type.some((t) => t.toLowerCase().includes(q)) ||
      d.popularAttractions.some((a) => a.toLowerCase().includes(q)) ||
      d.bestFor.some((b) => b.toLowerCase().includes(q)) ||
      d.id.toLowerCase().includes(q)
    )
  })
}

export function getDestinationsByRegion(region: string): Destination[] {
  return destinations.filter((d) => d.region === region)
}

/**
 * Returns a pricing multiplier for a destination based on the month.
 * 1.0 = normal season, 1.3 = peak season, 0.8 = off season
 */
export function getSeasonalPeakMultiplier(destination: Destination, month: number): number {
  if (destination.peakMonths.includes(month)) {
    return 1.3
  }
  if (destination.offMonths.includes(month)) {
    return 0.8
  }
  return 1.0
}

export { destinations as allDestinations }
