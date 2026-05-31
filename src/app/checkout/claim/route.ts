import { NextRequest, NextResponse } from "next/server";
import {
  ASSETLY_CHECKOUT_SESSION_COOKIE,
  getPaidAssetlyCheckoutSession,
  storePaidAssetlyCheckoutSession,
} from "@/lib/assetly-download";

export const runtime = "nodejs";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? undefined;
  const session = await getPaidAssetlyCheckoutSession(sessionId);

  if (!session) {
    return NextResponse.redirect(new URL("/checkout/error", request.url));
  }

  try {
    await storePaidAssetlyCheckoutSession(session);
  } catch (error) {
    console.error("Assetly checkout claim storage failed", error);
  }

  const response = NextResponse.redirect(new URL("/checkout/success", request.url));
  response.cookies.set(ASSETLY_CHECKOUT_SESSION_COOKIE, session.id, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
  });

  return response;
}
