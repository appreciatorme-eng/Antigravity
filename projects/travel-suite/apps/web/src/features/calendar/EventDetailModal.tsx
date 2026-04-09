"use client";

import { GlassModal } from "@/components/glass/GlassModal";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { EVENT_TYPE_CONFIG } from "./constants";
import { formatDateRange, getStatusVariant } from "./utils";
import { useCalendarActions } from "./useCalendarActions";
import { TripEventDetail } from "./details/TripEventDetail";
import { InvoiceEventDetail } from "./details/InvoiceEventDetail";
import { ProposalEventDetail } from "./details/ProposalEventDetail";
import { HolidayEventDetail } from "./details/HolidayEventDetail";
import { PaymentEventDetail } from "./details/PaymentEventDetail";
import { FollowUpEventDetail } from "./details/FollowUpEventDetail";
import { SocialPostEventDetail } from "./details/SocialPostEventDetail";
import { ConciergeEventDetail } from "./details/ConciergeEventDetail";
import { PersonalEventDetail } from "./details/PersonalEventDetail";
import type { CalendarEvent } from "./types";

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const actions = useCalendarActions();
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;

  function renderDetail() {
    switch (event.entityData.type) {
      case "trip":
        return (
          <TripEventDetail
            data={event.entityData}
            event={event}
            actions={actions}
            onClose={onClose}
          />
        );
      case "invoice":
        return (
          <InvoiceEventDetail
            data={event.entityData}
            event={event}
            actions={actions}
            onClose={onClose}
          />
        );
      case "proposal":
        return (
          <ProposalEventDetail
            data={event.entityData}
            event={event}
            actions={actions}
            onClose={onClose}
          />
        );
      case "holiday":
        return <HolidayEventDetail data={event.entityData} event={event} />;
      case "payment":
        return (
          <PaymentEventDetail data={event.entityData} event={event} />
        );
      case "follow_up":
        return (
          <FollowUpEventDetail data={event.entityData} event={event} />
        );
      case "social_post":
        return (
          <SocialPostEventDetail data={event.entityData} event={event} />
        );
      case "concierge":
        return (
          <ConciergeEventDetail
            data={event.entityData}
            event={event}
            actions={actions}
            onClose={onClose}
          />
        );
      case "personal":
        return (
          <PersonalEventDetail
            data={event.entityData}
            event={event}
            actions={actions}
            onClose={onClose}
          />
        );
    }
  }

  return (
    <GlassModal isOpen={true} onClose={onClose} size="lg">
      {/* Custom header inside modal */}
      <div className="flex items-start gap-3 mb-6">
        <div className={`p-3 rounded-xl ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-serif text-slate-900">{event.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{event.subtitle}</p>
          <div className="flex items-center gap-2 mt-2">
            <GlassBadge
              variant={getStatusVariant(event.status)}
              className="text-[10px]"
            >
              {event.status}
            </GlassBadge>
            <span className="text-xs text-slate-400">
              {formatDateRange(event.startDate, event.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Entity-specific detail */}
      {renderDetail()}

      {/* Footer with View Details link */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
        {event.type !== "personal" && event.type !== "holiday" && (
          <GlassButton
            variant="primary"
            size="sm"
            onClick={() => {
              window.location.href = event.href;
            }}
          >
            View Full Details
          </GlassButton>
        )}
        {event.drillHref && (
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.href = event.drillHref!;
            }}
          >
            Analytics Drill-Through
          </GlassButton>
        )}
      </div>
    </GlassModal>
  );
}
