/**
 * Real-time WebSocket hook for proposal updates
 *
 * Subscribes to Supabase Realtime channels for:
 * - Proposal status changes (viewed, commented, approved)
 * - Activity selection changes (client toggles activities)
 * - New comments
 * - Price updates
 *
 * Integrated with browser push notifications
 */

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  shouldShowNotification,
  notifyProposalComment,
  notifyProposalApproval,
  notifyProposalView,
  createEventNotification,
  showNotification,
} from '@/lib/notifications/browser-push';

interface UseRealtimeProposalOptions {
  proposalId: string;
  proposalTitle?: string;
  clientName?: string;
  onProposalUpdate?: (payload: any) => void;
  onActivityUpdate?: (payload: any) => void;
  onCommentAdded?: (payload: any) => void;
  enabled?: boolean;
  enableNotifications?: boolean;
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
  proposalTitle = 'Proposal',
  clientName = 'Client',
  onProposalUpdate,
  onActivityUpdate,
  onCommentAdded,
  enabled = true,
  enableNotifications = true,
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

          // Show notification for status changes
          if (enableNotifications && payload.new) {
            const oldStatus = payload.old?.status;
            const newStatus = payload.new.status;

            // Client viewed proposal
            if (oldStatus !== 'viewed' && newStatus === 'viewed') {
              if (shouldShowNotification('view')) {
                notifyProposalView(proposalTitle, clientName, proposalId);
              }
            }

            // Client approved proposal
            if (newStatus === 'approved' && oldStatus !== 'approved') {
              if (shouldShowNotification('approval')) {
                notifyProposalApproval(proposalTitle, clientName, proposalId);
              }
            }
          }

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

          // Show notification for client activity toggles
          if (enableNotifications && payload.new) {
            const oldSelected = payload.old?.is_selected;
            const newSelected = payload.new.is_selected;

            if (oldSelected !== newSelected && shouldShowNotification('update')) {
              const notification = createEventNotification('update', {
                proposalTitle,
                clientName,
                proposalId,
              });
              showNotification(notification);
            }
          }

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

          // Show notification for new comments
          if (enableNotifications && payload.new) {
            const authorName = payload.new.author_name || clientName;
            const commentText = payload.new.comment || '';

            if (shouldShowNotification('comment')) {
              notifyProposalComment(proposalTitle, authorName, proposalId, commentText);
            }
          }

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
  }, [
    proposalId,
    proposalTitle,
    clientName,
    enabled,
    enableNotifications,
    onProposalUpdate,
    onActivityUpdate,
    onCommentAdded,
  ]);

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
