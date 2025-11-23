# Environment Variables Checklist

This document lists all environment variables used in the codebase and where they should be configured.

## Required Environment Variables

### Supabase Configuration

**Vercel Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key (for client-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side/admin operations)

**Supabase Dashboard Location:**
- Go to: Project Settings → API
- Copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

**Legacy/Alternative Names (some files still use these):**
- `SUPABASE_URL` (used in some older routes)
- `SUPABASE_KEY` (used in some older routes)

---

### Kie.ai API Keys

**Vercel Environment Variables:**
- `VIBEFORGE_API_KEY` - For music generation (Kie.ai music API)
- `KIE_IMAGE_API_KEY` - For image generation (Kie.ai image API)
- `KIE_CALLBACK_URL` - Callback URL for Kie.ai (defaults to `https://www.soundswoop.com/api/callback`)

**Alternative Names:**
- `KIE_MUSIC_API_KEY` (used in debug route, falls back to `VIBEFORGE_API_KEY`)

**Kie.ai Dashboard Location:**
- Get API keys from your Kie.ai account dashboard
- Ensure callback URL matches your production domain

---

### DeepInfra AI Configuration

**Vercel Environment Variables:**
- `NEXT_PUBLIC_DEEPINFRA_API_KEY` - DeepInfra API key for AI image generation
- `NEXT_PUBLIC_DEEPINFRA_BASE_URL` - DeepInfra API base URL (defaults to `https://api.deepinfra.com/v1/openai`)

**Note:** The code also supports `REACT_APP_DEEPINFRA_API_KEY` and `REACT_APP_DEEPINFRA_BASE_URL` for compatibility, but Next.js requires `NEXT_PUBLIC_` prefix for client-side environment variables.

**DeepInfra Dashboard Location:**
- Get API key from your DeepInfra account dashboard
- Visit: https://deepinfra.com/dash/api_keys

**Usage:**
- Used in the Agency Dashboard AI Asset Generator (`/agency`)
- Generates 2048x2048 images using DeepInfra's OpenAI-compatible API

---

### HuggingFace / Cognaix AI Configuration

**Vercel Environment Variables:**
- `NEXT_PUBLIC_HF_API_KEY` - HuggingFace API key for AI image generation
- `NEXT_PUBLIC_HF_BASE_URL` - HuggingFace Inference API base URL (defaults to `https://api-inference.huggingface.co/models`)
- `NEXT_PUBLIC_COGNAIX_API_KEY` - (Optional) Cognaix-specific API key if using Cognaix endpoint instead of HF
- `NEXT_PUBLIC_COGNAIX_BASE_URL` - (Optional) Cognaix-specific base URL if different from HF

**HuggingFace Dashboard Location:**
- Get API key from your HuggingFace account
- Visit: https://huggingface.co/settings/tokens
- Create a token with "Read" permissions

**Usage:**
- Used in the Agency Dashboard AI Asset Generator (`/agency`)
- Supports 7 elite models: Realistic Vision V6, Juggernaut XL V9, DreamShaper 8, Deliberate, CyberRealistic, OpenJourney v4, SynthwavePunk v2
- Generates images using HuggingFace Inference API
- Returns binary image data converted to base64

---

### Stripe Configuration

**Vercel Environment Variables:**
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (for webhook verification)
- `NEXT_PUBLIC_STRIPE_PRICE_PRO` - Stripe price ID for Pro plan
- `NEXT_PUBLIC_STRIPE_PRICE_CREATOR` - Stripe price ID for Creator plan
- `NEXT_PUBLIC_STRIPE_PRICE_TOPUP_1K` or `NEXT_PUBLIC_STRIPE_PRICE_1K` - Stripe price ID for 1K credit top-up

**Stripe Dashboard Location:**
- Go to: Developers → API keys
- Copy **Secret key** → `STRIPE_SECRET_KEY`
- Go to: Developers → Webhooks
- Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`
- Go to: Products → Copy Price IDs → Set in env vars

---

### Application Configuration

**Vercel Environment Variables:**
- `NEXT_PUBLIC_SITE_URL` - Your production site URL (e.g., `https://www.soundswoop.com`)
- `NEXT_PUBLIC_BASE_URL` - Base URL for API calls (defaults to `http://localhost:3000` in dev)
- `NEXT_PUBLIC_STARTING_CREDITS` - Default credits for new users (defaults to `36`)
- `NEXT_PUBLIC_CREDITS_PER_GENERATION` - Credits deducted per generation (defaults to `12`)

---

## Verification Steps

### 1. Check Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to: **Settings → Environment Variables**
3. Verify all variables listed above are present

### 2. Check Supabase Configuration

1. Go to Supabase Dashboard → Your Project
2. Navigate to: **Settings → API**
3. Compare:
   - **Project URL** should match `NEXT_PUBLIC_SUPABASE_URL` in Vercel
   - **anon public** key should match `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
   - **service_role** key should match `SUPABASE_SERVICE_ROLE_KEY` in Vercel

### 3. Check Application Logs

After deployment, check Vercel logs for:
- `✅ Kie.ai API keys loaded:` - Should show both keys loaded
- `🎵 Music Key: Loaded ✅` - Confirms `VIBEFORGE_API_KEY` is set
- `🖼️ Image Key: Loaded ✅` - Confirms `KIE_IMAGE_API_KEY` is set

### 4. Test Database Connection

Check if Supabase connection works by:
- Generating a track (should create a row in `tracks` table)
- Checking callback logs (should update `tracks` table)

---

## Common Issues

### ❌ "Missing VIBEFORGE_API_KEY"
- **Fix**: Add `VIBEFORGE_API_KEY` to Vercel environment variables

### ❌ "Missing KIE_IMAGE_API_KEY"
- **Fix**: Add `KIE_IMAGE_API_KEY` to Vercel environment variables

### ❌ "Supabase not initialized"
- **Fix**: Ensure both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### ❌ "Missing SUPABASE_SERVICE_ROLE_KEY"
- **Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API

### ❌ Database operations fail silently
- **Check**: Verify `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key (not anon key)
- **Check**: Ensure RLS policies allow service role access

---

## Quick Verification Script

You can add this to a test route to verify all env vars:

```typescript
// /api/test-env/route.ts
export async function GET() {
  const envVars = {
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    kie: {
      music: !!process.env.VIBEFORGE_API_KEY,
      image: !!process.env.KIE_IMAGE_API_KEY,
      callback: !!process.env.KIE_CALLBACK_URL,
    },
    deepinfra: {
      apiKey: !!process.env.NEXT_PUBLIC_DEEPINFRA_API_KEY,
      baseUrl: !!process.env.NEXT_PUBLIC_DEEPINFRA_BASE_URL,
    },
    stripe: {
      secret: !!process.env.STRIPE_SECRET_KEY,
      webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    app: {
      siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      baseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
    },
  };
  
  return NextResponse.json(envVars);
}
```

---

**Last Updated**: February 2025

