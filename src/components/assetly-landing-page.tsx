"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Bot,
  Calculator,
  Check,
  CreditCard,
  Download,
  Laptop,
  LineChart,
  LockKeyhole,
  PiggyBank,
  ReceiptText,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { HeroWithMockup } from "@/components/blocks/hero-with-mockup";
import { cn } from "@/lib/utils";

const checkoutHref = "/api/checkout";
const launchPriceLabel = "$19";
const easeOut = [0.16, 1, 0.3, 1] as const;

const featureCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "amber" | "red" | "neutral";
}> = [
  {
    title: "One serious money workspace",
    description:
      "Net worth, cash flow, savings, credit cards, debt, stocks, crypto, and goals live in the same desktop app.",
    icon: WalletCards,
    tone: "green",
  },
  {
    title: "Credit card and debt command",
    description:
      "Track APRs, minimums, due dates, statement balances, carried balances, and payoff progress.",
    icon: CreditCard,
    tone: "red",
  },
  {
    title: "Investing with tax lots",
    description:
      "Follow positions, lots, cost basis, price snapshots, realized sales, and gain/loss movement.",
    icon: LineChart,
    tone: "blue",
  },
  {
    title: "Tax planning included",
    description:
      "Estimate ordinary income, capital gains, withholding, projected tax, and yearly report views.",
    icon: Calculator,
    tone: "amber",
  },
  {
    title: "Local-first privacy",
    description:
      "Assetly is built for local browser data with validation, backups, and recovery-minded storage.",
    icon: LockKeyhole,
    tone: "neutral",
  },
  {
    title: "AI review cards",
    description:
      "Use the optional AI agent for cleanup ideas, then approve or dismiss every proposed edit.",
    icon: Bot,
    tone: "green",
  },
];

const screenshotCards = [
  {
    id: "dashboard",
    title: "Dashboard",
    emoji: "🧭",
    src: "/landing/uncropped/dashboard.png",
    alt: "Assetly dashboard with net worth, monthly income, investments, debt, recurring payments, alerts, and calendar.",
    width: 3420,
    height: 1958,
  },
  {
    id: "weekly-report",
    title: "Weekly Report",
    emoji: "📅",
    src: "/landing/uncropped/weekly-report.png",
    alt: "Assetly weekly report with income, outgoing, net flow, AI report status, and a weekly cash calendar.",
    width: 3420,
    height: 1966,
  },
  {
    id: "investing",
    title: "Investing",
    emoji: "📈",
    src: "/landing/uncropped/investing.png",
    alt: "Assetly investing page with allocation scope notice, portfolio metrics, asset allocation, and manual investments table.",
    width: 3418,
    height: 1956,
  },
  {
    id: "stocks",
    title: "Stocks",
    emoji: "📊",
    src: "/landing/uncropped/stocks.png",
    alt: "Assetly stocks page with portfolio metrics, manual price snapshot controls, and lot-level holdings table.",
    width: 3420,
    height: 1966,
  },
  {
    id: "crypto",
    title: "Crypto",
    emoji: "🪙",
    src: "/landing/uncropped/crypto.png",
    alt: "Assetly crypto page with total crypto value, gain/loss, allocation chart, and crypto holdings table.",
    width: 3414,
    height: 1956,
  },
  {
    id: "income",
    title: "Income",
    emoji: "💵",
    src: "/landing/uncropped/income.png",
    alt: "Assetly income page with estimated income, next payment, YTD tax cards, trend chart, and payment filters.",
    width: 3418,
    height: 1948,
  },
  {
    id: "tax-planner",
    title: "Tax Planner",
    emoji: "🧾",
    src: "/landing/uncropped/tax-planner.png",
    alt: "Assetly tax planner with estimate cards, tax form map, and capital gains views.",
    width: 3420,
    height: 1954,
  },
  {
    id: "savings",
    title: "Savings",
    emoji: "🎯",
    src: "/landing/uncropped/savings.png",
    alt: "Assetly savings page with emergency fund progress, monthly contribution, completion date, and savings goals table.",
    width: 3420,
    height: 1968,
  },
  {
    id: "debt",
    title: "Debt",
    emoji: "💳",
    src: "/landing/uncropped/debt.png",
    alt: "Assetly debt page with credit score, total debt tracker, credit card status, and due date filters.",
    width: 3420,
    height: 1962,
  },
  {
    id: "recurring",
    title: "Recurring",
    emoji: "🔁",
    src: "/landing/uncropped/recurring.png",
    alt: "Assetly recurring page with monthly recurring total, charge filters, and recurring payments table.",
    width: 3420,
    height: 2152,
  },
  {
    id: "net-worth",
    title: "Net Worth",
    emoji: "💼",
    src: "/landing/uncropped/net-worth.png",
    alt: "Assetly net worth page with net worth metrics, trend chart, asset mix, and asset breakdown.",
    width: 3420,
    height: 2154,
  },
  {
    id: "settings",
    title: "Settings",
    emoji: "⚙️",
    src: "/landing/uncropped/settings.png",
    alt: "Assetly settings page with workspace data, workspace identity, appearance controls, graph colors, and currency settings.",
    width: 3420,
    height: 2146,
  },
  {
    id: "market-ai-keys",
    title: "Market and AI Keys",
    emoji: "🔑",
    src: "/landing/uncropped/settings-api.png",
    alt: "Assetly settings page with local Finnhub, CoinGecko, and AI agent API key controls.",
    width: 3416,
    height: 2144,
  },
];

