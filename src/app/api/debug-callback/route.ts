import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ 
    message: 'Debug callback endpoint is active',
    endpoint: '/api/debug-callback',
    methods: ['GET', 'POST'],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🧪 [DEBUG CALLBACK RECEIVED]", new Date().toISOString());
    console.log("🧪 [DEBUG] Body:", JSON.stringify(body, null, 2));
    console.log("🧪 [DEBUG] Headers:", Object.fromEntries(req.headers.entries()));
    
    return NextResponse.json({ 
      success: true,
      message: 'Debug callback received',
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("🧪 [DEBUG] Error parsing body:", error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to parse body',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}
