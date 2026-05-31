# Assetly Download Recovery

Assetly download recovery uses the buyer's Stripe checkout email as the durable receipt.

## Flow

- Stripe checkout success calls `/checkout/claim`.
- The claim route verifies the paid Assetly checkout session, stores a private purchase record in Vercel Blob, and sets an HttpOnly browser cookie.
- `/checkout/recover` lets a buyer enter their checkout email after losing the original browser session.
- If a matching purchase exists, `/api/checkout/recover` sends a one-hour recovery link.
- `/checkout/recover/claim` verifies the recovery token, restores the checkout cookie, and sends the buyer to `/checkout/success`.
- `/api/download/mac` and `/api/download/windows` create 30-minute private Blob download URLs only after a confirmed checkout cookie is present. One purchase unlocks both platform installers.

## Required Env Vars

- `BLOB_READ_WRITE_TOKEN`: already required for private downloads and purchase records.
- `STRIPE_SECRET_KEY`: required to verify checkout sessions.
- `STRIPE_WEBHOOK_SECRET`: required for Stripe webhook verification.
- `RESEND_API_KEY`: required before recovery emails can send.

Optional:

- `ASSETLY_EMAIL_FROM`: defaults to `Assetly <onboarding@resend.dev>`.
- `ASSETLY_SUPPORT_EMAIL`: defaults to `support@assetlymanager.online`.

After adding or changing production email env vars in Vercel, redeploy the site so the live functions receive them.
