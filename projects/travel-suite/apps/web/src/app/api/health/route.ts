import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CheckStatus = "healthy" | "degraded" | "down" | "unconfigured";

type CheckResult = {
    status: CheckStatus;
    latency_ms?: number;
    code?: number;
    detail?: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null;

function aggregateStatus(values: CheckStatus[]): CheckStatus {
    if (values.some((value) => value === "down")) return "down";
    if (values.some((value) => value === "degraded")) return "degraded";
    if (values.some((value) => value === "healthy")) return "healthy";
    return "unconfigured";
}

async function timedFetch(
    url: string,
    init: RequestInit,
    timeoutMs: number
): Promise<{ response?: Response; latency: number; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        return { response, latency: Date.now() - startedAt };
    } catch (error) {
        return {
            latency: Date.now() - startedAt,
            error: error instanceof Error ? error.message : "Network error",
        };
    } finally {
        clearTimeout(timer);
    }
}

function mapHttpStatus(code: number, options: {
    healthy: number[];
    degraded?: number[];
}): CheckStatus {
    if (options.healthy.includes(code)) return "healthy";
    if (options.degraded?.includes(code)) return "degraded";
    if (code >= 500) return "down";
    return "degraded";
}

async function checkDatabase(): Promise<CheckResult> {
    if (!supabaseAdmin) {
        return { status: "unconfigured", detail: "Supabase env vars are missing" };
    }

    const startedAt = Date.now();
    const { error } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true });

    const latency = Date.now() - startedAt;
    if (error) {
        return {
            status: "down",
            latency_ms: latency,
            detail: error.message,
        };
    }

    return { status: "healthy", latency_ms: latency };
}

async function checkSupabaseEdgeFunctions(): Promise<CheckResult & { functions: Record<string, CheckResult> }> {
    if (!supabaseUrl || !supabaseServiceKey) {
        return {
            status: "unconfigured",
            detail: "Supabase env vars are missing",
            functions: {},
        };
    }

    const configuredFunctions =
        process.env.HEALTH_EDGE_FUNCTIONS
            ?.split(",")
            .map((item) => item.trim())
            .filter(Boolean) ?? ["send-notification"];

    const functionResults: Record<string, CheckResult> = {};

    await Promise.all(
        configuredFunctions.map(async (functionName) => {
            const url = `${supabaseUrl}/functions/v1/${functionName}`;
            const { response, latency, error } = await timedFetch(
                url,
                {
                    method: "OPTIONS",
                    headers: {
                        apikey: supabaseServiceKey,
                        Authorization: `Bearer ${supabaseServiceKey}`,
                    },
                },
                5000
            );

            if (error) {
                functionResults[functionName] = {
                    status: "down",
                    latency_ms: latency,
                    detail: error,
                };
                return;
            }

            const code = response!.status;
            functionResults[functionName] = {
                status: mapHttpStatus(code, {
                    healthy: [200, 204, 401, 403, 405],
                    degraded: [404],
                }),
                code,
                latency_ms: latency,
            };
        })
    );

    const status = aggregateStatus(Object.values(functionResults).map((result) => result.status));
    return {
        status,
        functions: functionResults,
    };
}

async function checkFirebaseFcm(): Promise<CheckResult> {
    const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        process.env.FCM_PROJECT_ID;

    if (!projectId) {
        return { status: "unconfigured", detail: "Firebase project id is not set" };
    }

    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const { response, latency, error } = await timedFetch(
        url,
        {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        },
        5000
    );

    if (error) {
        return { status: "down", latency_ms: latency, detail: error };
    }

    const code = response!.status;
    return {
        status: mapHttpStatus(code, {
            healthy: [200, 400, 401, 403],
            degraded: [404],
        }),
        code,
        latency_ms: latency,
    };
}

async function checkWhatsappApi(): Promise<CheckResult> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneNumberId) {
        return {
            status: "unconfigured",
            detail: "WHATSAPP_TOKEN/WHATSAPP_PHONE_ID missing",
        };
    }

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=id`;
    const { response, latency, error } = await timedFetch(
        url,
        {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        },
        5000
    );

    if (error) {
        return { status: "down", latency_ms: latency, detail: error };
    }

    const code = response!.status;
    return {
        status: mapHttpStatus(code, {
            healthy: [200],
            degraded: [400, 401, 403, 404],
        }),
        code,
        latency_ms: latency,
    };
}

async function checkExternalApis(): Promise<{ status: CheckStatus; weather: CheckResult; currency: CheckResult }> {
    const weatherUrl =
        "https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&daily=temperature_2m_max&forecast_days=1&timezone=auto";
    const currencyUrl = "https://api.frankfurter.app/latest?from=USD&to=EUR";

    const [weatherReq, currencyReq] = await Promise.all([
        timedFetch(weatherUrl, { method: "GET" }, 5000),
        timedFetch(currencyUrl, { method: "GET" }, 5000),
    ]);

    const weather: CheckResult = weatherReq.error
        ? { status: "down", latency_ms: weatherReq.latency, detail: weatherReq.error }
        : {
            status: mapHttpStatus(weatherReq.response!.status, { healthy: [200] }),
            code: weatherReq.response!.status,
            latency_ms: weatherReq.latency,
        };

    const currency: CheckResult = currencyReq.error
        ? { status: "down", latency_ms: currencyReq.latency, detail: currencyReq.error }
        : {
            status: mapHttpStatus(currencyReq.response!.status, { healthy: [200] }),
            code: currencyReq.response!.status,
            latency_ms: currencyReq.latency,
        };

    return {
        status: aggregateStatus([weather.status, currency.status]),
        weather,
        currency,
    };
}

export async function GET() {
    const startedAt = Date.now();

    const [database, supabaseEdgeFunctions, firebaseFcm, whatsappApi, externalApis] = await Promise.all([
        checkDatabase(),
        checkSupabaseEdgeFunctions(),
        checkFirebaseFcm(),
        checkWhatsappApi(),
        checkExternalApis(),
    ]);

    const status = aggregateStatus([
        database.status,
        supabaseEdgeFunctions.status,
        firebaseFcm.status,
        whatsappApi.status,
        externalApis.status,
    ]);

    return NextResponse.json(
        {
            status,
            checked_at: new Date().toISOString(),
            duration_ms: Date.now() - startedAt,
            checks: {
                database,
                supabase_edge_functions: supabaseEdgeFunctions,
                firebase_fcm: firebaseFcm,
                whatsapp_api: whatsappApi,
                external_apis: externalApis,
            },
        },
        { status: status === "down" ? 503 : 200 }
    );
}
