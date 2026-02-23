import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/admin', '/planner'];

const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const isOnboardingPath = (pathname: string) =>
  pathname === '/onboarding' || pathname.startsWith('/onboarding/');

const buildAuthRedirect = (request: NextRequest, nextPath: string) => {
  const destination = new URL('/auth', request.url);
  destination.searchParams.set('next', nextPath);
  return destination;
};

const isOnboardingComplete = (profile: {
  organization_id: string | null;
  role: string | null;
  onboarding_step: number | null;
} | null) =>
  !!profile?.organization_id && profile.role === 'admin' && Number(profile.onboarding_step || 0) >= 2;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const protectedPath = isProtectedPath(pathname);
  const onboardingPath = isOnboardingPath(pathname);

  if (!user) {
    if (protectedPath || onboardingPath) {
      const requested = `${pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(buildAuthRedirect(request, requested));
    }
    return response;
  }

  if (!protectedPath && !onboardingPath) {
    return response;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, onboarding_step')
    .eq('id', user.id)
    .maybeSingle();

  const onboardingComplete = isOnboardingComplete(profile);

  if (!onboardingComplete && protectedPath) {
    const destination = new URL('/onboarding', request.url);
    destination.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(destination);
  }

  if (onboardingComplete && onboardingPath) {
    const requestedNext = request.nextUrl.searchParams.get('next');
    const safeNext = requestedNext && requestedNext.startsWith('/') ? requestedNext : '/admin';
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
