import { z } from "zod";
import {
  createMarketDataRefreshResult,
  isValidMarketPrice,
  normalizeMarketSymbol,
  type MarketAssetKind,
  type MarketDataAssetRequest,
  type MarketDataPriceFailure,
  type MarketDataPriceUpdate,
} from "@/lib/market-data";

export const runtime = "nodejs";

const assetSchema = z.object({
  currentPrice: z.number().finite().nonnegative(),
  id: z.string().min(1),
  symbol: z.string().min(1),
});

const requestSchema = z.object({
  apiKey: z.string().trim().min(1),
  stocks: z.array(assetSchema).default([]),
});

const finnhubFreePlanSpacingMs = 1050;

type FinnhubQuoteResponse = {
  c?: unknown;
  error?: unknown;
};

type SymbolPriceResult =
  | { ok: true; price: number }
  | { ok: false; reason: string };

export async function POST(request: Request) {
  try {
    const requestBody = await request.json().catch(() => null);
    const parsedRequest = requestSchema.safeParse(requestBody);
    if (!parsedRequest.success) {
      return Response.json(
        { error: "Add a Finnhub API key in Settings before refreshing prices." },
        { status: 400 },
      );
    }

    const { apiKey, stocks } = parsedRequest.data;
    const stockGroups = groupAssetsByProviderSymbol(
      stocks,
      "stock",
      (asset) => normalizeMarketSymbol(asset.symbol),
    );
    const updates: MarketDataPriceUpdate[] = [];
    const failures: MarketDataPriceFailure[] = [...stockGroups.invalidFailures];

    const requests = [
      ...Array.from(stockGroups.assetsBySymbol.entries()).map(([providerSymbol, assets]) => ({
        run: async () => {
          const result = await fetchStockQuote(providerSymbol, apiKey);
          appendSymbolResult({
            assets,
            failures,
            kind: "stock",
            providerSymbol,
            result,
            source: "quote",
            updates,
          });
        },
      })),
    ];

    for (const [index, finnHubRequest] of requests.entries()) {
      if (index > 0) {
        await wait(finnhubFreePlanSpacingMs);
      }
      await finnHubRequest.run();
    }

    return Response.json(createMarketDataRefreshResult(updates, failures));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Finnhub refresh failed." },
      { status: 500 },
    );
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function groupAssetsByProviderSymbol(
  assets: MarketDataAssetRequest[],
  kind: MarketAssetKind,
  getProviderSymbol: (asset: MarketDataAssetRequest) => string,
) {
  const assetsBySymbol = new Map<string, MarketDataAssetRequest[]>();
  const invalidFailures: MarketDataPriceFailure[] = [];

  assets.forEach((asset) => {
    const symbol = normalizeMarketSymbol(asset.symbol);
    const providerSymbol = getProviderSymbol(asset);
    if (!symbol || !providerSymbol) {
      invalidFailures.push({
        id: asset.id,
        kind,
        providerSymbol,
        reason: "Missing symbol.",
        symbol: asset.symbol,
      });
      return;
    }

    const group = assetsBySymbol.get(providerSymbol) ?? [];
    group.push({ ...asset, symbol });
    assetsBySymbol.set(providerSymbol, group);
  });

  return { assetsBySymbol, invalidFailures };
}

async function fetchStockQuote(symbol: string, apiKey: string): Promise<SymbolPriceResult> {
  const response = await fetchFinnhub("/quote", apiKey, { symbol });
  if (!response.ok) {
    return { ok: false, reason: response.error };
  }

  const body = response.body as FinnhubQuoteResponse;
  if (typeof body.error === "string" && body.error.trim()) {
    return { ok: false, reason: body.error };
  }

  return readMarketPrice(body.c, "No current quote returned.");
}

async function fetchFinnhub(
  path: string,
  apiKey: string,
  params: Record<string, string>,
): Promise<{ body: unknown; ok: true } | { error: string; ok: false }> {
  const url = new URL(`https://finnhub.io/api/v1${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("token", apiKey);

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const body = await readJsonBody(response);

  if (!response.ok) {
    return {
      error: getFinnhubErrorMessage(body) || `Finnhub returned ${response.status}.`,
      ok: false,
    };
  }

  return { body, ok: true };
}

async function readJsonBody(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function readMarketPrice(value: unknown, fallbackReason: string): SymbolPriceResult {
  if (isValidMarketPrice(value)) {
    return { ok: true, price: value };
  }

  return { ok: false, reason: fallbackReason };
}

function appendSymbolResult({
  assets,
  failures,
  kind,
  providerSymbol,
  result,
  source,
  updates,
}: {
  assets: MarketDataAssetRequest[];
  failures: MarketDataPriceFailure[];
  kind: MarketAssetKind;
  providerSymbol: string;
  result: SymbolPriceResult;
  source: MarketDataPriceUpdate["source"];
  updates: MarketDataPriceUpdate[];
}) {
  assets.forEach((asset) => {
    if (!result.ok) {
      failures.push({
        id: asset.id,
        kind,
        providerSymbol,
        reason: result.reason,
        symbol: asset.symbol,
      });
      return;
    }

    updates.push({
      id: asset.id,
      kind,
      newPrice: result.price,
      oldPrice: asset.currentPrice,
      providerSymbol,
      source,
      symbol: asset.symbol,
    });
  });
}

function getFinnhubErrorMessage(body: unknown) {
  if (!body || typeof body !== "object") {
    return "";
  }

  const error = (body as Record<string, unknown>).error;
  return typeof error === "string" ? error : "";
}
