# Image Generation Debug Logging

## Overview

Comprehensive logging added to trace image generation failures and debug undefined URLs.

## Logging Hierarchy

### 1. Repair Route Logs (`src/app/api/repair-track/[id]/route.ts`)

#### Track Fetching
- `🔍 [REPAIR] Fetching track {id}...`
- `📋 [REPAIR] Track found: {title}`
- `   Current image_url: {url}`
- `   Current resolution: {resolution}`

#### Prompt Validation
- `🎨 [REPAIR] Using prompt: {preview}...`
- `📝 [REPAIR] Full prompt length: {length} characters`

#### Image Generation
- `🖼️ [REPAIR] Calling generateImage() with prompt...`

#### Result Validation
- `📦 [REPAIR] generateImage() returned:` with full object structure
- `❌ [REPAIR] generateImage() returned undefined/null`
- `❌ [REPAIR] No image URL in result object`
- `🔍 [REPAIR] Full result:` JSON dump
- `✅ [REPAIR] Image generated successfully`
- `🔗 [REPAIR] Image URL: {url}`
- `📐 [REPAIR] Resolution: {resolution}`

#### Verification
- `🔍 [REPAIR] Verifying image dimensions...`
- `📏 [REPAIR] Verified size: {width}x{height}`
- `💾 [REPAIR] Image valid, updating database...`
- `✅ [REPAIR] Track {id} successfully repaired!`

### 2. Image Generation Logs (`src/lib/kie.ts`)

#### Setup
- `🖼️ [SYNC IMAGE] Model: {model} | Resolution: {resolution}`
- `🎨 [SYNC IMAGE] Prompt length: {length} characters`
- `🎨 [SYNC IMAGE] Prompt preview: {first 150 chars}...`
- `🎨 [SYNC IMAGE] Quality: {quality} | Steps: {steps}`
- `🔑 [SYNC IMAGE] API Key present: {bool} (length: {length})`

#### Request
- `🧠 [SYNC IMAGE] Sending request for 2K image generation`
- `🌐 [SYNC IMAGE] URL: {url}`
- `📤 [SYNC IMAGE] Headers: {headers}` (redacted auth)
- `📦 [SYNC IMAGE] Request body:` JSON dump

#### Response
- `🧠 [SYNC IMAGE] Response status: {status}`
- `🧠 [SYNC IMAGE] Response headers:` full headers
- `📥 [SYNC IMAGE] Response data:` JSON dump

#### Data Extraction
- `🔍 [SYNC IMAGE] Extracting image URL from response...`
- `🔍 [SYNC IMAGE] Data structure:` object keys inspection
- `✅ [SYNC IMAGE] Received image URL: {url}`
- `❌ [SYNC IMAGE] Data structure dump:` JSON if null

#### Retry Path
- `🖼️ [SYNC IMAGE] Error response: {data}`
- `🔄 [SYNC IMAGE] Retrying once with adjusted parameters`
- `🔄 [SYNC IMAGE] Retry response status: {status}`
- `📥 [SYNC IMAGE] Retry response data:` JSON dump
- `🔍 [SYNC IMAGE] Retry success, extracting image URL...`
- `🔍 [SYNC IMAGE] Retry image URL: {url or NULL}`
- `❌ [SYNC IMAGE] Retry data structure:` JSON if null

#### Verification
- `🖼️ [SYNC IMAGE] Retry image verified at {width}x{height}`
- `🖼️ [SYNC IMAGE] Image verified at {width}x{height}`
- `🖼️ [SYNC IMAGE] Image generated at: {url}`
- `⚠️ [SYNC IMAGE] Retry image verification failed: {error}`
- `⚠️ [SYNC IMAGE] Verification failed: {error}`
- `⚠️ [SYNC IMAGE] Image too small ({width}x{height}), returning anyway`
- `❌ [SYNC IMAGE] Generation error: {error}`

## Expected Log Flow

