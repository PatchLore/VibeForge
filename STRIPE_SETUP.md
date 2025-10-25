# Stripe Setup Guide for Soundswoop

## Current Status

✅ **Code is ready**: Checkout, webhook, and credits system are implemented  
❌ **Not configured**: Stripe keys and products need to be set up

## Quick Setup Steps

### 1. Create Stripe Account
1. Go to https://stripe.com
2. Sign up for a free account
3. Complete business verification

### 2. Get Your API Keys

From Stripe Dashboard → Developers → API keys:

**Test Mode** (for development):
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

**Live Mode** (for production):
- Publishable key: `pk_live_...`
- Secret key: `sk_live_...`

### 3. Create Products & Prices in Stripe

Go to Stripe Dashboard → Products → Add Product

Create these 3 products:

#### Product 1: Pro Plan (Monthly Subscription)
- **Name**: Pro Plan
- **Description**: 2,000 credits per month
- **Price**: $9.99
- **Billing**: Recurring (monthly)
- **Price ID**: Copy this (starts with `price_...`)
  - Example: `price_pro_month`

#### Product 2: Creator Plan (Monthly Subscription)
- **Name**: Creator Plan
- **Description**: 5,000 credits per month
- **Price**: $19.99
- **Billing**: Recurring (monthly)
- **Price ID**: Copy this
  - Example: `price_creator_month`

#### Product 3: Top-up Credits (One-time Payment)
- **Name**: Top-up Credits
- **Description**: 1,000 bonus credits
- **Price**: $4.99
- **Billing**: One-time
- **Price ID**: Copy this
  - Example: `price_topup_1k`

### 4. Set Up Webhook Endpoint

In Stripe Dashboard → Developers → Webhooks:

1. Click **"Add endpoint"**
2. **Endpoint URL**: `https://soundswoop.com/api/stripe-webhook`
3. **Events to listen to**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
4. Copy the **Signing secret** (starts with `whsec_...`)

### 5. Add Environment Variables to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

```bash
# Stripe Secret Key (from step 2)
STRIPE_SECRET_KEY=sk_live_... 

# Stripe Webhook Secret (from step 4)
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL (already set)
NEXT_PUBLIC_BASE_URL=https://soundswoop.com
```

### 6. Update Price IDs in Code

Edit `src/app/api/checkout/route.ts` and `src/app/api/stripe-webhook/route.ts`:

Replace the placeholder price IDs with your actual Stripe price IDs:

```typescript
const PRICE_MAP: Record<string, { credits: number; plan: string }> = {
  price_pro_month: { credits: 2000, plan: 'pro' },        // Replace with your Stripe price ID
  price_creator_month: { credits: 5000, plan: 'creator' }, // Replace with your Stripe price ID
  price_topup_1k: { credits: 1000, plan: 'free' },          // Replace with your Stripe price ID
};
```

### 7. Set Up Supabase Tables

Ensure these tables exist in Supabase:

#### `users` table:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 100,
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Functions:
```sql
-- Deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(user_id UUID, amount INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users 
  SET credits = credits - amount 
  WHERE id = user_id AND credits >= amount;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add credits
CREATE OR REPLACE FUNCTION add_credits(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET credits = credits + amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Update plan
CREATE OR REPLACE FUNCTION update_user_plan(user_id UUID, new_plan TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET plan = new_plan 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
```

### 8. Test the Integration

#### Test Mode:
1. Use test API keys (`sk_test_...`)
2. Use test card: `4242 4242 4242 4242`
3. Expiry: Any future date
4. CVC: Any 3 digits

#### Test Flow:
1. Go to `/pricing` page
2. Click "Subscribe to Pro"
3. Complete checkout with test card
4. Check Supabase `users` table for credits added
5. Check Stripe Dashboard for webhook events

### 9. Go Live

When ready for production:

1. **Switch to Live Keys**:
   - Replace `sk_test_...` with `sk_live_...` in Vercel
   - Update webhook endpoint to live signing secret

2. **Test Production Checkout**:
   - Use real card with small amount
   - Verify credits are added correctly
   - Check webhook logs in Stripe Dashboard

3. **Monitor**:
   - Stripe Dashboard → Payments (for transactions)
   - Stripe Dashboard → Webhooks (for delivery status)
   - Vercel Logs (for API errors)

## Troubleshooting

### Webhook Not Working?
- Check webhook URL is correct: `https://soundswoop.com/api/stripe-webhook`
- Verify signing secret matches Vercel env var
- Check Vercel logs for errors
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe-webhook`

### Credits Not Adding?
- Check Supabase RPC functions exist
- Verify webhook events are being received
- Check user email matches Stripe customer email
- Review Vercel logs for errors

### Checkout Failing?
- Verify `STRIPE_SECRET_KEY` is set in Vercel
- Check price IDs match Stripe Dashboard
- Ensure base URL is correct: `https://soundswoop.com`

## Current Product Configuration

Based on code, you need to create these in Stripe:

| Plan | Price | Credits | Type | Price ID Variable |
|------|-------|---------|------|-------------------|
| Pro | $9.99/mo | 2,000 | Subscription | `price_pro_month` |
| Creator | $19.99/mo | 5,000 | Subscription | `price_creator_month` |
| Top-up | $4.99 | 1,000 | One-time | `price_topup_1k` |

## Support

- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Vercel Environment Variables: https://vercel.com/docs/environment-variables


