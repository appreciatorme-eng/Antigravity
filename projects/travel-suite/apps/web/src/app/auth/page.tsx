import type { Metadata } from 'next';
import AuthPageContent from './_components/AuthPageContent';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to TravelBuilt — the AI-powered platform for modern Indian tour operators.',
  robots: { index: false, follow: false },
};

export default function AuthPage() {
  return <AuthPageContent />;
}
