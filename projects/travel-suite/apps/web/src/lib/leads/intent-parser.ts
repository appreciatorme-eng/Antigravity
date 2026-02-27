export interface ParsedIntent {
  destination: string | null;
  destinationConfidence: number;
  travelers: number | null;
  durationDays: number | null;
  budgetTier: 'budget' | 'standard' | 'premium' | 'luxury' | null;
  rawBudget: number | null;
  departureMonth: string | null;
  isInquiry: boolean;
  confidence: number;
  extractedName: string | null;
}

const DESTINATIONS: Record<string, string[]> = {
  'Goa': ['goa', 'panaji', 'baga', 'calangute', 'anjuna', 'vagator'],
  'Rajasthan': ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'jaisalmer', 'pushkar', 'bikaner'],
  'Kerala': ['kerala', 'munnar', 'alleppey', 'kochi', 'kovalam', 'wayanad', 'varkala', 'thekkady'],
  'Himachal Pradesh': ['himachal', 'manali', 'shimla', 'dharamsala', 'kasol', 'spiti', 'kullu', 'mcleod'],
  'Kashmir': ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'sonamarg', 'dal lake'],
  'Uttarakhand': ['uttarakhand', 'rishikesh', 'haridwar', 'mussoorie', 'nainital', 'kedarnath', 'badrinath'],
  'Andaman': ['andaman', 'nicobar', 'port blair', 'havelock', 'neil island'],
  'Ladakh': ['ladakh', 'leh', 'nubra', 'pangong', 'zanskar'],
  'Karnataka': ['coorg', 'ooty', 'mysore', 'hampi', 'kabini', 'chikmagalur'],
  'Varanasi': ['varanasi', 'banaras', 'kashi', 'agra', 'lucknow', 'ayodhya'],
  'Meghalaya': ['meghalaya', 'shillong', 'cherrapunji', 'dawki', 'mawlynnong'],
  'Gujarat': ['gujarat', 'rann of kutch', 'somnath', 'dwarka', 'gir', 'ahmedabad', 'surat'],
  'Golden Triangle': ['golden triangle', 'delhi agra jaipur', 'delhi-agra', 'agra-jaipur'],
  'North East': ['north east', 'northeast', 'assam', 'arunachal', 'sikkim', 'kaziranga', 'gangtok'],
};

const MONTHS: Record<string, string> = {
  'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
  'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
  'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December',
  'january': 'January', 'february': 'February', 'march': 'March', 'april': 'April',
  'june': 'June', 'july': 'July', 'august': 'August', 'september': 'September',
  'october': 'October', 'november': 'November', 'december': 'December',
};

export function detectDestination(text: string): { name: string; confidence: number } | null {
  const lower = text.toLowerCase();
  const first100 = lower.slice(0, 100);

  // Check exact destination name match first (highest confidence)
  for (const [dest] of Object.entries(DESTINATIONS)) {
    if (lower.includes(dest.toLowerCase())) {
      return { name: dest, confidence: 0.9 };
    }
  }

  // Check keywords
  for (const [dest, keywords] of Object.entries(DESTINATIONS)) {
    for (const kw of keywords) {
      if (first100.includes(kw)) {
        return { name: dest, confidence: 0.8 };
      }
      if (lower.includes(kw)) {
        return { name: dest, confidence: 0.6 };
      }
    }
  }

  return null;
}

export function extractTravelerCount(text: string): number | null {
  const lower = text.toLowerCase();

  // solo / honeymoon / couple shortcuts
  if (/\bsolo\b/.test(lower)) return 1;
  if (/\bhoneymoon\b/.test(lower)) return 2;
  if (/\bcouple\b/.test(lower)) return 2;

  // "X log/people/persons/pax/adults/members/family/couples/friends"
  const groupMatch = lower.match(
    /(\d+)\s*(?:log|people|persons?|pax|adults?|members?|family|couples?|friends?)/i
  );
  if (groupMatch) return parseInt(groupMatch[1], 10);

  // "family of X"
  const familyMatch = lower.match(/family\s+of\s+(\d+)/i);
  if (familyMatch) return parseInt(familyMatch[1], 10);

  // "X ka group"
  const groupKaMatch = lower.match(/(\d+)\s*ka\s*group/i);
  if (groupKaMatch) return parseInt(groupKaMatch[1], 10);

  return null;
}

