import { NextResponse } from "next/server";
import Stripe from "stripe";
import { storePaidAssetlyCheckoutSession } from "@/lib/assetly-download";
import { getStripe, requireEnv } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const record = await storePaidAssetlyCheckoutSession(session);
      console.info("Assetly checkout completed", {
        fulfilled: Boolean(record),
        mode: session.mode,
        paymentStatus: session.payment_status,
        sessionId: session.id,
      });
    } catch (error) {
      console.error("Assetly checkout fulfillment failed", error);
      return NextResponse.json({ error: "Checkout fulfillment failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
