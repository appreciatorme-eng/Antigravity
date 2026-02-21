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

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Find the element to convert
      const element = document.getElementById('itinerary-pdf-content');
      if (!element) {
        throw new Error("Could not find the itinerary content to generate PDF");
      }

      // Small delay to ensure any layout shifts/images have loaded
      await new Promise(resolve => setTimeout(resolve, 300));

      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

      const canvas = await (html2canvas as any)(element, {
        scale: 2, // higher scale for better resolution
        useCORS: true, // to load remote images
        logging: true,
        backgroundColor: '#ffffff',
        ignoreElements: (node: Element) => {
          if (node && typeof node.hasAttribute === 'function' && node.classList && typeof node.classList.contains === 'function' && node.classList.contains('print:hidden')) {
            return true;
          }
          return false;
        }
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new (jsPDF as any)('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position -= pageHeight; // Move the position up by exactly one page height
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const computedFileName = fileName || (data.trip_title ? `${data.trip_title.replace(/\s+/g, '_')}_Itinerary.pdf` : 'itinerary.pdf');
      pdf.save(computedFileName);

    } catch (error) {
      console.error("Failed to generate PDF", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to generate PDF: ${errorMessage}\nPlease try again.`);
    } finally {
      setLoading(false);
    }
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
