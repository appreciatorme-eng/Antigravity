import { fetchWithRetry } from "@/lib/network/retry";
import { logError } from "@/lib/observability/logger";

// ─── TYPE DEFINITIONS ───────────────────────────────────────────────────────

export interface IRPCredentials {
  username: string;
  password: string;
  gstin: string;
  sandboxMode?: boolean;
}

export interface AuthTokenResponse {
  status: "success" | "error";
  authToken?: string;
  tokenExpiry?: number; // Unix timestamp
  message?: string;
  errorCode?: string;
}

export interface IRNGenerationRequest {
  version: string;
  tranDtls: {
    taxSch: string;
    supTyp: string;
    regRev?: string;
    ecmGstin?: string;
    igstOnIntra?: string;
  };
  docDtls: {
    typ: string;
    no: string;
    dt: string; // DD/MM/YYYY format
  };
  sellerDtls: {
    gstin: string;
    lglNm: string;
    addr1: string;
    addr2?: string;
    loc: string;
    pin: number;
    stcd: string;
  };
  buyerDtls: {
    gstin?: string;
    lglNm: string;
    pos: string;
    addr1: string;
    addr2?: string;
    loc: string;
    pin: number;
    stcd: string;
  };
  itemList: Array<{
    slNo: string;
    isServc: string;
    hsnCd: string;
    barcde?: string;
    prdDesc?: string;
    qty: number;
    freeQty?: number;
    unit: string;
    unitPrice: number;
    totAmt: number;
    discount?: number;
    preTaxVal?: number;
    assAmt: number;
    gstRt: number;
    igstAmt?: number;
    cgstAmt?: number;
    sgstAmt?: number;
    cesRt?: number;
    cesAmt?: number;
    cesNonAdvlAmt?: number;
    stateCesRt?: number;
    stateCesAmt?: number;
    stateCesNonAdvlAmt?: number;
    othChrg?: number;
    totItemVal: number;
  }>;
  valDtls: {
    assVal: number;
    cgstVal?: number;
    sgstVal?: number;
    igstVal?: number;
    cesVal?: number;
    stCesVal?: number;
    discount?: number;
    othChrg?: number;
    rndOffAmt?: number;
    totInvVal: number;
  };
}

export interface IRNGenerationResponse {
  status: "success" | "error";
  irn?: string;
  ackNo?: string;
  ackDt?: string; // DateTime format
  signedInvoice?: string; // Base64 encoded signed invoice JSON
  signedQRCode?: string; // QR code data
  message?: string;
  errorCode?: string;
  errorDetails?: Array<{
    errorCode: string;
    errorMessage: string;
  }>;
}

export interface IRNCancellationRequest {
  irn: string;
  cnlRsn: string;
  cnlRem: string;
}

export interface IRNCancellationResponse {
  status: "success" | "error";
  irn?: string;
  cancelDate?: string;
  message?: string;
  errorCode?: string;
}

export interface IRNStatusResponse {
  status: "success" | "error";
  irn?: string;
  irnStatus?: "ACT" | "CNL"; // Active or Cancelled
  ackNo?: string;
  ackDt?: string;
  message?: string;
  errorCode?: string;
}

// ─── TOKEN CACHE ────────────────────────────────────────────────────────────

interface CachedToken {
  token: string;
  expiry: number;
}

const tokenCache = new Map<string, CachedToken>();

function getCacheKey(gstin: string, sandboxMode: boolean): string {
  return `${gstin}:${sandboxMode ? "sandbox" : "production"}`;
}

function getCachedToken(gstin: string, sandboxMode: boolean): string | null {
  const key = getCacheKey(gstin, sandboxMode);
  const cached = tokenCache.get(key);

  if (!cached) return null;

  // Check if token is still valid (with 5-minute buffer)
  const now = Math.floor(Date.now() / 1000);
  if (cached.expiry - now < 300) {
    tokenCache.delete(key);
    return null;
  }

  return cached.token;
}

function setCachedToken(gstin: string, sandboxMode: boolean, token: string, expiry: number): void {
  const key = getCacheKey(gstin, sandboxMode);
  tokenCache.set(key, { token, expiry });
}

function clearCachedToken(gstin: string, sandboxMode: boolean): void {
  const key = getCacheKey(gstin, sandboxMode);
  tokenCache.delete(key);
}

// ─── ENDPOINT CONFIGURATION ─────────────────────────────────────────────────

const IRP_ENDPOINTS = {
  sandbox: {
    base: "https://gsp.adaequare.com/test/enriched/ei/api",
    auth: "/authenticate",
    generateIRN: "/invoice",
    cancelIRN: "/invoice/cancel",
    getIRN: "/invoice/irn",
  },
  production: {
    base: "https://gsp.adaequare.com/enriched/ei/api",
    auth: "/authenticate",
    generateIRN: "/invoice",
    cancelIRN: "/invoice/cancel",
    getIRN: "/invoice/irn",
  },
} as const;

function getEndpoint(path: keyof typeof IRP_ENDPOINTS.sandbox, sandboxMode: boolean): string {
  const config = sandboxMode ? IRP_ENDPOINTS.sandbox : IRP_ENDPOINTS.production;
  return `${config.base}${config[path]}`;
}

// ─── AUTHENTICATION ─────────────────────────────────────────────────────────

/**
 * Authenticates with IRP and returns an auth token.
 * Token is cached for reuse until near expiry.
 */
