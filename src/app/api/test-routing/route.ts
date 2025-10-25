import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.log("🧪 GET /api/test-routing endpoint reached");
  return NextResponse.json({
    message: "Test routing endpoint working",
    endpoint: "/api/test-routing",
    timestamp: new Date().toISOString()
  });
}
