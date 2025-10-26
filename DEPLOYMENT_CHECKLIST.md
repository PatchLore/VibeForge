# Soundswoop Deployment & Debug Checklist

## 🧩 1️⃣ Environment Verification

Before deploying to Vercel, confirm all required variables exist and match across `.env.local` and Vercel Production:

| Key | Example | Notes |
|-----|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Matches Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `...` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `...` | Private key for server routes |
| `STRIPE_SECRET_KEY` | `sk_live_...` | From Stripe dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | For frontend checkout |
| `KIE_API_KEY` | `...` | From Kie.ai |
| `KIE_CALLBACK_URL` | `https://www.soundswoop.com/api/callback` | ✅ **Must include www** |
| `NEXT_PUBLIC_CREDIT_SYSTEM_ENABLED` | `true` | Enables credit deduction |
| `NODE_ENV` | `production` | Ensure not "development" |

✅ All must be defined for "Production" scope in Vercel Settings.

---

## 🧭 2️⃣ Health Check Before Deployment

Use your built-in `/api/health` route (create if missing):

```typescript
export async function GET() {
  return Response.json({
    kie_callback: process.env.KIE_CALLBACK_URL,
    supabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    time: new Date().toISOString()
  });
}
```

Run this before every deployment:

```bash
curl https://www.soundswoop.com/api/health
```

→ Output should show the correct callback URL and non-empty Supabase keys.

---

## 🧠 3️⃣ Deployment Steps

1. **Commit working branch**: `stable-working-build`
2. **Push & Deploy**: Vercel → Deployments → Redeploy Latest
3. **Verify Build Logs**: No missing environment warnings
4. **Run Health Check**
5. **Trigger one test generation**

---

## 🎧 4️⃣ Post-Deploy Functional Test

After deployment, test this full chain:

| Step | Endpoint | What to Expect |
|------|----------|----------------|
| 1. Generate track | `/api/music` | Returns `task_id` & logs `KIE CALLBACK URL: https://www.soundswoop.com/api/callback` |
| 2. Wait 1–2 min | — | `/api/status` shows "pending" |
| 3. Callback fires | `/api/callback` | Logs `[CALLBACK RECEIVED type: completed]` |
| 4. DB update | Supabase `tracks` | New row with correct `user_id` |
| 5. Credits | Supabase `profiles` | Decrements by 12 |
| 6. UI | Navbar | Updates with remaining credits |

If any step fails → check Vercel logs for `[CALLBACK RECEIVED]` or deduction errors.

---

## ⚙️ 5️⃣ Safe Debug Tools

**Debug endpoints:**

- `/api/debug-callback` — manual callback tester

```bash
curl -X POST https://www.soundswoop.com/api/debug-callback \
  -H "Content-Type: application/json" \
  -d '{"task_id":"test123"}'
```

- `/api/health` — confirms live environment config

**Common checks:**

- Missing `www` → callback never hits
- Supabase RLS → update fails silently
- Anon key used instead of service key → credit deduction blocked

---

## 🛡️ 6️⃣ Version Control Safety

- Tag every known-good build: `stable-v1`, `stable-v2`, etc.
- Keep `.env.backup` in your local workspace (never commit).
- Always test major API changes on a Preview deployment before Production.

---

## 🪄 7️⃣ If Generation Hangs

1. Check Vercel logs for `KIE CALLBACK URL` value.
2. If no `[CALLBACK RECEIVED]` after 2 min → Kie.ai still calling wrong domain.
3. Test `/api/debug-callback` manually.
4. Verify Kie.ai project settings → `https://www.soundswoop.com/api/callback`.

---

## ✅ 8️⃣ Definition of "Stable"

A deployment is stable when:

- Health check passes ✅
- Callback logs show `type: completed` ✅
- Credits decrement ✅
- Track visible in Supabase ✅
- No console errors in `/app` ✅

At that point:
→ Tag the commit in Git
→ Snapshot in Vercel ("Promote to Production")
