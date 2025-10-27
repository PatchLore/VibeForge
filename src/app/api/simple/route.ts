export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ 
    message: "Simple GET works",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return Response.json({ 
    message: "Simple POST works",
    timestamp: new Date().toISOString()
  });
}

