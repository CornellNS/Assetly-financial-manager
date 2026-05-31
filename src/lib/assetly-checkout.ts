import type Stripe from "stripe";
import type { AssetlyDownloadPlatform } from "@/lib/assetly-download";
import { getStripe, requireEnv } from "@/lib/stripe";

export async function createAssetlyCheckoutSession(
  siteUrl: string,
  platform: AssetlyDownloadPlatform = "mac",
) {
  const stripe = getStripe();
  const priceId = requireEnv("STRIPE_PRICE_ID_ASSETLY_LAUNCH");

  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: `${siteUrl}/checkout/claim?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/#download`,
    metadata: {
      product: "assetly-financial-manager",
      license_type: "perpetual_cross_platform",
      platform,
    },
  }) satisfies Promise<Stripe.Checkout.Session>;
}

export function getAssetlySiteUrl(origin: string) {
  return process.env.NEXT_PUBLIC_SITE_URL || origin;
}
