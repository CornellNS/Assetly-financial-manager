import Link from "next/link";

export default function CheckoutErrorPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-lg border border-border bg-paper p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl font-semibold">Checkout needs another try.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We could not start or confirm the Assetly checkout session. Return to the download
          section and try again. If you already paid, reopen the Stripe success link in the same
          browser or contact Assetly support with your receipt.
        </p>
        <Link
          href="/#download"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to download
        </Link>
        <div className="mt-4">
          <Link className="text-sm font-medium text-brand hover:underline" href="/checkout/recover">
            Recover a previous purchase
          </Link>
        </div>
      </section>
    </main>
  );
}
