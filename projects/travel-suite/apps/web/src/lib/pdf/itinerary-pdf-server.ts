import React from "react";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";

import ItineraryDocument from "@/components/pdf/ItineraryDocument";
import {
  DEFAULT_ITINERARY_BRANDING,
  DEFAULT_ITINERARY_TEMPLATE,
  normalizeItineraryTemplateId,
  type ItineraryBranding,
  type ItineraryPrintExtras,
} from "@/components/pdf/itinerary-types";
import { stripRepeatedPdfImages } from "@/components/pdf/templates/sections/shared";
import { populateItineraryImages } from "@/lib/image-search";
import { logError } from "@/lib/observability/logger";
import { prepareItineraryPrintPayload } from "@/lib/pdf/itinerary-print/assets";
import { launchItineraryPdfBrowser } from "@/lib/pdf/itinerary-print/browser";
import { renderItineraryPrintHtml } from "@/lib/pdf/itinerary-print/document";
import type { ItineraryResult } from "@/types/itinerary";

export type ItineraryPdfRenderResult = {
  readonly buffer: Buffer;
  readonly fileName: string;
  readonly renderer: "print-html" | "legacy-react-pdf";
  readonly printErrorMessage: string | null;
};

export const sanitizeItineraryPdfFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9-_]+/g, "_");

export const normalizeServerPdfBranding = (
  branding: ItineraryBranding,
  fallback: ItineraryBranding,
): ItineraryBranding => {
  const name = branding.companyName?.trim();
  if (name && name.toLowerCase() !== "tripbuilt") {
    return { ...branding, companyName: name };
  }
  const fallbackName = fallback.companyName?.trim();
  return {
    ...branding,
    companyName:
      fallbackName && fallbackName.toLowerCase() !== "tripbuilt"
        ? fallbackName
        : DEFAULT_ITINERARY_BRANDING.companyName,
  };
};

export const normalizeServerPdfItinerary = (input: ItineraryResult): ItineraryResult => {
  const duration = input.duration_days || input.days?.length || 1;
  return {
    ...input,
    duration_days: duration,
    trip_title: input.trip_title || input.title || "My Itinerary",
    destination: input.destination || "Destination",
    summary: input.summary || input.description || "Detailed itinerary enclosed.",
    days: input.days || [],
  };
};

const stripActivityImages = (itinerary: ItineraryResult): ItineraryResult => ({
  ...itinerary,
  days: itinerary.days.map((day) => ({
    ...day,
    activities: (day.activities || []).map((activity) => ({
      ...activity,
      image: undefined,
      imageUrl: undefined,
    })),
  })),
});

const stripAllPdfImages = (
  itinerary: ItineraryResult,
  branding: ItineraryBranding,
): { itinerary: ItineraryResult; branding: ItineraryBranding } => ({
  itinerary: stripActivityImages(itinerary),
  branding: {
    ...branding,
    logoUrl: null,
  },
});

export const renderLegacyItineraryPdfBuffer = async (
  itinerary: ItineraryResult,
  template: ReturnType<typeof normalizeItineraryTemplateId>,
  branding: ItineraryBranding,
) => {
  const enrichedItinerary = stripRepeatedPdfImages(itinerary);

  const document = React.createElement(ItineraryDocument, {
    data: enrichedItinerary,
    template,
    branding,
  }) as React.ReactElement<DocumentProps>;

  let stream;
  try {
    stream = await renderToStream(document);
  } catch (error) {
    logError("Primary legacy itinerary PDF render failed, retrying without activity images", error);
    try {
      const fallbackDocument = React.createElement(ItineraryDocument, {
        data: stripActivityImages(itinerary),
        template,
        branding,
      }) as React.ReactElement<DocumentProps>;
      stream = await renderToStream(fallbackDocument);
    } catch (secondaryError) {
      logError("Secondary legacy itinerary PDF render failed, retrying without remote images", secondaryError);
      const stripped = stripAllPdfImages(itinerary, branding);
      const finalDocument = React.createElement(ItineraryDocument, {
        data: stripped.itinerary,
        template,
        branding: stripped.branding,
      }) as React.ReactElement<DocumentProps>;
      stream = await renderToStream(finalDocument);
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

type RenderItineraryPdfArgs = {
  readonly itinerary: ItineraryResult;
  readonly requestUrl: string;
  readonly branding: ItineraryBranding;
  readonly template?: string | null;
  readonly printExtras?: ItineraryPrintExtras;
  readonly fileName?: string | null;
};

export async function renderItineraryPdfBuffer({
  itinerary,
  requestUrl,
  branding,
  template,
  printExtras,
  fileName,
}: RenderItineraryPdfArgs): Promise<ItineraryPdfRenderResult> {
  const resolvedTemplate = normalizeItineraryTemplateId(template ?? DEFAULT_ITINERARY_TEMPLATE);
  const normalizedItinerary = normalizeServerPdfItinerary(itinerary);
  const resolvedBranding = normalizeServerPdfBranding(branding, branding);
  const imageReadyItinerary = (await populateItineraryImages(
    normalizedItinerary as unknown as Parameters<typeof populateItineraryImages>[0],
    {
      refreshAutoGenerated: true,
    },
  )) as unknown as ItineraryResult;
  const resolvedFileName =
    fileName ||
    `${sanitizeItineraryPdfFileName(normalizedItinerary.trip_title || "itinerary")}_${resolvedTemplate}.pdf`;

  let printErrorMessage: string | null = null;

  try {
    const origin = new URL(requestUrl).origin;
    const prepared = await prepareItineraryPrintPayload(
      imageReadyItinerary,
      resolvedBranding,
      resolvedTemplate,
      origin,
      printExtras,
    );
    const html = await renderItineraryPrintHtml(prepared);
    const browser = await launchItineraryPdfBrowser();

    try {
      const page = await browser.newPage({
        deviceScaleFactor: 1,
        colorScheme: resolvedTemplate === "luxury_resort" ? "dark" : "light",
      });
      await page.emulateMedia({ media: "print" });
      await page.setContent(html, { waitUntil: "networkidle" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      await page.close();

      return {
        buffer: Buffer.from(pdf),
        fileName: resolvedFileName,
        renderer: "print-html",
        printErrorMessage: null,
      };
    } finally {
      await browser.close();
    }
  } catch (printError) {
    logError("HTML itinerary PDF render failed, falling back to legacy renderer", printError);
    printErrorMessage =
      printError instanceof Error ? printError.message : "Unknown print renderer error";
  }

  const legacyPdf = await renderLegacyItineraryPdfBuffer(
    imageReadyItinerary,
    resolvedTemplate,
    resolvedBranding,
  );

  return {
    buffer: legacyPdf,
    fileName: resolvedFileName,
    renderer: "legacy-react-pdf",
    printErrorMessage,
  };
}
