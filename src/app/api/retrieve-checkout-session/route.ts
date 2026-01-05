import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper function to initialize Stripe client
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-09-30.clover",
  });
}

export async function GET(request: Request) {
  try {
    // Check for Stripe secret key before processing
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ Missing STRIPE_SECRET_KEY environment variable');
      return NextResponse.json(
        { error: 'Stripe configuration is missing. STRIPE_SECRET_KEY environment variable is not set.' },
        { status: 500 }
      );
    }

    // Initialize Stripe client inside the handler
    const stripe = getStripeClient();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session with expanded customer and subscription data
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "subscription"]
    });

    // Extract plan name from metadata or subscription
    let planName = "Unknown Plan";
    if (session.metadata?.plan_type) {
      planName = session.metadata.plan_type === 'pro' 
        ? "Soundswoop Pro" 
        : session.metadata.plan_type === 'creator' 
        ? "Soundswoop Creator" 
        : `Soundswoop ${session.metadata.plan_type}`;
    }

    // Format the response
    const response = {
      customer_email: session.customer_details?.email || session.customer_email,
      plan_name: planName,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      created_at: new Date(session.created * 1000).toISOString(),
      session_id: session.id,
      status: session.status,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
