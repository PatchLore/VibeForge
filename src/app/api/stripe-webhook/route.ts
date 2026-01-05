import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper function to initialize Stripe client
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(secretKey, { 
    apiVersion: "2025-09-30.clover" 
  });
}

// Helper function to initialize Supabase client
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    // Check for Stripe secret key before processing
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ Missing STRIPE_SECRET_KEY environment variable');
      return NextResponse.json(
        { error: 'Stripe configuration is missing. STRIPE_SECRET_KEY environment variable is not set.' },
        { status: 500 }
      );
    }

    // Check for Supabase configuration before processing
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Supabase configuration is missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.' },
        { status: 500 }
      );
    }

    // Initialize Supabase client inside the handler
    const supabase = getSupabaseClient();

    // Get the raw request body and headers
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe client inside the handler
    const stripe = getStripeClient();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed.' },
        { status: 400 }
      );
    }

    console.log(`✅ Webhook signature verified. Processing event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(stripe, supabase, event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripe, supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripe, supabase, event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle successful checkout sessions
async function handleCheckoutSessionCompleted(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  try {
    console.log(`🛒 Processing checkout session: ${session.id}`);

    const customerEmail = session.customer_details?.email;
    const plan = session.metadata?.plan_type;

    if (!customerEmail) {
      console.error('❌ No customer email in checkout session');
      return;
    }

    if (!plan) {
      console.error('❌ No plan metadata in checkout session');
      return;
    }

    // Define credit amounts for each plan
    const creditMap: Record<string, number> = {
      pro: 2000,
      creator: 5000,
    };

    const credits = creditMap[plan];
    if (!credits) {
      console.error(`❌ Unknown plan type: ${plan}`);
      return;
    }

    // Find user in Supabase by email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, plan, credits')
      .eq('email', customerEmail)
      .single();

    if (userError || !user) {
      console.error(`❌ User not found for email: ${customerEmail}`, userError);
      return;
    }

    // Update user's plan and add credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: plan,
        credits: user.credits + credits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Failed to update user profile:', updateError);
      throw updateError;
    }

    console.log(`✅ User ${user.id} upgraded to ${plan} plan with ${credits} credits added`);

  } catch (error) {
    console.error('❌ Error handling checkout session:', error);
    throw error;
  }
}

// Handle successful invoice payments (recurring billing)
async function handleInvoicePaymentSucceeded(stripe: Stripe, supabase: SupabaseClient, invoice: Stripe.Invoice) {
  try {
    console.log(`💳 Processing invoice payment: ${invoice.id}`);

    const customerId = typeof invoice.customer === 'string' 
      ? invoice.customer 
      : invoice.customer?.id;

    if (!customerId) {
      console.error('❌ No customer ID in invoice');
      return;
    }

    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer && !customer.deleted ? customer.email : null;

    if (!customerEmail) {
      console.error('❌ No customer email found');
      return;
    }

    // Find user in Supabase
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, plan, credits')
      .eq('email', customerEmail)
      .single();

    if (userError || !user) {
      console.error(`❌ User not found for email: ${customerEmail}`, userError);
      return;
    }

    // Define credit amounts for each plan
    const creditMap: Record<string, number> = {
      pro: 2000,
      creator: 5000,
    };

    const credits = creditMap[user.plan];
    if (!credits) {
      console.error(`❌ Unknown plan type: ${user.plan}`);
      return;
    }

    // Add monthly credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: user.credits + credits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Failed to add monthly credits:', updateError);
      throw updateError;
    }

    console.log(`✅ Added ${credits} monthly credits to user ${user.id}`);

  } catch (error) {
    console.error('❌ Error handling invoice payment:', error);
    throw error;
  }
}

// Handle subscription updates (plan changes, etc.)
async function handleSubscriptionUpdated(stripe: Stripe, supabase: SupabaseClient, subscription: Stripe.Subscription) {
  try {
    console.log(`🔄 Processing subscription update: ${subscription.id}`);

    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id;

    if (!customerId) {
      console.error('❌ No customer ID in subscription');
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer && !customer.deleted ? customer.email : null;

    if (!customerEmail) {
      console.error('❌ No customer email found');
      return;
    }

    // Determine new plan based on subscription status
    let newPlan = 'free';
    if (subscription.status === 'active') {
      // You might want to check the price ID to determine the plan
      // For now, we'll use a simple approach
      newPlan = 'pro'; // Default to pro for active subscriptions
    }

    // Update user's plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: newPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('email', customerEmail);

    if (updateError) {
      console.error('❌ Failed to update subscription:', updateError);
      throw updateError;
    }

    console.log(`✅ Updated subscription for user with email: ${customerEmail}`);

  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
    throw error;
  }
}

// Handle subscription cancellations
async function handleSubscriptionDeleted(stripe: Stripe, supabase: SupabaseClient, subscription: Stripe.Subscription) {
  try {
    console.log(`🗑️ Processing subscription cancellation: ${subscription.id}`);

    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id;

    if (!customerId) {
      console.error('❌ No customer ID in subscription');
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer && !customer.deleted ? customer.email : null;

    if (!customerEmail) {
      console.error('❌ No customer email found');
      return;
    }

    // Downgrade user to free plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('email', customerEmail);

    if (updateError) {
      console.error('❌ Failed to cancel subscription:', updateError);
      throw updateError;
    }

    console.log(`✅ Cancelled subscription for user with email: ${customerEmail}`);

  } catch (error) {
    console.error('❌ Error handling subscription cancellation:', error);
    throw error;
  }
}