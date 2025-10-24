import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    console.log("🔍 [Status] Endpoint called");
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    // For now, always return PENDING to test the endpoint
    // This will be updated once we confirm the endpoint is working
    return NextResponse.json({ 
      status: "PENDING",
      message: "Generation in progress...",
      taskId: taskId
    });

  } catch (err: any) {
    console.error("💥 [Status] Unexpected error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
