// Root-level health check fallback handler
export default function handler(req, res) {
  console.log("🚀 [FALLBACK] Root-level /api/status/health handler reached");
  
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      deployed: true,
      fallback: true,
      timestamp: new Date().toISOString(),
      message: "Root-level fallback handler working - Vercel deployment verified!"
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}
