import { env } from "@/lib/config/env";
import { getWahaStatus } from "@/lib/whatsapp-waha.server";

interface SessionHealthInput {
  sessionName?: string | null;
  token?: string | null;
}

export async function checkWPPConnectHealth(input: SessionHealthInput = {}): Promise<{
  connected: boolean;
  sessionName: string | null;
  error?: string;
}> {
  if (!env.wppconnect.baseUrl) {
    return {
      connected: false,
      sessionName: input.sessionName ?? null,
      error: "WPPConnect base URL is not configured",
    };
  }

  // WhatsApp: Meta Cloud API only. WPPConnect path removed — see CLAUDE.md.
  const sessionName = input.sessionName ?? null;
  const token = input.token ?? null;

  if (!sessionName || !token) {
    return {
      connected: false,
      sessionName,
      error: "WhatsApp session is not configured",
    };
  }

  const status = await getWahaStatus(sessionName, token);
  if (status.status === "FAILED") {
    return {
      connected: false,
      sessionName,
      error: "WPPConnect unreachable",
    };
  }

  return {
    connected: status.status === "CONNECTED",
    sessionName,
    error: status.status === "CONNECTED" ? undefined : "WhatsApp session disconnected",
  };
}
