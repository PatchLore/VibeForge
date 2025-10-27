import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("🖼️ POST /api/describe-image endpoint reached");
  
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({
        success: false,
        message: "No image file provided"
      }, { status: 400 });
    }

    console.log("🖼️ Image file received:", imageFile.name, imageFile.size, "bytes");

    // Convert image to base64 for API
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Use Kie.ai's vision API for image description
    const apiKey = process.env.KIE_IMAGE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing KIE_IMAGE_API_KEY for image description");
    }

    const response = await fetch("https://api.kie.ai/api/v1/generate/text", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Describe this image in 2-4 words that would work well as a music vibe or mood. Focus on the emotional atmosphere, colors, and artistic style. Examples: "dreamy sunset", "urban night", "cosmic drift", "forest serenity". Return only the description, no quotes or extra text.`,
        model: "GPT-4o",
        image: dataUrl,
        maxTokens: 20,
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.code !== 200) {
      console.error("🖼️ Image description error:", data);
      throw new Error(`Image description failed: ${data.msg}`);
    }

    const description = data.data?.response?.text?.trim() || 'mysterious atmosphere';
    console.log("🖼️ [Vision] Image described as:", description);

    return NextResponse.json({
      success: true,
      description: description,
      message: `Image described as: ${description}`
    });

  } catch (error) {
    console.error("🖼️ Error describing image:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to describe image. Please try again."
    }, { status: 500 });
  }
}
