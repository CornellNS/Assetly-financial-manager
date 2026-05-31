import Link from "next/link";
import { Mail } from "lucide-react";
import { RECOVERY_LINK_TTL_SECONDS } from "@/lib/assetly-download";
import { isAssetlyEmailConfigured } from "@/lib/assetly-email";

export const dynamic = "force-dynamic";

export default async function RecoverDownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const params = await searchParams;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const ttlMinutes = RECOVERY_LINK_TTL_SECONDS / 60;
  const emailConfigured = isAssetlyEmailConfigured();

  return (
    <main className="min-h-dvh bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-lg border border-border bg-paper p-6 shadow-[var(--shadow-card)]">
        <span className="grid h-12 w-12 place-items-center rounded-lg border border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] text-[var(--tone-green-fg)]">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Recover your Assetly download.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Enter the email used at checkout. If it matches a completed Assetly purchase, we will
          send a private access link that expires after {ttlMinutes} minutes.
        </p>

        {status === "sent" ? (
          <p className="mt-6 rounded-lg border border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] p-4 text-sm leading-6 text-[var(--tone-green-fg)]">
            Check your inbox. If that email matches a completed Assetly purchase, a new download
            access link is on the way.
          </p>
        ) : null}

        {status === "invalid" ? (
          <p className="mt-6 rounded-lg border border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] p-4 text-sm leading-6 text-[var(--tone-amber-fg)]">
            Enter the email address you used at checkout.
          </p>
        ) : null}

        {status === "expired" ? (
          <p className="mt-6 rounded-lg border border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] p-4 text-sm leading-6 text-[var(--tone-amber-fg)]">
            That recovery link expired or was already used. Send yourself a fresh one.
          </p>
        ) : null}

        {status === "email" ? (
          <p className="mt-6 rounded-lg border border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] p-4 text-sm leading-6 text-[var(--tone-amber-fg)]">
            We could not send the email right now. Try again in a minute or contact Assetly support
            with your Stripe receipt.
          </p>
        ) : null}

        {status === "setup" || !emailConfigured ? (
          <p className="mt-6 rounded-lg border border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] p-4 text-sm leading-6 text-[var(--tone-amber-fg)]">
            Email recovery is installed but still needs the Resend API key before it can send links.
            Until then, contact Assetly support with your Stripe receipt.
          </p>
        ) : (
          <form action="/api/checkout/recover" method="post" className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="email">
              Checkout email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Email link
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-4">
          <Link className="text-sm font-medium text-brand hover:underline" href="/#download">
            Back to download
          </Link>
          <Link className="text-sm font-medium text-brand hover:underline" href="/checkout/success">
            I already have access
          </Link>
        </div>
      </section>
    </main>
  );
}
