// Pricing feedback loop utilities — track pricing suggestion outcomes to improve AI model
// Records accepted/adjusted/dismissed actions with context for learning

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@/lib/observability/logger';

export type PricingFeedbackAction = 'accepted' | 'adjusted' | 'dismissed';

export type PricingFeedbackInput = {
  suggestionId: string;
  action: PricingFeedbackAction;
  suggestedPricePaise: number;
  finalPricePaise: number | null;
  confidenceLevel: 'high' | 'medium' | 'low' | 'ai_estimate';
  comparableTripsCount: number;
  destination: string;
  durationDays: number;
  pax: number;
  packageTier?: 'budget' | 'standard' | 'premium' | 'luxury';
  seasonMonth?: number; // 1-12
  proposalId?: string;
};

export type PricingFeedbackRecord = {
  id: string;
  organization_id: string;
  proposal_id: string | null;
  suggestion_id: string;
  action: PricingFeedbackAction;
  suggested_price_paise: number;
  final_price_paise: number | null;
  confidence_level: string;
  comparable_trips_count: number;
  destination: string;
  duration_days: number;
  pax: number;
  package_tier: string | null;
  season_month: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Record pricing feedback from user action
 * Requires authenticated user with organization context
 */
export async function recordPricingFeedback(
  input: PricingFeedbackInput,
  options: {
    supabaseClient?: SupabaseClient;
  } = {}
): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  try {
    const supabase = options.supabaseClient || createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return { success: false, error: 'No organization found' };
    }

    // Validate input
    if (input.action === 'adjusted' && input.finalPricePaise === null) {
      return { success: false, error: 'Final price required for adjusted action' };
    }

    // Insert feedback record
    const { data, error: insertError } = await supabase
      .from('pricing_feedback' as any)
      .insert({
        organization_id: profile.organization_id,
        proposal_id: input.proposalId || null,
        suggestion_id: input.suggestionId,
        action: input.action,
        suggested_price_paise: input.suggestedPricePaise,
        final_price_paise: input.finalPricePaise,
        confidence_level: input.confidenceLevel,
        comparable_trips_count: input.comparableTripsCount,
        destination: input.destination,
        duration_days: input.durationDays,
        pax: input.pax,
        package_tier: input.packageTier || null,
        season_month: input.seasonMonth || null,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      logError('[pricing/feedback-loop] Failed to insert feedback', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, feedbackId: data?.id };
  } catch (error) {
    logError('[pricing/feedback-loop] Unexpected error recording feedback', error);
    return { success: false, error: 'Failed to record feedback' };
  }
}

/**
 * Get feedback statistics for a destination
 * Useful for analyzing pricing acceptance rates
 */
export async function getFeedbackStats(
  destination: string,
  options: {
    durationDays?: number;
    packageTier?: string;
    supabaseClient?: SupabaseClient;
  } = {}
): Promise<{
  totalCount: number;
  acceptedCount: number;
  adjustedCount: number;
  dismissedCount: number;
  acceptanceRate: number;
  avgPriceAdjustmentPct?: number;
}> {
  try {
    const supabase = options.supabaseClient || (await createServerClient());

    // Build query
    let query = supabase
      .from('pricing_feedback' as any)
      .select('action, suggested_price_paise, final_price_paise')
      .ilike('destination', `%${destination}%`);

    if (options.durationDays) {
      query = query.eq('duration_days', options.durationDays);
    }

    if (options.packageTier) {
      query = query.eq('package_tier', options.packageTier);
    }

    const { data, error } = await query;

    if (error) {
      logError('[pricing/feedback-loop] Failed to fetch feedback stats', error);
      return {
        totalCount: 0,
        acceptedCount: 0,
        adjustedCount: 0,
        dismissedCount: 0,
        acceptanceRate: 0,
      };
    }

    if (!data || data.length === 0) {
      return {
        totalCount: 0,
        acceptedCount: 0,
        adjustedCount: 0,
        dismissedCount: 0,
        acceptanceRate: 0,
      };
    }

    // Calculate statistics
    const totalCount = data.length;
    const acceptedCount = data.filter((r) => r.action === 'accepted').length;
    const adjustedCount = data.filter((r) => r.action === 'adjusted').length;
    const dismissedCount = data.filter((r) => r.action === 'dismissed').length;

    const acceptanceRate = totalCount > 0
      ? Math.round((acceptedCount / totalCount) * 100)
      : 0;

    // Calculate average price adjustment for 'adjusted' actions
    const adjustedRecords = data.filter(
      (r) => r.action === 'adjusted' && r.suggested_price_paise && r.final_price_paise
    );

    let avgPriceAdjustmentPct: number | undefined;
    if (adjustedRecords.length > 0) {
      const adjustments = adjustedRecords.map((r) => {
        const suggested = r.suggested_price_paise || 0;
        const final = r.final_price_paise || 0;
        return suggested > 0 ? ((final - suggested) / suggested) * 100 : 0;
      });
      avgPriceAdjustmentPct = Math.round(
        adjustments.reduce((sum, adj) => sum + adj, 0) / adjustments.length
      );
    }

    return {
      totalCount,
      acceptedCount,
      adjustedCount,
      dismissedCount,
      acceptanceRate,
      avgPriceAdjustmentPct,
    };
  } catch (error) {
    logError('[pricing/feedback-loop] Unexpected error fetching stats', error);
    return {
      totalCount: 0,
      acceptedCount: 0,
      adjustedCount: 0,
      dismissedCount: 0,
      acceptanceRate: 0,
    };
  }
}

/**
 * Get recent feedback records for an organization
 * Useful for admin dashboards and analytics
 */
export async function getRecentFeedback(
  limit: number = 50,
  options: {
    supabaseClient?: SupabaseClient;
  } = {}
): Promise<PricingFeedbackRecord[]> {
  try {
    const supabase = options.supabaseClient || createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return [];
    }

    // Fetch recent feedback
    const { data, error } = await supabase
      .from('pricing_feedback')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logError('[pricing/feedback-loop] Failed to fetch recent feedback', error);
      return [];
    }

    return (data as PricingFeedbackRecord[]) || [];
  } catch (error) {
    logError('[pricing/feedback-loop] Unexpected error fetching recent feedback', error);
    return [];
  }
}

