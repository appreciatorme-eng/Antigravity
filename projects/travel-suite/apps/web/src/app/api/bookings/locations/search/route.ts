import { NextRequest, NextResponse } from 'next/server';
import { guessIataCode, normalizeIataCode } from '@/lib/airport';
import { searchAmadeusLocations } from '@/lib/external/amadeus';

type LocationSuggestion = {
  id: string;
  iataCode: string;
  cityName: string;
  name: string;
  subType: string;
  countryCode?: string;
  detailedName?: string;
  label: string;
};

function fallbackSuggestion(query: string, kind: 'flight' | 'hotel'): LocationSuggestion[] {
  const cityName = query.trim();
  if (!cityName) return [];

  const guessed = normalizeIataCode(guessIataCode(cityName));
  if (!guessed && kind === 'flight') return [];

  const iataCode = guessed || cityName.slice(0, 3).toUpperCase();
  return [
    {
      id: `fallback-${iataCode}-${cityName.toLowerCase()}`,
      iataCode,
      cityName,
      name: cityName,
      subType: kind === 'hotel' ? 'CITY' : 'AIRPORT',
      label: `${cityName} (${iataCode})`,
    },
  ];
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') || '').trim();
  const kindRaw = (request.nextUrl.searchParams.get('kind') || 'flight').trim().toLowerCase();
  const kind: 'flight' | 'hotel' = kindRaw === 'hotel' ? 'hotel' : 'flight';

  if (query.length < (kind === 'flight' ? 1 : 2)) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const subType = kind === 'hotel' ? 'CITY' : 'CITY,AIRPORT';
    const locations = await searchAmadeusLocations(query, subType, 10);

    const suggestions = locations.reduce<LocationSuggestion[]>((acc, location, index) => {
        const cityName = (location.address?.cityName || location.name || query).trim();
        const iataCode =
          normalizeIataCode(location.iataCode) ||
          normalizeIataCode(guessIataCode(cityName)) ||
          '';
        const name = (location.name || cityName).trim();
        const subTypeValue = (location.subType || 'CITY').trim();

        if (!iataCode && kind === 'flight') {
          return acc;
        }

        acc.push({
          id: `${iataCode || 'LOC'}-${cityName}-${index}`.toLowerCase(),
          iataCode: iataCode || cityName.slice(0, 3).toUpperCase(),
          cityName,
          name,
          subType: subTypeValue,
          countryCode: location.address?.countryCode?.trim() || undefined,
          detailedName: location.detailedName?.trim() || undefined,
          label: `${cityName} (${iataCode || cityName.slice(0, 3).toUpperCase()})`,
        });

        return acc;
      }, []);

    if (suggestions.length > 0) {
      return NextResponse.json({ suggestions });
    }

    return NextResponse.json({ suggestions: fallbackSuggestion(query, kind) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load location suggestions';
    return NextResponse.json(
      {
        suggestions: fallbackSuggestion(query, kind),
        warning: message,
      },
      { status: 200 }
    );
  }
}
