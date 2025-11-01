# Image Generation Summary for Soundswoop Tracks

## Overview

Soundswoop generates AI artwork for each track using **Bytedance Seedream-v4** via the **Kie.ai API**. The system ensures all track images are generated at **2K resolution (2048x1152)** with a 16:9 aspect ratio for optimal quality and visual consistency.

---

## Image Generation Flow

### 1. **User Input** → **Prompt Enrichment**

**Location**: `src/lib/enrichPrompt.ts` → `buildImagePrompt()`

When a user enters a vibe (e.g., "heartbroken in the city"), the system:

1. **Enriches the prompt** into a detailed image description:
   - Adds visual context, mood, atmosphere
   - Includes style descriptors (cinematic, ethereal, etc.)
   - Formats for image generation API

**Example Transformation**:
```
User Input: "heartbroken in the city"
↓
Enriched Image Prompt: "cinematic moody cityscape at night, emotional atmosphere, 
rain-soaked streets, neon reflections, melancholic lighting, deep shadows, 
introspective urban scene, artistic composition, 16:9 aspect ratio"
```

**Function**: `buildImagePrompt(userPrompt: string)`

### 2. **API Call** → **Image Generation Request**

**Location**: `src/lib/kie.ts` → `generateImage()`

**API Endpoint**: `https://api.kie.ai/api/v1/generate/image`

**Request Parameters**:
```typescript
{
  model: "bytedance/seedream-v4-text-to-image",
  prompt: finalPrompt,              // Enriched image prompt
  resolution: "2048x1152",          // 2K resolution (target)
  aspect_ratio: "16:9",
  quality: "high",
  steps: 30,                        // Generation steps
  cfg_scale: 8,                     // Guidance scale
  guidance: "detailed, cinematic lighting, high contrast, ultra sharp focus"
}
```

**Authentication**: Bearer token via `KIE_IMAGE_API_KEY`

### 3. **Quality Verification & Retry Logic**

The system implements a **three-tier retry system** to ensure 2K quality:

#### **First Attempt**: Standard 2K Request
- Resolution: `2048x1152`
- Steps: 30
- CFG Scale: 8

#### **Second Attempt** (if first fails):
- Resolution: `2048x1152`
- Steps: 25
- CFG Scale: 7

#### **Third Attempt** (final fallback):
- Resolution: `1024x576` (lower quality backup)
- Only used if 2K generation completely fails

### 4. **Image Size Verification**

**Location**: `src/lib/kie.ts` → `verifyAndUpscaleTo2K()`

After receiving an image URL, the system:

1. **Detects image dimensions** by parsing image headers:
   - Supports PNG, JPEG, WEBP formats
   - Reads width/height from file metadata
   - Uses partial buffer fetch for efficiency

2. **Verifies minimum size**:
   - Target: `2048x1152` (2K resolution)
   - Checks file size (`>= 800KB` indicates high quality)
   - Validates URL contains "2048", "1152", or "2k"

3. **Upscale Attempt** (if low-res detected):
   - Retries with enhanced parameters:
     - Steps: 35 (increased)
     - CFG Scale: 8.5 (higher guidance)
     - Quality: "high"
   - Adds "2K resolution, professional quality, upscaled" to guidance

### 5. **Callback Integration**

**Location**: `src/app/api/callback/route.ts`

When Kie.ai completes music generation, it sends a callback with:
- `audio_url` (required)
- `image_url` (optional - may come from music generation service)

**Image Processing in Callback**:

1. **Check incoming image** (if provided):
   ```typescript
   const sourceImageUrl = completed?.image_url;
   ```

2. **Verify & upscale** if needed:
   ```typescript
   const checked = await verifyAndUpscaleTo2K(sourceImageUrl, TARGET);
   ```

3. **Regenerate if low quality**:
   - If image below 2K and `extended_prompt_image` exists
   - Regenerates using stored enriched prompt
   - Ensures final image meets quality standards

4. **Generate new image if missing**:
   - If no image provided in callback
   - Uses stored `extended_prompt_image` from track record
   - Generates fresh 2K image

5. **Save final image URL**:
   ```typescript
   updateFields.image_url = finalImageUrl ?? completed.image_url ?? null;
   ```

### 6. **Database Storage**

**Table**: `tracks`
**Column**: `image_url` (TEXT)

The final image URL is stored in the `tracks` table:
- Persisted when track status changes to `completed`
- Used for display in TrackCard components
- Accessed via `/api/proxy-audio?url=` for CORS handling

---

## Complete Generation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters vibe: "heartbroken in the city"              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/music                                          │
│    - buildImagePrompt() enriches prompt                    │
│    - Stores extended_prompt_image in tracks table          │
│    - Calls generateMusic() → returns taskId                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Kie.ai processes (async)                                 │
│    - Generates music                                        │
│    - May generate image (optional)                         │
│    - Calls back to /api/callback when ready                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. POST /api/callback                                      │
│    - Receives audio_url (required)                           │
│    - Receives image_url (optional, may be low-res)          │
│    - Verifies image quality with verifyAndUpscaleTo2K()     │
│    - Regenerates if < 2K using extended_prompt_image        │
│    - Or generates new 2K image if none provided             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. generateImage() called (if needed)                        │
│    - POST to Kie.ai /generate/image                        │
│    - Model: bytedance/seedream-v4-text-to-image             │
│    - Resolution: 2048x1152, Steps: 30, CFG: 8              │
│    - Retries with adjusted params if fails                  │
│    - Returns imageUrl                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Update tracks table                                      │
│    - Sets image_url = finalImageUrl                         │
│    - Sets status = 'completed'                              │
│    - Saves to Supabase                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Client polls /api/status                                 │
│    - Receives track with imageUrl                           │
│    - Displays in TrackCard component                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Functions & Files

