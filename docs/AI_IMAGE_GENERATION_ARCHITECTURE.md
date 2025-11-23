# 📘 DOCUMENT: AI Image Generation Architecture (Runware + DeepInfra)

**Version 1.1 – November 2025**

**Author:** Allen Dunn & ChatGPT Dev Assistant

**Use Case:** For Soundswoop, OnPointPrompt, FixBlox, Ambient Video Lab, AuralMix, etc.

**Changelog:**
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

## 🔥 3. Primary Model: FLUX.1-Schnell (Apache 2.0 License)

### Why we use it:

- ✅ **100% commercial safe** (Apache 2.0 License)
- ✅ **Fastest image model in the world** (0.5–1.5 seconds)
- ✅ **Great quality** (85% of Flux Pro)
- ✅ **Extremely cheap** ($0.0006–$0.0015 per image)
- ✅ **Supported natively on Runware**
- ✅ **Works with LoRAs** (SDXL + Schnell-compatible ones)

---

## 🎯 4. LoRA Support (DeepInfra Only)

**⚠️ CRITICAL:** LoRAs are **ONLY** sent to DeepInfra, **NEVER** to Runware.

- ✅ If **ANY LoRA is selected** → Route to DeepInfra immediately (bypass Runware)
- ✅ LoRAs use **Civitai SDXL format** (e.g., `civitai:122359@135867`)
- ❌ Runware **never receives LoRAs** (prevents `invalidLoraModel` errors)
- ✅ DeepInfra supports full SDXL LoRA compatibility

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

## 🌊 5. Waterfall Routing Logic

The system uses **two different routing paths** based on whether LoRAs are selected:

### 🟢 CASE A — No LoRAs Selected

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

**Result:** Fastest path for 90% of requests (no LoRAs).

### 🔵 CASE B — LoRAs Selected

**Waterfall:** DeepInfra (with LoRAs) → DeepInfra (without LoRAs) → fail

1. **Try DeepInfra FLUX.1-Dev with LoRAs**
   - Model: `black-forest-labs/FLUX.1-dev`
   - Payload includes `loras: [{model: "civitai:XXXX", weight: 0.8}]`
   - If successful → return image
   - If fails → continue to step 2

2. **Try DeepInfra FLUX.1-Dev without LoRAs** (graceful fallback)
   - Same model, but LoRAs removed from payload
   - If successful → return image
   - If fails → return error

**Result:** Full SDXL LoRA support, avoids Runware errors.

**⚠️ CRITICAL:** Runware is **completely bypassed** when ANY LoRA is selected.

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
  "modelId": "runware:101@1",
  "provider": "runware",
  "loraId": "civitai:122359@135867",
  "loraStrength": 1.0,
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": 12345
}
```

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
- [ ] Copy model definitions from `src/data/models.ts`
- [ ] Copy LoRA styles from `src/lib/loraStyles.ts` (if using LoRAs)
- [ ] Update UI component to use the unified API endpoint
- [ ] Test waterfall routing (Runware → DeepInfra fallback) for **no-LoRA** requests
- [ ] Test LoRA routing (DeepInfra only, bypasses Runware) for **LoRA** requests
- [ ] Verify LoRAs are never sent to Runware (check logs)
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

1. **Use Runware first** (fastest + cheapest) - **only for non-LoRA requests**
2. **LoRAs automatically route to DeepInfra** (bypasses Runware completely)
3. **Use LoRAs only when needed** (adds slight overhead, but enables style control)
4. **Cache generated images** when possible
5. **Monitor API usage** to optimize costs
6. **Check logs** for routing decisions: `[GEN] LoRAs detected — routing to DeepInfra only`

---

## 📞 14. Support & Updates

For questions or updates to this architecture:

- **Author:** Allen Dunn
- **Last Updated:** November 2025
- **Version:** 1.1

---

**End of Document**

