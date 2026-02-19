'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Home,
  MessageCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';

interface Proposal {
  id: string;
  title: string;
  total_price: number;
  client_selected_price?: number | null;
  status: string;
  expires_at: string | null;
  // Joined data
  template_name?: string;
  destination?: string;
  duration_days?: number;
  description?: string;
  hero_image_url?: string;
}

interface ProposalAddOn {
  id: string;
  proposal_id: string;
  add_on_id: string | null;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  is_selected: boolean;
}

interface ProposalDay {
  id: string;
  proposal_id: string;
  day_number: number;
  title: string | null;
  description: string | null;
  is_approved: boolean;
}

interface ProposalActivity {
  id: string;
  proposal_day_id: string;
  time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  price: number;
  is_optional: boolean;
  is_premium: boolean;
  is_selected: boolean;
  display_order: number;
}

interface ProposalAccommodation {
  id: string;
  proposal_day_id: string;
  hotel_name: string;
  star_rating: number;
  room_type: string | null;
  price_per_night: number;
  amenities: string[] | null;
  image_url: string | null;
}

interface ProposalComment {
  id: string;
  proposal_day_id: string | null;
  author_name: string;
  comment: string;
  created_at: string;
}

interface PublicProposalPayload {
  proposal: Proposal;
  days: ProposalDay[];
  activitiesByDay: Record<string, ProposalActivity[]>;
  accommodationsByDay: Record<string, ProposalAccommodation>;
  comments: ProposalComment[];
  addOns: ProposalAddOn[];
}

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

  useEffect(() => {
    void loadProposal();
  }, [shareToken]);

  async function loadProposal() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals/public/${shareToken}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as PublicProposalPayload | { error: string };

      if (!response.ok || !('proposal' in payload)) {
        setError('error' in payload ? payload.error : 'Proposal not found or link has expired');
        return;
      }

      const bundle = payload as PublicProposalPayload;
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
  }

  async function performPublicAction(body: Record<string, unknown>) {
    const response = await fetch(`/api/proposals/public/${shareToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as { error?: string; client_selected_price?: number; status?: string };
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

    if (payload.status) {
      setProposal((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status,
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
      alert('Please enter your name and comment');
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
      alert('Comment submitted successfully!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('An error occurred');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function approveProposal() {
    if (!proposal) return;

    const clientName = prompt('Please enter your name to approve this proposal:');
    if (!clientName) return;

    try {
      await performPublicAction({
        action: 'approve',
        approvedBy: clientName,
      });
      await loadProposal();
      setProposal((prev) => (prev ? { ...prev, status: 'approved' } : null));
      alert('✅ Proposal approved! The tour operator will be notified.');
    } catch (error) {
      console.error('Error approving proposal:', error);
      alert('Failed to approve proposal');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5efe6]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9c7c46] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading your proposal...</div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5efe6] p-4">
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
                  onClick={() => toggleDay(day.id)}
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
                  <div className="border-t border-[#eadfcd]">
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

        {/* Comment Section */}
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
                  onChange={(e) => setCommentName(e.target.value)}
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
                  onChange={(e) => setCommentEmail(e.target.value)}
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
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                placeholder="Ask a question or leave a comment..."
                className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
              />
            </div>

            <button
              onClick={submitComment}
              disabled={submittingComment}
              className="px-6 py-3 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors disabled:opacity-50"
            >
              {submittingComment ? 'Submitting...' : 'Submit Comment'}
            </button>
          </div>

          {/* Previous Comments */}
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

        {/* Approve Button */}
        {proposal.status !== 'approved' && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 p-8 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Love This Itinerary?
            </h3>
            <p className="text-gray-600 mb-6">
              Approve this proposal to confirm your booking and move forward!
            </p>
            <button
              onClick={approveProposal}
              className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              ✅ Approve This Proposal
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#eadfcd] bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[#bda87f]">
          <p>Powered by Travel Suite • Interactive Proposal System</p>
        </div>
      </div>
    </div>
  );
}