### Core Image Generation

**File**: `src/lib/kie.ts`

- **`generateImage(prompt, styleSuffix)`**
  - Main image generation function
  - Handles retry logic and quality verification
  - Returns `{ imageUrl, resolution: "2048x1152" }` or string URL

- **`verifyAndUpscaleTo2K(imageUrl, target)`**
  - Detects image dimensions (PNG/JPEG/WEBP)
  - Verifies minimum 2048x1152 resolution
  - Returns `{ url, width, height }`

### Prompt Enrichment

**File**: `src/lib/enrichPrompt.ts`

- **`buildImagePrompt(userPrompt)`**
  - Transforms user input into detailed image description
  - Adds visual context, mood, atmosphere
  - Optimized for Seedream-v4 model

### API Routes

**File**: `src/app/api/music/route.ts`
- Initiates generation, stores `extended_prompt_image`

**File**: `src/app/api/callback/route.ts`
- Receives callback from Kie.ai
- Processes and verifies images
- Regenerates if quality insufficient

**File**: `src/app/api/status/route.ts`
- Polling endpoint for client
- Returns completed tracks with `imageUrl`

**File**: `src/app/api/visual/route.ts`
- Standalone image generation endpoint (not used in main flow)

---

## Image Generation Parameters

### Model
- **Service**: Kie.ai API
- **Model**: `bytedance/seedream-v4-text-to-image`
- **Base URL**: `https://api.kie.ai/api/v1`

### Resolution Strategy

**Primary Target**: `2048x1152` (2K, 16:9)
- Optimal for web display
- Professional quality
- Consistent aspect ratio

**Fallback**: `1024x576` (if 2K fails)
- Lower quality backup
- Only used in final retry

### Quality Settings

**High Quality Request**:
- Steps: 30 (first attempt), 35 (upscale)
- CFG Scale: 8 (first), 8.5 (upscale)
- Quality: "high"
- Guidance: "detailed, cinematic lighting, high contrast, ultra sharp focus"

**Retry Parameters** (if first fails):
- Steps: 25
- CFG Scale: 7

---

## Quality Assurance Features

### 1. **Automatic Verification**
- Checks image dimensions from file headers
- Validates file size (>= 800KB indicates high quality)
- Verifies URL contains resolution indicators

### 2. **Automatic Regeneration**
- If incoming image < 2K, regenerates using stored prompt
- If no image provided, generates new 2K image
- Ensures consistent quality across all tracks

### 3. **Multiple Retry Attempts**
- Primary: Standard 2K request
- Secondary: Adjusted parameters
- Tertiary: Lower resolution fallback (only if needed)

### 4. **Error Handling**
- Graceful degradation to lower quality if 2K unavailable
- Logs detailed error information
- Returns image even if verification fails (with warning)

---

## Image Display

### TrackCard Component
**File**: `src/components/TrackCard.tsx`

Images are displayed via proxy endpoint:
```tsx
<img
  src={track.image_url 
    ? `/api/proxy-audio?url=${encodeURIComponent(track.image_url)}` 
    : FALLBACK_IMG}
/>
```

**Proxy Endpoint**: `src/app/api/proxy-audio/route.ts`
- Handles CORS issues with external image URLs
- Caches images for performance
- Returns images with proper headers

### Fallback Image
- Path: `/images/placeholders/track-fallback-16x9.jpg`
- Used when image generation fails or is processing

---

## Environment Variables

Required for image generation:

```env
KIE_IMAGE_API_KEY=your_kie_image_api_key
```

Used in:
- `src/lib/kie.ts` - Image generation API calls

---

## Current Status

✅ **Working**: 
- Image generation via Kie.ai Seedream-v4
- 2K resolution target (2048x1152)
- Quality verification and retry logic
- Automatic regeneration if quality insufficient
- Storage in Supabase `tracks.image_url`

⚠️ **Potential Improvements**:
- Add image caching layer
- Implement CDN for faster delivery
- Add image compression optimization
- Support for user-uploaded image inspiration (coming soon)

---

## API Response Examples

### Successful Image Generation Response
```json
{
  "code": 200,
  "data": {
    "response": {
      "imageUrl": "https://cdn.example.com/generated/abc123.png"
    }
  }
}
```

### Return Format from generateImage()
```typescript
// Success:
{ imageUrl: "https://...", resolution: "2048x1152" }
// or (legacy):
"https://cdn.example.com/image.png"
```

---

## Summary

Soundswoop's image generation system:
1. **Enriches** user prompts into detailed visual descriptions
2. **Generates** images at 2K resolution (2048x1152) via Kie.ai Seedream-v4
3. **Verifies** quality through size detection and retry logic
4. **Regenerates** if quality insufficient, ensuring all tracks have high-quality artwork
5. **Stores** final image URLs in Supabase for persistent display

The system prioritizes **quality and consistency**, ensuring all track artwork meets the 2K resolution standard for professional presentation.


