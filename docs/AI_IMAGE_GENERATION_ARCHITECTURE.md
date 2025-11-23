# 📘 DOCUMENT: AI Image Generation Architecture (Runware + DeepInfra)

**Version 1.0 – November 2025**

**Author:** Allen Dunn & ChatGPT Dev Assistant

**Use Case:** For Soundswoop, OnPointPrompt, FixBlox, Ambient Video Lab, AuralMix, etc.

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

## 🎯 4. LoRA Support (Optional Now, Add Later When Needed)

We only use **commercial-safe SDXL LoRAs**, not Flux Dev ones.

### Recommended LoRA Pack (Legal):

1. **Detail Tweaker XL**
   - AIR ID: `civitai:122359@135867`
   - Default Scale: 1.0

2. **SDXL Inkdrawing (Black & White Emotional)**
   - AIR ID: `civitai:154918@173694`
   - Default Scale: 0.9

3. **Cinematic Warm Light XL (SDXL version)**
   - AIR ID: `civitai:290860@592197`
   - Default Scale: 0.8

4. **Fine Tuned Detailed Eyes**
   - AIR ID: `civitai:316969@355491`
   - Default Scale: 0.8

5. **Vibrant Watercolor (SDXL)**
   - AIR ID: `civitai:1200817@1352135`
   - Default Scale: 0.7

These are **safe for SaaS**.

### ⚠️ Flux-based LoRAs (NOT Commercial Safe)

- ❌ Fluxlisimo
- ❌ Eldritch
- ❌ Abstract PopArt
- ❌ Dark Cinematic

**→ NOT commercial safe unless you buy a Flux license.**

---

## 🌊 5. Waterfall Routing Logic

### Step 1 — Try Runware FLUX.1-Schnell

If Runware responds within 3 seconds → return image.

### Step 2 — If timeout/error → DeepInfra Schnell

Second attempt with DeepInfra Schnell (fast + cheap).

### Step 3 — If still failing → DeepInfra Flux Dev

Higher quality fallback.

### Step 4 — Return failure if all 3 fail

**⚠️ Important:** If a LoRA is selected, **do NOT fallback to DeepInfra** (DeepInfra cannot load SDXL LoRAs while using Flux).

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
  "lora": ["civitai:122359@135867"],
  "outputType": "dataURI",
  "outputFormat": "PNG",
  "deliveryMethod": "sync",
  "numberResults": 1
}
```

**Note:** Runware API expects an array of LoRA IDs in the `lora` field. Scale is tracked separately but may not be directly supported in the API payload structure.

---

## 🖼 8. DeepInfra Payload Format (Schnell or Dev)

```json
{
  "prompt": "A beautiful emotional neon sunset",
  "width": 1024,
  "height": 1024,
  "num_inference_steps": 4,
  "seed": 12345
}
```

**Note:** DeepInfra does **not** support LoRAs when using Flux models. LoRA support is Runware-only.

---

## 🛡 9. Licensing Compliance

### Commercial-safe:

- ✅ **FLUX.1-Schnell** (Apache 2.0 License)
- ✅ **SDXL LoRAs** (Commercial-safe SDXL-based LoRAs)
- ✅ **Your own prompt mixing**
- ✅ **All Runware + DeepInfra Schnell generations**

### NOT commercial-safe:

- ❌ **Flux Dev** (Requires license for commercial use)
- ❌ **Flux Dev LoRAs** (Requires license)
- ❌ **Flux-based Cinematic / Eldritch / Abstract LoRAs** (Requires license)
- ❌ **Fluxlisimo** (Requires license)

**⚠️ Use only SDXL LoRAs until revenue allows a Flux Dev license.**

---

## 📝 10. Implementation Checklist

When adding AI Image Generation to a new PatchLore app:

- [ ] Add environment variables to `.env.local` and Vercel
- [ ] Copy `/api/generate/route.ts` from Soundswoop
- [ ] Copy model definitions from `src/data/models.ts`
- [ ] Copy LoRA styles from `src/lib/loraStyles.ts` (if using LoRAs)
- [ ] Update UI component to use the unified API endpoint
- [ ] Test waterfall routing (Runware → DeepInfra fallback)
- [ ] Test LoRA support (if enabled)
- [ ] Verify licensing compliance (SDXL LoRAs only)
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

1. **Use Runware first** (fastest + cheapest)
2. **Set timeout to 3 seconds** for Runware
3. **Use LoRAs only when needed** (adds slight overhead)
4. **Cache generated images** when possible
5. **Monitor API usage** to optimize costs

---

## 📞 14. Support & Updates

For questions or updates to this architecture:

- **Author:** Allen Dunn
- **Last Updated:** November 2025
- **Version:** 1.0

---

**End of Document**

