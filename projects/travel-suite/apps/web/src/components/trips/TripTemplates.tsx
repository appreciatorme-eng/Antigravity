'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Clock, Users, Star, ChevronDown, ChevronUp,
  Copy, Eye, Mountain, Waves, Sun, Compass, TreePine, Camera,
  Zap, Heart,
} from 'lucide-react'
import { GlassButton } from '@/components/glass/GlassButton'
import { formatINR } from '@/lib/india/formats'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TripTier = 'budget' | 'standard' | 'premium' | 'luxury'
type FilterRegion = 'all' | 'north' | 'south' | 'west' | 'hills' | 'beach' | 'budget' | 'luxury'

interface Attraction {
  name: string
}

interface TripTemplate {
  id: string
  name: string
  destinations: string[]         // city names
  region: FilterRegion
  days: number
  tier: TripTier
  pricePerPerson: number         // base standard price
  heroColor: string              // gradient for the card
  icon: React.ElementType
  tagline: string
  attractions: string[]          // max 5, display 3 chips
  bestMonths: string             // "Oct-Feb" style
  included: string[]             // brief inclusions
  itinerary: { day: number; title: string; highlights: string }[]
  tags: string[]
}

// ─── TEMPLATE DATA ────────────────────────────────────────────────────────────

const TEMPLATES: TripTemplate[] = [
  {
    id: 'golden-triangle',
    name: 'Golden Triangle Classic',
    destinations: ['Delhi', 'Agra', 'Jaipur'],
    region: 'north',
    days: 5,
    tier: 'standard',
    pricePerPerson: 18000,
    heroColor: 'from-amber-500 to-orange-600',
    icon: Star,
    tagline: 'India\'s most iconic route — Red Fort, Taj Mahal & Amber Fort',
    attractions: ['Red Fort', 'Taj Mahal', 'Amber Fort', 'Qutub Minar', 'City Palace Jaipur'],
    bestMonths: 'Oct-Mar',
    included: ['Hotels 3★+', 'AC transport', 'Breakfast', 'Guide'],
    itinerary: [
      { day: 1, title: 'Arrive Delhi', highlights: 'Red Fort, Qutub Minar, Chandni Chowk food walk' },
      { day: 2, title: 'Delhi Sightseeing', highlights: 'India Gate, Humayun Tomb, Lotus Temple, Connaught Place' },
      { day: 3, title: 'Delhi → Agra', highlights: 'Drive via Yamuna Expressway. Taj Mahal at sunrise, Agra Fort' },
      { day: 4, title: 'Agra → Jaipur', highlights: 'Fatehpur Sikri en route. Jaipur: Hawa Mahal evening' },
      { day: 5, title: 'Jaipur & Depart', highlights: 'Amber Fort elephant ride, City Palace, Jantar Mantar. Fly home' },
    ],
    tags: ['popular', 'first-timer', 'heritage'],
  },
  {
    id: 'kerala-gods-country',
    name: "Kerala God's Own Country",
    destinations: ['Cochin', 'Munnar', 'Thekkady', 'Alleppey', 'Kovalam'],
    region: 'south',
    days: 7,
    tier: 'standard',
    pricePerPerson: 22000,
    heroColor: 'from-emerald-500 to-teal-600',
    icon: TreePine,
    tagline: 'Tea gardens, backwater houseboats & pristine Kerala beaches',
    attractions: ['Munnar Tea Gardens', 'Alleppey Houseboat', 'Periyar Wildlife', 'Kovalam Beach', 'Chinese Fishing Nets'],
    bestMonths: 'Sep-Mar',
    included: ['Hotels + Houseboat', 'AC transport', 'Breakfast', 'English guide'],
    itinerary: [
      { day: 1, title: 'Arrive Cochin', highlights: 'Chinese fishing nets, Fort Kochi heritage walk, Kathakali show' },
      { day: 2, title: 'Cochin → Munnar', highlights: '3.5hr scenic drive. Tea estate tour, Mattupetty Dam, Echo Point' },
      { day: 3, title: 'Munnar', highlights: 'Eravikulam National Park, Top Station, tea tasting, Attukal Waterfalls' },
      { day: 4, title: 'Munnar → Thekkady', highlights: 'Periyar Lake boat safari, spice plantation walk, Elephant Camp' },
      { day: 5, title: 'Thekkady → Alleppey', highlights: 'Board houseboat, backwater cruise, village life, sunset on Vembanad Lake' },
      { day: 6, title: 'Alleppey → Kovalam', highlights: 'Morning on backwaters, drive to Kovalam, lighthouse beach sunset' },
      { day: 7, title: 'Kovalam & Depart', highlights: 'Ayurveda massage, Trivandrum city, fly home' },
    ],
    tags: ['honeymoon', 'nature', 'popular'],
  },
  {
    id: 'rajasthan-heritage',
    name: 'Rajasthan Heritage Trail',
    destinations: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer'],
    region: 'north',
    days: 8,
    tier: 'standard',
    pricePerPerson: 25000,
    heroColor: 'from-rose-500 to-red-600',
    icon: Camera,
    tagline: 'Royal forts, blue cities, lake palaces & Thar desert safari',
    attractions: ['Amber Fort', 'Mehrangarh Fort', 'Lake Pichola', 'Jaisalmer Fort', 'Sam Dunes'],
    bestMonths: 'Oct-Feb',
    included: ['Heritage hotels', 'AC transport', 'Breakfast', 'Desert camp night'],
    itinerary: [
      { day: 1, title: 'Arrive Jaipur', highlights: 'Hawa Mahal, City Palace, Jantar Mantar, Pink City bazaar' },
      { day: 2, title: 'Jaipur – Amber', highlights: 'Amber Fort elephant ride, Nahargarh Fort sunset, Bapu Bazaar shopping' },
      { day: 3, title: 'Jaipur → Jodhpur', highlights: '5hr drive. Mehrangarh Fort, Blue City heritage walk, Clock Tower market' },
      { day: 4, title: 'Jodhpur → Udaipur', highlights: 'Ranakpur Jain Temples en route. Evening at Lake Pichola, boat to Jag Mandir' },
      { day: 5, title: 'Udaipur', highlights: 'City Palace, Saheliyon Ki Bari, Jagdish Temple, Fateh Sagar Lake' },
      { day: 6, title: 'Udaipur → Jaisalmer', highlights: '6hr drive via Pali. Patwon Ki Haveli, Jaisalmer Fort sunset' },
      { day: 7, title: 'Desert Safari', highlights: 'Sam Sand Dunes camel safari, overnight desert camp, bonfire & folk music' },
      { day: 8, title: 'Jaisalmer & Depart', highlights: 'Gadisar Lake morning, drive to Jodhpur, fly home' },
    ],
    tags: ['heritage', 'photography', 'popular'],
  },
  {
    id: 'goa-beach',
    name: 'Goa Beach Holiday',
    destinations: ['North Goa', 'South Goa'],
    region: 'west',
    days: 4,
    tier: 'standard',
    pricePerPerson: 12000,
    heroColor: 'from-blue-400 to-cyan-500',
    icon: Waves,
    tagline: 'Sun, sea & Goa vibes — beaches, Portuguese heritage & fresh seafood',
    attractions: ['Baga Beach', 'Dudhsagar Falls', 'Old Goa Churches', 'Palolem Beach', 'Anjuna Flea Market'],
    bestMonths: 'Nov-Mar',
    included: ['Beach resort', 'Airport transfers', 'Breakfast'],
    itinerary: [
      { day: 1, title: 'Arrive Goa', highlights: 'Check-in, Baga / Calangute Beach, Tito\'s Lane evening, seafood dinner' },
      { day: 2, title: 'North Goa Full Day', highlights: 'Fort Aguada, Anjuna Flea Market, Vagator Beach, sunset cruise' },
      { day: 3, title: 'South Goa & Dudhsagar', highlights: 'Dudhsagar Waterfall jeep safari, Palolem Beach, Old Goa churches' },
      { day: 4, title: 'Leisure & Depart', highlights: 'Morning spa or water sports, Mapusa Market, fly home' },
    ],
    tags: ['beach', 'family', 'budget-friendly'],
  },
  {
    id: 'himachal-adventure',
    name: 'Himachal Adventure',
    destinations: ['Shimla', 'Kullu', 'Manali'],
    region: 'hills',
    days: 7,
    tier: 'standard',
    pricePerPerson: 20000,
    heroColor: 'from-sky-500 to-indigo-600',
    icon: Mountain,
    tagline: 'Toy trains, snow-capped peaks, river rafting & Rohtang Pass',
    attractions: ['Mall Road Shimla', 'Rohtang Pass', 'Solang Valley', 'River Rafting Kullu', 'Hadimba Temple'],
    bestMonths: 'Mar-Jun, Sep-Nov',
    included: ['Hill hotels', 'AC transport', 'Breakfast', 'Activity permits'],
    itinerary: [
      { day: 1, title: 'Arrive Shimla', highlights: 'Toy train Kalka-Shimla, Mall Road stroll, Christ Church' },
      { day: 2, title: 'Shimla Sightseeing', highlights: 'Jakhu Temple, Kufri snow activities, Scandal Point, local markets' },
      { day: 3, title: 'Shimla → Kullu', highlights: 'Scenic NH-3 drive, Kullu Shawl factory, Manikaran hot springs' },
      { day: 4, title: 'River Rafting', highlights: 'Beas River white-water rafting (Grade III-IV), paragliding at Bir Billing' },
      { day: 5, title: 'Kullu → Manali', highlights: 'Hadimba Temple, Old Manali, Tibetan Monastery, Van Vihar' },
      { day: 6, title: 'Rohtang Pass', highlights: 'Rohtang Pass snow activities, Solang Valley rope-way, bonfire evening' },
      { day: 7, title: 'Manali & Depart', highlights: 'Jogini Waterfall hike, hot spring dip, drive to Chandigarh, fly home' },
    ],
    tags: ['adventure', 'hills', 'popular'],
  },
  {
    id: 'varanasi-spiritual',
    name: 'Varanasi Spiritual Tour',
    destinations: ['Varanasi', 'Sarnath', 'Prayagraj'],
    region: 'north',
    days: 5,
    tier: 'standard',
    pricePerPerson: 15000,
    heroColor: 'from-orange-400 to-amber-600',
    icon: Sun,
    tagline: 'India\'s oldest city — Ganga Aarti, ghats, Buddhist Sarnath & Triveni Sangam',
    attractions: ['Ganga Aarti Dashashwamedh', 'Kashi Vishwanath Temple', 'Sarnath Stupa', 'Boat Ride at Dawn', 'Prayagraj Triveni Sangam'],
    bestMonths: 'Oct-Mar',
    included: ['Heritage hotel', 'AC transport', 'Breakfast', 'Spiritual guide'],
    itinerary: [
      { day: 1, title: 'Arrive Varanasi', highlights: 'Check-in, evening Ganga Aarti at Dashashwamedh Ghat (must experience)' },
      { day: 2, title: 'Dawn Boat Ride', highlights: 'Pre-dawn boat ride on Ganga, burning Manikarnika Ghat, Kashi Vishwanath Aarti' },
      { day: 3, title: 'Varanasi Deep Dive', highlights: 'Ghat walk, Banaras Hindu University, Ramnagar Fort, silk weaving workshop' },
      { day: 4, title: 'Sarnath', highlights: 'Dhamek Stupa, Deer Park, Sarnath Museum (Lion Capital original), Buddhist monasteries' },
      { day: 5, title: 'Prayagraj & Depart', highlights: 'Triveni Sangam boat ride (Ganges-Yamuna-Saraswati confluence), Allahabad Fort, fly home' },
    ],
    tags: ['spiritual', 'culture', 'pilgrimage'],
  },
  {
    id: 'spiti-valley',
    name: 'Spiti Valley Adventure',
    destinations: ['Shimla', 'Narkanda', 'Kaza', 'Pin Valley'],
    region: 'hills',
    days: 8,
    tier: 'premium',
    pricePerPerson: 28000,
    heroColor: 'from-slate-500 to-gray-700',
    icon: Compass,
    tagline: 'Cold desert monastery circuit — one of India\'s most dramatic road trips',
    attractions: ['Key Monastery', 'Chandratal Lake', 'Pin Valley National Park', 'Kibber Village', 'Dhankar Fort'],
    bestMonths: 'Jun-Sep',
    included: ['Guesthouses + tents', '4WD transport', 'All meals', 'Permits', 'Guide'],
    itinerary: [
      { day: 1, title: 'Shimla to Narkanda', highlights: 'Hatu Peak, apple orchards, acclimatisation at 2700m' },
      { day: 2, title: 'Narkanda → Reckong Peo', highlights: 'Kinnaur Valley, Kinnaur Kailash view, Kalpa village, Suicide Point' },
      { day: 3, title: 'Peo → Kaza', highlights: 'Nako Lake, Sumdo (Spiti entry), Tabo Monastery (1000+ years old)' },
      { day: 4, title: 'Kaza Exploration', highlights: 'Key Monastery, Kibber village (highest motorable village), fossil trail' },
      { day: 5, title: 'Pin Valley', highlights: 'Pin Valley National Park, Snow Leopard habitat, Mudh village' },
      { day: 6, title: 'Chandratal Lake', highlights: '2hr off-road drive to stunning Chandratal crescent lake. Overnight camp' },
      { day: 7, title: 'Chandratal → Manali', highlights: 'Kunzum Pass (4590m), Rohtang Pass, descend to Manali' },
      { day: 8, title: 'Manali & Depart', highlights: 'Old Manali, Hadimba Temple, fly from Bhuntar/Chandigarh' },
    ],
    tags: ['adventure', 'offbeat', 'premium'],
  },
  {
    id: 'kashmir-paradise',
    name: 'Kashmir Paradise',
    destinations: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonmarg'],
    region: 'north',
    days: 6,
    tier: 'premium',
    pricePerPerson: 24000,
    heroColor: 'from-violet-500 to-purple-700',
    icon: Heart,
    tagline: 'Dal Lake houseboats, Gulmarg gondola & the Valley of the Gods',
    attractions: ['Dal Lake Shikara', 'Gulmarg Gondola', 'Betaab Valley Pahalgam', 'Mughal Gardens', 'Sonmarg Glacier'],
    bestMonths: 'Apr-Jun, Sep-Oct',
    included: ['Houseboat + hotels', 'AC transport', 'Breakfast', 'Shikara rides'],
    itinerary: [
      { day: 1, title: 'Arrive Srinagar', highlights: 'Check into Dal Lake houseboat, shikara ride, floating vegetable market' },
      { day: 2, title: 'Srinagar Sightseeing', highlights: 'Mughal Gardens (Shalimar Bagh, Nishat Bagh), Shankaracharya Temple, Hazratbal Mosque' },
      { day: 3, title: 'Gulmarg', highlights: 'Gondola Phase 1+2 (world\'s highest cable car), skiing/snow activities, meadow walks' },
      { day: 4, title: 'Pahalgam', highlights: 'Betaab Valley, Aru Valley, Baisaran mini Switzerland, Lidder River horse ride' },
      { day: 5, title: 'Sonmarg', highlights: 'Glacier walk, Thajiwas Glacier, Baltal, pony rides on alpine meadows' },
      { day: 6, title: 'Srinagar & Depart', highlights: 'Morning shikara, Lal Chowk, pashmina shopping, fly home' },
    ],
    tags: ['honeymoon', 'premium', 'scenic'],
  },
  {
    id: 'andaman-escape',
    name: 'Andaman Island Escape',
    destinations: ['Port Blair', 'Havelock Island', 'Neil Island'],
    region: 'beach',
    days: 5,
    tier: 'premium',
    pricePerPerson: 30000,
    heroColor: 'from-cyan-400 to-blue-600',
    icon: Waves,
    tagline: 'Crystal waters, coral reefs, scuba diving & world-class beaches',
    attractions: ['Radhanagar Beach', 'Cellular Jail', 'Scuba Havelock', 'Elephant Beach Snorkel', 'Neil Island Beaches'],
    bestMonths: 'Oct-May',
    included: ['Resort + ferry', 'Airport transfers', 'Breakfast', 'Snorkel equipment'],
    itinerary: [
      { day: 1, title: 'Arrive Port Blair', highlights: 'Cellular Jail Sound & Light show, Corbyn Cove Beach, seafood dinner' },
      { day: 2, title: 'Havelock Island', highlights: 'Ferry to Havelock, Radhanagar Beach (Asia\'s Best Beach), sunset' },
      { day: 3, title: 'Havelock Activities', highlights: 'Scuba diving or snorkelling Elephant Beach, sea walk, kayaking' },
      { day: 4, title: 'Neil Island', highlights: 'Ferry to Neil, Bharatpur Beach, Natural Bridge, Laxmanpur Beach sunset' },
      { day: 5, title: 'Port Blair & Depart', highlights: 'Return ferry, Samudrika Marine Museum, fly home' },
    ],
    tags: ['beach', 'premium', 'diving'],
  },
  {
    id: 'ladakh-high-altitude',
    name: 'Ladakh High Altitude',
    destinations: ['Leh', 'Nubra Valley', 'Pangong Tso', 'Tso Moriri'],
    region: 'hills',
    days: 7,
    tier: 'premium',
    pricePerPerson: 35000,
    heroColor: 'from-blue-600 to-indigo-800',
    icon: Mountain,
    tagline: 'Earth\'s highest roads — Pangong Lake, Nubra Valley & Khardung La',
    attractions: ['Pangong Tso Lake', 'Nubra Valley', 'Khardung La Pass', 'Thiksey Monastery', 'Tso Moriri Lake'],
    bestMonths: 'Jun-Sep',
    included: ['Hotels + tents', '4WD transport', 'All meals', 'Permits', 'Oxygen cylinder'],
    itinerary: [
      { day: 1, title: 'Arrive Leh', highlights: 'Acclimatisation mandatory. Rest, Leh Palace, Shanti Stupa evening' },
      { day: 2, title: 'Leh Acclimatisation', highlights: 'Short walk, Thiksey Monastery, Shey Palace, Sindhu Ghat Aarti' },
      { day: 3, title: 'Nubra Valley', highlights: 'Khardung La Pass (5359m, world\'s highest motorable road), Diskit Monastery, Bactrian camels' },
      { day: 4, title: 'Nubra → Pangong', highlights: 'Shyok Valley drive, Pangong Tso Lake (blue to green to red), overnight camp' },
      { day: 5, title: 'Pangong Sunrise', highlights: 'Spectacular sunrise at Pangong, drive to Tso Moriri via Chang La (5360m)' },
      { day: 6, title: 'Tso Moriri', highlights: 'Pristine high-altitude lake, black-necked cranes, Korzok Monastery' },
      { day: 7, title: 'Return Leh & Depart', highlights: 'Magnetic Hill, Gurudwara Pathar Sahib, Sangam confluence, fly home' },
    ],
    tags: ['adventure', 'premium', 'bucket-list'],
  },
  {
    id: 'coorg-coffee',
    name: 'Coorg Coffee Country',
    destinations: ['Madikeri', 'Kushalnagar', 'Virajpet'],
    region: 'south',
    days: 3,
    tier: 'budget',
    pricePerPerson: 8000,
    heroColor: 'from-green-600 to-emerald-800',
    icon: TreePine,
    tagline: 'India\'s coffee bowl — plantation walks, waterfalls & misty hills',
    attractions: ['Coffee Plantation Walk', 'Abbey Falls', 'Dubare Elephant Camp', 'Raja Seat Sunset', 'Namdroling Monastery'],
    bestMonths: 'Oct-Apr',
    included: ['Plantation homestay', 'Transport', 'Breakfast + dinner'],
    itinerary: [
      { day: 1, title: 'Arrive Coorg', highlights: 'Bangalore drive (5hrs), coffee plantation walk, homestay welcome dinner' },
      { day: 2, title: 'Coorg Full Day', highlights: 'Dubare Elephant Camp (bathing), Abbey Falls, Raja Seat sunset, local Kodava cuisine' },
      { day: 3, title: 'Namdroling & Depart', highlights: 'Namdroling Golden Temple monastery, Bylakuppe Tibetan settlement, drive back' },
    ],
    tags: ['budget', 'nature', 'weekend'],
  },
  {
    id: 'rishikesh-adventure',
    name: 'Rishikesh Adventure',
    destinations: ['Rishikesh', 'Haridwar'],
    region: 'north',
    days: 3,
    tier: 'budget',
    pricePerPerson: 6000,
    heroColor: 'from-teal-500 to-cyan-700',
    icon: Zap,
    tagline: 'Yoga capital of the world — Ganga rafting, bungee & ashrams',
    attractions: ['River Rafting Beas', 'Laxman Jhula', 'Ganga Aarti Haridwar', 'Bungee Jumping', 'Triveni Ghat'],
    bestMonths: 'Feb-May, Sep-Nov',
    included: ['Camp / guesthouse', 'Transport', 'Breakfast', 'Rafting gear'],
    itinerary: [
      { day: 1, title: 'Arrive Rishikesh', highlights: 'Laxman Jhula walk, Beatles Ashram, cafe hopping, Triveni Ghat Aarti' },
      { day: 2, title: 'Rafting & Adventure', highlights: 'White-water rafting (16km Grade III-IV), bungee jumping, flying fox, cliff jumping' },
      { day: 3, title: 'Haridwar & Depart', highlights: 'Har Ki Pauri morning dip, Ganga Aarti, Mansa Devi Temple, drive to Delhi' },
    ],
    tags: ['adventure', 'budget', 'yoga'],
  },
]

