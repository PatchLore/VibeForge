import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function POST(request: NextRequest) {
  if (!stripe || !supabase) {
    return NextResponse.json(
      { error: 'Stripe or Supabase not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulCheckout(session);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleSuccessfulPayment(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
  const { userId, plan } = session.metadata!;
  const customerEmail = session.customer_email;

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Determine credits based on plan
  const creditsMap: Record<string, number> = {
    pro: 2500,
    creator: 10000,
  };

  const credits = creditsMap[plan] || 0;

  // Update user profile in Supabase
  const { error } = await supabase!
    .from('profiles')
    .upsert({
      id: userId,
      email: customerEmail,
      plan: plan,
      credits: credits,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }

  console.log(`✅ Updated profile for user ${userId}: plan=${plan}, credits=${credits}`);
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id;

  if (!customerId) {
    console.error('No customer ID in invoice');
    return;
  }

  // Get customer details
  const customer = await stripe!.customers.retrieve(customerId);
  const customerEmail = customer && !customer.deleted ? customer.email : null;

  if (!customerEmail) {
    console.error('No customer email found');
    return;
  }

  // Find user by email in Supabase
  const { data: user, error: userError } = await supabase!
    .from('profiles')
    .select('id, plan, credits')
    .eq('email', customerEmail)
    .single();

  if (userError || !user) {
    console.error('User not found:', userError);
    return;
  }

  // Determine credits based on current plan
  const creditsMap: Record<string, number> = {
    pro: 2500,
    creator: 10000,
  };

  const credits = creditsMap[user.plan] || 0;

  // Add credits to user account
  const { error: updateError } = await supabase!
    .from('profiles')
    .update({
      credits: user.credits + credits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to add credits:', updateError);
    throw updateError;
  }

  console.log(`✅ Added ${credits} credits to user ${user.id}`);
}