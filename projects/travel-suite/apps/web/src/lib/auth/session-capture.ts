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

  const browser = resolveBrowser(userAgent);
  const os = resolveOs(userAgent);
  const deviceName = resolveDeviceName(userAgent);

  return { deviceName, browser, os };
}

function resolveBrowser(userAgent: string): string {
  const edge = /Edg\/([\d.]+)/i.exec(userAgent);
  if (edge) return `Edge ${edge[1]}`;

  const opera = /OPR\/([\d.]+)/i.exec(userAgent);
  if (opera) return `Opera ${opera[1]}`;

  const chrome = /Chrome\/([\d.]+)/i.exec(userAgent);
  if (chrome) return `Chrome ${chrome[1]}`;

  const firefox = /Firefox\/([\d.]+)/i.exec(userAgent);
  if (firefox) return `Firefox ${firefox[1]}`;

  const safari = /Version\/([\d.]+).*Safari\//i.exec(userAgent);
  if (safari) return `Safari ${safari[1]}`;

  return "Unknown Browser";
}

function resolveOs(userAgent: string): string {
  const windows = /Windows NT ([\d.]+)/i.exec(userAgent);
  if (windows) return `Windows ${windows[1]}`;

  const android = /Android ([\d.]+)/i.exec(userAgent);
  if (android) return `Android ${android[1]}`;

  const ios = /(?:CPU (?:iPhone )?OS|iPhone OS) ([\d_]+)/i.exec(userAgent);
  if (ios) return `iOS ${ios[1].replaceAll("_", ".")}`;

  const mac = /Mac OS X ([\d_]+)/i.exec(userAgent);
  if (mac) return `macOS ${mac[1].replaceAll("_", ".")}`;

  if (/Linux/i.test(userAgent)) return "Linux";

  return "Unknown OS";
}

function resolveDeviceName(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent) && /Mobile/i.test(userAgent)) return "Android Phone";
  if (/Android/i.test(userAgent) || /Tablet/i.test(userAgent)) return "Android Tablet";
  if (/Mobile/i.test(userAgent)) return "Mobile";
  return "Desktop";
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
