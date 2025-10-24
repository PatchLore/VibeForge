// Root-level fallback handler for Vercel deployment verification
export default function handler(req, res) {
  console.log("🚀 [FALLBACK] Root-level /api/status handler reached");
  
  if (req.method === 'GET') {
    const { taskId } = req.query;
    
    if (!taskId) {
      return res.status(400).json({ error: "Missing taskId" });
    }
    
    console.log("🔍 [FALLBACK] Checking status for taskId:", taskId);
    
    // Return basic PENDING status for now
    return res.status(200).json({
      status: "PENDING",
      message: "Fallback handler working - Vercel deployment verified",
      taskId: taskId,
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}
