import Link from "next/link";
import { cookies } from "next/headers";
import { Check, Download } from "lucide-react";
import { redirect } from "next/navigation";
import {
  ASSETLY_CHECKOUT_SESSION_COOKIE,
  DOWNLOAD_LINK_TTL_SECONDS,
  getPaidAssetlyCheckoutSession,
} from "@/lib/assetly-download";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const params = await searchParams;
  const querySessionId = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id;

  if (querySessionId) {
    redirect(`/checkout/claim?session_id=${encodeURIComponent(querySessionId)}`);
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(ASSETLY_CHECKOUT_SESSION_COOKIE)?.value;
  const paidSession = await getPaidAssetlyCheckoutSession(sessionId);
  const downloadOptions = [
    {
      href: "/api/download/mac",
      label: "Download macOS ZIP",
    },
    {
      href: "/api/download/windows",
      label: "Download Windows EXE",
    },
  ];

  return (
    <main className="min-h-dvh bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-lg border border-border bg-paper p-6 shadow-[var(--shadow-card)]">
        <span className="grid h-12 w-12 place-items-center rounded-lg border border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] text-[var(--tone-green-fg)]">
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Assetly is yours.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Payment confirmed. This browser can return to this page for future downloads. You can
          download macOS or Windows from this purchase, and each download click creates a private
          link that expires after {DOWNLOAD_LINK_TTL_SECONDS / 60} minutes.
        </p>

        {paidSession ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {downloadOptions.map((option) => (
                <a
                  key={option.href}
                  href={option.href}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {option.label}
                  <Download className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="mt-4 rounded-lg border border-border bg-[var(--paper-subtle)] p-4 text-sm leading-6 text-muted-foreground">
              After Assetly opens successfully, you can delete the downloaded ZIP or EXE installer
              from your Downloads folder to save space. Deleting the installer file will not uninstall Assetly.
            </p>
          </>
        ) : (
          <p className="mt-6 rounded-lg border border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] p-4 text-sm leading-6 text-[var(--tone-amber-fg)]">
            We could not find a confirmed Assetly purchase in this browser. If payment succeeded,
            return from Stripe Checkout again or contact Assetly support with your Stripe receipt.
          </p>
        )}

        <div className="mt-6">
          <Link className="text-sm font-medium text-brand hover:underline" href="/">
            Back to Assetly
          </Link>
          <span className="mx-3 text-muted-foreground">/</span>
          <Link className="text-sm font-medium text-brand hover:underline" href="/checkout/recover">
            Recover on another device
          </Link>
        </div>
      </section>
    </main>
  );
}
