export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ 
    status: "ok", 
    message: "Health check working",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return Response.json({ 
    status: "ok", 
    message: "POST method working",
    timestamp: new Date().toISOString()
  });
}