/**
 * Get feedback for a specific proposal
 */
export async function getProposalFeedback(
  proposalId: string,
  options: {
    supabaseClient?: SupabaseClient;
  } = {}
): Promise<PricingFeedbackRecord | null> {
  try {
    const supabase = options.supabaseClient || createClient();

    const { data, error } = await supabase
      .from('pricing_feedback')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not an error
        return null;
      }
      logError('[pricing/feedback-loop] Failed to fetch proposal feedback', error);
      return null;
    }

    return (data as PricingFeedbackRecord) || null;
  } catch (error) {
    logError('[pricing/feedback-loop] Unexpected error fetching proposal feedback', error);
    return null;
  }
}

/**
 * Calculate pricing confidence improvement over time
 * Compares recent feedback (last 30 days) vs historical
 */
export async function getPricingConfidenceImprovement(
  options: {
    supabaseClient?: SupabaseClient;
  } = {}
): Promise<{
  recentAcceptanceRate: number;
  historicalAcceptanceRate: number;
  improvement: number;
  recentSampleSize: number;
  historicalSampleSize: number;
}> {
  try {
    const supabase = options.supabaseClient || (await createServerClient());

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        recentAcceptanceRate: 0,
        historicalAcceptanceRate: 0,
        improvement: 0,
        recentSampleSize: 0,
        historicalSampleSize: 0,
      };
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return {
        recentAcceptanceRate: 0,
        historicalAcceptanceRate: 0,
        improvement: 0,
        recentSampleSize: 0,
        historicalSampleSize: 0,
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch recent feedback (last 30 days)
    const { data: recentData, error: recentError } = await supabase
      .from('pricing_feedback')
      .select('action')
      .eq('organization_id', profile.organization_id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Fetch historical feedback (older than 30 days)
    const { data: historicalData, error: historicalError } = await supabase
      .from('pricing_feedback')
      .select('action')
      .eq('organization_id', profile.organization_id)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (recentError || historicalError) {
      logError('[pricing/feedback-loop] Failed to fetch confidence data', recentError || historicalError);
      return {
        recentAcceptanceRate: 0,
        historicalAcceptanceRate: 0,
        improvement: 0,
        recentSampleSize: 0,
        historicalSampleSize: 0,
      };
    }

    const recentRecords = recentData || [];
    const historicalRecords = historicalData || [];

    const recentSampleSize = recentRecords.length;
    const historicalSampleSize = historicalRecords.length;

    const recentAccepted = recentRecords.filter((r) => r.action === 'accepted').length;
    const historicalAccepted = historicalRecords.filter((r) => r.action === 'accepted').length;

    const recentAcceptanceRate = recentSampleSize > 0
      ? Math.round((recentAccepted / recentSampleSize) * 100)
      : 0;
    const historicalAcceptanceRate = historicalSampleSize > 0
      ? Math.round((historicalAccepted / historicalSampleSize) * 100)
      : 0;

    const improvement = recentAcceptanceRate - historicalAcceptanceRate;

    return {
      recentAcceptanceRate,
      historicalAcceptanceRate,
      improvement,
      recentSampleSize,
      historicalSampleSize,
    };
  } catch (error) {
    logError('[pricing/feedback-loop] Unexpected error calculating improvement', error);
    return {
      recentAcceptanceRate: 0,
      historicalAcceptanceRate: 0,
      improvement: 0,
      recentSampleSize: 0,
      historicalSampleSize: 0,
    };
  }
}
