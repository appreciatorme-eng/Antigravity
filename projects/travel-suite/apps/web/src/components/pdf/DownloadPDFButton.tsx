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

      // Add a class that templates can hook into via '[.pdf-exporting_&]:property' to expand accordions and un-hide elements
      element.classList.add('pdf-exporting');

      let imgData;
      try {
        const htmlToImage = await import('html-to-image');
        const jspdfModule = await import('jspdf');
        const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

        imgData = await htmlToImage.toPng(element, {
          pixelRatio: 2, // higher scale for better resolution
          backgroundColor: '#ffffff',
          imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          filter: (node: HTMLElement) => {
            if (node.classList && typeof node.classList.contains === 'function' && node.classList.contains('print:hidden')) {
              return false;
            }
            return true;
          }
        });

        const img = new Image();
        img.src = imgData;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Failed to load generated PDF image data"));
        });

        const canvasWidth = img.width;
        const canvasHeight = img.height;

        const pdf = new (jsPDF as any)('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

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
      } finally {
        element.classList.remove('pdf-exporting');
      }

    } catch (error) {
      console.error("Failed to generate PDF", error);
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'type' in error) {
        errorMessage = 'Failed to load a custom font or external image. Please try again.';
      } else {
        errorMessage = String(error);
      }
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
