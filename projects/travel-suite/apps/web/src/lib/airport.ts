const CITY_TO_IATA: Record<string, string> = {
  "new york": "NYC",
  "los angeles": "LAX",
  "san francisco": "SFO",
  "chicago": "CHI",
  "london": "LON",
  "paris": "PAR",
  "tokyo": "TYO",
  "chennai": "MAA",
  "delhi": "DEL",
  "mumbai": "BOM",
  "kolkata": "CCU",
  "hyderabad": "HYD",
  "pune": "PNQ",
  "bangalore": "BLR",
  "bengaluru": "BLR",
  "dubai": "DXB",
  "singapore": "SIN",
};

export function normalizeIataCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

export function guessIataCode(input: string | null | undefined): string {
  if (!input) return "";

  const direct = normalizeIataCode(input);
  if (direct) return direct;

  const upperMatch = input.match(/\b([A-Z]{3})\b/);
  if (upperMatch?.[1]) return upperMatch[1];

  const firstToken = input.split(/,|\/|\(|\)|-/)[0]?.trim() ?? "";
  const tokenIata = normalizeIataCode(firstToken);
  if (tokenIata) return tokenIata;

  const cityKey = input.toLowerCase().trim();
  return CITY_TO_IATA[cityKey] ?? "";
}
