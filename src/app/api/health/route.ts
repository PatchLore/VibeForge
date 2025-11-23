export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // Check critical environment variables
  const envCheck = {
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    kie: {
      music: !!process.env.VIBEFORGE_API_KEY,
      image: !!process.env.KIE_IMAGE_API_KEY,
      callback: !!process.env.KIE_CALLBACK_URL,
    },
    stripe: {
      secret: !!process.env.STRIPE_SECRET_KEY,
      webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    app: {
      siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    }
  };

  const criticalVars = [
    envCheck.supabase.url,
    envCheck.supabase.anonKey,
    envCheck.supabase.serviceRole,
    envCheck.kie.music,
    envCheck.kie.image
  ];

  const allCriticalPresent = criticalVars.every(v => v);
  const missingCritical = [
    !envCheck.supabase.url && 'NEXT_PUBLIC_SUPABASE_URL',
    !envCheck.supabase.anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    !envCheck.supabase.serviceRole && 'SUPABASE_SERVICE_ROLE_KEY',
    !envCheck.kie.music && 'VIBEFORGE_API_KEY',
    !envCheck.kie.image && 'KIE_IMAGE_API_KEY'
  ].filter(Boolean);

  return Response.json({ 
    status: allCriticalPresent ? "ok" : "degraded",
    message: allCriticalPresent ? "Health check working" : "Missing critical environment variables",
    timestamp: new Date().toISOString(),
    environment: {
      allCriticalPresent,
      missingCritical,
      details: envCheck
    }
  });
}

export async function POST() {
  return Response.json({ 
    status: "ok", 
    message: "POST method working",
    timestamp: new Date().toISOString()
  });
}

