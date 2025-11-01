import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const apiKey = process.env.KIE_MUSIC_API_KEY || process.env.VIBEFORGE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing KIE_MUSIC_API_KEY" }, { status: 500 });
    }

    const endpoint = `https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`;
    console.log("[DEBUG][KIE STATUS] Calling:", endpoint);

    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    console.log("[DEBUG][KIE STATUS] HTTP:", res.status, res.statusText);
    const data = await res.json().catch(async () => ({ raw: await res.text() }));
    console.log("[DEBUG][KIE STATUS] Payload:", JSON.stringify(data));

    const status = data?.data?.status || data?.data?.response?.status || null;
    const progress = data?.data?.progress || null;

    return NextResponse.json({ taskId, status, progress, data }, { status: 200 });
  } catch (e: any) {
    console.error("[DEBUG][KIE STATUS] Error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}






