'use client';

import { AlertCircle, CheckCircle, CreditCard, MessageCircle } from 'lucide-react';
import type { ProposalComment } from './shared';

export function ProposalLoadingState() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#f5efe6]"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#9c7c46] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg text-gray-600">Loading your proposal...</div>
      </div>
    </div>
  );
}

export function ProposalErrorState({ error }: { error: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#f5efe6] p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'The proposal link is invalid or has expired.'}</p>
        <p className="text-sm text-gray-500">
          Please contact your tour operator for a new link.
        </p>
      </div>
    </div>
  );
}

interface ProposalCommentsSectionProps {
  commentEmail: string;
  commentName: string;
  commentText: string;
  comments: ProposalComment[];
  onCommentEmailChange: (value: string) => void;
  onCommentNameChange: (value: string) => void;
  onCommentTextChange: (value: string) => void;
  onSubmitComment: () => void;
  submittingComment: boolean;
}

export function ProposalCommentsSection({
  commentEmail,
  commentName,
  commentText,
  comments,
  onCommentEmailChange,
  onCommentNameChange,
  onCommentTextChange,
  onSubmitComment,
  submittingComment,
}: ProposalCommentsSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-8">
      <h3 className="text-xl font-semibold text-[#1b140a] mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Questions or Comments?
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={commentName}
              onChange={(event) => onCommentNameChange(event.target.value)}
              placeholder="John Smith"
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={commentEmail}
              onChange={(event) => onCommentEmailChange(event.target.value)}
              placeholder="john@example.com"
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Your Comment *
          </label>
          <textarea
            value={commentText}
            onChange={(event) => onCommentTextChange(event.target.value)}
            rows={4}
            placeholder="Ask a question or leave a comment..."
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>

        <button
          type="button"
          onClick={onSubmitComment}
          disabled={submittingComment}
          className="px-6 py-3 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors disabled:opacity-50"
        >
          {submittingComment ? 'Submitting...' : 'Submit Comment'}
        </button>
      </div>

      {comments.length > 0 && (
        <div className="mt-8 pt-8 border-t border-[#eadfcd]">
          <h4 className="font-semibold text-[#1b140a] mb-4">Previous Comments</h4>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-[#f8f1e6] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#1b140a]">{comment.author_name}</span>
                  <span className="text-xs text-[#bda87f]">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[#6f5b3e]">{comment.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProposalApprovalSectionProps {
  approvalEmail: string;
  approvalName: string;
  onApprovalEmailChange: (value: string) => void;
  onApprovalNameChange: (value: string) => void;
  onApprove: (requestPayment: boolean) => void;
  submittingApproval: boolean;
}

export function ProposalApprovalSection({
  approvalEmail,
  approvalName,
  onApprovalEmailChange,
  onApprovalNameChange,
  onApprove,
  submittingApproval,
}: ProposalApprovalSectionProps) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 p-8">
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Ready to confirm this itinerary?
        </h3>
        <p className="text-gray-600">
          Approve now and optionally ask the operator to share a payment link.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-left">
          <label htmlFor="approval-name" className="block text-sm font-medium text-[#1b140a] mb-2">
            Full name *
          </label>
          <input
            id="approval-name"
            type="text"
            value={approvalName}
            onChange={(event) => onApprovalNameChange(event.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46] focus:border-transparent"
          />
        </div>

        <div className="text-left">
          <label htmlFor="approval-email" className="block text-sm font-medium text-[#1b140a] mb-2">
            Email (optional)
          </label>
          <input
            id="approval-email"
            type="email"
            value={approvalEmail}
            onChange={(event) => onApprovalEmailChange(event.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46] focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => onApprove(false)}
          disabled={submittingApproval}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          {submittingApproval ? 'Submitting...' : 'Approve Proposal'}
        </button>
        <button
          type="button"
          onClick={() => onApprove(true)}
          disabled={submittingApproval}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1b140a] text-white text-sm font-semibold rounded-lg hover:bg-[#342715] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CreditCard className="w-4 h-4" />
          {submittingApproval ? 'Submitting...' : 'Approve & Request Payment'}
        </button>
      </div>
    </div>
  );
}
