'use client';

import Link from 'next/link';
import { Send, Loader2 } from 'lucide-react';

export interface CreateProposalActionsProps {
  readonly creating: boolean;
  readonly disabled: boolean;
  readonly onCreateProposal: () => void;
}

export function CreateProposalActions({
  creating,
  disabled,
  onCreateProposal,
}: CreateProposalActionsProps) {
  return (
    <>
      {/* Create Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/proposals"
          className="px-6 py-3 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={onCreateProposal}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Proposal...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Create Proposal
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>A proposal will be created from the selected template</li>
          <li>You&apos;ll be able to customize activities and pricing</li>
          <li>A unique shareable link will be generated</li>
          <li>The client can view, comment, and approve the proposal</li>
          <li>You&apos;ll get real-time notifications when the client interacts</li>
        </ul>
      </div>
    </>
  );
}
