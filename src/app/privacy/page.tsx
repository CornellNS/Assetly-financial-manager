import type { Metadata } from "next";
import Link from "next/link";
import { PiggyBank } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Assetly Financial Manager",
  description:
    "Privacy policy for Assetly Financial Manager and assetlymanager.online.",
};

const effectiveDate = "May 31, 2026";
const contactEmail = "support@assetlymanager.online";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-paper shadow-sm">
            <PiggyBank className="h-4 w-4 text-brand" aria-hidden="true" />
          </span>
          <span>Assetly</span>
        </Link>

        <header className="mt-10 border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase text-brand">Privacy Policy</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">
            Assetly Financial Manager Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Effective date: {effectiveDate}
          </p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            This policy explains how Assetly handles information for assetlymanager.online,
            Stripe checkout, download recovery, and the Assetly Financial Manager desktop app.
          </p>
        </header>

        <div className="grid gap-8 py-8 text-sm leading-7 text-muted-foreground">
          <PolicySection title="1. The Short Version">
            <p>
              Assetly is designed as a local-first personal finance workspace. Financial records
              you enter in the desktop app are intended to stay on your device unless you choose to
              export, back up, share, or send information through optional features. The website
              collects only the information needed to sell the app, confirm payment, provide
              download access, send recovery emails, respond to support, and protect the service.
            </p>
          </PolicySection>

          <PolicySection title="2. Information We Collect">
            <p>We may collect the following information depending on how you use Assetly:</p>
            <ul>
              <li>
                Checkout and purchase information, such as your email address, payment status,
                Stripe checkout session ID, customer ID, payment intent ID, and download access
                records.
              </li>
              <li>
                Recovery information, such as the email address you submit to recover a download
                link and temporary recovery tokens.
              </li>
              <li>
                Support information, such as messages you send us and any receipt or device details
                you choose to include.
              </li>
              <li>
                Technical information from the website and hosting providers, such as IP address,
                browser type, request logs, security logs, cookies, and device or usage data needed
                to operate and protect the site.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="3. Local Financial Data">
            <p>
              Assetly Financial Manager stores workspace records locally on your device. That may
              include income, debt, credit cards, investments, crypto, taxes, savings goals, notes,
              settings, and backups you create. Assetly does not need that local workspace data to
              process your purchase.
            </p>
            <p>
              If you use optional AI, market-data, support, import/export, or sharing features, the
              information needed for that feature may be sent to the provider you configure, to a
              local app process, or to Assetly support if you send it to us.
            </p>
          </PolicySection>

          <PolicySection title="4. How We Use Information">
            <p>We use information to:</p>
            <ul>
              <li>process purchases and confirm payment through Stripe;</li>
              <li>provide download access and generate expiring download links;</li>
              <li>send recovery emails for previous purchases;</li>
              <li>respond to support requests;</li>
              <li>maintain security, prevent abuse, troubleshoot bugs, and improve the product;</li>
              <li>comply with tax, accounting, legal, and fraud-prevention obligations.</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. Service Providers">
            <p>
              We use service providers to operate Assetly. These providers process information for
              us according to their own terms and privacy commitments:
            </p>
            <ul>
              <li>Stripe for checkout, payment processing, receipts, and payment records;</li>
              <li>Vercel for website hosting, serverless functions, logs, and private Blob storage;</li>
              <li>Resend for transactional email such as download recovery messages;</li>
              <li>
                optional providers you configure, such as market-data providers or OpenAI-compatible
                AI providers.
              </li>
            </ul>
            <p>We do not sell personal information.</p>
          </PolicySection>

          <PolicySection title="6. Cookies and Download Access">
            <p>
              After checkout or recovery, Assetly may set a secure browser cookie that lets the same
              browser return to the download page. Download links are generated as temporary private
              links. You can clear browser cookies, but doing so may require you to use purchase
              recovery again.
            </p>
          </PolicySection>

          <PolicySection title="7. Retention">
            <p>
              We keep purchase and recovery records for as long as reasonably needed to provide
              download access, support, security, accounting, legal compliance, and fraud
              prevention. Temporary recovery tokens and private download links expire. Local
              workspace records remain under your control on your device unless you export, delete,
              or share them.
            </p>
          </PolicySection>

          <PolicySection title="8. Your Choices">
            <p>
              You can request access, correction, deletion, or other help with personal information
              we hold by emailing{" "}
              <a className="font-medium text-brand hover:underline" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
              . We may need information to verify and complete your request. To remove local
              workspace records, use Assetly&apos;s local data controls or your browser/app storage
              controls.
            </p>
          </PolicySection>

          <PolicySection title="9. Security">
            <p>
              We use reasonable safeguards for the website, purchase records, and private download
              flow. No internet or local storage system is perfectly secure, so keep your device,
              backups, email account, and API keys protected.
            </p>
          </PolicySection>

          <PolicySection title="10. Children">
            <p>
              Assetly is not directed to children under 13, and we do not knowingly collect personal
              information from children under 13.
            </p>
          </PolicySection>

          <PolicySection title="11. Changes">
            <p>
              We may update this policy as Assetly changes. If we make material changes, we will
              update the effective date and post the revised policy on this page.
            </p>
          </PolicySection>

          <PolicySection title="12. Contact">
            <p>
              Questions about this policy or Assetly privacy practices can be sent to{" "}
              <a className="font-medium text-brand hover:underline" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
              .
            </p>
          </PolicySection>
        </div>
      </article>
    </main>
  );
}

function PolicySection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="grid gap-3 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  );
}