// ─── FILTER TABS ─────────────────────────────────────────────────────────────

const FILTER_TABS: { id: FilterRegion; label: string }[] = [
  { id: 'all',     label: 'All'         },
  { id: 'north',   label: 'North India' },
  { id: 'south',   label: 'South India' },
  { id: 'west',    label: 'West India'  },
  { id: 'hills',   label: 'Hills'       },
  { id: 'beach',   label: 'Beach'       },
  { id: 'budget',  label: 'Budget'      },
  { id: 'luxury',  label: 'Luxury'      },
]

const TIER_COLORS: Record<TripTier, string> = {
  budget:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  premium:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  luxury:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const TIER_LABELS: Record<TripTier, string> = {
  budget:   'Budget',
  standard: 'Standard',
  premium:  'Premium',
  luxury:   'Luxury',
}

// ─── TEMPLATE CARD ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: TripTemplate
  onUseTemplate: (template: TripTemplate) => void
}

function TemplateCard({ template, onUseTemplate }: TemplateCardProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = template.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="glass-card overflow-hidden flex flex-col"
    >
      {/* Hero */}
      <div className={`bg-gradient-to-br ${template.heroColor} p-5 relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-2 w-20 h-20 rounded-full border-4 border-white" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full border-4 border-white" />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${TIER_COLORS[template.tier]}`}>
              {TIER_LABELS[template.tier]}
            </div>
          </div>

          <h3 className="text-lg font-black text-white leading-tight">{template.name}</h3>
          <p className="text-xs text-white/70 mt-1 leading-relaxed line-clamp-2">{template.tagline}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {template.days} days
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {template.destinations.slice(0, 2).join(' → ')}
            {template.destinations.length > 2 && ` +${template.destinations.length - 2}`}
          </span>
        </div>

        {/* Price */}
        <div>
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">From</span>
          <div className="text-2xl font-black text-white">
            {formatINR(template.pricePerPerson)}
            <span className="text-sm font-normal text-white/50 ml-1">/person</span>
          </div>
        </div>

        {/* Attractions chips */}
        <div className="flex flex-wrap gap-1.5">
          {template.attractions.slice(0, 3).map((attr) => (
            <span
              key={attr}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10"
            >
              {attr}
            </span>
          ))}
        </div>

        {/* Best months */}
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          Best: {template.bestMonths}
        </div>

        {/* Expandable itinerary */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Day-by-Day Preview
                </div>
                {template.itinerary.map((day) => (
                  <div key={day.day} className="flex gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-full bg-[#00d084]/20 text-[#00d084] flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                      {day.day}
                    </div>
                    <div>
                      <div className="font-semibold text-white/80">{day.title}</div>
                      <div className="text-white/50 leading-snug">{day.highlights}</div>
                    </div>
                  </div>
                ))}

                {/* Inclusions */}
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Included</div>
                  <div className="flex flex-wrap gap-1">
                    {template.included.map((inc) => (
                      <span
                        key={inc}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/20"
                      >
                        {inc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs font-medium transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            {expanded ? 'Hide' : 'Preview'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <GlassButton
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onUseTemplate(template)}
          >
            <Copy className="w-3.5 h-3.5" />
            Use Template
          </GlassButton>
        </div>
      </div>
    </motion.div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface TripTemplatesProps {
  onTemplateSelect?: (template: TripTemplate) => void
}

export function TripTemplates({ onTemplateSelect }: TripTemplatesProps) {
  const [activeFilter, setActiveFilter] = useState<FilterRegion>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matches =
          t.name.toLowerCase().includes(q) ||
          t.destinations.some((d) => d.toLowerCase().includes(q)) ||
          t.attractions.some((a) => a.toLowerCase().includes(q)) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        if (!matches) return false
      }

      // Region/category filter
      if (activeFilter === 'all') return true
      if (activeFilter === 'budget')  return t.tier === 'budget'
      if (activeFilter === 'luxury')  return t.tier === 'luxury' || t.tier === 'premium'
      return t.region === activeFilter
    })
  }, [activeFilter, searchQuery])

  const handleUseTemplate = (template: TripTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template)
      return
    }
    // Default: navigate to new trip page with template param
    const params = new URLSearchParams({
      template: template.id,
      name: template.name,
      days: String(template.days),
      tier: template.tier,
    })
    window.location.href = `/trips/new?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Search + Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by destination, attraction or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#00d084]/50 focus:border-[#00d084] transition-all text-sm"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#00d084] text-white shadow-lg shadow-[#00d084]/20'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-white/40">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''} found
        {searchQuery && ` for "${searchQuery}"`}
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUseTemplate={handleUseTemplate}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 text-white/40"
          >
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">No templates found</p>
            <p className="text-sm mt-1">Try a different search term or filter</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export type { TripTemplate }
