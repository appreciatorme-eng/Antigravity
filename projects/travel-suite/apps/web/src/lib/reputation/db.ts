// Typed Supabase accessor for reputation tables.
// Consolidates table access to a single site with proper Database typing.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
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

type TypedClient = SupabaseClient<Database>;
type PublicTableName = keyof Database["public"]["Tables"] & string;

// Reputation tables are now present in the generated Database types.
// This helper casts the unparameterized SupabaseClient to the Database-typed
// client so that .from() resolves table schemas correctly.
export function repFrom<T extends keyof TableMap>(
  supabase: SupabaseClient,
  table: T & PublicTableName
) {
  return (supabase as TypedClient).from(table);
}
