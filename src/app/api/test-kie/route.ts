import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.KIE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ok: false, message: "❌ Missing KIE_API_KEY env variable." }, { status: 500 });
  }

  try {
    // Make a lightweight test request to confirm authentication
    // Using a simple endpoint that should return 401 if unauthorized
    const res = await fetch("https://api.kie.ai/api/v1/generate", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: "test" })
    });

    if (res.status === 401) {
      return NextResponse.json({ ok: false, message: "❌ Invalid API key - unauthorized" });
    } else if (res.status === 400) {
      return NextResponse.json({ ok: true, message: "✅ Kie.ai API key connected successfully (got expected 400 for test request)" });
    } else {
      const text = await res.text();
      return NextResponse.json({ ok: true, message: `✅ Kie.ai API key connected successfully (status: ${res.status})`, details: text });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: "⚠️ Error connecting to Kie.ai", error: err.message });
  }
}
