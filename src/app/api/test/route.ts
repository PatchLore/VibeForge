import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.log("🧪 GET /api/test endpoint reached");
  return NextResponse.json({
    message: "Test GET works",
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  console.log("🧪 POST /api/test endpoint reached");
  const body = await req.json();
  return NextResponse.json({
    message: "Test POST works",
    body: body,
    timestamp: new Date().toISOString()
  });
}
