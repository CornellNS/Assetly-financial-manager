import { z } from "zod";
import {
  createMarketDataRefreshResult,
  getCoinGeckoCryptoProviderSymbol,
  isValidMarketPrice,
  normalizeMarketSymbol,
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
  crypto: z.array(assetSchema).default([]),
});

type CoinGeckoSimplePriceResponse = Record<
  string,
  {
    last_updated_at?: unknown;
    usd?: unknown;
  }
>;

export async function POST(request: Request) {
  try {
    const requestBody = await request.json().catch(() => null);
    const parsedRequest = requestSchema.safeParse(requestBody);
    if (!parsedRequest.success) {
      return Response.json(
        { error: "Add a CoinGecko API key in Settings before refreshing crypto prices." },
        { status: 400 },
      );
    }

    const { apiKey, crypto } = parsedRequest.data;
    const cryptoGroups = groupCryptoAssetsBySymbol(crypto);
    const updates: MarketDataPriceUpdate[] = [];
    const failures: MarketDataPriceFailure[] = [...cryptoGroups.invalidFailures];

    if (cryptoGroups.assetsBySymbol.size === 0) {
      return Response.json(createMarketDataRefreshResult(updates, failures, "CoinGecko"));
    }

    const response = await fetchCoinGeckoSimplePrices(
      [...cryptoGroups.assetsBySymbol.keys()],
      apiKey,
    );

    if (!response.ok) {
      cryptoGroups.assetsBySymbol.forEach((assets, providerSymbol) => {
        appendSymbolFailure(assets, failures, providerSymbol, response.error);
      });

      return Response.json(createMarketDataRefreshResult(updates, failures, "CoinGecko"));
    }

    cryptoGroups.assetsBySymbol.forEach((assets, providerSymbol) => {
      const priceData = response.body[providerSymbol];
      const price = priceData?.usd;
      if (!isValidMarketPrice(price)) {
        appendSymbolFailure(
          assets,
          failures,
          providerSymbol,
          "No CoinGecko USD price returned.",
        );
        return;
      }

      assets.forEach((asset) => {
        updates.push({
          id: asset.id,
          kind: "crypto",
          newPrice: price,
          oldPrice: asset.currentPrice,
          providerSymbol: formatCoinGeckoProviderSymbol(providerSymbol),
          providerPriceUpdatedAt: readCoinGeckoTimestamp(priceData?.last_updated_at),
          source: "coingecko-simple-price",
          symbol: asset.symbol,
        });
      });
    });

    return Response.json(createMarketDataRefreshResult(updates, failures, "CoinGecko"));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "CoinGecko refresh failed." },
      { status: 500 },
    );
  }
}

function groupCryptoAssetsBySymbol(assets: MarketDataAssetRequest[]) {
  const assetsBySymbol = new Map<string, MarketDataAssetRequest[]>();
  const invalidFailures: MarketDataPriceFailure[] = [];

  assets.forEach((asset) => {
    const symbol = normalizeMarketSymbol(asset.symbol);
    const providerSymbol = getCoinGeckoCryptoProviderSymbol(asset.symbol);
    if (!symbol || !providerSymbol) {
      invalidFailures.push({
        id: asset.id,
        kind: "crypto",
        providerSymbol,
        reason: "Missing crypto symbol.",
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

async function fetchCoinGeckoSimplePrices(ids: string[], apiKey: string) {
  const headerResponse = await fetchCoinGeckoSimplePricesOnce(ids, apiKey, false);
  if (headerResponse.ok || !shouldRetryCoinGeckoWithQueryKey(headerResponse.error)) {
    return headerResponse;
  }

  return fetchCoinGeckoSimplePricesOnce(ids, apiKey, true);
}

async function fetchCoinGeckoSimplePricesOnce(
  ids: string[],
  apiKey: string,
  includeQueryApiKey: boolean,
) {
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_last_updated_at", "true");
  if (includeQueryApiKey) {
    url.searchParams.set("x_cg_demo_api_key", apiKey);
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "x-cg-demo-api-key": apiKey,
    },
  });
  const body = await readJsonBody(response);

  if (!response.ok) {
    return {
      error: getCoinGeckoErrorMessage(body) || `CoinGecko returned ${response.status}.`,
      ok: false as const,
    };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "CoinGecko returned an unexpected response.", ok: false as const };
  }

  return { body: body as CoinGeckoSimplePriceResponse, ok: true as const };
}

function shouldRetryCoinGeckoWithQueryKey(error: string) {
  const normalizedError = error.toLowerCase();
  return (
    normalizedError.includes("api key missing") ||
    normalizedError.includes("authentication") ||
    normalizedError.includes("unauthorized")
  );
}

async function readJsonBody(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function appendSymbolFailure(
  assets: MarketDataAssetRequest[],
  failures: MarketDataPriceFailure[],
  providerSymbol: string,
  reason: string,
) {
  assets.forEach((asset) => {
    failures.push({
      id: asset.id,
      kind: "crypto",
      providerSymbol: formatCoinGeckoProviderSymbol(providerSymbol),
      reason,
      symbol: asset.symbol,
    });
  });
}

function formatCoinGeckoProviderSymbol(providerSymbol: string) {
  return providerSymbol ? `${providerSymbol.toUpperCase()}/USD` : "";
}

function readCoinGeckoTimestamp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return new Date(value * 1000).toISOString();
}

function getCoinGeckoErrorMessage(body: unknown) {
  if (!body || typeof body !== "object") {
    return "";
  }

  const record = body as Record<string, unknown>;
  const status = record.status;
  if (status && typeof status === "object") {
    const statusRecord = status as Record<string, unknown>;
    if (typeof statusRecord.error_message === "string") {
      return statusRecord.error_message;
    }
  }

  return typeof record.error === "string" ? record.error : "";
}
