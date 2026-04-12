type PipelineProposalLike = {
  id: string;
  title?: string | null;
  status?: string | null;
  client_id?: string | null;
  trip_id?: string | null;
  total_price?: number | null;
  client_selected_price?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  trips?:
    | {
        id?: string | null;
      }
    | {
        id?: string | null;
      }[]
    | null;
};

const OPEN_PIPELINE_STATUSES = new Set(["draft", "sent", "viewed"]);

function normalizeStatus(input: string | null | undefined): string {
  return (input || "").trim().toLowerCase();
}

function getProposalValue(row: PipelineProposalLike): number {
  return Number(row.client_selected_price ?? row.total_price ?? 0);
}

function getTripRelationId(
  trips: PipelineProposalLike["trips"],
): string | null {
  if (!trips) return null;
  if (Array.isArray(trips)) {
    return trips[0]?.id ?? null;
  }
  return trips.id ?? null;
}

function getProposalTimestamp(row: PipelineProposalLike): number {
  const value = row.updated_at || row.created_at || null;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function buildDuplicateKey(row: PipelineProposalLike): string | null {
  const title = (row.title || "").trim().toLowerCase();
  const clientId = row.client_id || "";
  if (!title || !clientId) return null;
  return `${clientId}::${title}::${getProposalValue(row)}`;
}

export function isOpenPipelineProposalStatus(status: string | null | undefined): boolean {
  return OPEN_PIPELINE_STATUSES.has(normalizeStatus(status));
}

export function hasLiveLinkedTrip(row: PipelineProposalLike): boolean {
  if (!row.trip_id) return true;
  return Boolean(getTripRelationId(row.trips));
}

export function filterCanonicalPipelineProposals<T extends PipelineProposalLike>(
  rows: T[],
): T[] {
  const dedupeKeepers = new Map<string, T>();

  for (const row of rows) {
    if (!hasLiveLinkedTrip(row)) continue;

    if (!row.trip_id && isOpenPipelineProposalStatus(row.status)) {
      const duplicateKey = buildDuplicateKey(row);
      if (!duplicateKey) {
        dedupeKeepers.set(`__row__:${row.id}`, row);
        continue;
      }

      const current = dedupeKeepers.get(duplicateKey);
      if (!current || getProposalTimestamp(row) > getProposalTimestamp(current)) {
        dedupeKeepers.set(duplicateKey, row);
      }
      continue;
    }

    dedupeKeepers.set(`__row__:${row.id}`, row);
  }

  const keeperIds = new Set(Array.from(dedupeKeepers.values()).map((row) => row.id));
  return rows.filter((row) => keeperIds.has(row.id));
}

export function findRepairablePipelineProposalIds<T extends PipelineProposalLike>(
  rows: T[],
): string[] {
  const ids = new Set<string>();
  const dedupeKeepers = new Map<string, T>();

  for (const row of rows) {
    if (!hasLiveLinkedTrip(row)) {
      ids.add(row.id);
      continue;
    }

    if (!row.trip_id && isOpenPipelineProposalStatus(row.status)) {
      const duplicateKey = buildDuplicateKey(row);
      if (!duplicateKey) continue;

      const current = dedupeKeepers.get(duplicateKey);
      if (!current) {
        dedupeKeepers.set(duplicateKey, row);
        continue;
      }

      if (getProposalTimestamp(row) > getProposalTimestamp(current)) {
        ids.add(current.id);
        dedupeKeepers.set(duplicateKey, row);
      } else {
        ids.add(row.id);
      }
    }
  }

  return Array.from(ids);
}
