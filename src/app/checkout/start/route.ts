import { NextRequest, NextResponse } from "next/server";
import { createAssetlyCheckoutSession, getAssetlySiteUrl } from "@/lib/assetly-checkout";
import { normalizeAssetlyPlatform } from "@/lib/assetly-download";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const siteUrl = getAssetlySiteUrl(request.nextUrl.origin);
  const platform = normalizeAssetlyPlatform(request.nextUrl.searchParams.get("platform"));
  const session = await createAssetlyCheckoutSession(siteUrl, platform);

  if (!session.url) {
    return NextResponse.redirect(`${siteUrl}/checkout/error`, 303);
  }

  return NextResponse.redirect(session.url, 303);
}
