import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // Initialize Supabase client and get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Server-side auth check - User:', user?.email, 'Error:', authError);

    if (authError || !user) {
      console.error('Server-side auth failed:', { authError, hasUser: !!user });
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to continue', details: authError?.message },
        { status: 401 }
      );
    }

    const { plan } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Map plan to Stripe price ID
    const priceMap: Record<string, string> = {
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!,
      creator: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR!,
      topup_1k: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_1K || process.env.NEXT_PUBLIC_STRIPE_PRICE_1K || '',
    };

    const priceId = priceMap[plan];
    console.log('Stripe price mapping:', { plan, priceId, hasPriceEnv: !!priceMap[plan] });
    
    if (!priceId) {
      console.error('Missing Stripe price ID for plan:', plan);
      return NextResponse.json(
        { error: `Stripe price ID not configured for plan: ${plan}` },
        { status: 500 }
      );
    }

    // Determine if this is a subscription or one-time payment
    const isSubscription = plan !== 'topup_1k';
    
    // Create Stripe checkout session
    console.log('Creating Stripe checkout session with:', { priceId, userEmail: user.email, mode: isSubscription ? 'subscription' : 'payment' });
    
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
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
        user_id: user.id,
        plan: plan,
      },
      customer_email: user.email,
    });
    
    console.log('Stripe session created:', session.id);

    return NextResponse.json({ 
      url: session.url 
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error?.message },
      { status: 500 }
    );
  }
}
