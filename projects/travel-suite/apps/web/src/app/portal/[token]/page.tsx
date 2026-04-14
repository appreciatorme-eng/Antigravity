'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Users,
} from 'lucide-react';
import PortalItinerary, { type ItineraryDay } from '@/components/portal/PortalItinerary';
import { PortalInstallPrompt } from '@/components/portal/PortalInstallPrompt';
import PortalPayment from '@/components/portal/PortalPayment';
import PortalReview from '@/components/portal/PortalReview';
import type { PaymentLinkData } from '@/lib/payments/payment-links';
import { logError } from '@/lib/observability/logger';

interface PortalPayload {
  proposal: {
    id: string;
    token: string;
    title: string;
    status: string;
    approvedAt: string | null;
    totalAmount: number;
    destination: string | null;
    durationDays: number | null;
    description: string | null;
    heroImageUrl: string | null;
  };
  client: {
    name: string;
    firstName: string;
    phone: string | null;
    travelersCount: number | null;
  };
  operator: {
    name: string;
    phone: string | null;
  };
  trip: {
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
  };
  driver: {
    name: string;
    phone: string | null;
    phoneDisplay: string | null;
    vehicle: string | null;
    plate: string | null;
  } | null;
  itinerary: ItineraryDay[];
  payment: {
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paymentLink: PaymentLinkData | null;
  };
  review: {
    enabled: boolean;
    googleReviewLink: string | null;
  };
}

function formatDisplayDate(dateIso: string | null, fallbackText: string) {
  if (!dateIso) return fallbackText;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateIso));
}

