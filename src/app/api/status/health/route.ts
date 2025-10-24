import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.log("🚀 [DEPLOYMENT] /api/status/health endpoint reached - Vercel deployment successful!");
  return NextResponse.json({
    ok: true,
    deployed: true,
    timestamp: new Date().toISOString(),
    message: "Vercel API routes are working correctly!"
  });
}
