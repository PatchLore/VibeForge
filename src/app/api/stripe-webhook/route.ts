import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { addCredits, updateUserPlan, getOrCreateUser } from '@/lib/credits';

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

const PRICE_MAP: Record<string, { credits: number; plan: string }> = {
  price_pro_month: { credits: 2000, plan: 'pro' },
  price_creator_month: { credits: 5000, plan: 'creator' },
  price_topup_1k: { credits: 1000, plan: 'free' },
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('❌ Missing signature or webhook secret');
    return NextResponse.json(
      { error: 'Webhook configuration error' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log('📧 Webhook event received:', event.type);

  try {
    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('✅ Checkout completed:', session.id);
      
      const metadata = session.metadata;
      const customerEmail = session.customer_email || session.customer_details?.email;
      
      if (!customerEmail) {
        console.error('❌ No customer email found');
        return NextResponse.json({ received: true });
      }

      // Get or create user
      const userId = await getOrCreateUser(customerEmail);
      if (!userId) {
        console.error('❌ Failed to get/create user');
        return NextResponse.json({ received: true });
      }

      // Get price info from metadata
      const priceInfo = PRICE_MAP[metadata?.priceId || ''];
      if (!priceInfo) {
        console.error('❌ Unknown price ID:', metadata?.priceId);
        return NextResponse.json({ received: true });
      }

      // Add credits
      await addCredits(userId, priceInfo.credits);
      console.log(`✅ Added ${priceInfo.credits} credits to user ${userId}`);

      // Update plan if subscription
      if (metadata?.type === 'subscription') {
        await updateUserPlan(userId, priceInfo.plan);
        console.log(`✅ Updated plan to ${priceInfo.plan}`);
      }

      // Store Stripe customer ID
      if (session.customer && supabase) {
        await supabase
          .from('users')
          .update({ stripe_customer_id: session.customer as string })
          .eq('id', userId);
      }
    }

    // Handle subscription renewal
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.log('✅ Invoice payment succeeded:', invoice.id);
      
      // Access subscription via bracket notation for compatibility
      const subscriptionId = (invoice as any).subscription;
      
      if (subscriptionId && supabase) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;

        if (customerId) {
          // Find user by Stripe customer ID
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (user) {
            // Add monthly credits based on subscription
            const lineItem = invoice.lines.data[0];
            const priceId = (lineItem as any).price?.id || lineItem.price;
            const priceInfo = PRICE_MAP[priceId || ''];
            
            if (priceInfo) {
              await addCredits(user.id, priceInfo.credits);
              console.log(`✅ Renewal: Added ${priceInfo.credits} credits to user ${user.id}`);
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

