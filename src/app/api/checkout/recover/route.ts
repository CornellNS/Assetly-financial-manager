import { NextRequest, NextResponse } from "next/server";
import {
  createAssetlyRecoveryToken,
  getAssetlyPurchaseByEmail,
  normalizeAssetlyEmail,
} from "@/lib/assetly-download";
import { isAssetlyEmailConfigured, sendAssetlyRecoveryEmail } from "@/lib/assetly-email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAssetlyEmailConfigured()) {
    return redirectToRecover(request, "setup");
  }

  const formData = await request.formData();
  const rawEmail = formData.get("email");

  if (typeof rawEmail !== "string" || !rawEmail.includes("@")) {
    return redirectToRecover(request, "invalid");
  }

  const email = normalizeAssetlyEmail(rawEmail);
  const record = await getAssetlyPurchaseByEmail(email);

  if (!record) {
    return redirectToRecover(request, "sent");
  }

  try {
    const { token } = await createAssetlyRecoveryToken(record);
    const claimUrl = new URL("/checkout/recover/claim", getSiteUrl(request));
    claimUrl.searchParams.set("token", token);

    await sendAssetlyRecoveryEmail({
      claimUrl: claimUrl.toString(),
      to: record.email,
    });
  } catch (error) {
    console.error("Assetly recovery email failed", error);
    return redirectToRecover(request, "email");
  }

  return redirectToRecover(request, "sent");
}

function redirectToRecover(request: NextRequest, status: "email" | "invalid" | "sent" | "setup") {
  const url = new URL("/checkout/recover", request.url);
  url.searchParams.set("status", status);
  return NextResponse.redirect(url, 303);
}

function getSiteUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}
