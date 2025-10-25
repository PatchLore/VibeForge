import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  console.log("🎨 GET /api/visual endpoint reached");
  return NextResponse.json({
    message: "Visual endpoint working",
    endpoint: "/api/visual",
    methods: ["GET", "POST"],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  console.log("🎨 POST /api/visual endpoint reached");
  try {
    const body = await req.json();
    return NextResponse.json({
      message: "Visual generation endpoint working",
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Visual POST error:", error);
    return NextResponse.json({ error: "Visual POST failed" }, { status: 500 });
  }
}
