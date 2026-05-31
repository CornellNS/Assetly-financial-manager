import type Stripe from "stripe";
import { del, get, put } from "@vercel/blob";
import { createHash, randomBytes } from "node:crypto";
import { getStripe } from "@/lib/stripe";

export const ASSETLY_CHECKOUT_SESSION_COOKIE = "assetly_checkout_session";
export const ASSETLY_PRODUCT_KEY = "assetly-financial-manager";
export const ASSETLY_MAC_BLOB_PATHNAME = "installers/mac/Assetly-Financial-Manager-mac-arm64.zip";
export const ASSETLY_MAC_FILENAME = "Assetly-Financial-Manager-mac-arm64.zip";
export const ASSETLY_WINDOWS_BLOB_PATHNAME =
  "installers/windows/Assetly-Financial-Manager-Setup-0.1.0.exe";
export const ASSETLY_WINDOWS_FILENAME = "Assetly-Financial-Manager-Setup-0.1.0.exe";
export const DOWNLOAD_LINK_TTL_SECONDS = 30 * 60;
export const RECOVERY_LINK_TTL_SECONDS = 60 * 60;

export type AssetlyDownloadPlatform = "mac" | "windows";

export type AssetlyPurchaseRecord = {
  version: 1;
  email: string;
  emailHash: string;
  sessionId: string;
  platform?: AssetlyDownloadPlatform;
  customerId?: string;
  paymentIntentId?: string;
  amountTotal?: number | null;
  currency?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetlyRecoveryTokenRecord = {
  version: 1;
  emailHash: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
};

export async function getPaidAssetlyCheckoutSession(sessionId: string | undefined) {
  if (!sessionId) {
    return null;
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return isPaidAssetlySession(session) ? session : null;
  } catch {
    return null;
  }
}

export function isPaidAssetlySession(session: Stripe.Checkout.Session) {
  const hasConfirmedPayment = session.payment_status === "paid";
  const isConfirmedNoCostOrder =
    session.payment_status === "no_payment_required" &&
    session.status === "complete" &&
    session.amount_total === 0;

  return (
    session.mode === "payment" &&
    (hasConfirmedPayment || isConfirmedNoCostOrder) &&
    session.metadata?.product === ASSETLY_PRODUCT_KEY
  );
}

export function normalizeAssetlyEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeAssetlyPlatform(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") {
    return "mac" satisfies AssetlyDownloadPlatform;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "windows" || normalized === "win") {
    return "windows" satisfies AssetlyDownloadPlatform;
  }

  return "mac" satisfies AssetlyDownloadPlatform;
}

export function getAssetlySessionPlatform(session: Stripe.Checkout.Session) {
  return normalizeAssetlyPlatform(session.metadata?.platform);
}

export async function storePaidAssetlyCheckoutSession(session: Stripe.Checkout.Session) {
  if (!isPaidAssetlySession(session)) {
    return null;
  }

  const email = getCheckoutSessionEmail(session);
  if (!email) {
    return null;
  }

  const normalizedEmail = normalizeAssetlyEmail(email);
  const now = new Date().toISOString();
  const existing = await getAssetlyPurchaseByEmail(normalizedEmail);
  const record: AssetlyPurchaseRecord = {
    version: 1,
    email: normalizedEmail,
    emailHash: hashAssetlyValue(normalizedEmail),
    sessionId: session.id,
    platform: getAssetlySessionPlatform(session),
    customerId: getStripeId(session.customer),
    paymentIntentId: getStripeId(session.payment_intent),
    amountTotal: session.amount_total,
    currency: session.currency,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await Promise.all([
    putBlobJson(getPurchaseByEmailPath(record.emailHash), record),
    putBlobJson(getPurchaseBySessionPath(session.id), record),
  ]);

  return record;
}

export async function getAssetlyPurchaseByEmail(email: string) {
  const normalizedEmail = normalizeAssetlyEmail(email);
  return getBlobJson<AssetlyPurchaseRecord>(getPurchaseByEmailPath(hashAssetlyValue(normalizedEmail)));
}

export async function createAssetlyRecoveryToken(record: AssetlyPurchaseRecord) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const tokenRecord: AssetlyRecoveryTokenRecord = {
    version: 1,
    emailHash: record.emailHash,
    sessionId: record.sessionId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + RECOVERY_LINK_TTL_SECONDS * 1000).toISOString(),
  };

  await putBlobJson(getRecoveryTokenPath(token), tokenRecord);

  return {
    token,
    expiresAt: tokenRecord.expiresAt,
  };
}

export async function getAssetlyRecoveryToken(token: string) {
  if (!isLikelyRecoveryToken(token)) {
    return null;
  }

  const record = await getBlobJson<AssetlyRecoveryTokenRecord>(getRecoveryTokenPath(token));
  if (!record) {
    return null;
  }

  if (Date.parse(record.expiresAt) < Date.now()) {
    await deleteAssetlyRecoveryToken(token);
    return null;
  }

  return record;
}

export async function deleteAssetlyRecoveryToken(token: string) {
  try {
    await del(getRecoveryTokenPath(token), getBlobCommandOptions());
  } catch {
    // Expired or already-used tokens can disappear without breaking recovery.
  }
}

function getCheckoutSessionEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email ?? session.customer_email ?? undefined;
}

function getStripeId(value: string | { id?: string } | null) {
  return typeof value === "string" ? value : value?.id;
}

function getPurchaseByEmailPath(emailHash: string) {
  return `assetly/purchases/by-email/${emailHash}.json`;
}

function getPurchaseBySessionPath(sessionId: string) {
  return `assetly/purchases/by-session/${sessionId}.json`;
}

function getRecoveryTokenPath(token: string) {
  return `assetly/recovery-tokens/${hashAssetlyValue(token)}.json`;
}

function isLikelyRecoveryToken(token: string) {
  return /^[A-Za-z0-9_-]{32,120}$/.test(token);
}

function hashAssetlyValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function putBlobJson(pathname: string, value: unknown) {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    ...getBlobCommandOptions(),
  });
}

async function getBlobJson<T>(pathname: string) {
  const result = await get(pathname, {
    access: "private",
    useCache: false,
    ...getBlobCommandOptions(),
  });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  const text = await new Response(result.stream).text();
  return JSON.parse(text) as T;
}

function getBlobCommandOptions() {
  return {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  };
}
