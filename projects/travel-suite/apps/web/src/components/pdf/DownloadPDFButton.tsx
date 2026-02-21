"use client";

import React, { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import type { ItineraryResult } from '@/types/itinerary';

interface DownloadPDFButtonProps {
  data: ItineraryResult;
  fileName?: string;
}

const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = ({ data, fileName }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);
    // Give state a brief moment to update so loading spinner shows before print blocks UI thread
    setTimeout(() => {
      // Change document title temporarily so the default PDF filename matches the trip
      const originalTitle = document.title;
      if (fileName) {
        document.title = fileName.replace('.pdf', '');
      } else if (data.trip_title) {
        document.title = `${data.trip_title} Itinerary`;
      }

      window.print();

      // Restore original document title
      document.title = originalTitle;
      setLoading(false);
    }, 100);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
      aria-label="Download itinerary as PDF"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Preparing...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" /> Download PDF
        </>
      )}
    </button>
  );
};

export default DownloadPDFButton;
