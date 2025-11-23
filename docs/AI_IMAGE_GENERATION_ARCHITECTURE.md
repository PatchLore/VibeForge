# 📘 DOCUMENT: AI Image Generation Architecture (Runware + DeepInfra)

**Version 1.4 – November 2025**

**Author:** Allen Dunn & ChatGPT Dev Assistant

**Use Case:** For Soundswoop, OnPointPrompt, FixBlox, Ambient Video Lab, AuralMix, etc.

**Changelog:**
- **v1.4:** Use actual DeepInfra model IDs for LoRA-supported models (prevents 400/404 errors)
- **v1.3:** Added DreamShaper XL and Realistic Vision XL models, updated LoRA support (7 models total, 3 LoRA-supported)
- **v1.2:** 5-model system with LORA_SUPPORTED matrix, smart LoRA routing, auto-switch to sdxl-base
- **v1.1:** LoRAs now route to DeepInfra only (bypass Runware completely)
- **v1.0:** Initial architecture with Runware + DeepInfra waterfall

---

## 🧩 1. Overview

This document describes the standardized system for adding AI Image Generation capabilities into any PatchLore Web App using:

- **Runware.ai** (Primary Provider)
- **DeepInfra** (Secondary Fallback Provider)
- **FLUX.1-Schnell** (Primary Model)
- **Optional SDXL LoRA Pack** (Commercial Safe)
- **Waterfall Routing Logic**
- **Single unified `/api/ai/generate` endpoint**

This gives:

- ✅ Ultra-fast inference (0.5–1.5 seconds)
- ✅ Extremely cheap costs ($0.0006–$0.0015 per image)
- ✅ Legal, commercial-safe models
- ✅ Optional modular LoRA extensions
- ✅ Compatible across Next.js 15 with App Router

---

## ⚙️ 2. Environment Variables

Add to `.env.local` and Vercel dashboard:

```bash
# Runware Primary
RUNWARE_API_KEY=xxxxxxxxxxxx
RUNWARE_BASE_URL=https://api.runware.ai/v1

# DeepInfra Secondary
DEEPINFRA_API_KEY=xxxxxxxxxxxx
DEEPINFRA_FLUX_SCHNELL_URL=https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX.1-schnell
DEEPINFRA_FLUX_DEV_URL=https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX.1-dev

# LoRA (optional)
RUNWARE_LORA_ENABLED=true
```

**⚠️ Important:** No `NEXT_PUBLIC_` prefix is used. This is server-only for security.

---

## 🔥 3. Available Models

The system supports **7 models** with different characteristics:

### Model List:

1. **FLUX.1 Schnell (Fast — Runware)**
   - Value: `flux-schnell`
   - Provider: Runware (with DeepInfra fallbacks)
   - LoRA Support: ❌ No
   - Use Case: Fastest generation, cheapest cost

2. **FLUX.1 Dev (HQ — DeepInfra)**
   - Value: `flux-dev`
   - Provider: DeepInfra only
   - LoRA Support: ❌ No
   - Use Case: Highest quality Flux generation

3. **Seedream XL (Artistic — DeepInfra)**
   - Value: `seedream-xl`
   - Provider: DeepInfra only
   - LoRA Support: ❌ No
   - Use Case: Artistic, creative generations

4. **Janu Pro SDXL Turbo (Realistic — DeepInfra)**
   - Value: `janu-sdxl`
   - Provider: DeepInfra only
   - LoRA Support: ❌ No
   - Use Case: Realistic images without LoRA support

5. **SDXL Base 1.0 (Universal — SDXL LoRA)**
   - Value: `stabilityai/stable-diffusion-xl-base-1.0`
   - Provider: DeepInfra only
   - LoRA Support: ✅ Yes
   - Use Case: Universal SDXL with full LoRA compatibility
   - **Note:** Uses actual DeepInfra model ID (prevents 400/404 errors)

