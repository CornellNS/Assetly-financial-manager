import { NextRequest, NextResponse } from "next/server";
import { getDownloadUrl, issueSignedToken, presignUrl } from "@vercel/blob";
import {
  ASSETLY_CHECKOUT_SESSION_COOKIE,
  ASSETLY_MAC_BLOB_PATHNAME,
  ASSETLY_MAC_FILENAME,
  DOWNLOAD_LINK_TTL_SECONDS,
  getPaidAssetlyCheckoutSession,
} from "@/lib/assetly-download";
import { requireEnv } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(ASSETLY_CHECKOUT_SESSION_COOKIE)?.value;
  const session = await getPaidAssetlyCheckoutSession(sessionId);

  if (!session) {
    return NextResponse.redirect(new URL("/checkout/error", request.url));
  }

  const validUntil = Date.now() + DOWNLOAD_LINK_TTL_SECONDS * 1000;
  const signedToken = await issueSignedToken({
    operations: ["get", "head"],
    pathname: ASSETLY_MAC_BLOB_PATHNAME,
    token: requireEnv("BLOB_READ_WRITE_TOKEN"),
    validUntil,
  });
  const { presignedUrl } = await presignUrl(signedToken, {
    access: "private",
    operation: "get",
    pathname: ASSETLY_MAC_BLOB_PATHNAME,
    validUntil,
  });

  const downloadUrl = new URL(getDownloadUrl(presignedUrl));
  downloadUrl.searchParams.set("filename", ASSETLY_MAC_FILENAME);

  const response = NextResponse.redirect(downloadUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
