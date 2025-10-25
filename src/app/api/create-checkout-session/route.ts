import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL environment variable not configured' },
        { status: 500 }
      );
    }

    const { plan, userId, email } = await request.json();

    if (!plan || !userId || !email) {
      return NextResponse.json(
        { error: 'Plan, userId, and email are required' },
        { status: 400 }
      );
    }

    // Map plan to Stripe price ID
    const priceMap: Record<string, string> = {
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!,
      creator: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR!,
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      metadata: {
        user_email: email,
        plan_type: plan,
      },
      customer_email: email,
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