export function extractDuration(text: string): number | null {
  const lower = text.toLowerCase();

  // "long weekend" → 4
  if (/long\s+weekend/.test(lower)) return 4;
  // "weekend" → 3
  if (/\bweekend\b/.test(lower)) return 3;
  // "week" → 7
  if (/\bweek\b/.test(lower)) return 7;

  // "XN/XD" format e.g. "5N6D"
  const ndMatch = lower.match(/(\d+)\s*[n\/]\s*(\d+)\s*d/i);
  if (ndMatch) return parseInt(ndMatch[1], 10) + 1;

  // "X nights/days/din/raat"
  const durationMatch = lower.match(/(\d+)\s*(?:nights?|days?|din|raat)/i);
  if (durationMatch) return parseInt(durationMatch[1], 10);

  return null;
}

export function extractBudget(
  text: string
): { tier: 'budget' | 'standard' | 'premium' | 'luxury'; raw: number | null } | null {
  const lower = text.toLowerCase();

  // Match patterns like "10000", "10k", "1 lakh", "1.5L", "50,000"
  const budgetMatch = lower.match(
    /(?:budget|cost|price|rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|l|thousand)?\s*(?:per\s*person|pp|each)?/i
  );

  if (!budgetMatch) return null;

  const rawStr = budgetMatch[1].replace(/,/g, '');
  let raw = parseFloat(rawStr);
  const unit = (budgetMatch[2] || '').toLowerCase();

  if (unit === 'k' || unit === 'thousand') raw *= 1000;
  else if (unit === 'lakh' || unit === 'l') raw *= 100000;

  // Determine if per person or total — heuristic: if > 5 lakhs assume total
  const isPerPerson =
    /per\s*person|pp\b|each\b/.test(lower) || raw < 50000;
  const perPersonRaw = isPerPerson ? raw : raw / 2; // default assume 2 pax if total

  // We need per-person-per-day but we don't have duration here, so use raw per person
  // Tier classification based on per-person trip budget:
  // budget < 7500 total, standard 7500-20000, premium 20000-45000, luxury > 45000
  let tier: 'budget' | 'standard' | 'premium' | 'luxury';
  if (perPersonRaw < 7500) tier = 'budget';
  else if (perPersonRaw < 20000) tier = 'standard';
  else if (perPersonRaw < 45000) tier = 'premium';
  else tier = 'luxury';

  return { tier, raw };
}

export function isLikelyInquiry(text: string): boolean {
  const lower = text.toLowerCase();
  const inquiryKeywords = [
    'trip', 'tour', 'package', 'plan', 'travel', 'booking', 'quote',
    'rate', 'price', 'cost', 'kitna', 'batao', 'chahiye', 'karo', 'book',
    'arrange', 'itinerary', 'hotel', 'cab', 'flight',
  ];
  return inquiryKeywords.some((kw) => lower.includes(kw));
}

function extractDepartureMonth(text: string): string | null {
  const lower = text.toLowerCase();

  if (/next\s+month/.test(lower)) return 'Next Month';

  for (const [abbr, full] of Object.entries(MONTHS)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'i');
    if (regex.test(lower)) return full;
  }
  return null;
}

function extractName(text: string): string | null {
  // Simple heuristic: look for "I am X" / "my name is X" / "mera naam X"
  const patterns = [
    /(?:i am|i'm|my name is|mera naam|naam hai)\s+([A-Z][a-z]+)/i,
    /(?:^|\n)\s*([A-Z][a-z]{2,})\s+(?:here|speaking|calling)/i,
  ];
  for (const pat of patterns) {
    const match = text.match(pat);
    if (match) return match[1];
  }
  return null;
}

export function parseLeadMessage(message: string): ParsedIntent {
  const destResult = detectDestination(message);
  const travelers = extractTravelerCount(message);
  const durationDays = extractDuration(message);
  const budgetResult = extractBudget(message);
  const isInquiry = isLikelyInquiry(message);
  const departureMonth = extractDepartureMonth(message);
  const extractedName = extractName(message);

  const hasDestination = destResult !== null ? 1 : 0;
  const hasTravelers = travelers !== null ? 1 : 0;
  const hasDuration = durationDays !== null ? 1 : 0;
  const inquiryScore = isInquiry ? 1 : 0;

  const confidence =
    hasDestination * 0.4 +
    hasTravelers * 0.2 +
    hasDuration * 0.2 +
    inquiryScore * 0.2;

  return {
    destination: destResult?.name ?? null,
    destinationConfidence: destResult?.confidence ?? 0,
    travelers,
    durationDays,
    budgetTier: budgetResult?.tier ?? null,
    rawBudget: budgetResult?.raw ?? null,
    departureMonth,
    isInquiry,
    confidence,
    extractedName,
  };
}
