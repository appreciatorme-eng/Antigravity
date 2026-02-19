"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
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

interface DownloadPDFButtonProps {
  data: ItineraryResult;
  fileName?: string;
}

const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = ({ data, fileName = 'itinerary.pdf' }) => {
  const [loading, setLoading] = useState(false);
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
    if (loading) return;
    setLoading(true);

    try {
      await downloadItineraryPdf({
        itinerary: data,
        template,
        fileName,
      });
    } catch (error) {
      console.error('Failed to generate itinerary PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={template}
        onChange={(event) => setTemplate(event.target.value as ItineraryTemplateId)}
        className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Choose itinerary template"
      >
        {ITINERARY_TEMPLATE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" /> Download PDF
          </>
        )}
      </button>
    </div>
  );
};

export default DownloadPDFButton;