6. **DreamShaper XL v2 (Stylized — SDXL LoRA)**
   - Value: `Lykon/dreamshaper-xl-v2`
   - Provider: DeepInfra only
   - LoRA Support: ✅ Yes
   - Use Case: Stylized artistic generations with LoRA support
   - **Note:** Uses actual DeepInfra model ID (prevents 400/404 errors)

7. **Realistic Vision XL 4.0 (Realistic — SDXL LoRA)**
   - Value: `SG161222/Realistic_Vision_4.0`
   - Provider: DeepInfra only
   - LoRA Support: ✅ Yes
   - Use Case: Highly realistic images with LoRA support
   - **Note:** Uses actual DeepInfra model ID (prevents 400/404 errors)

### LoRA Compatibility Matrix:

```typescript
export const LORA_SUPPORTED = {
  "flux-schnell": false,
  "flux-dev": false,
  "seedream-xl": false,
  "janu-sdxl": false,
  "stabilityai/stable-diffusion-xl-base-1.0": true,
  "Lykon/dreamshaper-xl-v2": true,
  "SG161222/Realistic_Vision_4.0": true
};
```

**Only 3 models support LoRAs:** Uses actual DeepInfra model IDs to prevent "Model not available" errors

---

## 🎯 4. LoRA Support & Smart Routing

**⚠️ CRITICAL:** LoRAs are **ONLY** sent to DeepInfra, **NEVER** to Runware.

### LoRA Compatibility Rules:

1. **Only 3 models support LoRAs (using actual DeepInfra IDs):**
   - ✅ `stabilityai/stable-diffusion-xl-base-1.0` (SDXL Base 1.0)
   - ✅ `Lykon/dreamshaper-xl-v2` (DreamShaper XL v2)
   - ✅ `SG161222/Realistic_Vision_4.0` (Realistic Vision XL 4.0)

2. **Smart Auto-Switching:**
   - If LoRAs are selected but model doesn't support them → **automatically switch to `stabilityai/stable-diffusion-xl-base-1.0`**
   - Example: User selects `flux-schnell` with LoRAs → system switches to `stabilityai/stable-diffusion-xl-base-1.0`
   - Example: User selects `janu-sdxl` with LoRAs → system switches to `stabilityai/stable-diffusion-xl-base-1.0`
   - **Uses actual DeepInfra model IDs** to prevent "Model not available" (400/404) errors

3. **Non-LoRA Models:**
   - `flux-schnell`, `flux-dev`, `seedream-xl`, `janu-sdxl` → **LoRAs are automatically removed**
   - These models cannot use SDXL LoRAs

### LoRA Format:

- LoRAs use **Civitai SDXL format** (e.g., `civitai:122359@135867`)
- DeepInfra payload: `{loras: [{model: "civitai:XXXX", weight: 0.8}]}`
- Weight range: 0.0–2.5

### Recommended LoRA Pack (Commercial Safe):

1. **Detail Tweaker XL (Intensity / Grit)**
   - Civitai ID: `civitai:122359@135867`
   - Default Scale: 1.0

2. **SDXL Inkdrawing (Raw Emotion)**
   - Civitai ID: `civitai:154918@173694`
   - Default Scale: 0.9

3. **Warm Light XL v2 (Nostalgia & Comfort)**
   - Civitai ID: `civitai:290860@592197`
   - Default Scale: 0.8

4. **Watercolor – Textured Paper (Soft Dreaminess)**
   - Civitai ID: `civitai:120789@131382`
   - Default Scale: 0.7

5. **Fine Tuned Detailed Eyes (Realistic Emotion)**
   - Civitai ID: `civitai:316969@355491`
   - Default Scale: 0.8

These are **100% safe for SaaS** and work with DeepInfra's FLUX.1-dev model.

### ⚠️ Flux-based LoRAs (NOT Commercial Safe)

- ❌ Fluxlisimo
- ❌ Eldritch
- ❌ Abstract PopArt
- ❌ Dark Cinematic

**→ NOT commercial safe unless you buy a Flux license.**

---