### Success
```
🔧 [REPAIR] Starting one-off repair for track {id}
🔍 [REPAIR] Fetching track {id}...
📋 [REPAIR] Track found: {title}
   Current image_url: NULL
   Current resolution: NULL
🎨 [REPAIR] Using prompt: A stunning visual...
📝 [REPAIR] Full prompt length: 156 characters
🖼️ [REPAIR] Calling generateImage() with prompt...

🖼️ [SYNC IMAGE] Model: bytedance/seedream-v4-text-to-image | Resolution: 2048x1152
🎨 [SYNC IMAGE] Prompt length: 156 characters
🎨 [SYNC IMAGE] Prompt preview: A stunning visual representation of...
🎨 [SYNC IMAGE] Quality: high | Steps: 30
🔑 [SYNC IMAGE] API Key present: true (length: 64)
🧠 [SYNC IMAGE] Sending request for 2K image generation
🌐 [SYNC IMAGE] URL: https://api.kie.ai/api/v1/generate/image
📤 [SYNC IMAGE] Headers: {Authorization: "Bearer abc123..."}
📦 [SYNC IMAGE] Request body: {"model":"bytedance/seedream-v4-text-to-image",...}

🧠 [SYNC IMAGE] Response status: 200
🧠 [SYNC IMAGE] Response headers: {...}
📥 [SYNC IMAGE] Response data: {"code":200,"data":{"response":{"imageUrl":"https://..."}}}

🔍 [SYNC IMAGE] Extracting image URL from response...
🔍 [SYNC IMAGE] Data structure: {hasData: true, hasResponse: true, hasImageUrl: true, ...}
✅ [SYNC IMAGE] Received image URL: https://...
🖼️ [SYNC IMAGE] Image verified at 2048x1152
🖼️ [SYNC IMAGE] Image generated at: https://...

📦 [REPAIR] generateImage() returned: {hasImageUrl: true, hasResolution: true, ...}
✅ [REPAIR] Image generated successfully
🔗 [REPAIR] Image URL: https://...
📐 [REPAIR] Resolution: 2048x1152

🔍 [REPAIR] Verifying image dimensions...
📏 [REPAIR] Verified size: 2048x1152
💾 [REPAIR] Image valid, updating database...
✅ [REPAIR] Track {id} successfully repaired!
```

### Failure - No Image URL
```
🧠 [SYNC IMAGE] Response status: 200
📥 [SYNC IMAGE] Response data: {"code":200,"data":{}}

🔍 [SYNC IMAGE] Extracting image URL from response...
🔍 [SYNC IMAGE] Data structure: {hasData: true, hasResponse: false, hasImageUrl: false, ...}
❌ [SYNC IMAGE] Received image URL: undefined
❌ [SYNC IMAGE] Data structure dump: {full JSON}

📦 [REPAIR] generateImage() returned: {hasImageUrl: false, ...}
❌ [REPAIR] No image URL in result object
🔍 [REPAIR] Full result: {JSON dump}
```

### Failure - Retry Path
```
🧠 [SYNC IMAGE] Response status: 500
📥 [SYNC IMAGE] Response data: {"code":500,"msg":"Error message"}
🖼️ [SYNC IMAGE] Error response: {data}

🔄 [SYNC IMAGE] Retrying once with adjusted parameters
🔄 [SYNC IMAGE] Retry response status: 200
📥 [SYNC IMAGE] Retry response data: {"code":200,"data":{"response":{"imageUrl":"https://..."}}}

🔍 [SYNC IMAGE] Retry success, extracting image URL...
🔍 [SYNC IMAGE] Retry image URL: https://...
🖼️ [SYNC IMAGE] Retry image verified at 2048x1152
🖼️ [SYNC IMAGE] Image generated at: https://...
```

## Debugging Checklist

If image generation fails, check logs for:

1. **API Key**: `🔑 [SYNC IMAGE] API Key present` should be `true`
2. **Request**: `📦 [SYNC IMAGE] Request body` has correct params
3. **Response Status**: `🧠 [SYNC IMAGE] Response status` should be `200`
4. **Response Code**: `📥 [SYNC IMAGE] Response data` should have `code: 200`
5. **Data Structure**: `🔍 [SYNC IMAGE] Data structure` shows data path
6. **Image URL**: `✅ [SYNC IMAGE] Received image URL` is not undefined

---

**Commits**: af85200  
**Date**: January 2025  
**Status**: ✅ Production Ready






