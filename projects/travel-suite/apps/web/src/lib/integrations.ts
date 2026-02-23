type IntegrationName = "payments" | "email" | "whatsapp";

function parseBoolean(value: string | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return undefined;
}

function getExplicitFlag(names: string[]): boolean | undefined {
    for (const name of names) {
        const parsed = parseBoolean(process.env[name]);
        if (parsed !== undefined) return parsed;
    }
    return undefined;
}

function defaultEnabled(): boolean {
    return process.env.NODE_ENV === "production";
}

function hasConfiguredValue(name: string): boolean {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0;
}

function hasAnyConfiguredValue(names: string[]): boolean {
    return names.some((name) => hasConfiguredValue(name));
}

function hasPaymentsCredentials(): boolean {
    return hasConfiguredValue("RAZORPAY_KEY_ID") && hasConfiguredValue("RAZORPAY_KEY_SECRET");
}

function hasEmailCredentials(): boolean {
    return hasConfiguredValue("RESEND_API_KEY") &&
        hasAnyConfiguredValue(["PROPOSAL_FROM_EMAIL", "WELCOME_FROM_EMAIL", "RESEND_FROM_EMAIL"]);
}

function hasWhatsAppCredentials(): boolean {
    return hasConfiguredValue("WHATSAPP_TOKEN") && hasConfiguredValue("WHATSAPP_PHONE_ID");
}

function resolveEnabled(explicit: boolean | undefined, configured: boolean): boolean {
    if (explicit === false) return false;
    if (explicit === true) return configured;
    return defaultEnabled() && configured;
}

export function isPaymentsIntegrationEnabled(): boolean {
    const explicit = getExplicitFlag([
        "ENABLE_RAZORPAY_INTEGRATION",
        "ENABLE_PAYMENTS_INTEGRATION",
    ]);
    return resolveEnabled(explicit, hasPaymentsCredentials());
}

export function isEmailIntegrationEnabled(): boolean {
    const explicit = getExplicitFlag(["ENABLE_EMAIL_INTEGRATION"]);
    return resolveEnabled(explicit, hasEmailCredentials());
}

export function isWhatsAppIntegrationEnabled(): boolean {
    const explicit = getExplicitFlag(["ENABLE_WHATSAPP_INTEGRATION"]);
    return resolveEnabled(explicit, hasWhatsAppCredentials());
}

export function getIntegrationDisabledMessage(name: IntegrationName): string {
    if (name === "payments" && !hasPaymentsCredentials()) {
        return "Payments integration is not configured (missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)";
    }

    if (name === "email" && !hasEmailCredentials()) {
        return "Email integration is not configured (missing RESEND_API_KEY and sender email)";
    }

    if (name === "whatsapp" && !hasWhatsAppCredentials()) {
        return "WhatsApp integration is not configured (missing WHATSAPP_TOKEN / WHATSAPP_PHONE_ID)";
    }

    if (name === "payments") {
        return "Payments integration is disabled in this environment";
    }
    if (name === "email") {
        return "Email integration is disabled in this environment";
    }
    return "WhatsApp integration is disabled in this environment";
}
