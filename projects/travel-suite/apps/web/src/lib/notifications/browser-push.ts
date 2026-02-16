/**
 * Browser Push Notifications
 *
 * Native browser notifications for real-time events
 * Works with Chrome, Firefox, Safari, Edge
 */

export type NotificationType = 'comment' | 'approval' | 'view' | 'update' | 'message';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Show browser notification
 */
export async function showNotification(notification: PushNotification): Promise<boolean> {
  const permission = getNotificationPermission();

  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    const options: any = {
      body: notification.body,
      icon: notification.icon || '/logo-192.png',
      badge: notification.badge || '/logo-96.png',
      data: notification.data,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction || false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
    };

    if (notification.actions && notification.actions.length > 0) {
      options.actions = notification.actions;
    }

    const browserNotification = new Notification(notification.title, options);

    // Handle clicks
    browserNotification.onclick = (event) => {
      event.preventDefault();
      window.focus();

      // Close notification
      browserNotification.close();

      // Navigate if data contains URL
      if (notification.data?.url) {
        window.location.href = notification.data.url;
      }
    };

    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

/**
 * Create notification for specific event types
 */
export function createEventNotification(
  type: NotificationType,
  data: {
    proposalTitle?: string;
    clientName?: string;
    commentText?: string;
    proposalId?: string;
    shareToken?: string;
  }
): PushNotification {
  const baseUrl = window.location.origin;

  switch (type) {
    case 'comment':
      return {
        title: '💬 New Comment',
        body: `${data.clientName} commented on "${data.proposalTitle}"`,
        tag: `comment-${data.proposalId}`,
        requireInteraction: true,
        data: {
          url: `${baseUrl}/admin/proposals/${data.proposalId}`,
          type: 'comment',
          proposalId: data.proposalId,
        },
        actions: [
          { action: 'view', title: 'View Comment' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

    case 'approval':
      return {
        title: '✅ Proposal Approved!',
        body: `${data.clientName} approved "${data.proposalTitle}"`,
        tag: `approval-${data.proposalId}`,
        requireInteraction: true,
        data: {
          url: `${baseUrl}/admin/proposals/${data.proposalId}`,
          type: 'approval',
          proposalId: data.proposalId,
        },
        actions: [
          { action: 'view', title: 'View Proposal' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

    case 'view':
      return {
        title: '👁️ Proposal Viewed',
        body: `${data.clientName} is viewing "${data.proposalTitle}"`,
        tag: `view-${data.proposalId}`,
        requireInteraction: false,
        data: {
          url: `${baseUrl}/admin/proposals/${data.proposalId}`,
          type: 'view',
          proposalId: data.proposalId,
        },
      };

    case 'update':
      return {
        title: '🔄 Proposal Updated',
        body: `${data.clientName} made changes to "${data.proposalTitle}"`,
        tag: `update-${data.proposalId}`,
        requireInteraction: false,
        data: {
          url: `${baseUrl}/admin/proposals/${data.proposalId}`,
          type: 'update',
          proposalId: data.proposalId,
        },
      };

    case 'message':
      return {
        title: '📨 New Message',
        body: data.commentText || 'You have a new message',
        tag: 'message-general',
        requireInteraction: false,
        data: {
          type: 'message',
        },
      };

    default:
      return {
        title: 'Travel Suite',
        body: 'You have a new notification',
        tag: 'general',
        requireInteraction: false,
      };
  }
}

/**
 * Helper: Show notification for proposal comment
 */
export async function notifyProposalComment(
  proposalTitle: string,
  clientName: string,
  proposalId: string,
  commentText: string
): Promise<boolean> {
  const notification = createEventNotification('comment', {
    proposalTitle,
    clientName,
    proposalId,
    commentText,
  });

  return showNotification(notification);
}

/**
 * Helper: Show notification for proposal approval
 */
export async function notifyProposalApproval(
  proposalTitle: string,
  clientName: string,
  proposalId: string
): Promise<boolean> {
  const notification = createEventNotification('approval', {
    proposalTitle,
    clientName,
    proposalId,
  });

  return showNotification(notification);
}

/**
 * Helper: Show notification for proposal view
 */
export async function notifyProposalView(
  proposalTitle: string,
  clientName: string,
  proposalId: string
): Promise<boolean> {
  const notification = createEventNotification('view', {
    proposalTitle,
    clientName,
    proposalId,
  });

  return showNotification(notification);
}

/**
 * Store user notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  comments: boolean;
  approvals: boolean;
  views: boolean;
  updates: boolean;
}

const PREFERENCES_KEY = 'notification_preferences';

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading notification preferences:', error);
  }

  // Default preferences
  return {
    enabled: true,
    comments: true,
    approvals: true,
    views: false, // Don't notify for views by default (too noisy)
    updates: true,
  };
}

export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
}

/**
 * Check if notification should be shown based on preferences
 */
export function shouldShowNotification(type: NotificationType): boolean {
  const preferences = getNotificationPreferences();

  if (!preferences.enabled) {
    return false;
  }

  switch (type) {
    case 'comment':
      return preferences.comments;
    case 'approval':
      return preferences.approvals;
    case 'view':
      return preferences.views;
    case 'update':
      return preferences.updates;
    default:
      return true;
  }
}
