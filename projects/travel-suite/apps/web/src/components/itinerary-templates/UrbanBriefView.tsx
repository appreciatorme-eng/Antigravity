import React from 'react';
import Image from 'next/image';
import { Clock, DollarSign, Mail, MapPin, Phone, Plane } from 'lucide-react';
import { resolveHotelForDay } from '@/lib/itinerary/tracking';
import type { Activity, Day } from '@/types/itinerary';
import type { ItineraryTemplateProps } from './types';

const safeBrandName = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'tripbuilt') return 'Your Travel Company';
  return trimmed;
};

const getActivityImage = (activity?: Activity | null) => activity?.image || activity?.imageUrl || null;

const getHeroImage = (days: Day[] = []) => {
  for (const day of days) {
    const activityWithImage = day.activities?.find((activity) => getActivityImage(activity));
    const image = getActivityImage(activityWithImage);
    if (image) return image;
  }
  return null;
};

const formatDisplayDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getPrimaryLocation = (day: Day, fallback: string) =>
  day.activities?.find((activity) => activity.location)?.location || fallback;

export const UrbanBriefView: React.FC<ItineraryTemplateProps> = ({
  itinerary,
  organizationBranding,
  organizationName,
  client,
}) => {
  const brandColor = organizationBranding?.primaryColor || itinerary.branding?.primaryColor || '#124ea2';
  const orgName = safeBrandName(
    organizationBranding?.name || itinerary.branding?.organizationName || organizationName,
  );
  const logoUrl = organizationBranding?.logoUrl || itinerary.branding?.logoUrl || null;
  const orgLocation = [organizationBranding?.city, organizationBranding?.state].filter(Boolean).join(', ');
  const contactItems = [
    organizationBranding?.email ? { icon: Mail, label: organizationBranding.email } : null,
    organizationBranding?.phone ? { icon: Phone, label: organizationBranding.phone } : null,
  ].filter((item): item is { icon: typeof Mail; label: string } => Boolean(item));

  const totalDays = itinerary.days?.length || 0;
  const totalActivities = itinerary.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;
  const flightsCount = itinerary.logistics?.flights?.length || 0;
  const staysCount = itinerary.logistics?.hotels?.length || 0;
  const heroImage = getHeroImage(itinerary.days);
  const dateWindow = [
    formatDisplayDate(itinerary.start_date),
    formatDisplayDate(itinerary.end_date),
  ].filter(Boolean).join(' - ') || 'Dates to confirm';

  return (
    <article className="mx-auto max-w-6xl overflow-hidden bg-[#f7f5f0] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="h-1.5 w-full" style={{ backgroundColor: brandColor }} />
        <div className="flex flex-col gap-5 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={orgName}
                width={150}
                height={48}
                className="h-10 w-auto max-w-[150px] object-contain"
                unoptimized
              />
            ) : null}
            <div className={logoUrl ? 'border-l border-slate-200 pl-4' : ''}>
              <div className="text-xl font-semibold tracking-tight" style={{ color: brandColor }}>
                {orgName}
              </div>
              {orgLocation ? (
                <div className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {orgLocation}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500 md:justify-end">
            {contactItems.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" style={{ color: brandColor }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        {client ? (
          <div className="border-t border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] md:px-8" style={{ color: brandColor }}>
            Prepared for {client.name}
          </div>
        ) : null}
      </header>

      <section className="grid gap-0 bg-white lg:grid-cols-[1.05fr_0.95fr]">
        <div className="px-5 py-8 md:px-8 md:py-10">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span style={{ color: brandColor }}>Urban brief</span>
            <span className="h-px w-8 bg-slate-300" />
            <span>{dateWindow}</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-[-0.055em] text-slate-950 md:text-6xl">
            {itinerary.trip_title || itinerary.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            {itinerary.summary || itinerary.description}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Duration', `${totalDays} days`],
              ['Activities', `${totalActivities} stops`],
              ['Destination', itinerary.destination],
              ['Logistics', `${flightsCount} flights / ${staysCount} stays`],
            ].map(([label, value]) => (
              <div key={label} className="border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
                <div className="mt-2 truncate text-base font-bold text-slate-950">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-h-[340px] bg-slate-900">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt={itinerary.destination} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#111827_0%,#334155_100%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
            <div className="mb-3 inline-flex items-center gap-2 border border-white/20 bg-black/25 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
              <MapPin className="h-3.5 w-3.5" />
              {itinerary.destination}
            </div>
            <div className="max-w-md text-sm leading-6 text-white/80">
              A client-ready city dossier with route, timing, logistics, and daily notes in one compact handoff.
            </div>
          </div>
        </div>
      </section>

      {(flightsCount > 0 || staysCount > 0) ? (
        <section className="grid gap-4 border-y border-slate-200 bg-slate-950 px-5 py-5 text-white md:grid-cols-2 md:px-8">
          {flightsCount > 0 ? (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Plane className="h-4 w-4" style={{ color: brandColor }} />
                Air travel
              </div>
              <div className="grid gap-2">
                {itinerary.logistics?.flights?.slice(0, 2).map((flight) => (
                  <div key={flight.id} className="border border-white/10 bg-white/[0.04] p-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <strong>{flight.airline}</strong>
                      <span className="text-white/50">{flight.flight_number}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4 text-white/70">
                      <span>{flight.departure_airport} {flight.departure_time}</span>
                      <span>{flight.arrival_airport} {flight.arrival_time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {staysCount > 0 ? (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4" style={{ color: brandColor }} />
                Stays
              </div>
              <div className="grid gap-2">
                {itinerary.logistics?.hotels?.slice(0, 2).map((hotel) => (
                  <div key={hotel.id} className="border border-white/10 bg-white/[0.04] p-3 text-sm">
                    <strong>{hotel.name}</strong>
                    <div className="mt-1 text-white/60">{hotel.address}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.14em] text-white/45">
                      {hotel.check_in} - {hotel.check_out}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="px-5 py-8 md:px-8 md:py-10">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-300 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: brandColor }}>
              Daily schedule
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Route sequence</h2>
          </div>
          <div className="hidden text-right text-xs font-medium text-slate-500 md:block">
            {totalDays} day chapters / {totalActivities} planned stops
          </div>
        </div>

        <div className="grid gap-5">
          {itinerary.days?.map((day, dayIndex) => (
            <section key={day.day_number} className="overflow-hidden border border-slate-200 bg-white">
              <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[auto_1fr_auto] md:items-center md:px-5">
                <div className="flex h-12 w-12 items-center justify-center text-lg font-black text-white" style={{ backgroundColor: brandColor }}>
                  {day.day_number || day.day}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {formatDisplayDate(day.date) || getPrimaryLocation(day, itinerary.destination)}
                  </div>
                  <h3 className="mt-1 text-xl font-black tracking-[-0.035em] text-slate-950">
                    {day.theme || day.title || `Day ${day.day_number}`}
                  </h3>
                  {day.summary ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{day.summary}</p> : null}
                </div>
                <div className="text-sm font-semibold text-slate-500">{day.activities?.length || 0} stops</div>
              </div>

              {(() => {
                const hotel = resolveHotelForDay(itinerary, day, dayIndex);
                if (!hotel) return null;

                return (
                  <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-4 md:px-5">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: brandColor }}>
                      Stay tonight
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <div className="text-base font-bold text-slate-950">{hotel.name}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">{hotel.address}</div>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {hotel.check_in} - {hotel.check_out}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="divide-y divide-slate-100">
                {day.activities?.map((activity, activityIndex) => {
                  const image = getActivityImage(activity);
                  return (
                    <div key={`${day.day_number}-${activityIndex}`} className="grid gap-3 px-4 py-4 md:grid-cols-[56px_1fr_auto] md:px-5">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={activity.title || activity.name || 'Activity'} className="h-14 w-14 object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center bg-slate-100">
                          <MapPin className="h-5 w-5" style={{ color: brandColor }} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                          {activity.time ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.time}
                            </span>
                          ) : null}
                          {activity.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </span>
                          ) : null}
                        </div>
                        <h4 className="mt-1 text-base font-bold text-slate-950">{activity.title || activity.name}</h4>
                        {activity.description ? (
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{activity.description}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 md:max-w-[170px] md:justify-end">
                        {activity.duration ? <span className="border border-slate-200 px-2 py-1">{activity.duration}</span> : null}
                        {activity.cost ? (
                          <span className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1">
                            <DollarSign className="h-3 w-3" />
                            {activity.cost}
                          </span>
                        ) : null}
                        {activity.transport ? <span className="border border-slate-200 px-2 py-1">{activity.transport}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      {itinerary.tips?.length || itinerary.inclusions?.length ? (
        <section className="border-t border-slate-200 bg-white px-5 py-8 md:px-8">
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: brandColor }}>
                Client handoff
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Key information</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[...(itinerary.tips || []), ...(itinerary.inclusions || [])].slice(0, 6).map((item, index) => (
                <div key={`${item}-${index}`} className="border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 text-xs font-black" style={{ color: brandColor }}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-5 text-xs text-slate-500 md:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>{orgName} / {itinerary.destination}</span>
          <span>Powered by TripBuilt</span>
        </div>
      </footer>
    </article>
  );
};
