/**
 * Real-time WebSocket hook for proposal updates
 *
 * Subscribes to Supabase Realtime channels for:
 * - Proposal status changes (viewed, commented, approved)
 * - Activity selection changes (client toggles activities)
 * - New comments
 * - Price updates
 */

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeProposalOptions {
  proposalId: string;
  onProposalUpdate?: (payload: any) => void;
  onActivityUpdate?: (payload: any) => void;
  onCommentAdded?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Subscribe to real-time updates for a proposal
 *
 * @example
 * ```tsx
 * useRealtimeProposal({
 *   proposalId: 'uuid',
 *   onProposalUpdate: (payload) => {
 *     console.log('Proposal updated:', payload);
 *     refetchProposal();
 *   },
 *   onCommentAdded: (payload) => {
 *     console.log('New comment:', payload);
 *     refetchComments();
 *   },
 * });
 * ```
 */
export function useRealtimeProposal({
  proposalId,
  onProposalUpdate,
  onActivityUpdate,
  onCommentAdded,
  enabled = true,
}: UseRealtimeProposalOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !proposalId) return;

    const supabase = createClient();

    // Create unique channel name
    const channelName = `proposal:${proposalId}`;

    // Subscribe to proposal changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposals',
          filter: `id=eq.${proposalId}`,
        },
        (payload) => {
          console.log('[Realtime] Proposal updated:', payload);
          onProposalUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposal_activities',
        },
        (payload) => {
          console.log('[Realtime] Activity updated:', payload);
          onActivityUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proposal_comments',
          filter: `proposal_id=eq.${proposalId}`,
        },
        (payload) => {
          console.log('[Realtime] Comment added:', payload);
          onCommentAdded?.(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log('[Realtime] Unsubscribing from:', channelName);
      supabase.removeChannel(channel);
    };
  }, [proposalId, enabled, onProposalUpdate, onActivityUpdate, onCommentAdded]);

  return {
    isSubscribed: channelRef.current !== null,
  };
}

/**
 * Subscribe to real-time updates for all proposals (admin dashboard)
 *
 * @example
 * ```tsx
 * useRealtimeProposals({
 *   organizationId: 'uuid',
 *   onProposalUpdate: () => refetchProposals(),
 * });
 * ```
 */
export function useRealtimeProposals({
  organizationId,
  onProposalUpdate,
  enabled = true,
}: {
  organizationId?: string;
  onProposalUpdate?: (payload: any) => void;
  enabled?: boolean;
}) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId) return;

    const supabase = createClient();
    const channelName = `proposals:${organizationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'proposals',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('[Realtime] Proposals changed:', payload);
          onProposalUpdate?.(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Proposals subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('[Realtime] Unsubscribing from:', channelName);
      supabase.removeChannel(channel);
    };
  }, [organizationId, enabled, onProposalUpdate]);

  return {
    isSubscribed: channelRef.current !== null,
  };
}
