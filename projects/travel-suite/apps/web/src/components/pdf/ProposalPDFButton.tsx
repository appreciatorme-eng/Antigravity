/**
 * Proposal PDF Download Button
 *
 * Downloads proposal as PDF or emails it to client
 */

'use client';

import React, { useState } from 'react';
import { Download, Mail, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ProposalDocument } from './ProposalDocument';
import { GlassButton } from '../glass/GlassButton';

interface ProposalPDFButtonProps {
  proposalId: string;
  proposalData: any;
  clientEmail?: string;
  variant?: 'download' | 'email' | 'both';
  organizationName?: string;
}

export const ProposalPDFButton: React.FC<ProposalPDFButtonProps> = ({
  proposalId,
  proposalData,
  clientEmail,
  variant = 'both',
  organizationName = 'Travel Suite',
}) => {
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Generate PDF
      const blob = await pdf(
        <ProposalDocument
          proposal={proposalData}
          organizationName={organizationName}
        />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${proposalData.title.replace(/\s+/g, '_')}_Proposal.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = async () => {
    if (!clientEmail) {
      alert('Client email not available');
      return;
    }

    setEmailing(true);
    try {
      // Generate PDF blob
      const blob = await pdf(
        <ProposalDocument
          proposal={proposalData}
          organizationName={organizationName}
        />
      ).toBlob();

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64 = base64data.split(',')[1];

        // Send email via API
        const response = await fetch('/api/proposals/send-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposal_id: proposalId,
            client_email: clientEmail,
            pdf_base64: base64,
            proposal_title: proposalData.title,
          }),
        });

        if (response.ok) {
          alert(`PDF sent successfully to ${clientEmail}!`);
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send email');
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read PDF blob');
      };
    } catch (error) {
      console.error('Error emailing PDF:', error);
      alert('Failed to send PDF via email. Please try again.');
    } finally {
      setEmailing(false);
    }
  };

  if (variant === 'download') {
    return (
      <GlassButton
        onClick={handleDownload}
        disabled={downloading}
        variant="primary"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </>
        )}
      </GlassButton>
    );
  }

  if (variant === 'email') {
    return (
      <GlassButton
        onClick={handleEmail}
        disabled={emailing || !clientEmail}
        variant="ghost"
      >
        {emailing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            Email PDF
          </>
        )}
      </GlassButton>
    );
  }

  // Both buttons
  return (
    <div className="flex gap-2">
      <GlassButton
        onClick={handleDownload}
        disabled={downloading}
        variant="primary"
        size="sm"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download
          </>
        )}
      </GlassButton>

      {clientEmail && (
        <GlassButton
          onClick={handleEmail}
          disabled={emailing}
          variant="ghost"
          size="sm"
        >
          {emailing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </>
          )}
        </GlassButton>
      )}
    </div>
  );
};
