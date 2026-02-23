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

export function isPaymentsIntegrationEnabled(): boolean {
    const explicit = getExplicitFlag([
        "ENABLE_RAZORPAY_INTEGRATION",
        "ENABLE_PAYMENTS_INTEGRATION",
    ]);
    return explicit ?? defaultEnabled();
}

export function isEmailIntegrationEnabled(): boolean {
    const explicit = getExplicitFlag(["ENABLE_EMAIL_INTEGRATION"]);
    return explicit ?? defaultEnabled();
}

export function isWhatsAppIntegrationEnabled(): boolean {
    const explicit = getExplicitFlag(["ENABLE_WHATSAPP_INTEGRATION"]);
    return explicit ?? defaultEnabled();
}

export function getIntegrationDisabledMessage(name: IntegrationName): string {
    if (name === "payments") {
        return "Payments integration is disabled in this environment";
    }
    if (name === "email") {
        return "Email integration is disabled in this environment";
    }
    return "WhatsApp integration is disabled in this environment";
}
