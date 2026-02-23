/**
 * ExchangeRate-API Integration (Free Tier)
 * Free tier: 1,500 requests/month
 * 
 * We'll use the free frankfurter.app API as a fully free alternative
 * No API key required, unlimited requests
 * 
 * @see https://www.frankfurter.app/docs/
 */
import { fetchWithRetry } from "@/lib/network/retry";
import { z } from "zod";

export interface ExchangeRates {
    base: string;
    date: string;
    rates: Record<string, number>;
}

export interface ConversionResult {
    from: string;
    to: string;
    amount: number;
    result: number;
    rate: number;
    date: string;
}

const FrankfurterRatesSchema = z.object({
    base: z.string().min(3),
    date: z.string(),
    rates: z.record(z.string(), z.number()),
});

const FrankfurterConversionSchema = z.object({
    amount: z.number(),
    base: z.string().min(3),
    date: z.string(),
    rates: z.record(z.string(), z.number()),
});

const FrankfurterCurrenciesSchema = z.record(z.string(), z.string());

// Common currency symbols
const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    KRW: "₩",
    INR: "₹",
    BRL: "R$",
    MXN: "$",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    THB: "฿",
    SGD: "S$",
    HKD: "HK$",
    NZD: "NZ$",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    CZK: "Kč",
    HUF: "Ft",
    TRY: "₺",
    ZAR: "R",
    AED: "د.إ",
    SAR: "﷼",
    ILS: "₪",
    PHP: "₱",
    IDR: "Rp",
    MYR: "RM",
    VND: "₫",
};

/**
 * Get the latest exchange rates for a base currency
 */
export async function getExchangeRates(baseCurrency: string = "USD"): Promise<ExchangeRates | null> {
    try {
        const response = await fetchWithRetry(
            `https://api.frankfurter.app/latest?from=${baseCurrency.toUpperCase()}`,
            undefined,
            { retries: 2, timeoutMs: 5000 }
        );

        if (!response.ok) {
            console.error(`Exchange rate API failed:`, response.status);
            return null;
        }

        const data = await response.json();
        const parsed = FrankfurterRatesSchema.safeParse(data);
        if (!parsed.success) {
            console.error("Invalid exchange rate payload:", parsed.error.flatten());
            return null;
        }

        return {
            base: parsed.data.base,
            date: parsed.data.date,
            rates: parsed.data.rates,
        };
    } catch (error) {
        console.error(`Exchange rate fetch error:`, error);
        return null;
    }
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<ConversionResult | null> {
    try {
        const from = fromCurrency.toUpperCase();
        const to = toCurrency.toUpperCase();

        // Same currency, no conversion needed
        if (from === to) {
            return {
                from,
                to,
                amount,
                result: amount,
                rate: 1,
                date: new Date().toISOString().split("T")[0],
            };
        }

        const response = await fetchWithRetry(
            `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`,
            undefined,
            { retries: 2, timeoutMs: 5000 }
        );

        if (!response.ok) {
            console.error(`Currency conversion failed:`, response.status);
            return null;
        }

        const data = await response.json();
        const parsed = FrankfurterConversionSchema.safeParse(data);
        if (!parsed.success) {
            console.error("Invalid conversion payload:", parsed.error.flatten());
            return null;
        }

        const resultAmount = parsed.data.rates[to];
        if (typeof resultAmount !== "number" || !Number.isFinite(resultAmount)) {
            console.error(`Conversion payload missing target currency: ${to}`);
            return null;
        }

        return {
            from: parsed.data.base,
            to,
            amount: parsed.data.amount,
            result: resultAmount,
            rate: resultAmount / parsed.data.amount,
            date: parsed.data.date,
        };
    } catch (error) {
        console.error(`Currency conversion error:`, error);
        return null;
    }
}

/**
 * Get available currencies
 */
export async function getAvailableCurrencies(): Promise<Record<string, string> | null> {
    try {
        const response = await fetchWithRetry(
            "https://api.frankfurter.app/currencies",
            undefined,
            { retries: 2, timeoutMs: 5000 }
        );

        if (!response.ok) {
            console.error(`Currencies list failed:`, response.status);
            return null;
        }

        const data = await response.json();
        const parsed = FrankfurterCurrenciesSchema.safeParse(data);
        if (!parsed.success) {
            console.error("Invalid currencies payload:", parsed.error.flatten());
            return null;
        }

        return parsed.data;
    } catch (error) {
        console.error(`Currencies list error:`, error);
        return null;
    }
}

/**
 * Format a currency amount with symbol
 */
export function formatCurrency(amount: number, currency: string): string {
    const code = currency.toUpperCase();
    const symbol = currencySymbols[code] || code;

    // Format with appropriate decimal places
    const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    // Handle symbol placement
    if (["EUR", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF"].includes(code)) {
        return `${formatted} ${symbol}`;
    }

    return `${symbol}${formatted}`;
}

/**
 * Get the currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
    return currencySymbols[currency.toUpperCase()] || currency.toUpperCase();
}

/**
 * Detect likely currency for a destination country
 */
export function getCurrencyForCountry(countryCode: string): string {
    const countryCurrencies: Record<string, string> = {
        US: "USD",
        GB: "GBP",
        EU: "EUR",
        DE: "EUR",
        FR: "EUR",
        IT: "EUR",
        ES: "EUR",
        JP: "JPY",
        CN: "CNY",
        KR: "KRW",
        IN: "INR",
        BR: "BRL",
        MX: "MXN",
        CA: "CAD",
        AU: "AUD",
        CH: "CHF",
        TH: "THB",
        SG: "SGD",
        HK: "HKD",
        NZ: "NZD",
        SE: "SEK",
        NO: "NOK",
        DK: "DKK",
        PL: "PLN",
        CZ: "CZK",
        HU: "HUF",
        TR: "TRY",
        ZA: "ZAR",
        AE: "AED",
        SA: "SAR",
        IL: "ILS",
        PH: "PHP",
        ID: "IDR",
        MY: "MYR",
        VN: "VND",
    };

    return countryCurrencies[countryCode.toUpperCase()] || "USD";
}
