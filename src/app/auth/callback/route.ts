import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { NextURL } from 'next/dist/server/web/next-url';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    const errorUrl = new NextURL(`${origin}/auth/auth-code-error`);
    errorUrl.searchParams.set('error', error);
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(errorUrl);
  }

  // Handle missing code
  if (!code) {
    const errorUrl = new NextURL(`${origin}/auth/auth-code-error`);
    errorUrl.searchParams.set('error', 'missing_code');
    errorUrl.searchParams.set('error_description', 'No authorization code provided');
    return NextResponse.redirect(errorUrl);
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Exchange code for session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('❌ [AUTH CALLBACK] Error exchanging code:', exchangeError);
    const errorUrl = new NextURL(`${origin}/auth/auth-code-error`);
    errorUrl.searchParams.set('error', exchangeError.message || 'exchange_failed');
    errorUrl.searchParams.set('error_description', exchangeError.message || 'Failed to exchange authorization code');
    return NextResponse.redirect(errorUrl);
  }

  // Success - redirect to app
  return NextResponse.redirect(`${origin}${next}`);
}

