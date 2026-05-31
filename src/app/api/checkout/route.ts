import { NextRequest, NextResponse } from "next/server";
import { createAssetlyCheckoutSession, getAssetlySiteUrl } from "@/lib/assetly-checkout";
import { normalizeAssetlyPlatform } from "@/lib/assetly-download";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const siteUrl = getAssetlySiteUrl(request.nextUrl.origin);
  const formData = await request.formData().catch(() => null);
  const platform = normalizeAssetlyPlatform(formData?.get("platform"));
  const session = await createAssetlyCheckoutSession(siteUrl, platform);

  if (!session.url) {
    return NextResponse.redirect(`${siteUrl}/checkout/error`, 303);
  }

  return NextResponse.redirect(session.url, 303);
}
