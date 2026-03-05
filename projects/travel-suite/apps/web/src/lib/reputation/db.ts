// Typed Supabase accessor for reputation tables not yet in generated database.types.ts.
// Consolidates all (supabase as any) casts to a single ESLint-disabled site.
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ReputationReview,
  ReputationBrandVoice,
  ReputationReviewCampaign,
  ReputationCampaignSend,
  ReputationWidget,
  ReputationSnapshot,
} from "./types";

interface ReputationPlatformConnection {
  id: string;
  organization_id: string;
  platform: string;
  is_active: boolean;
  access_token_encrypted?: string | null;
  refresh_token_encrypted?: string | null;
  external_account_id?: string | null;
  external_account_name?: string | null;
  fetch_since?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

type TableMap = {
  reputation_reviews: ReputationReview;
  reputation_brand_voice: ReputationBrandVoice;
  reputation_review_campaigns: ReputationReviewCampaign;
  reputation_campaign_sends: ReputationCampaignSend;
  reputation_widgets: ReputationWidget;
  reputation_analytics_snapshots: ReputationSnapshot;
  reputation_connections: ReputationPlatformConnection;
};

// Single cast point — all reputation table access goes through this helper.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawDb = (supabase: SupabaseClient): any => supabase;

export function repFrom<T extends keyof TableMap>(
  supabase: SupabaseClient,
  table: T
): ReturnType<typeof supabase.from> {
  return rawDb(supabase).from(table);
}