export async function authenticate(credentials: IRPCredentials): Promise<string> {
  const { gstin, username, password, sandboxMode = false } = credentials;

  // Check cache first
  const cachedToken = getCachedToken(gstin, sandboxMode);
  if (cachedToken) {
    return cachedToken;
  }

  // Request new token
  const endpoint = getEndpoint("auth", sandboxMode);

  try {
    const response = await fetchWithRetry(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          gstin,
        }),
        cache: "no-store",
      },
      {
        retries: 2,
        timeoutMs: 10000,
        baseDelayMs: 500,
      }
    );

    const payload: AuthTokenResponse = await response.json().catch(() => ({
      status: "error",
      message: "Invalid JSON response from IRP",
    }));

    if (!response.ok || payload.status === "error") {
      const message = payload.message || `Authentication failed (${response.status})`;
      throw new Error(`IRP Authentication Error: ${message}`);
    }

    if (!payload.authToken || !payload.tokenExpiry) {
      throw new Error("IRP Authentication Error: Missing authToken or tokenExpiry");
    }

    // Cache the token
    setCachedToken(gstin, sandboxMode, payload.authToken, payload.tokenExpiry);

    return payload.authToken;
  } catch (error) {
    logError("IRP authentication failed", { error, gstin, sandboxMode });
    throw error;
  }
}

// ─── GENERATE IRN ───────────────────────────────────────────────────────────

/**
 * Generates an Invoice Reference Number (IRN) for an invoice.
 * Returns IRN, acknowledgement details, and signed QR code data.
 */
export async function generateIRN(
  credentials: IRPCredentials,
  invoiceData: IRNGenerationRequest
): Promise<IRNGenerationResponse> {
  const { sandboxMode = false } = credentials;

  try {
    const authToken = await authenticate(credentials);
    const endpoint = getEndpoint("generateIRN", sandboxMode);

    const response = await fetchWithRetry(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invoiceData),
        cache: "no-store",
      },
      {
        retries: 1,
        timeoutMs: 15000,
        baseDelayMs: 1000,
      }
    );

    const payload: IRNGenerationResponse = await response.json().catch(() => ({
      status: "error",
      message: "Invalid JSON response from IRP",
    }));

    if (!response.ok || payload.status === "error") {
      // If auth token expired, clear cache and don't retry (caller can retry)
      if (payload.errorCode === "INVALID_TOKEN" || response.status === 401) {
        clearCachedToken(credentials.gstin, sandboxMode);
      }

      const message =
        payload.message ||
        payload.errorDetails?.map((e) => e.errorMessage).join("; ") ||
        `IRN generation failed (${response.status})`;

      throw new Error(`IRP IRN Generation Error: ${message}`);
    }

    return payload;
  } catch (error) {
    logError("IRP IRN generation failed", { error, invoiceNo: invoiceData.docDtls.no });
    throw error;
  }
}

// ─── CANCEL IRN ─────────────────────────────────────────────────────────────

/**
 * Cancels a previously generated IRN.
 * Can only be cancelled within 24 hours of generation.
 */
export async function cancelIRN(
  credentials: IRPCredentials,
  cancellationData: IRNCancellationRequest
): Promise<IRNCancellationResponse> {
  const { sandboxMode = false } = credentials;

  try {
    const authToken = await authenticate(credentials);
    const endpoint = getEndpoint("cancelIRN", sandboxMode);

    const response = await fetchWithRetry(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(cancellationData),
        cache: "no-store",
      },
      {
        retries: 1,
        timeoutMs: 12000,
        baseDelayMs: 1000,
      }
    );

    const payload: IRNCancellationResponse = await response.json().catch(() => ({
      status: "error",
      message: "Invalid JSON response from IRP",
    }));

    if (!response.ok || payload.status === "error") {
      if (payload.errorCode === "INVALID_TOKEN" || response.status === 401) {
        clearCachedToken(credentials.gstin, sandboxMode);
      }

      const message = payload.message || `IRN cancellation failed (${response.status})`;
      throw new Error(`IRP IRN Cancellation Error: ${message}`);
    }

    return payload;
  } catch (error) {
    logError("IRP IRN cancellation failed", { error, irn: cancellationData.irn });
    throw error;
  }
}

// ─── GET IRN STATUS ─────────────────────────────────────────────────────────

/**
 * Retrieves the status of an IRN.
 * Returns whether the IRN is active or cancelled.
 */
export async function getIRNStatus(
  credentials: IRPCredentials,
  irn: string
): Promise<IRNStatusResponse> {
  const { sandboxMode = false } = credentials;

  try {
    const authToken = await authenticate(credentials);
    const endpoint = `${getEndpoint("getIRN", sandboxMode)}/${encodeURIComponent(irn)}`;

    const response = await fetchWithRetry(
      endpoint,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-store",
      },
      {
        retries: 2,
        timeoutMs: 10000,
        baseDelayMs: 500,
      }
    );

    const payload: IRNStatusResponse = await response.json().catch(() => ({
      status: "error",
      message: "Invalid JSON response from IRP",
    }));

    if (!response.ok || payload.status === "error") {
      if (payload.errorCode === "INVALID_TOKEN" || response.status === 401) {
        clearCachedToken(credentials.gstin, sandboxMode);
      }

      const message = payload.message || `IRN status retrieval failed (${response.status})`;
      throw new Error(`IRP IRN Status Error: ${message}`);
    }

    return payload;
  } catch (error) {
    logError("IRP IRN status retrieval failed", { error, irn });
    throw error;
  }
}

// ─── EXPORTS ────────────────────────────────────────────────────────────────

export const irpClient = {
  authenticate,
  generateIRN,
  cancelIRN,
  getIRNStatus,
  clearCache: (gstin: string, sandboxMode: boolean) => clearCachedToken(gstin, sandboxMode),
};
