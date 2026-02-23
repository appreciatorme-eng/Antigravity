import { NextRequest, NextResponse } from "next/server";
import {
    convertCurrency,
    getExchangeRates,
    getAvailableCurrencies,
    formatCurrency,
    type ExchangeRates,
    type ConversionResult,
} from "@/lib/external/currency";
import { getCachedJson, setCachedJson } from "@/lib/cache/upstash";

const CURRENCY_LIST_TTL_SECONDS = 7 * 24 * 60 * 60;
const CURRENCY_RATES_TTL_SECONDS = 24 * 60 * 60;
const CURRENCY_CONVERSION_TTL_SECONDS = 6 * 60 * 60;
const CACHE_HEADERS = {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
};

interface ConversionResponse extends ConversionResult {
    formatted: {
        from: string;
        to: string;
    };
}

function normalizeCurrencyCode(code: string): string {
    return code.trim().toUpperCase();
}

function conversionCacheKey(amount: number, from: string, to: string): string {
    return `currency:convert:v1:${from}:${to}:${amount.toFixed(4)}`;
}

/**
 * GET /api/currency?amount=100&from=USD&to=EUR
 * GET /api/currency/rates?base=USD
 * GET /api/currency/list
 * 
 * Convert currency or get exchange rates
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const amount = searchParams.get("amount");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const base = searchParams.get("base");
    const list = searchParams.get("list");

    try {
        // Get available currencies
        if (list !== null) {
            const cacheKey = "currency:list:v1";
            const cached = await getCachedJson<Record<string, string>>(cacheKey);
            if (cached) {
                return NextResponse.json({ currencies: cached }, { headers: CACHE_HEADERS });
            }

            const currencies = await getAvailableCurrencies();
            if (!currencies) {
                return NextResponse.json(
                    { error: "Could not fetch currency list" },
                    { status: 500 }
                );
            }

            await setCachedJson(cacheKey, currencies, CURRENCY_LIST_TTL_SECONDS);
            return NextResponse.json({ currencies }, { headers: CACHE_HEADERS });
        }

        // Get exchange rates for base currency
        if (base) {
            const normalizedBase = normalizeCurrencyCode(base);
            const cacheKey = `currency:rates:v1:${normalizedBase}`;
            const cachedRates = await getCachedJson<ExchangeRates>(cacheKey);
            if (cachedRates) {
                return NextResponse.json(cachedRates, { headers: CACHE_HEADERS });
            }

            const rates = await getExchangeRates(normalizedBase);
            if (!rates) {
                return NextResponse.json(
                    { error: `Could not fetch rates for: ${normalizedBase}` },
                    { status: 404 }
                );
            }

            await setCachedJson(cacheKey, rates, CURRENCY_RATES_TTL_SECONDS);
            return NextResponse.json(rates, { headers: CACHE_HEADERS });
        }

        // Convert amount
        if (amount && from && to) {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount < 0) {
                return NextResponse.json(
                    { error: "Invalid amount" },
                    { status: 400 }
                );
            }

            const normalizedFrom = normalizeCurrencyCode(from);
            const normalizedTo = normalizeCurrencyCode(to);
            const cacheKey = conversionCacheKey(numAmount, normalizedFrom, normalizedTo);

            const cachedConversion = await getCachedJson<ConversionResponse>(cacheKey);
            if (cachedConversion) {
                return NextResponse.json(cachedConversion, { headers: CACHE_HEADERS });
            }

            const conversion = await convertCurrency(numAmount, normalizedFrom, normalizedTo);
            if (!conversion) {
                return NextResponse.json(
                    { error: `Could not convert ${normalizedFrom} to ${normalizedTo}` },
                    { status: 404 }
                );
            }

            const payload: ConversionResponse = {
                ...conversion,
                formatted: {
                    from: formatCurrency(conversion.amount, conversion.from),
                    to: formatCurrency(conversion.result, conversion.to),
                },
            };

            await setCachedJson(cacheKey, payload, CURRENCY_CONVERSION_TTL_SECONDS);
            return NextResponse.json(payload, { headers: CACHE_HEADERS });
        }

        return NextResponse.json(
            {
                error: "Provide 'amount', 'from', and 'to' for conversion, or 'base' for rates, or 'list' for currencies",
                examples: {
                    convert: "/api/currency?amount=100&from=USD&to=EUR",
                    rates: "/api/currency?base=USD",
                    list: "/api/currency?list",
                }
            },
            { status: 400 }
        );
    } catch (error) {
        console.error("Currency API error:", error);
        return NextResponse.json(
            { error: "Failed to process currency request" },
            { status: 500 }
        );
    }
}
