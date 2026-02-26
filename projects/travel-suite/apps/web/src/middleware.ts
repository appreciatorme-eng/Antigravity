import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key';

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
    const isWelcomePage = request.nextUrl.pathname === '/welcome';
    const isStaticFile = request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/icons') ||
        request.nextUrl.pathname.startsWith('/images') ||
        request.nextUrl.pathname.includes('.');

    if (isStaticFile) return supabaseResponse;

    if (!user) {
        // Unauthenticated users
        if (!isWelcomePage && !isAuthPage && !request.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.redirect(new URL('/welcome', request.url));
        }
    } else {
        // Authenticated users
        if (isWelcomePage) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
