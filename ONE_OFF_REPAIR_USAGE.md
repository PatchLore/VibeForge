# One-Off Track Repair - Usage Guide

## Overview

Two methods to repair a specific broken track by ID.

## Method 1: API Endpoint (Recommended)

### Endpoint
```
GET /api/repair-track/{trackId}
```

### Usage
```bash
# Repair the specific track
curl https://www.soundswoop.com/api/repair-track/0ed159ad-3dcd-4e2d-ad88-29e899685f62

# Or visit in browser
open https://www.soundswoop.com/api/repair-track/0ed159ad-3dcd-4e2d-ad88-29e899685f62
```

### Response (Success)
```json
{
  "success": true,
  "message": "Track repaired successfully",
  "track": {
    "id": "0ed159ad-3dcd-4e2d-ad88-29e899685f62",
    "title": "Track Name",
    "oldImageUrl": null,
    "oldResolution": null,
    "newImageUrl": "https://...",
    "newResolution": "2048x1152",
    "verifiedDimensions": "2048x1152"
  }
}
```

### Response (Failure)
```json
{
  "success": false,
  "error": "Error description",
  "details": { ... }
}
```

## Method 2: Standalone Script

### Prerequisites
```bash
npm install -D tsx
```

### Usage
```bash
# Set the track ID
export TRACK_ID=0ed159ad-3dcd-4e2d-ad88-29e899685f62

# Run the script
npx tsx scripts/repair-specific-track.ts
```

### Or Modify the Script
Edit `scripts/repair-specific-track.ts` and change the `TRACK_ID` constant:

```typescript
const TRACK_ID = "0ed159ad-3dcd-4e2d-ad88-29e899685f62";
```

Then run:
```bash
npx tsx scripts/repair-specific-track.ts
```

## What It Does

1. **Fetches track** by ID from Supabase
2. **Validates** that `extended_prompt_image` exists
3. **Generates** new 2K image synchronously
4. **Verifies** dimensions using `verifyAndUpscaleTo2K()`
5. **Updates** database if image is valid (≥2048x1152)

## Logs

### Success Flow
```
🔧 [REPAIR] Starting one-off repair for track 0ed159ad-3dcd-4e2d-ad88-29e899685f62
🔍 [REPAIR] Fetching track 0ed159ad-3dcd-4e2d-ad88-29e899685f62...
📋 [REPAIR] Track found: Track Name
   Current image_url: NULL
   Current resolution: NULL
🎨 [REPAIR] Using prompt: A stunning visual representation of...
🖼️ [REPAIR] Generating new image...
🖼️ [SYNC IMAGE] Image verified at 2048x1152
✅ [REPAIR] Image generated: https://...
🔍 [REPAIR] Verifying image dimensions...
📏 [REPAIR] Verified size: 2048x1152
💾 [REPAIR] Image valid, updating database...
✅ [REPAIR] Track 0ed159ad-3dcd-4e2d-ad88-29e899685f62 successfully repaired!
```

### Failure Flow
```
🔧 [REPAIR] Starting one-off repair for track 0ed159ad-3dcd-4e2d-ad88-29e899685f62
🔍 [REPAIR] Fetching track 0ed159ad-3dcd-4e2d-ad88-29e899685f62...
❌ [REPAIR] Track not found: 0ed159ad-3dcd-4e2d-ad88-29e899685f62
```

## Safety Features

✅ **Idempotent**: Can be run multiple times safely  
✅ **Non-destructive**: Only updates `image_url`, `resolution`, `updated_at`  
✅ **Validation**: Only saves if image ≥2048x1152  
✅ **Error handling**: Graceful failure with clear error messages  
✅ **Logging**: Detailed console logs for debugging

## Common Errors

### Track Not Found
```json
{
  "success": false,
  "error": "Track not found"
}
```
**Solution**: Verify the track ID is correct

### No Prompt Available
```json
{
  "success": false,
  "error": "No extended_prompt_image available for this track"
}
```
**Solution**: Track created before prompts were stored; cannot regenerate

### Image Too Small
```json
{
  "success": false,
  "error": "Generated image is too small",
  "details": {
    "width": 1024,
    "height": 576,
    "minimum": "2048x1152"
  }
}
```
**Solution**: Kie.ai returned low-res image; will retry on next call

## Quick Reference

### Repair Multiple Tracks
Use the batch repair endpoint:
```bash
curl https://www.soundswoop.com/api/repair-tracks
```

### Repair Specific Track
Use the one-off endpoint:
```bash
curl https://www.soundswoop.com/api/repair-track/{trackId}
```

---

**Track ID**: `0ed159ad-3dcd-4e2d-ad88-29e899685f62`  
**Endpoint**: `/api/repair-track/0ed159ad-3dcd-4e2d-ad88-29e899685f62`  
**Status**: ✅ Ready to use

