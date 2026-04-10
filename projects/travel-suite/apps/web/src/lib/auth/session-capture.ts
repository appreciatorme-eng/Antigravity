import { UAParser } from "ua-parser-js";
import { logError } from "@/lib/observability/logger";

interface GeoResult {
  city: string;
  country: string;
}

async function geolocateIp(ip: string): Promise<GeoResult> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("::")) {
    return { city: "Local", country: "" };
  }
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return { city: "", country: "" };
    const data = (await response.json()) as { city?: string; country?: string };
    return {
      city: typeof data.city === "string" ? data.city : "",
      country: typeof data.country === "string" ? data.country : "",
    };
  } catch {
    return { city: "", country: "" };
  }
}

function parseUserAgent(userAgent: string | null): { deviceName: string; browser: string; os: string } {
  if (!userAgent) return { deviceName: "Unknown Device", browser: "Unknown Browser", os: "Unknown OS" };
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const deviceModel = result.device.model;
  const deviceVendor = result.device.vendor;
  const deviceType = result.device.type;

  let deviceName = "Desktop";
  if (deviceModel && deviceVendor) {
    deviceName = `${deviceVendor} ${deviceModel}`;
  } else if (deviceType) {
    deviceName = deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
  }

  const browser = result.browser.name ?? "Unknown Browser";
  const osName = result.os.name ?? "Unknown OS";
  const osVersion = result.os.version ? ` ${result.os.version}` : "";
  const os = `${osName}${osVersion}`;

  return { deviceName, browser, os };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (table: string) => any };

export async function captureSession(
  supabase: AnyClient,
  opts: {
    userId: string;
    supabaseSessionId: string | null;
    ip: string;
    userAgent: string | null;
  }
): Promise<void> {
  try {
    const [geo, parsed] = await Promise.all([
      geolocateIp(opts.ip),
      Promise.resolve(parseUserAgent(opts.userAgent)),
    ]);

    const { error } = await supabase.from("user_sessions").insert({
      user_id: opts.userId,
      supabase_session_id: opts.supabaseSessionId,
      ip_address: opts.ip,
      device_name: parsed.deviceName,
      browser: parsed.browser,
      os: parsed.os,
      city: geo.city,
      country: geo.country,
    });

    if (error) {
      logError("[session-capture] Failed to insert session record", error);
    }
  } catch (error) {
    logError("[session-capture] Unhandled error", error);
  }
}
