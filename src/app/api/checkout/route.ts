import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

const PRICE_MAP: Record<string, { credits: number; plan: string }> = {
  price_pro_month: { credits: 2000, plan: 'pro' },
  price_creator_month: { credits: 5000, plan: 'creator' },
  price_topup_1k: { credits: 1000, plan: 'free' },
};

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { type, priceId, email } = body;

    console.log('💳 Checkout request:', { type, priceId, email });

    if (!type || !priceId) {
      return NextResponse.json(
        { error: 'Missing type or priceId' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://soundswoop.com';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: type === 'subscription' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      customer_email: email,
      metadata: {
        type,
        priceId,
        ...PRICE_MAP[priceId],
      },
    });

    console.log('✅ Checkout session created:', session.id);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

