import { describe, expect, it } from "vitest";

import {
  extractImportTextFromHtml,
  looksLikePdfUrl,
} from "../../../src/lib/import/trip-import";

describe("trip import helpers", () => {
  it("extracts readable brochure text from html while stripping chrome noise", () => {
    const text = extractImportTextFromHtml(`
      <html>
        <head>
          <title>Thailand Tour Package</title>
          <meta name="description" content="7 day island hopping itinerary" />
        </head>
        <body>
          <nav>Navigation</nav>
          <header>Site Header</header>
          <main>
            <h1>Thailand Tour Package</h1>
            <p>Day 1 Arrival in Phuket</p>
            <p>Day 2 Phi Phi Island tour</p>
          </main>
          <footer>Footer links</footer>
        </body>
      </html>
    `);

    expect(text).toContain("Thailand Tour Package");
    expect(text).toContain("7 day island hopping itinerary");
    expect(text).toContain("Day 2 Phi Phi Island tour");
    expect(text).not.toContain("Navigation");
    expect(text).not.toContain("Footer links");
  });

  it("detects direct pdf urls", () => {
    expect(looksLikePdfUrl("https://example.com/brochures/thailand.pdf")).toBe(true);
    expect(looksLikePdfUrl("https://example.com/download?id=123")).toBe(false);
    expect(looksLikePdfUrl("https://example.com/tour.pdf?version=2")).toBe(true);
  });
});
