import { NextRequest } from "next/server";

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "images.pexels.com",
  "cdn.pixabay.com",
  "pixabay.com",
  "images.unsplash.com",
]);

function buildError(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) return buildError("Missing src", 400);

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return buildError("Invalid src", 400);
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    return buildError("Unsupported protocol", 400);
  }

  if (!ALLOWED_REMOTE_IMAGE_HOSTS.has(parsed.hostname)) {
    return buildError("Host not allowed", 403);
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "TripBuilt Share Image Proxy/1.0",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!upstream.ok) {
      return buildError("Upstream image unavailable", 502);
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return buildError("Upstream is not an image", 415);
    }

    const arrayBuffer = await upstream.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return buildError("Failed to proxy image", 502);
  }
}

