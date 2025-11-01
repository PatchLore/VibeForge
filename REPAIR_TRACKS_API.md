# Repair Tracks API

## Overview

The `/api/repair-tracks` endpoint finds and fixes tracks with missing or invalid images.

## What It Does

Finds the 3 most recent tracks where:
- `image_url IS NULL`
- `resolution IS NULL`
- `resolution NOT IN ('2048x1152', '2K')`

For each track:
1. Uses `extended_prompt_image` to regenerate a new image via `generateImage()`
2. Synchronous generation only (no callback)
3. Verifies image dimensions using `verifyAndUpscaleTo2K()`
4. Only saves if image is ≥2048x1152

## Usage

### Via API Call
```bash
# Call the API endpoint
curl https://www.soundswoop.com/api/repair-tracks

# Or with authentication if needed
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://www.soundswoop.com/api/repair-tracks
```

### Via Browser
Navigate to: `https://www.soundswoop.com/api/repair-tracks`

### Response Format
```json
{
  "success": true,
  "summary": {
    "fixed": 2,
    "skipped": 1,
    "failed": 0,
    "total": 3
  },
  "results": [
    {
      "trackId": 123,
      "title": "Energetic Beat",
      "success": true,
      "imageUrl": "https://...",
      "resolution": "2048x1152",
      "verifiedDimensions": "2048x1152"
    },
    {
      "trackId": 124,
      "title": "Chill Vibes",
      "success": false,
      "skipped": true,
      "reason": "No extended_prompt_image"
    }
  ]
}
```

## Logging

### Console Logs
The endpoint logs the following:

#### Search Phase
- `🔍 [REPAIR] Finding tracks that need image repair...`
- `📊 [REPAIR] Found {count} tracks needing repair`

#### Processing Phase
- `🔧 [REPAIR] Regenerating image for track {id}`
- `[REPAIR] ✅ Image fixed for track {id}`
- `[REPAIR] ❌ Skipped — image invalid for track {id}`
- `[REPAIR] ❌ Skipped — no extended_prompt_image for track {id}`

#### Summary Phase
- `✅ [REPAIR] Repair process complete!`
- `📊 [REPAIR] Summary:`
- `   - Fixed: {count}`
- `   - Skipped: {count}`
- `   - Failed: {count}`

## Safety Features

### Idempotent
- Can be called multiple times safely
- Won't modify tracks that already have valid images
- Only processes tracks with `status = 'completed'`

### Validation
- Only saves images that pass dimension verification
- Requires `extended_prompt_image` to exist
- Handles errors gracefully

### Non-Destructive
- Only updates:
  - `image_url`
  - `resolution`
  - `updated_at`
- Never modifies other fields
- Never changes track status

## Monitoring

### View Logs
```bash
# Vercel logs
vercel logs

# Or in Vercel dashboard
# https://vercel.com/dashboard -> Your Project -> Logs
```

### Expected Log Flow
```
🚀 [REPAIR] Starting track repair process...
🔍 [REPAIR] Finding tracks that need image repair...
📊 [REPAIR] Found 3 tracks needing repair
--- Processing track 123 ---
🔧 [REPAIR] Regenerating image for track 123
🖼️ [SYNC IMAGE] Image verified at 2048x1152
[REPAIR] ✅ Image fixed for track 123
✅ [REPAIR] Repair process complete!
📊 [REPAIR] Summary: Fixed: 2, Skipped: 1, Failed: 0
```

## Error Handling

### Common Error Responses

#### No Tracks Found
```json
{
  "success": true,
  "message": "No tracks need repair",
  "fixed": 0,
  "skipped": 0,
  "failed": 0
}
```

#### Database Error
```json
{
  "success": false,
  "error": "Database query failed"
}
```

#### Missing Config
```json
{
  "success": false,
  "error": "Supabase not initialized"
}
```

## Manual Script Alternative

If you prefer to run locally, use the standalone script:

```bash
# Make sure you have tsx installed
npm install -D tsx

# Run the repair script
npx tsx scripts/repair-tracks.ts
```

---

**Endpoint**: `/api/repair-tracks`  
**Method**: GET  
**Auth**: Not required (optional bearer token)  
**Rate Limit**: None (but only processes 3 tracks per call)  
**Status**: ✅ Production Ready

