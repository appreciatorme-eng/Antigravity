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
import { useToast } from '@/components/ui/toast';

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
  const { toast } = useToast();

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
      toast({
        title: 'PDF generation failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'error',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = async () => {
    if (!clientEmail) {
      toast({
        title: 'Email unavailable',
        description: 'Client email not available.',
        variant: 'warning',
      });
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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const encoded = base64data.split(',')[1];
          if (!encoded) {
            reject(new Error('Failed to encode PDF blob'));
            return;
          }
          resolve(encoded);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read PDF blob'));
        };
      });

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
        toast({
          title: 'PDF emailed',
          description: `PDF sent successfully to ${clientEmail}.`,
          variant: 'success',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error emailing PDF:', error);
      toast({
        title: 'Email failed',
        description: 'Failed to send PDF via email. Please try again.',
        variant: 'error',
      });
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
