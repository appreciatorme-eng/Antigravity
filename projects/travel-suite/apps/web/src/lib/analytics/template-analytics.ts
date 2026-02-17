/**
 * Template Analytics Utilities
 *
 * Track template views and usage for analytics
 */

import { createClient } from '@/lib/supabase/client';

export interface TemplateAnalytics {
  template_id: string;
  total_views: number;
  total_uses: number;
  views_last_7_days: number;
  views_last_30_days: number;
  uses_last_7_days: number;
  uses_last_30_days: number;
  conversion_rate: number;
  last_viewed_at: string | null;
  last_used_at: string | null;
}

export interface TopTemplate {
  template_id: string;
  template_name: string;
  destination: string;
  total_uses: number;
  total_views: number;
  conversion_rate: number;
}

/**
 * Track template view
 *
 * Call this when a user views a template in the template library or editor
 */
export async function trackTemplateView(
  templateId: string,
  organizationId: string,
  source: 'web' | 'mobile' | 'api' = 'web'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('template_views').insert({
      template_id: templateId,
      organization_id: organizationId,
      viewed_by: user?.id || null,
      source,
    });

    if (error) {
      console.error('Error tracking template view:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking template view:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track template usage
 *
 * Call this when a template is used to create a proposal
 */
export async function trackTemplateUsage(
  templateId: string,
  proposalId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('template_usage').insert({
      template_id: templateId,
      proposal_id: proposalId,
      organization_id: organizationId,
      created_by: user?.id || null,
    });

    if (error) {
      console.error('Error tracking template usage:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking template usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get analytics for a specific template
 */
export async function getTemplateAnalytics(
  templateId: string,
  organizationId: string
): Promise<{ success: boolean; data?: TemplateAnalytics; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_template_analytics', {
      p_template_id: templateId,
      p_organization_id: organizationId,
    });

    if (error) {
      console.error('Error getting template analytics:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as unknown as TemplateAnalytics };
  } catch (error) {
    console.error('Error getting template analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get top templates by usage
 */
export async function getTopTemplatesByUsage(
  organizationId: string,
  limit: number = 10,
  days: number = 30
): Promise<{ success: boolean; data?: TopTemplate[]; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_top_templates_by_usage', {
      p_organization_id: organizationId,
      p_limit: limit,
      p_days: days,
    });

    if (error) {
      console.error('Error getting top templates:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as unknown as TopTemplate[] };
  } catch (error) {
    console.error('Error getting top templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get template view timeline (for charts)
 */
export async function getTemplateViewTimeline(
  templateId: string,
  organizationId: string,
  days: number = 30
): Promise<{
  success: boolean;
  data?: Array<{ date: string; views: number; uses: number }>;
  error?: string;
}> {
  try {
    const supabase = createClient();

    // Get views grouped by date
    const { data: viewsData, error: viewsError } = await supabase
      .from('template_views')
      .select('viewed_at')
      .eq('template_id', templateId)
      .eq('organization_id', organizationId)
      .gte('viewed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (viewsError) throw viewsError;

    // Get uses grouped by date
    const { data: usesData, error: usesError } = await supabase
      .from('template_usage')
      .select('created_at')
      .eq('template_id', templateId)
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (usesError) throw usesError;

    // Group by date
    const timeline: Record<string, { views: number; uses: number }> = {};

    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      timeline[dateKey] = { views: 0, uses: 0 };
    }

    // Count views
    viewsData?.forEach((view) => {
      if (!view.viewed_at) return;
      const dateKey = new Date(view.viewed_at).toISOString().split('T')[0];
      if (timeline[dateKey]) {
        timeline[dateKey].views++;
      }
    });

    // Count uses
    usesData?.forEach((use) => {
      if (!use.created_at) return;
      const dateKey = new Date(use.created_at).toISOString().split('T')[0];
      if (timeline[dateKey]) {
        timeline[dateKey].uses++;
      }
    });

    // Convert to array and sort
    const data = Object.entries(timeline)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data };
  } catch (error) {
    console.error('Error getting template view timeline:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