const comparisonRows = [
  ["Local private workspace", "Manual files", "Cloud account", "Included"],
  ["Net worth plus cash flow", "Manual formulas", "Limited", "Included"],
  ["Debt and card payoff tracking", "Manual formulas", "Partial", "Included"],
  ["Stock lots and tax sales", "Manual sheets", "Rare", "Included"],
  ["Tax planner and yearly reports", "Separate tool", "Rare", "Included"],
  ["AI proposals require approval", "Not available", "Often opaque", "Included"],
];

const faqItems = [
  {
    question: "What am I downloading?",
    answer:
      "After checkout, Assetly confirms your payment and gives you access to your selected desktop build: macOS Apple Silicon ZIP or Windows EXE.",
  },
  {
    question: "Can I delete the installer after installing?",
    answer:
      "Yes. After Assetly opens successfully, you can delete the downloaded ZIP or EXE installer from your Downloads folder to save space. Deleting that installer file will not uninstall Assetly.",
  },
  {
    question: "Is this a bank connection app?",
    answer:
      "No. Assetly is a private finance manager where you control the records, optional market-data settings, and optional AI settings.",
  },
  {
    question: "Is Windows ready?",
    answer:
      "Yes. Assetly now offers a Windows desktop installer. If Windows shows an early trust warning, it is because signing reputation can take time to build after a new release.",
  },
  {
    question: "Is Assetly giving financial or tax advice?",
    answer:
      "No. Assetly is tracking and planning software. Estimates are educational and depend on the records you enter.",
  },
];

