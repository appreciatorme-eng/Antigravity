import { NextRequest, NextResponse } from "next/server";
import { searchAmadeusLocations } from "@/lib/external/amadeus";

interface LocationSuggestion {
    id: string;
    iataCode: string;
    cityName: string;
    name: string;
    subType: string;
    countryCode?: string;
    detailedName?: string;
    label: string;
}

interface RawLocation {
    iataCode?: string;
    name?: string;
    subType?: string;
    detailedName?: string;
    address?: {
        cityName?: string;
        countryCode?: string;
    };
}

function toSuggestion(location: RawLocation, index: number): LocationSuggestion | null {
    const iataCode = typeof location.iataCode === "string" ? location.iataCode.toUpperCase() : "";
    if (!iataCode) return null;

    const cityName =
        typeof location.address?.cityName === "string" && location.address.cityName.trim().length > 0
            ? location.address.cityName.trim()
            : typeof location.name === "string"
                ? location.name.trim()
                : iataCode;

    const name =
        typeof location.name === "string" && location.name.trim().length > 0
            ? location.name.trim()
            : cityName;

    const subType = typeof location.subType === "string" ? location.subType : "CITY";
    const detailedName = typeof location.detailedName === "string" ? location.detailedName : undefined;
    const countryCode =
        typeof location.address?.countryCode === "string" ? location.address.countryCode.toUpperCase() : undefined;

    const label = `${cityName} (${iataCode})`;

    return {
        id: `${iataCode}-${subType}-${index}`,
        iataCode,
        cityName,
        name,
        subType,
        detailedName,
        countryCode,
        label,
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim() || "";
        const kind = searchParams.get("kind")?.trim() || "flight";

        if (q.length < 2) {
            return NextResponse.json({ suggestions: [] });
        }

        const subType = kind === "hotel" ? "CITY" : "CITY,AIRPORT";
        const locations = await searchAmadeusLocations(q, subType);

        const suggestions = locations
            .map((location) => location as RawLocation)
            .map(toSuggestion)
            .filter((item): item is LocationSuggestion => item !== null);

        return NextResponse.json({ suggestions });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to search locations";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