## 🌊 5. Routing Logic by Model

The system routes requests based on the selected model and LoRA compatibility:

### 🟢 `flux-schnell` (FLUX.1 Schnell)

**Waterfall:** Runware → DeepInfra Schnell → DeepInfra Dev → fail

1. **Try Runware FLUX.1-Schnell** (fastest, cheapest)
   - If successful → return image
   - If fails → continue to step 2

2. **Try DeepInfra FLUX.1-Schnell** (fast fallback)
   - If successful → return image
   - If fails → continue to step 3

3. **Try DeepInfra FLUX.1-Dev** (high quality fallback)
   - If successful → return image
   - If fails → return error

**LoRAs:** Automatically removed (Flux models don't support LoRAs)

### 🔵 `flux-dev` (FLUX.1 Dev)

**Direct:** DeepInfra FLUX.1-Dev only

- No waterfall, direct DeepInfra call
- **LoRAs:** Automatically removed

### 🟡 `seedream-xl` (Seedream XL)

**Direct:** DeepInfra Seedream XL only

- **LoRAs:** ❌ Not supported (automatically removed)

### 🟡 `janu-sdxl` (Janu Pro SDXL Turbo)

**Direct:** DeepInfra Janu Pro SDXL Turbo

- **LoRAs:** ❌ Not supported (automatically removed)

### 🟢 `stabilityai/stable-diffusion-xl-base-1.0` (SDXL Base 1.0)

**Direct:** DeepInfra SDXL Base

- **LoRAs:** ✅ Supported
- Waterfall: With LoRAs → Without LoRAs → fail
- **Auto-switch target:** If user selects non-LoRA model with LoRAs, switches here
- **Uses actual DeepInfra model ID** (prevents 400/404 errors)

### 🟢 `Lykon/dreamshaper-xl-v2` (DreamShaper XL v2)

**Direct:** DeepInfra DreamShaper XL v2

- **LoRAs:** ✅ Supported
- Waterfall: With LoRAs → Without LoRAs → fail
- Use Case: Stylized artistic generations
- **Uses actual DeepInfra model ID** (prevents 400/404 errors)

### 🟢 `SG161222/Realistic_Vision_4.0` (Realistic Vision XL 4.0)

**Direct:** DeepInfra Realistic Vision XL 4.0

- **LoRAs:** ✅ Supported
- Waterfall: With LoRAs → Without LoRAs → fail
- Use Case: Highly realistic images
- **Uses actual DeepInfra model ID** (prevents 400/404 errors)

### ⚠️ Smart LoRA Routing:

1. **User selects LoRAs + non-LoRA model** → Auto-switch to `stabilityai/stable-diffusion-xl-base-1.0`
   - Applies to: `flux-schnell`, `flux-dev`, `seedream-xl`, `janu-sdxl`
   - **Uses actual DeepInfra model ID** to prevent errors
2. **User selects LoRAs + LoRA-compatible model** → Use selected model with LoRAs
   - Applies to: `stabilityai/stable-diffusion-xl-base-1.0`, `Lykon/dreamshaper-xl-v2`, `SG161222/Realistic_Vision_4.0`
   - **All use actual DeepInfra model IDs** (no shorthand names)
3. **LoRAs are automatically removed** for non-LoRA models before generation
4. **Payload sanitization** ensures LoRAs are never sent to:
   - Runware (any model)
   - Flux models (flux-schnell, flux-dev)
   - Seedream XL

---

## 🧠 6. API Route: `/api/ai/generate`

This is a standard endpoint you copy into any PatchLore app:

- ✅ Soundswoop
- ✅ OnPointPrompt
- ✅ Fixblox
- ✅ AuralMix
- ✅ Ambient Video Lab
- ✅ RebookFlow
- ✅ InvoiceGenius

It will work everywhere.

### Inside:

- Accepts `prompt`, `steps`, `loras`, `seed`, `aspect`
- Routes based on waterfall
- Returns `data:image/png;base64,...`

### Request Format:

```json
{
  "prompt": "A beautiful emotional neon sunset",
  "modelId": "flux-schnell",
  "provider": "deepinfra",
  "loraId": "civitai:122359@135867",
  "loraStrength": 1.0,
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": 12345
}
```

**Model IDs:**
- `flux-schnell` - FLUX.1 Schnell (Runware)
- `flux-dev` - FLUX.1 Dev (DeepInfra)
- `seedream-xl` - Seedream XL (DeepInfra)
- `janu-sdxl` - Janu Pro SDXL Turbo (DeepInfra)
- `stabilityai/stable-diffusion-xl-base-1.0` - SDXL Base 1.0 (DeepInfra) ✅ LoRA-supported
- `Lykon/dreamshaper-xl-v2` - DreamShaper XL v2 (DeepInfra) ✅ LoRA-supported
- `SG161222/Realistic_Vision_4.0` - Realistic Vision XL 4.0 (DeepInfra) ✅ LoRA-supported

**⚠️ Important:** LoRA-supported models use **actual DeepInfra model IDs** (not shorthand names) to prevent "Model not available" errors.

### Response Format:

```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

## 🖼 7. Runware Payload Format

```json
{
  "taskType": "imageInference",
  "taskUUID": "unique-uuid-here",
  "positivePrompt": "A beautiful emotional neon sunset",
  "model": "runware:101@1",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": 12345,
  "outputType": "dataURI",
  "outputFormat": "PNG",
  "deliveryMethod": "sync",
  "numberResults": 1
}
```

**⚠️ CRITICAL:** Runware **NEVER** receives LoRA fields. If LoRAs are selected, the request is routed to DeepInfra instead.

**Note:** Runware only accepts AIR identifiers (not Civitai IDs), and we use DeepInfra for all LoRA requests to avoid compatibility issues.

---

## 🖼 8. DeepInfra Payload Format (Schnell or Dev)

### Without LoRAs:

```json
{
  "prompt": "A beautiful emotional neon sunset",
  "width": 1024,
  "height": 1024,
  "num_inference_steps": 4,
  "seed": 12345
}
```

### With LoRAs:

```json
{
  "prompt": "A beautiful emotional neon sunset",
  "model": "black-forest-labs/FLUX.1-dev",
  "width": 1024,
  "height": 1024,
  "num_inference_steps": 25,
  "seed": 12345,
  "loras": [
    {
      "model": "civitai:122359@135867",
      "weight": 0.8
    },
    {
      "model": "civitai:290860@592197",
      "weight": 0.5
    }
  ]
}
```

**Note:** 
- DeepInfra **fully supports LoRAs** with FLUX.1-dev model
- LoRA format: `{model: "civitai:XXXX", weight: 0.0-2.5}`
- Multiple LoRAs can be included in the `loras` array
- LoRA support is **DeepInfra-only** (Runware never receives LoRAs)

---

## 🛡 9. Licensing Compliance

### Commercial-safe:

- ✅ **FLUX.1-Schnell** (Apache 2.0 License)
- ✅ **SDXL LoRAs** (Commercial-safe SDXL-based LoRAs via DeepInfra)
- ✅ **Your own prompt mixing**
- ✅ **All Runware + DeepInfra Schnell generations**
- ✅ **DeepInfra FLUX.1-dev with SDXL LoRAs** (SDXL LoRAs are commercial-safe)

### NOT commercial-safe:

- ❌ **Flux Dev** (Requires license for commercial use)
- ❌ **Flux Dev LoRAs** (Requires license)
- ❌ **Flux-based Cinematic / Eldritch / Abstract LoRAs** (Requires license)
- ❌ **Fluxlisimo** (Requires license)

**⚠️ Use only SDXL LoRAs (via DeepInfra) until revenue allows a Flux Dev license.**

**Note:** All LoRAs are routed to DeepInfra, which supports commercial-safe SDXL LoRAs with FLUX.1-dev.

---

## 📝 10. Implementation Checklist

When adding AI Image Generation to a new PatchLore app:

- [ ] Add environment variables to `.env.local` and Vercel
- [ ] Copy `/api/generate/route.ts` from Soundswoop
- [ ] Copy model definitions from `src/data/models.ts` (includes `MODELS`, `LORA_SUPPORTED`, `MODEL_METADATA`)
- [ ] Copy LoRA styles from `src/lib/loraStyles.ts` (if using LoRAs)
- [ ] Update UI component to use the unified API endpoint
- [ ] Test model selection dropdown (5 models available)
- [ ] Test LoRA auto-switching (select non-LoRA model with LoRAs → should switch to `stabilityai/stable-diffusion-xl-base-1.0`)
- [ ] Test Seedream XL soft-block (select Seedream with LoRAs → LoRAs removed, model stays)
- [ ] Verify LoRA models use actual DeepInfra IDs (prevents 400/404 errors)
- [ ] Test payload sanitization (LoRAs removed for Runware, Flux, Seedream)
- [ ] Test waterfall routing (flux-schnell → Runware → DeepInfra Schnell → DeepInfra Dev)
- [ ] Test LoRA routing (janu-sdxl/sdxl-base with LoRAs → DeepInfra with LoRAs)
- [ ] Verify LoRAs are never sent to Runware or Flux models (check logs)
- [ ] Verify licensing compliance (SDXL LoRAs only, via DeepInfra)
- [ ] Monitor costs and performance

---

## 🔗 11. Related Files

- **API Route:** `src/app/api/generate/route.ts`
- **Model Definitions:** `src/data/models.ts`
- **LoRA Styles:** `src/lib/loraStyles.ts`
- **UI Component:** `src/components/agency/AIAssetGenerator.tsx`

---

## 📊 12. Cost Estimates

### Runware FLUX.1-Schnell:
- **Cost per image:** ~$0.0006–$0.0015
- **Speed:** 0.5–1.5 seconds
- **Quality:** 85% of Flux Pro

### DeepInfra FLUX.1-Schnell:
- **Cost per image:** ~$0.0008–$0.002
- **Speed:** 1–2 seconds
- **Quality:** 85% of Flux Pro

### DeepInfra FLUX.1-Dev:
- **Cost per image:** ~$0.002–$0.005
- **Speed:** 2–4 seconds
- **Quality:** 100% (highest quality)

---

## 🚀 13. Performance Tips

1. **Use `flux-schnell` for fastest generation** (Runware → DeepInfra fallback)
2. **Use LoRA-supported models for LoRA support:**
   - `stabilityai/stable-diffusion-xl-base-1.0` (Universal)
   - `Lykon/dreamshaper-xl-v2` (Stylized)
   - `SG161222/Realistic_Vision_4.0` (Realistic)
3. **System auto-switches to `stabilityai/stable-diffusion-xl-base-1.0`** if LoRAs are selected with non-LoRA model
4. **Seedream XL removes LoRAs automatically** (prevents errors, keeps artistic style)
5. **Flux models never receive LoRAs** (automatically stripped)
6. **All LoRA models use actual DeepInfra IDs** (prevents 400/404 "Model not available" errors)
7. **Payload sanitization** ensures LoRAs are never sent to incompatible models
8. **Cache generated images** when possible
9. **Monitor API usage** to optimize costs
10. **Check logs** for routing decisions:
    - `[LORA SWITCH] Model 'X' does NOT support LoRAs. Switching to SDXL Base.`
    - `[Seedream] LoRAs removed (Seedream does not support SDXL LoRAs).`
    - `[GEN] Requested model: X`
    - `[GEN] Final routed model: Y`
    - `[GEN] LoRAs used: N`
    - `[GEN] Provider: runware|deepinfra`

---

## 📞 14. Support & Updates

For questions or updates to this architecture:

- **Author:** Allen Dunn
- **Last Updated:** November 2025
- **Version:** 1.4

---

**End of Document**

