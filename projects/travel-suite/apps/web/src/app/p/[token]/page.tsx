'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Home,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast';
import { z } from 'zod';
import {
  ProposalApprovalSection,
  ProposalCommentsSection,
  ProposalErrorState,
  ProposalLoadingState,
} from './sections';
import {
  type Proposal,
  type ProposalAccommodation,
  type ProposalActivity,
  type ProposalAddOn,
  type ProposalComment,
  type ProposalDay,
  type PublicProposalPayload,
  PublicActionResponseSchema,
  PublicProposalPayloadSchema,
} from './shared';

export default function PublicProposalPage() {
  const params = useParams();
  const shareToken = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [days, setDays] = useState<ProposalDay[]>([]);
  const [activities, setActivities] = useState<Record<string, ProposalActivity[]>>({});
  const [accommodations, setAccommodations] = useState<Record<string, ProposalAccommodation>>(
    {}
  );
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [addOns, setAddOns] = useState<ProposalAddOn[]>([]);

  // UI state
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [commentDayId, setCommentDayId] = useState<string | null>(null);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [approvalName, setApprovalName] = useState('');
  const [approvalEmail, setApprovalEmail] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const { toast } = useToast();

  const loadProposal = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals/public/${shareToken}`, {
        cache: 'no-store',
      });
      const rawPayload = await response.json();

      if (!response.ok) {
        const errorPayload = z.object({ error: z.string().optional() }).safeParse(rawPayload);
        setError(errorPayload.success ? errorPayload.data.error || 'Proposal not found or link has expired' : 'Proposal not found or link has expired');
        return;
      }

      const parsed = PublicProposalPayloadSchema.safeParse(rawPayload);
      if (!parsed.success) {
        console.error('Invalid proposal payload:', parsed.error.flatten());
        setError('Invalid proposal data format');
        return;
      }

      const bundle = parsed.data as PublicProposalPayload;
      setProposal(bundle.proposal);
      setDays(bundle.days || []);
      setActivities(bundle.activitiesByDay || {});
      setAccommodations(bundle.accommodationsByDay || {});
      setComments(bundle.comments || []);
      setAddOns(bundle.addOns || []);

      if (bundle.days && bundle.days.length > 0) {
        setExpandedDays((previous) =>
          previous.size ? previous : new Set([bundle.days[0].id])
        );
      } else {
        setExpandedDays(new Set());
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
      setError('An error occurred while loading the proposal');
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    void loadProposal();
  }, [loadProposal]);

  async function performPublicAction(body: Record<string, unknown>) {
    const response = await fetch(`/api/proposals/public/${shareToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const rawPayload = await response.json();
    const parsed = PublicActionResponseSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new Error('Invalid response from server');
    }
    const payload = parsed.data;
    if (!response.ok) {
      throw new Error(payload.error || 'Action failed');
    }

    if (payload.client_selected_price !== undefined) {
      setProposal((prev) =>
        prev
          ? {
              ...prev,
              client_selected_price: payload.client_selected_price,
            }
          : prev
      );
    }

    const nextStatus = payload.status;
    if (typeof nextStatus === 'string') {
      setProposal((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
            }
          : prev
      );
    }
  }

  async function toggleActivity(activityId: string, dayId: string) {
    const activity = activities[dayId]?.find((a) => a.id === activityId);

    if (!activity) return;

    const newSelectedState = !activity.is_selected;

    try {
      await performPublicAction({
        action: 'toggleActivity',
        activityId,
        selected: newSelectedState,
      });
      await loadProposal();
    } catch (error) {
      console.error('Error toggling activity:', error);
    }
  }

  async function toggleAddOn(addOnId: string) {
    const current = addOns.find((item) => item.id === addOnId);
    if (!current) return;

    try {
      await performPublicAction({
        action: 'toggleAddOn',
        addOnId,
        selected: !current.is_selected,
      });
      await loadProposal();
    } catch (error) {
      console.error('Error toggling add-on:', error);
    }
  }

  async function selectVehicle(addOnId: string) {
    try {
      await performPublicAction({
        action: 'selectVehicle',
        addOnId,
      });
      await loadProposal();
    } catch (error) {
      console.error('Error selecting vehicle:', error);
    }
  }

  async function submitComment() {
    if (!proposal || !commentText.trim() || !commentName.trim()) {
      toast({
        title: 'Missing details',
        description: 'Please enter your name and comment.',
        variant: 'warning',
      });
      return;
    }

    setSubmittingComment(true);

    try {
      await performPublicAction({
        action: 'comment',
        proposalDayId: commentDayId,
        authorName: commentName,
        authorEmail: commentEmail || null,
        comment: commentText,
      });
      await loadProposal();

      // Reset form
      setCommentText('');
      setCommentDayId(null);
      toast({
        title: 'Comment submitted',
        description: 'Your comment was sent to the operator.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Comment failed',
        description: 'An error occurred while submitting your comment.',
        variant: 'error',
      });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function approveProposal(requestPayment = false) {
    if (!proposal) return;

    const approverName = approvalName.trim() || commentName.trim();
    const approverEmail = approvalEmail.trim() || commentEmail.trim();

    if (!approverName) {
      toast({
        title: 'Name required',
        description: 'Please enter your full name before approving.',
        variant: 'warning',
      });
      return;
    }

    setSubmittingApproval(true);
    try {
      await performPublicAction({
        action: 'approve',
        approvedBy: approverName,
        approvedEmail: approverEmail || null,
        requestPayment,
      });
      await loadProposal();
      setProposal((prev) => (prev ? { ...prev, status: 'approved' } : null));
      toast({
        title: requestPayment ? 'Approved and payment requested' : 'Proposal approved',
        description: requestPayment
          ? 'The operator has been notified to share your payment link.'
          : 'The tour operator has been notified.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error approving proposal:', error);
      toast({
        title: 'Approval failed',
        description: 'Failed to approve proposal',
        variant: 'error',
      });
    } finally {
      setSubmittingApproval(false);
    }
  }

  function toggleDay(dayId: string) {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  }

  const displayedPrice = proposal?.client_selected_price ?? proposal?.total_price ?? 0;
  const expiresDate = proposal?.expires_at ? new Date(proposal.expires_at) : null;
  const hasValidExpiry = Boolean(expiresDate && Number.isFinite(expiresDate.getTime()));
  const expiresInDays =
    hasValidExpiry && expiresDate
      ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

  if (loading) {
    return <ProposalLoadingState />;
  }

  if (error || !proposal) {
    return <ProposalErrorState error={error || 'The proposal link is invalid or has expired.'} />;
  }

  return (
    <div className="min-h-screen bg-[#f5efe6]">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-[#f6efe4] to-[#eadfcd]">
        {proposal.hero_image_url ? (
          <Image src={proposal.hero_image_url} alt={proposal.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-32 h-32 text-[#bda87f]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-5xl font-[var(--font-display)] mb-4">{proposal.title}</h1>
            <div className="flex items-center gap-8 text-lg">
              {proposal.destination && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {proposal.destination}
                </div>
              )}
              {proposal.duration_days && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {proposal.duration_days} days
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                ${displayedPrice.toFixed(2)}
              </div>
              {hasValidExpiry && expiresInDays !== null ? (
                <div className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                  <Calendar className="w-4 h-4" />
                  {expiresInDays >= 0
                    ? `Expires in ${expiresInDays} day${expiresInDays === 1 ? '' : 's'}`
                    : 'Expired'}
                </div>
              ) : null}
            </div>
            <div className="mt-6">
              <a
                href={`/api/proposals/${proposal.id}/pdf?token=${shareToken}`}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur-sm text-[#9c7c46] rounded-lg hover:bg-white transition-colors shadow-lg font-medium"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Description */}
        {proposal.description && (
          <div className="bg-white rounded-2xl border border-[#eadfcd] p-8">
            <p className="text-lg text-[#6f5b3e] leading-relaxed">{proposal.description}</p>
          </div>
        )}

        {/* Options & Add-ons */}
        {(addOns.length > 0) && (
          <div className="bg-white rounded-2xl border border-[#eadfcd] p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-[var(--font-display)] text-[#1b140a]">Options</h2>
                <p className="text-sm text-[#6f5b3e]">
                  Choose your vehicle type and optional upgrades. Price updates instantly.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#6f5b3e]">Current total</div>
                <div className="text-xl font-semibold text-[#1b140a]">${displayedPrice.toFixed(2)}</div>
                {proposal.total_price !== displayedPrice && (
                  <div className="text-xs text-[#6f5b3e]">Base: ${proposal.total_price.toFixed(2)}</div>
                )}
              </div>
            </div>

            {addOns.filter((a) => a.category === 'Transport').length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#1b140a] mb-2">Vehicle Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addOns
                    .filter((a) => a.category === 'Transport')
                    .map((a) => (
                      <label
                        key={a.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                          a.is_selected ? 'border-[#9c7c46] bg-[#f8f1e6]' : 'border-[#eadfcd] hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vehicle"
                          checked={a.is_selected}
                          onChange={() => selectVehicle(a.id)}
                          aria-label={`Select vehicle option ${a.name}`}
                          className="mt-1 w-4 h-4 text-[#9c7c46] border-gray-300 focus:ring-[#9c7c46]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-[#1b140a] truncate">{a.name}</div>
                            <div className="text-sm font-semibold text-[#1b140a] whitespace-nowrap">
                              ${Number(a.unit_price || 0).toFixed(2)}
                            </div>
                          </div>
                          {a.description ? (
                            <div className="text-xs text-[#6f5b3e] mt-1">{a.description}</div>
                          ) : null}
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {addOns.filter((a) => a.category !== 'Transport').length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#1b140a] mb-2">Add-ons</h3>
                <div className="space-y-2">
                  {addOns
                    .filter((a) => a.category !== 'Transport')
                    .map((a) => (
                      <label
                        key={a.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-[#eadfcd] hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={a.is_selected}
                          onChange={() => toggleAddOn(a.id)}
                          aria-label={`Toggle add-on ${a.name}`}
                          className="mt-1 w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-[#1b140a] truncate">{a.name}</div>
                            <div className="text-sm font-semibold text-[#1b140a] whitespace-nowrap">
                              ${Number(a.unit_price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-xs text-[#6f5b3e] mt-0.5 truncate">{a.category}</div>
                          {a.description ? (
                            <div className="text-xs text-[#6f5b3e] mt-1">{a.description}</div>
                          ) : null}
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approval Status */}
        {proposal.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Proposal Approved!</h3>
              <p className="text-sm text-green-700">
                This proposal has been approved. The tour operator will contact you soon.
              </p>
            </div>
          </div>
        )}

        {/* Day-by-Day Itinerary */}
        <div className="space-y-4">
          <h2 className="text-3xl font-[var(--font-display)] text-[#1b140a]">
            Your Itinerary
          </h2>

          {days.map((day) => {
            const isExpanded = expandedDays.has(day.id);
            const dayActivities = activities[day.id] || [];
            const dayAccommodation = accommodations[day.id];

            return (
              <div
                key={day.id}
                className="bg-white rounded-2xl border border-[#eadfcd] overflow-hidden"
              >
                {/* Day Header */}
                <button
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`day-panel-${day.id}`}
                  className="w-full p-6 flex items-center justify-between hover:bg-[#f8f1e6]/30 transition-colors text-left"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-[#1b140a]">
                      Day {day.day_number}: {day.title || 'Untitled'}
                    </h3>
                    {day.description && (
                      <p className="text-sm text-[#6f5b3e] mt-1">{day.description}</p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-[#9c7c46] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-[#9c7c46] flex-shrink-0" />
                  )}
                </button>

                {/* Day Content */}
                {isExpanded && (
                  <div id={`day-panel-${day.id}`} className="border-t border-[#eadfcd]">
                    {/* Activities */}
                    {dayActivities.length > 0 && (
                      <div className="p-6 space-y-4">
                        {dayActivities.map((activity) => (
                          <div
                            key={activity.id}
                            className={`flex gap-4 p-4 rounded-lg transition-all ${activity.is_selected
                              ? 'bg-[#f8f1e6] border-2 border-[#9c7c46]'
                              : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                              }`}
                          >
                            {/* Activity Toggle (if optional) */}
                            {activity.is_optional && (
                              <div className="flex items-start pt-1">
                                <input
                                  type="checkbox"
                                  checked={activity.is_selected}
                                  onChange={() => toggleActivity(activity.id, day.id)}
                                  aria-label={`Toggle optional activity ${activity.title}`}
                                  className="w-5 h-5 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
                                />
                              </div>
                            )}

                            {/* Activity Image */}
                            {activity.image_url && (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={activity.image_url}
                                  alt={activity.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}

                            {/* Activity Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    {activity.time && (
                                      <span className="text-xs text-[#bda87f] flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {activity.time}
                                      </span>
                                    )}
                                    {activity.is_optional && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                        Optional
                                      </span>
                                    )}
                                    {activity.is_premium && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                        Premium
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-semibold text-[#1b140a]">{activity.title}</h5>
                                  {activity.location && (
                                    <p className="text-xs text-[#bda87f] flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {activity.location}
                                    </p>
                                  )}
                                </div>
                                {activity.price > 0 && (
                                  <div className="text-right">
                                    <div className="text-lg font-semibold text-[#9c7c46]">
                                      ${activity.price.toFixed(2)}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {activity.description && (
                                <p className="text-sm text-[#6f5b3e]">{activity.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Accommodation */}
                    {dayAccommodation && (
                      <div className="p-6 border-t border-[#eadfcd] bg-gradient-to-br from-white to-[#f8f1e6]">
                        <h4 className="font-semibold text-[#1b140a] mb-3 flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Accommodation
                        </h4>
                        <div className="flex gap-4 p-4 bg-white rounded-lg border border-[#eadfcd]">
                          {dayAccommodation.image_url && (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={dayAccommodation.image_url}
                                alt={dayAccommodation.hotel_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-[#1b140a] mb-1">
                                  {dayAccommodation.hotel_name}
                                </h5>
                                <div className="flex items-center gap-1 mb-1">
                                  {Array.from({ length: dayAccommodation.star_rating }).map(
                                    (_, i) => (
                                      <Star
                                        key={i}
                                        className="w-3 h-3 fill-[#9c7c46] text-[#9c7c46]"
                                      />
                                    )
                                  )}
                                </div>
                                {dayAccommodation.room_type && (
                                  <p className="text-sm text-[#6f5b3e]">
                                    {dayAccommodation.room_type}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-[#9c7c46]">
                                  ${dayAccommodation.price_per_night.toFixed(2)}
                                </div>
                                <div className="text-xs text-[#bda87f]">per night</div>
                              </div>
                            </div>
                            {dayAccommodation.amenities && dayAccommodation.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {dayAccommodation.amenities.map((amenity, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-[#f8f1e6] text-xs text-[#6f5b3e] rounded"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-2xl border border-[#eadfcd] p-8 sticky bottom-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#1b140a] mb-1">Total Price</h3>
              <p className="text-sm text-[#6f5b3e]">
                Based on your selected options and itinerary
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-[#9c7c46]">
                ${displayedPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <ProposalCommentsSection
          commentEmail={commentEmail}
          commentName={commentName}
          commentText={commentText}
          comments={comments}
          onCommentEmailChange={setCommentEmail}
          onCommentNameChange={setCommentName}
          onCommentTextChange={setCommentText}
          onSubmitComment={submitComment}
          submittingComment={submittingComment}
        />

        {/* Approval Actions */}
        {proposal.status !== 'approved' && (
          <ProposalApprovalSection
            approvalEmail={approvalEmail}
            approvalName={approvalName}
            onApprovalEmailChange={setApprovalEmail}
            onApprovalNameChange={setApprovalName}
            onApprove={approveProposal}
            submittingApproval={submittingApproval}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#eadfcd] bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[#bda87f]">
          <p>Powered by TripBuilt • Interactive Proposal System</p>
        </div>
      </div>
    </div>
  );
}
