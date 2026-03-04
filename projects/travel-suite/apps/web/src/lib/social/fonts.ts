/**
 * Google Font loader for Satori server-side rendering.
 * Caches font data in module scope -- loaded once per server cold start.
 */

export interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
}

let fontCache: SatoriFont[] | null = null;

const FONT_SPECS: Array<{
  family: string;
  weight: SatoriFont["weight"];
  style: SatoriFont["style"];
}> = [
  { family: "Inter", weight: 400, style: "normal" },
  { family: "Inter", weight: 600, style: "normal" },
  { family: "Inter", weight: 700, style: "normal" },
  { family: "Inter", weight: 900, style: "normal" },
  { family: "Cormorant Garamond", weight: 400, style: "normal" },
  { family: "Cormorant Garamond", weight: 700, style: "normal" },
];

async function fetchGoogleFont(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;

  const cssResponse = await fetch(cssUrl, {
    headers: {
      // A desktop user-agent is required so Google returns woff2/truetype URLs
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!cssResponse.ok) {
    throw new Error(
      `Failed to fetch font CSS for ${family} ${weight}: ${cssResponse.status}`
    );
  }

  const css = await cssResponse.text();

  // Extract the font file URL from the @font-face src: url(...) declaration
  const fontUrlMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!fontUrlMatch?.[1]) {
    throw new Error(`Font URL not found in CSS for ${family} ${weight}`);
  }

  const fontResponse = await fetch(fontUrlMatch[1]);
  if (!fontResponse.ok) {
    throw new Error(
      `Failed to fetch font file for ${family} ${weight}: ${fontResponse.status}`
    );
  }

  return fontResponse.arrayBuffer();
}

export async function loadPosterFonts(): Promise<SatoriFont[]> {
  if (fontCache) return fontCache;

  const results = await Promise.allSettled(
    FONT_SPECS.map(async (spec) => {
      const data = await fetchGoogleFont(spec.family, spec.weight);
      return {
        name: spec.family,
        data,
        weight: spec.weight,
        style: spec.style,
      } satisfies SatoriFont;
    })
  );

  const fonts = results
    .filter(
      (r): r is PromiseFulfilledResult<SatoriFont> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);

  if (fonts.length === 0) {
    throw new Error("Failed to load any fonts for Satori");
  }

  fontCache = fonts;
  return fonts;
}