export default function PortalPage() {
  const t = useTranslations('portal');
  const params = useParams();
  const token = params.token as string;
  const [portal, setPortal] = useState<PortalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPortal = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorStatus(null);

        const response = await fetch(`/api/portal/${token}`, {
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as
          | { data?: PortalPayload; error?: string }
          | null;

        if (!response.ok || !payload?.data) {
          if (!isMounted) return;
          setError(payload?.error || t('errors.loadFailed'));
          setErrorStatus(response.status);
          setPortal(null);
          return;
        }

        if (isMounted) {
          setPortal(payload.data);
        }
      } catch (loadError) {
        logError('[portal] Failed to load portal data', loadError);
        if (isMounted) {
          setError(t('errors.loadFailed'));
          setErrorStatus(500);
          setPortal(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPortal();

    return () => {
      isMounted = false;
    };
  }, [token, t]);

  async function handleReviewSubmit(rating: number, comment: string) {
    if (!portal) return;

    try {
      await fetch('/api/social/reviews/public', {
        // eslint-disable-next-line no-restricted-syntax -- pre-auth route, no Bearer token available
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          rating,
          comment,
          trip_name: portal.trip.name,
          destination: portal.proposal.destination,
          reviewer_name: portal.client.name,
        }),
      });
    } catch (reviewError) {
      logError('[portal] Failed to submit review', reviewError);
    }
  }

  function handleWhatsAppDriver() {
    if (!portal?.driver?.phone) return;

    const msg = encodeURIComponent(
      t('driver.whatsappMessage', {
        driverName: portal.driver.name,
        clientName: portal.client.name,
        tripName: portal.trip.name,
      }),
    );
    const digits = portal.driver.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');
  }

  function handleShareLocation() {
    if (!portal?.driver?.phone) return;

    const msg = encodeURIComponent(
      t('shareLocation.message', {
        driverName: portal.driver.name,
        tripName: portal.trip.name,
      }),
    );
    const digits = portal.driver.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-10 text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !portal) {
    const title =
      errorStatus === 404
        ? t('errors.notFound.title')
        : errorStatus === 410
          ? t('errors.expired.title')
          : t('errors.unavailable.title');
    const description =
      errorStatus === 404
        ? t('errors.notFound.description')
        : errorStatus === 410
          ? t('errors.expired.description')
          : error || t('errors.unavailable.description');

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl border border-red-200 bg-white shadow-sm p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            {description}
          </p>
        </div>
      </div>
    );
  }

  const tripEnded =
    Boolean(portal.trip.endDate) && new Date(portal.trip.endDate as string) < new Date();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white relative overflow-hidden">
        {portal.proposal.heroImageUrl && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={portal.proposal.heroImageUrl}
              alt={portal.proposal.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative px-6 py-8">
          <p className="text-emerald-100 text-sm font-medium mb-1">{t('hero.yourTripPortal')}</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            {t('hero.welcome', { firstName: portal.client.firstName })}
          </h1>
          <p className="text-emerald-100 text-base mt-2 font-medium">{portal.trip.name}</p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDisplayDate(portal.trip.startDate, t('dates.toBeConfirmed'))}
                {portal.trip.endDate ? ` – ${formatDisplayDate(portal.trip.endDate, t('dates.toBeConfirmed'))}` : ''}
              </span>
            </div>
            {portal.proposal.destination && (
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{portal.proposal.destination}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-emerald-200 mb-1">{t('hero.needHelp')}</p>
            {portal.operator.phone ? (
              <a
                href={`tel:${portal.operator.phone}`}
                className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm rounded-xl px-4 py-2 hover:bg-emerald-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {t('hero.call', { operatorName: portal.operator.name })}
              </a>
            ) : (
              <p className="text-sm font-semibold text-white">{portal.operator.name}</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">{t('tripSummary.title')}</h2>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 rounded-full px-3 py-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {portal.proposal.status}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('tripSummary.destination'), value: portal.proposal.destination || t('tripSummary.toBeConfirmed'), icon: MapPin },
              {
                label: t('tripSummary.duration'),
                value: portal.proposal.durationDays
                  ? t('tripSummary.days', { days: portal.proposal.durationDays })
                  : t('tripSummary.days', { days: portal.itinerary.length }),
                icon: Calendar,
              },
              {
                label: t('tripSummary.travellers'),
                value: portal.client.travelersCount
                  ? t('tripSummary.travellersCount', { count: portal.client.travelersCount })
                  : t('tripSummary.travellersPending'),
                icon: Users,
              },
              { label: t('tripSummary.tripStarts'), value: formatDisplayDate(portal.trip.startDate, t('dates.toBeConfirmed')), icon: Calendar },
              {
                label: t('tripSummary.paymentStatus'),
                value: portal.payment.paymentLink
                  ? portal.payment.paymentLink.status.replace('_', ' ')
                  : portal.payment.dueAmount > 0
                    ? t('tripSummary.awaitingLink')
                    : t('tripSummary.paid'),
                icon: CheckCircle,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700">{item.value}</p>
              </div>
            ))}
          </div>

          {portal.proposal.description && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed">{portal.proposal.description}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{t('itinerary.title')}</h2>
        <PortalItinerary days={portal.itinerary} />
      </section>

      {portal.driver && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t('driver.title')}</h2>
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Car className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">{portal.driver.name}</p>
                <p className="text-sm text-gray-500">
                  {portal.driver.phoneDisplay || t('driver.phoneWillBeShared')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {t('driver.vehicle')}
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {portal.driver.vehicle || t('driver.vehicleToBeConfirmed')}
                </p>
                {portal.driver.plate && (
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{portal.driver.plate}</p>
                )}
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                  {t('driver.contact')}
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {portal.driver.phoneDisplay || t('driver.sharedInWhatsApp')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{t('driver.reachOutBeforePickup')}</p>
              </div>
            </div>

            <div className="flex gap-3">
              {portal.driver.phone && (
                <a
                  href={`tel:${portal.driver.phone.replace(/\s/g, '')}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-500" />
                  {t('driver.callDriver')}
                </a>
              )}
              {portal.driver.phone && (
                <button
                  type="button"
                  onClick={handleWhatsAppDriver}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5a] transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('driver.whatsappDriver')}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{t('payment.title')}</h2>
        <PortalPayment
          totalAmount={portal.payment.totalAmount}
          paidAmount={portal.payment.paidAmount}
          dueAmount={portal.payment.dueAmount}
          tripName={portal.trip.name}
          paymentLink={portal.payment.paymentLink}
          operatorName={portal.operator.name}
          operatorPhone={portal.operator.phone}
        />
      </section>

      {portal.driver?.phone && (
        <section>
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Navigation className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-800 mb-0.5">{t('shareLocation.title')}</h2>
                <p className="text-xs text-gray-500 mb-4">
                  {t('shareLocation.description')}
                </p>
                <button
                  type="button"
                  onClick={handleShareLocation}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
                >
                  <Navigation className="w-4 h-4" />
                  {t('shareLocation.button')}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {portal.review.enabled && tripEnded && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t('review.title')}</h2>
          <PortalReview
            tripName={portal.trip.name}
            operatorName={portal.operator.name}
            googleReviewLink={portal.review.googleReviewLink || 'https://www.google.com/'}
            onSubmit={handleReviewSubmit}
          />
        </section>
      )}

      <div className="h-4" />
      <PortalInstallPrompt />
    </div>
  );
}