export function AssetlyLandingPage() {
  const reducedMotion = useReducedMotion();
  const [activeScreenshotId, setActiveScreenshotId] = useState("dashboard");
  const activeScreenshot =
    screenshotCards.find((screen) => screen.id === activeScreenshotId) ?? screenshotCards[0];
  const sectionMotion = {
    initial: { opacity: 1, y: reducedMotion ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reducedMotion ? 0 : 0.42, ease: easeOut },
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-dvh bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--paper)_91%,transparent)] backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              aria-label="Assetly home"
              className="flex min-w-0 items-center gap-2 rounded-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-paper shadow-sm">
                <PiggyBank className="h-4 w-4 text-brand" aria-hidden="true" />
              </span>
              <span className="truncate text-sm">Assetly</span>
            </Link>

            <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex" aria-label="Marketing page">
              <NavLink href="#download">Download</NavLink>
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#screenshots">Screenshots</NavLink>
              <NavLink href="#compare">Compare</NavLink>
              <NavLink href="#faq">FAQ</NavLink>
              <NavLink href="/workspace">Demo workspace</NavLink>
            </nav>

            <a
              href="#download"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Download
              <Download className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </header>

        <HeroWithMockup
          title="Assetly Financial Manager"
          description="Download private desktop finance software for net worth, cash flow, debt, credit cards, investments, and tax planning in one focused workspace."
          primaryCta={{
            text: "Choose your download",
            href: "#download",
            download: false,
          }}
          secondaryCta={{
            text: "See screenshots",
            href: "#screenshots",
            icon: <ReceiptText className="mr-2 h-4 w-4" />,
          }}
          mockupImage={{
            src: "/landing/uncropped/dashboard.png",
            alt: "Assetly Financial Manager dashboard screenshot.",
            width: 3420,
            height: 1958,
          }}
          className="min-h-[calc(100dvh-4rem)]"
        />

        <section id="download" className="scroll-mt-24 border-y border-border bg-paper px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <motion.div {...sectionMotion}>
              <p className="text-xs font-semibold uppercase text-brand">Download Assetly</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Buy once and download either desktop build.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Pick the installer you want first, then checkout securely with Stripe. After payment,
                the success page gives you both macOS and Windows private download links. After Assetly
                opens successfully, you can delete the downloaded ZIP or EXE installer to save space.
              </p>
            </motion.div>

            <motion.div {...sectionMotion} className="grid gap-3 md:grid-cols-2">
              <DownloadCard
                title="macOS Apple Silicon"
                description="Start with the Mac ZIP. Your purchase also unlocks the Windows EXE."
                status="Available now"
                href={checkoutHref}
                platform="mac"
                buttonLabel="Start with ZIP"
                active
              />
              <DownloadCard
                title="Windows installer"
                description="Start with the Windows installer. Your purchase also unlocks the Mac ZIP."
                status="Available now"
                href={checkoutHref}
                platform="windows"
                buttonLabel="Start with EXE"
                active
              />
            </motion.div>
          </div>
        </section>

        <section id="screenshots" className="scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2 lg:items-center">
            <motion.div
              {...sectionMotion}
              className="flex flex-col items-center justify-center text-center lg:min-h-[460px]"
            >
              <p className="text-xs font-semibold uppercase text-brand">Real screenshots</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Pick a workspace view</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Click any Assetly area to preview the real screen before downloading.
              </p>

              <div
                className="mt-5 grid w-full max-w-[500px] grid-cols-2 gap-2"
                role="group"
                aria-label="Choose Assetly screenshot preview"
              >
                {screenshotCards.map((screen) => {
                  const active = screen.id === activeScreenshot.id;

                  return (
                    <button
                      key={screen.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveScreenshotId(screen.id)}
                      className={cn(
                        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "border-brand bg-[color-mix(in_srgb,var(--tone-green-bg)_78%,white)] text-brand shadow-[0_10px_22px_-18px_rgba(92,153,104,0.9)]"
                          : "border-border bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] text-foreground/88 hover:border-brand/45 hover:bg-paper hover:text-foreground",
                      )}
                    >
                      <span className="min-w-0 text-center leading-4">{screen.title}</span>
                      <span aria-hidden="true">{screen.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              {...sectionMotion}
              className="flex items-center justify-center lg:min-h-[460px]"
            >
              <div className="w-full overflow-hidden rounded-xl border border-border bg-paper shadow-[0_26px_70px_-42px_rgba(36,33,29,0.58)]">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                  <h3 className="text-sm font-semibold">{activeScreenshot.title}</h3>
                  <span className="rounded-full border border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] px-2.5 py-1 text-xs font-medium text-[var(--tone-green-fg)]">
                    {activeScreenshot.emoji} Preview
                  </span>
                </div>
                <Image
                  key={activeScreenshot.id}
                  src={activeScreenshot.src}
                  alt={activeScreenshot.alt}
                  width={activeScreenshot.width}
                  height={activeScreenshot.height}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="h-auto w-full"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-t border-border bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div {...sectionMotion} className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-brand">Why it exists</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Bank apps show fragments. Spreadsheets become chores. Assetly gives you the whole picture.
              </h2>
            </motion.div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <MetricCard label="Finance areas" value="10+" detail="Cash flow, debt, tax, investing, savings, cards, net worth, and more." />
              <MetricCard label="Data posture" value="Local" detail="Private workspace data with validation, backup, and recovery behavior." />
              <MetricCard label="AI mode" value="Review" detail="Optional AI suggestions wait for your approval before changing records." />
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 border-y border-border bg-[var(--paper-subtle)] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div {...sectionMotion} className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase text-brand">What you get</p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                  A full finance manager, not a thin budget widget.
                </h2>
              </div>
              <a
                href="#download"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Download now
                <Download className="h-4 w-4" aria-hidden="true" />
              </a>
            </motion.div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    key={feature.title}
                    {...sectionMotion}
                    transition={{
                      duration: reducedMotion ? 0 : 0.38,
                      delay: reducedMotion ? 0 : index * 0.035,
                      ease: easeOut,
                    }}
                    className="min-h-56 rounded-lg border border-border bg-paper p-5 shadow-[var(--shadow-card)]"
                  >
                    <span className={cn("grid h-11 w-11 place-items-center rounded-lg border", toneClass(feature.tone))}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-base font-semibold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="compare" className="scroll-mt-24 border-y border-border bg-paper px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <motion.div {...sectionMotion}>
              <p className="text-xs font-semibold uppercase text-brand">Compare</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Built for the parts of money that generic tools skip.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Assetly is made for repeated use: scanning balances, checking upcoming payments,
                reviewing investments, and planning taxes from the same place.
              </p>
            </motion.div>

            <motion.div {...sectionMotion} className="overflow-hidden rounded-lg border border-border bg-[var(--paper-subtle)] shadow-[var(--shadow-card)]">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] border-b border-border bg-paper text-xs font-semibold text-muted-foreground">
                <div className="px-3 py-3">Capability</div>
                <div className="px-3 py-3">Spreadsheet</div>
                <div className="px-3 py-3">Bank app</div>
                <div className="px-3 py-3 text-brand">Assetly</div>
              </div>
              {comparisonRows.map((row) => (
                <div key={row[0]} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] border-b border-border text-xs last:border-b-0 sm:text-sm">
                  {row.map((cell, index) => (
                    <div
                      key={`${row[0]}-${cell}`}
                      className={cn(
                        "px-3 py-3 leading-5",
                        index === 0 ? "font-medium text-foreground" : "text-muted-foreground",
                        index === 3 && "font-semibold text-brand",
                      )}
                    >
                      {index === 3 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="windows" className="px-4 py-16 sm:px-6 lg:px-8">
          <motion.div {...sectionMotion} className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase text-brand">Platform roadmap</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                macOS and Windows downloads are ready.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Assetly ships as a macOS Apple Silicon ZIP and a Windows EXE installer. One checkout unlocks both private download routes.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-paper p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] text-[var(--tone-amber-fg)]">
                  <Laptop className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">Windows desktop installer</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Available through the Windows checkout button above.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="faq" className="scroll-mt-24 border-y border-border bg-[var(--paper-subtle)] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div {...sectionMotion} className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-brand">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Questions before download.</h2>
            </motion.div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {faqItems.map((item) => (
                <motion.article
                  key={item.question}
                  {...sectionMotion}
                  className="rounded-lg border border-border bg-paper p-5 shadow-[var(--shadow-card)]"
                >
                  <h3 className="text-base font-semibold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            {...sectionMotion}
            className="mx-auto grid max-w-7xl gap-6 rounded-lg border border-border bg-primary p-6 text-primary-foreground shadow-[var(--shadow-card)] md:grid-cols-[1fr_auto] md:items-center md:p-8"
          >
            <div>
              <p className="text-xs font-semibold uppercase text-white/58">Get the software</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Download Assetly Financial Manager.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72">
                Get Assetly today for {launchPriceLabel}. Checkout confirms the purchase before creating private macOS and Windows download links.
              </p>
            </div>
            <a
              href="#download"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white bg-white px-4 text-sm font-medium text-[#24211d] shadow-sm transition hover:bg-[#fff8ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Choose download
              <Download className="h-4 w-4" aria-hidden="true" />
            </a>
          </motion.div>
        </section>

        <footer className="border-t border-border bg-paper px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-foreground">
              <PiggyBank className="h-4 w-4 text-brand" aria-hidden="true" />
              <span className="font-semibold">Assetly Financial Manager</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a className="rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href="#download">
                Download
              </a>
              <Link className="rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href="/checkout/recover">
                Recover download
              </Link>
              <a className="rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href="#faq">
                FAQ
              </a>
              <Link className="rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href="/workspace">
                Demo workspace
              </Link>
              <Link className="rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href="/privacy">
                Privacy
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </MotionConfig>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-md px-3 py-2 transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </a>
  );
}

function DownloadCard({
  title,
  description,
  status,
  href,
  platform,
  buttonLabel,
  active = false,
}: {
  title: string;
  description: string;
  status: string;
  href: string;
  platform?: "mac" | "windows";
  buttonLabel?: string;
  active?: boolean;
}) {
  return (
    <article className="rounded-lg border border-border bg-[var(--paper-subtle)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-1 text-xs font-medium",
            active
              ? "border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] text-[var(--tone-green-fg)]"
              : "border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] text-[var(--tone-amber-fg)]",
          )}
        >
          {status}
        </span>
      </div>
      {active ? (
        <form action={href} method="post" className="mt-4">
          {platform ? <input type="hidden" name="platform" value={platform} /> : null}
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {buttonLabel ?? "Download"}
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <a
          href={href}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-paper px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Track release
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-lg border border-border bg-paper p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}

function toneClass(tone: "green" | "blue" | "amber" | "red" | "neutral") {
  const tones = {
    green: "border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] text-[var(--tone-green-fg)]",
    blue: "border-[var(--tone-blue-border)] bg-[var(--tone-blue-bg)] text-[var(--tone-blue-fg)]",
    amber: "border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] text-[var(--tone-amber-fg)]",
    red: "border-[var(--tone-red-border)] bg-[var(--tone-red-bg)] text-[var(--tone-red-fg)]",
    neutral:
      "border-[var(--tone-neutral-border)] bg-[var(--tone-neutral-bg)] text-[var(--tone-neutral-fg)]",
  };

  return tones[tone];
}
