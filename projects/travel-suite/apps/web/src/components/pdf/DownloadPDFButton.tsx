"use client";

import React, { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import type { ItineraryResult } from '@/types/itinerary';
import { useToast } from '@/components/ui/toast';
import { downloadItineraryPdf } from './itinerary-pdf';
import type { ItineraryPrintExtras, ItineraryTemplateId } from './itinerary-types';

interface DownloadPDFButtonProps {
  data: ItineraryResult;
  fileName?: string;
  template?: ItineraryTemplateId;
  clientName?: string | null;
  printExtras?: ItineraryPrintExtras;
}

const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = ({
  data,
  fileName,
  template,
  clientName,
  printExtras,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await downloadItineraryPdf({
        itinerary: data,
        template,
        branding: clientName ? { clientName } : undefined,
        printExtras,
        fileName: fileName || (data.trip_title ? `${data.trip_title.replace(/\s+/g, '_')}_Itinerary.pdf` : 'itinerary.pdf'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'PDF generation failed',
        description: `Failed to generate PDF: ${message}`,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="h-9 md:h-10 px-2 md:px-4 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-70 text-xs md:text-sm"
      aria-label="Download itinerary as PDF"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden md:inline">Preparing...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="hidden md:inline">Download PDF</span>
        </>
      )}
    </button>
  );
};

export default DownloadPDFButton;
