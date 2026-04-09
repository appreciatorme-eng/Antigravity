const SHARE_IMAGE_PROXY_PREFIX = "/share-image?src=";

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "images.pexels.com",
  "cdn.pixabay.com",
  "pixabay.com",
  "images.unsplash.com",
]);

export function shouldProxyPublicShareImage(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return false;
  if (url.startsWith("data:")) return false;
  if (url.startsWith(SHARE_IMAGE_PROXY_PREFIX)) return false;

  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:")
      && ALLOWED_REMOTE_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function toPublicShareImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (!shouldProxyPublicShareImage(url)) return url;
  return `${SHARE_IMAGE_PROXY_PREFIX}${encodeURIComponent(url)}`;
}

