import {
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { formatDateTime, type FirstValuePayload } from './types';

interface FirstValueSprintStepProps {
  firstValue: FirstValuePayload | null;
  firstValueLoading: boolean;
  firstValueRefreshing: boolean;
  shareLinkCopied: boolean;
  onRefresh: () => void;
  onCopyShareLink: () => void;
}

export function FirstValueSprintStep({
  firstValue,
  firstValueLoading,
  firstValueRefreshing,
  shareLinkCopied,
  onRefresh,
  onCopyShareLink,
}: FirstValueSprintStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9c7c46]">10-minute first value</p>
            <h3 className="mt-1 text-lg font-semibold text-[#1b140a]">Reach first client share quickly</h3>
            <p className="mt-1 text-sm text-[#6f5b3e]">
              Complete all milestones to validate activation: setup, itinerary creation, and first share.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6f5b3e]">Progress</p>
            <p className="text-2xl font-semibold text-[#1b140a]">{firstValue?.completion_pct ?? 0}%</p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#f1e6d5]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#9c7c46] to-[#c89d54] transition-all duration-300"
            style={{ width: `${firstValue?.completion_pct ?? 0}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
          <div className="rounded-lg border border-[#eadfcd] bg-white px-3 py-2">
            <p className="text-[#6f5b3e]">Itineraries created</p>
            <p className="mt-1 font-semibold text-[#1b140a]">{firstValue?.itinerary_count ?? 0}</p>
          </div>
          <div className="rounded-lg border border-[#eadfcd] bg-white px-3 py-2">
            <p className="text-[#6f5b3e]">Shared itineraries</p>
            <p className="mt-1 font-semibold text-[#1b140a]">{firstValue?.shared_itinerary_count ?? 0}</p>
          </div>
          <div className="rounded-lg border border-[#eadfcd] bg-white px-3 py-2">
            <p className="text-[#6f5b3e]">Milestones complete</p>
            <p className="mt-1 font-semibold text-[#1b140a]">
              {firstValue?.completed_milestones ?? 0}/{firstValue?.total_milestones ?? 3}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {(firstValue?.milestones || []).map((milestone) => (
          <div
            key={milestone.id}
            className={`rounded-xl border p-4 ${
              milestone.completed ? 'border-green-200 bg-green-50' : 'border-[#eadfcd] bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                  milestone.completed
                    ? 'border-green-200 bg-green-100 text-green-700'
                    : 'border-[#eadfcd] bg-[#fcf8f1] text-[#9c7c46]'
                }`}
              >
                {milestone.completed ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1b140a]">{milestone.title}</p>
                  <span className="text-[11px] text-[#6f5b3e]">Target: {milestone.target_minute} min</span>
                </div>
                <p className="mt-1 text-sm text-[#6f5b3e]">{milestone.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <a
          href="/planner"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dcc9aa] px-4 py-2.5 text-[#6f5b3e] hover:bg-[#f8f1e6]"
        >
          Open Planner
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href="/trips"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dcc9aa] px-4 py-2.5 text-[#6f5b3e] hover:bg-[#f8f1e6]"
        >
          Open Trips
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2 text-[#6f5b3e] hover:bg-[#f8f1e6]"
          disabled={firstValueRefreshing || firstValueLoading}
        >
          {firstValueRefreshing || firstValueLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh milestones
        </button>

        {firstValue?.latest_share_url ? (
          <button
            type="button"
            onClick={onCopyShareLink}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2 text-[#6f5b3e] hover:bg-[#f8f1e6]"
          >
            {shareLinkCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {shareLinkCopied ? 'Copied share link' : 'Copy latest share link'}
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-[#eadfcd] p-4 text-sm text-[#6f5b3e]">
        <p>
          <span className="font-medium text-[#1b140a]">First itinerary:</span>{' '}
          {formatDateTime(firstValue?.first_itinerary_created_at || null)}
        </p>
        <p className="mt-1">
          <span className="font-medium text-[#1b140a]">First share:</span>{' '}
          {formatDateTime(firstValue?.first_shared_at || null)}
        </p>
        {firstValueLoading ? (
          <p className="mt-2 text-xs text-[#9c7c46]">Checking latest milestone activity...</p>
        ) : null}
      </div>
    </div>
  );
}
