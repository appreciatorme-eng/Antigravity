"use client";

import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ItineraryResult } from '@/types/itinerary';
import {
  downloadItineraryPdf,
  fetchItineraryPdfPreferences,
} from './itinerary-pdf';
import {
  DEFAULT_ITINERARY_TEMPLATE,
  ITINERARY_TEMPLATE_OPTIONS,
  type ItineraryTemplateId,
} from './itinerary-types';

interface PDFDownloadButtonProps {
  itinerary: ItineraryResult;
  className?: string;
  showTemplateSelector?: boolean;
  clientName?: string | null;
}

export default function PDFDownloadButton({
  itinerary,
  className = '',
  showTemplateSelector = true,
  clientName,
}: PDFDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [template, setTemplate] = useState<ItineraryTemplateId>(DEFAULT_ITINERARY_TEMPLATE);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const preferences = await fetchItineraryPdfPreferences();
      if (mounted) {
        setTemplate(preferences.defaultTemplate);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDownload = async () => {
    if (!itinerary || generating) return;

    setGenerating(true);

    try {
      await downloadItineraryPdf({
        itinerary,
        template,
        branding: clientName ? { clientName } as any : undefined,
        fileName: `${(itinerary.trip_title || 'itinerary').replace(/[^a-zA-Z0-9-_]+/g, '_')}_${template}.pdf`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showTemplateSelector ? (
        <select
          value={template}
          onChange={(event) => setTemplate(event.target.value as ItineraryTemplateId)}
          className="h-9 rounded-md border border-gray-200 bg-white/90 px-2 text-xs text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Choose PDF template"
        >
          {ITINERARY_TEMPLATE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      <Button
        variant="outline"
        size="icon"
        onClick={handleDownload}
        disabled={generating}
        className={`bg-white/80 backdrop-blur-sm shadow-sm hover:bg-gray-100 transition-colors ${className}`}
        title="Download PDF"
      >
        {generating ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
        ) : (
          <Download className="w-4 h-4 text-gray-700" />
        )}
      </Button>
    </div>
  );
}
