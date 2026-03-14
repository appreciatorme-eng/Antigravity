'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Listens for Supabase SIGNED_OUT events and redirects to /auth
 * with the current path preserved as a `next` query parameter.
 */
export function useSessionRefresh() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        const next = encodeURIComponent(pathname);
        router.push(`/auth?next=${next}`);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);
}
