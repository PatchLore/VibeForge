import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const envCheck = {
    supabase: {
      url: {
        present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 'MISSING',
        fullKey: 'NEXT_PUBLIC_SUPABASE_URL'
      },
      anonKey: {
        present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MISSING',
        fullKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      },
      serviceRole: {
        present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'MISSING',
        fullKey: 'SUPABASE_SERVICE_ROLE_KEY'
      },
      // Legacy names
      legacyUrl: {
        present: !!process.env.SUPABASE_URL,
        value: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 20)}...` : 'MISSING',
        fullKey: 'SUPABASE_URL'
      },
      legacyKey: {
        present: !!process.env.SUPABASE_KEY,
        value: process.env.SUPABASE_KEY ? `${process.env.SUPABASE_KEY.substring(0, 20)}...` : 'MISSING',
        fullKey: 'SUPABASE_KEY'
      }
    },
    kie: {
      music: {
        present: !!process.env.VIBEFORGE_API_KEY,
        value: process.env.VIBEFORGE_API_KEY ? `${process.env.VIBEFORGE_API_KEY.substring(0, 20)}...` : 'MISSING',
        fullKey: 'VIBEFORGE_API_KEY'
      },
      image: {
        present: !!process.env.KIE_IMAGE_API_KEY,
        value: process.env.KIE_IMAGE_API_KEY ? `${process.env.KIE_IMAGE_API_KEY.substring(0, 20)}...` : 'MISSING',
        fullKey: 'KIE_IMAGE_API_KEY'
      },
      callback: {
        present: !!process.env.KIE_CALLBACK_URL,
        value: process.env.KIE_CALLBACK_URL || 'Using default: https://www.soundswoop.com/api/callback',
        fullKey: 'KIE_CALLBACK_URL'
      },
      // Alternative name
      musicAlt: {
        present: !!process.env.KIE_MUSIC_API_KEY,
        value: process.env.KIE_MUSIC_API_KEY ? `${process.env.KIE_MUSIC_API_KEY.substring(0, 20)}...` : 'MISSING',
        fullKey: 'KIE_MUSIC_API_KEY'
      }
    },
    stripe: {
      secret: {
        present: !!process.env.STRIPE_SECRET_KEY,
        value: process.env.STRIPE_SECRET_KEY ? `${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...` : 'MISSING',
        fullKey: 'STRIPE_SECRET_KEY'
      },
      webhook: {
        present: !!process.env.STRIPE_WEBHOOK_SECRET,
        value: process.env.STRIPE_WEBHOOK_SECRET ? `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20)}...` : 'MISSING',
        fullKey: 'STRIPE_WEBHOOK_SECRET'
      },
      pricePro: {
        present: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
        value: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'MISSING',
        fullKey: 'NEXT_PUBLIC_STRIPE_PRICE_PRO'
      },
      priceCreator: {
        present: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR,
        value: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR || 'MISSING',
        fullKey: 'NEXT_PUBLIC_STRIPE_PRICE_CREATOR'
      },
      priceTopup: {
        present: !!(process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_1K || process.env.NEXT_PUBLIC_STRIPE_PRICE_1K),
        value: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_1K || process.env.NEXT_PUBLIC_STRIPE_PRICE_1K || 'MISSING',
        fullKey: 'NEXT_PUBLIC_STRIPE_PRICE_TOPUP_1K or NEXT_PUBLIC_STRIPE_PRICE_1K'
      }
    },
    app: {
      siteUrl: {
        present: !!process.env.NEXT_PUBLIC_SITE_URL,
        value: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING',
        fullKey: 'NEXT_PUBLIC_SITE_URL'
      },
      baseUrl: {
        present: !!process.env.NEXT_PUBLIC_BASE_URL,
        value: process.env.NEXT_PUBLIC_BASE_URL || 'MISSING (defaults to localhost:3000)',
        fullKey: 'NEXT_PUBLIC_BASE_URL'
      },
      startingCredits: {
        present: !!process.env.NEXT_PUBLIC_STARTING_CREDITS,
        value: process.env.NEXT_PUBLIC_STARTING_CREDITS || '36 (default)',
        fullKey: 'NEXT_PUBLIC_STARTING_CREDITS'
      },
      creditsPerGen: {
        present: !!process.env.NEXT_PUBLIC_CREDITS_PER_GENERATION,
        value: process.env.NEXT_PUBLIC_CREDITS_PER_GENERATION || '12 (default)',
        fullKey: 'NEXT_PUBLIC_CREDITS_PER_GENERATION'
      }
    }
  };

  // Calculate summary
  const criticalVars = [
    envCheck.supabase.url,
    envCheck.supabase.anonKey,
    envCheck.supabase.serviceRole,
    envCheck.kie.music,
    envCheck.kie.image
  ];

  const allCriticalPresent = criticalVars.every(v => v.present);
  const missingCritical = criticalVars.filter(v => !v.present).map(v => v.fullKey);

  return NextResponse.json({
    status: allCriticalPresent ? '✅ All critical variables present' : '❌ Missing critical variables',
    summary: {
      allCriticalPresent,
      missingCritical,
      timestamp: new Date().toISOString()
    },
    details: envCheck
  }, { status: allCriticalPresent ? 200 : 503 });
}

