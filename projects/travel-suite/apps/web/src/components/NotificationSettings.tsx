/**
 * Notification Settings Component
 *
 * Allow users to configure browser push notifications
 */

'use client';

import { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
  getNotificationPreferences,
  saveNotificationPreferences,
  showNotification,
  type NotificationPreferences,
} from '@/lib/notifications/browser-push';
import { Bell, BellOff, Check, X } from 'lucide-react';

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    comments: true,
    approvals: true,
    views: false,
    updates: true,
  });
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
      setPreferences(getNotificationPreferences());
    }
  }, []);

  const handleRequestPermission = async () => {
    setRequesting(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setRequesting(false);

    if (result === 'granted') {
      // Show test notification
      await showNotification({
        title: '🎉 Notifications Enabled!',
        body: 'You will now receive real-time updates for proposals',
        tag: 'welcome',
      });
    }
  };

  const handleTogglePreference = (key: keyof NotificationPreferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(updated);
    saveNotificationPreferences(updated);
  };

  const handleTestNotification = async () => {
    await showNotification({
      title: '🔔 Test Notification',
      body: 'This is what a notification looks like!',
      tag: 'test',
      requireInteraction: false,
    });
  };

  if (!isNotificationSupported()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Notifications Not Supported</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your browser doesn't support push notifications. Please use Chrome, Firefox, Safari,
              or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-[#9c7c46]" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Browser Notifications</h2>
            <p className="text-sm text-gray-600 mt-1">
              Get instant desktop/mobile alerts for important events
            </p>
          </div>
        </div>
      </div>

      {/* Permission Status */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Permission Status</h3>
            <p className="text-sm text-gray-600">
              {permission === 'granted' && '✅ Enabled - You will receive notifications'}
              {permission === 'denied' && '❌ Blocked - Please enable in browser settings'}
              {permission === 'default' && '⏳ Not configured - Click enable below'}
            </p>
          </div>

          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              disabled={requesting || permission === 'denied'}
              className="px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {requesting ? 'Requesting...' : 'Enable Notifications'}
            </button>
          )}

          {permission === 'granted' && (
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Send Test
            </button>
          )}
        </div>

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Notifications are blocked.</strong> To enable them:
              <br />
              1. Click the lock icon in your browser's address bar
              <br />
              2. Find "Notifications" and change to "Allow"
              <br />
              3. Refresh this page
            </p>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      {permission === 'granted' && (
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Notification Types</h3>

          <div className="space-y-3">
            {/* Master Toggle */}
            <div
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => handleTogglePreference('enabled')}
            >
              <div>
                <p className="font-medium text-gray-900">All Notifications</p>
                <p className="text-sm text-gray-600">Enable or disable all notifications</p>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  } mt-0.5`}
                />
              </div>
            </div>

            {/* Individual Toggles */}
            <div className="space-y-2 ml-4">
              <div
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  preferences.enabled ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => preferences.enabled && handleTogglePreference('comments')}
              >
                <div className="flex items-center gap-2">
                  {preferences.comments && preferences.enabled ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">New Comments</p>
                    <p className="text-sm text-gray-600">When clients comment on proposals</p>
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  preferences.enabled ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => preferences.enabled && handleTogglePreference('approvals')}
              >
                <div className="flex items-center gap-2">
                  {preferences.approvals && preferences.enabled ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Approvals</p>
                    <p className="text-sm text-gray-600">When clients approve proposals</p>
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  preferences.enabled ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => preferences.enabled && handleTogglePreference('views')}
              >
                <div className="flex items-center gap-2">
                  {preferences.views && preferences.enabled ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Proposal Views</p>
                    <p className="text-sm text-gray-600">
                      When clients view proposals (can be noisy)
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  preferences.enabled ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => preferences.enabled && handleTogglePreference('updates')}
              >
                <div className="flex items-center gap-2">
                  {preferences.updates && preferences.enabled ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Proposal Updates</p>
                    <p className="text-sm text-gray-600">When clients make changes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-6 bg-blue-50 border-t border-blue-200">
        <h3 className="text-sm font-bold text-blue-900 mb-2">💡 How Notifications Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Notifications appear even when Travel Suite is closed</li>
          <li>• Click a notification to open the relevant proposal</li>
          <li>• Works on desktop and mobile devices</li>
          <li>• You can change these settings anytime</li>
        </ul>
      </div>
    </div>
  );
}
