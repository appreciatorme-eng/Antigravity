'use client';

export type ProposalSummaryProps = {
  proposalTitle: string;
  expirationDays: number;
  sendEmail: boolean;
  onTitleChange: (title: string) => void;
  onExpirationChange: (days: number) => void;
  onEmailToggle: (send: boolean) => void;
};

export function ProposalSummary({
  proposalTitle,
  expirationDays,
  sendEmail,
  onTitleChange,
  onExpirationChange,
  onEmailToggle,
}: ProposalSummaryProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <h2 className="text-lg font-semibold text-[#1b140a] mb-4">Proposal Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Proposal Title
          </label>
          <input
            type="text"
            value={proposalTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Classic Dubai - John Smith"
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <p className="text-xs text-[#bda87f] mt-1">
            Auto-generated from template and client name
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Expiration (Days)
          </label>
          <input
            type="number"
            value={expirationDays}
            onChange={(e) => onExpirationChange(parseInt(e.target.value) || 0)}
            min="0"
            max="90"
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <p className="text-xs text-[#bda87f] mt-1">
            Proposal will expire in {expirationDays} days (0 = never expires)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sendEmail"
            checked={sendEmail}
            onChange={(e) => onEmailToggle(e.target.checked)}
            className="w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
          />
          <label htmlFor="sendEmail" className="text-sm text-[#6f5b3e]">
            Send email notification to client after proposal creation
          </label>
        </div>
      </div>
    </div>
  );
}
