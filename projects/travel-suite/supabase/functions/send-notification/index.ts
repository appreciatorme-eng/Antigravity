import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!; // JSON string

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface NotificationPayload {
    user_id: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            }
        });
    }

    try {
        const { user_id, title, body, data } = await req.json() as NotificationPayload;

        // 1. Get user's push tokens
        const { data: tokens, error: tokenError } = await supabase
            .from("push_tokens")
            .select("fcm_token")
            .eq("user_id", user_id)
            .eq("is_active", true);

        if (tokenError) throw tokenError;
        if (!tokens || tokens.length === 0) {
            console.log(`No active tokens for user ${user_id}`);
            return new Response(JSON.stringify({ message: "No active tokens for user" }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 2. Prepare FCM message
        const accessToken = await getGoogleAccessToken();
        const results = [];

        for (const token of tokens) {
            const fcmResponse = await fetch(
                `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        message: {
                            token: token.fcm_token,
                            notification: { title, body },
                            data: data || {},
                        }
                    }),
                }
            );

            const result = await fcmResponse.json();
            results.push(result);
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: unknown) {
        console.error("Error sending notification:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        });
    }
});

async function getGoogleAccessToken(): Promise<string> {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);

    // The service account private key is usually a multi-line string in the JSON.
    // We need to import it. djwt or Web Crypto can do this.
    // For simplicity, we assume the private key is in PKCS#8 format or similar.

    const jwt = await djwt.create(
        { alg: "RS256", typ: "JWT" },
        {
            iss: serviceAccount.client_email,
            sub: serviceAccount.client_email,
            aud: "https://oauth2.googleapis.com/token",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            scope: "https://www.googleapis.com/auth/cloud-platform",
        },
        await importPrivateKey(serviceAccount.private_key)
    );

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    const body = await response.json();
    if (body.error) {
        throw new Error(`Failed to get access token: ${body.error_description || body.error}`);
    }
    return body.access_token;
}

async function importPrivateKey(pem: string) {
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(
        pem.indexOf(pemHeader) + pemHeader.length,
        pem.indexOf(pemFooter)
    );
    const binaryDerString = atob(pemContents.replace(/[^a-zA-Z0-9+/=]/g, ""));
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"]
    );
}
