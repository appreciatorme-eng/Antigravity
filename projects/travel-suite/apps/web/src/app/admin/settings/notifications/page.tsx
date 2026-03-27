import { redirect } from 'next/navigation';

export default function AdminNotificationSettingsPage() {
  redirect('/settings?tab=notifications');
}
