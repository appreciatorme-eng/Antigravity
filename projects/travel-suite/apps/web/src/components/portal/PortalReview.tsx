'use client';

import { useState } from 'react';
import { Star, ExternalLink, Share2, CheckCircle } from 'lucide-react';

interface PortalReviewProps {
  tripName: string;
  operatorName: string;
  googleReviewLink: string;
  onSubmit: (rating: number, comment: string) => void;
}

export default function PortalReview({
  tripName,
  operatorName,
  googleReviewLink,
  onSubmit,
}: PortalReviewProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://touros.in'}/refer?trip=${encodeURIComponent(tripName)}`;

  function handleSubmit() {
    if (rating === 0) return;
    onSubmit(rating, comment);
    setSubmitted(true);
  }

  function handleShare() {
    const text = `I just had an amazing trip: *${tripName}* with ${operatorName}! Book yours: ${referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    setShareMessage('Link opened in WhatsApp!');
    setTimeout(() => setShareMessage(null), 3000);
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(referralLink).then(() => {
      setShareMessage('Link copied!');
      setTimeout(() => setShareMessage(null), 3000);
    });
  }

  const displayStars = hovered || rating;

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Shukriya! 🙏</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Your feedback helps us improve and serve our guests better.
          </p>

          <div className="flex items-center gap-1 mt-4 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={[
                  'w-6 h-6',
                  s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Google review shortcut */}
          <a
            href={googleReviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#4285f4] rounded-xl px-4 py-2.5 hover:bg-[#3367d6] transition-colors mb-4"
          >
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            Also review us on Google
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>

          {/* Referral */}
          <div className="w-full rounded-xl bg-gray-50 border border-gray-200 p-4 mt-2">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Know someone who'd love this trip?
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-500 overflow-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 text-xs font-semibold text-white bg-emerald-500 rounded-lg px-3 py-2 hover:bg-emerald-600 transition-colors"
              >
                Copy
              </button>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-[#25D366] rounded-lg py-2 hover:bg-[#1ebe5a] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share on WhatsApp
            </button>
            {shareMessage && (
              <p className="text-center text-xs text-emerald-600 mt-2 font-medium">
                {shareMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-800">Rate Your Trip</h3>
        <p className="text-xs text-gray-400 mt-0.5">{tripName}</p>
      </div>

      <div className="px-5 py-5 space-y-5">
        <p className="text-sm text-gray-600 text-center font-medium">
          How was your experience? 😊
        </p>

        {/* Star rating */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 active:scale-95"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={[
                  'w-9 h-9 transition-colors duration-150',
                  star <= displayStars
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-200 hover:text-amber-200',
                ].join(' ')}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-xs font-semibold text-amber-600">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
          </p>
        )}

        {/* Comment textarea */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
            Your Experience
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your trip — the highlights, the moments, the memories..."
            rows={4}
            className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={rating === 0}
          className={[
            'w-full py-3 rounded-xl text-sm font-bold transition-all duration-200',
            rating > 0
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Submit Review
        </button>

        {/* Google review shortcut */}
        <a
          href={googleReviewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-[#4285f4] font-medium hover:underline"
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          Also review us on Google
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
