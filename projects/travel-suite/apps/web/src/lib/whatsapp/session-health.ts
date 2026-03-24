import { env } from "@/lib/config/env";
import { getEvolutionStatus } from "@/lib/whatsapp-evolution.server";

interface SessionHealthInput {
  sessionName?: string | null;
  dbStatus?: string | null;
}

export async function checkEvolutionHealth(input: SessionHealthInput = {}): Promise<{
  connected: boolean;
  sessionName: string | null;
  error?: string;
}> {
  const sessionName = input.sessionName ?? null;

  // Trust the DB if it says connected — avoids slow/flaky Evolution API calls
  if (input.dbStatus === "connected" && sessionName) {
    return { connected: true, sessionName };
  }

  if (!env.evolution?.baseUrl) {
    return {
      connected: false,
      sessionName,
      error: "Evolution API base URL is not configured",
    };
  }

  if (!sessionName) {
    return {
      connected: false,
      sessionName,
      error: "WhatsApp session is not configured",
    };
  }

  const status = await getEvolutionStatus(sessionName);
  if (status.status === "FAILED") {
    return {
      connected: false,
      sessionName,
      error: "Evolution API unreachable",
    };
  }

  return {
    connected: status.status === "CONNECTED",
    sessionName,
    error: status.status === "CONNECTED" ? undefined : "WhatsApp session disconnected",
  };
}
