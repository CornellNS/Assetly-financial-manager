import type { FinanceData } from "./finance-data";

export const finnhubSettingsStorageKey = "ledger-room-finnhub-settings";
export const finnhubSignupUrl = "https://finnhub.io/";
export const finnhubDocsUrl = "https://finnhub.io/docs/api";
export const coingeckoSettingsStorageKey = "ledger-room-coingecko-settings";
export const coingeckoSignupUrl = "https://www.coingecko.com/en/api/pricing";
export const coingeckoDocsUrl = "https://docs.coingecko.com/v3.0.1/reference/simple-price";

export type FinnhubSettings = {
  apiKey: string;
};

export type CoinGeckoSettings = {
  apiKey: string;
};

export const defaultFinnhubSettings: FinnhubSettings = {
  apiKey: "",
};

export const defaultCoinGeckoSettings: CoinGeckoSettings = {
  apiKey: "",
};

export type MarketAssetKind = "stock" | "crypto";
export type MarketDataProvider = "Finnhub" | "CoinGecko" | "Mixed";

export type MarketDataAssetRequest = {
  currentPrice: number;
  id: string;
  marketPriceUpdatedAt?: string;
  symbol: string;
};

export type MarketDataPriceUpdate = {
  id: string;
  kind: MarketAssetKind;
  newPrice: number;
  oldPrice: number;
  providerPriceUpdatedAt?: string;
  providerSymbol: string;
  source: "quote" | "crypto-candle" | "coingecko-simple-price";
  symbol: string;
};

export type MarketDataPriceFailure = {
  id: string;
  kind: MarketAssetKind;
  providerSymbol: string;
  reason: string;
  symbol: string;
};

export type MarketDataRefreshResult = {
  failures: MarketDataPriceFailure[];
  fetchedAt: string;
  provider: MarketDataProvider;
  updates: MarketDataPriceUpdate[];
};

export function normalizeFinnhubSettings(value: unknown): FinnhubSettings {
  if (!value || typeof value !== "object") {
    return { ...defaultFinnhubSettings };
  }

  const record = value as Record<string, unknown>;
  return {
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
  };
}

export function normalizeFinnhubSettingsJson(value: string | null): FinnhubSettings {
  if (!value) {
    return { ...defaultFinnhubSettings };
  }

  try {
    return normalizeFinnhubSettings(JSON.parse(value));
  } catch {
    return { ...defaultFinnhubSettings };
  }
}

export function normalizeCoinGeckoSettings(value: unknown): CoinGeckoSettings {
  if (!value || typeof value !== "object") {
    return { ...defaultCoinGeckoSettings };
  }

  const record = value as Record<string, unknown>;
  return {
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
  };
}

export function normalizeCoinGeckoSettingsJson(value: string | null): CoinGeckoSettings {
  if (!value) {
    return { ...defaultCoinGeckoSettings };
  }

  try {
    return normalizeCoinGeckoSettings(JSON.parse(value));
  } catch {
    return { ...defaultCoinGeckoSettings };
  }
}

export function normalizeMarketSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

export function getFinnhubCryptoProviderSymbol(symbol: string) {
  const normalizedSymbol = normalizeMarketSymbol(symbol);
  return normalizedSymbol ? `BINANCE:${normalizedSymbol}USDT` : "";
}

export function getCoinGeckoCryptoProviderSymbol(symbol: string) {
  const baseSymbol = symbol.trim().split(/[/:_-]/)[0] ?? symbol;
  const normalizedSymbol = normalizeMarketSymbol(baseSymbol);
  const coinGeckoIdsBySymbol: Record<string, string> = {
    AAVE: "aave",
    ADA: "cardano",
    ARB: "arbitrum",
    ATOM: "cosmos",
    AVAX: "avalanche-2",
    BCH: "bitcoin-cash",
    BNB: "binancecoin",
    BTC: "bitcoin",
    DOGE: "dogecoin",
    DOT: "polkadot",
    ETC: "ethereum-classic",
    ETH: "ethereum",
    FIL: "filecoin",
    ICP: "internet-computer",
    LINK: "chainlink",
    LTC: "litecoin",
    MATIC: "matic-network",
    NEAR: "near",
    OP: "optimism",
    PAXG: "pax-gold",
    PEPE: "pepe",
    POL: "polygon-ecosystem-token",
    SHIB: "shiba-inu",
    SOL: "solana",
    TRX: "tron",
    UNI: "uniswap",
    USDC: "usd-coin",
    USDT: "tether",
    XLM: "stellar",
    XRP: "ripple",
  };

  return coinGeckoIdsBySymbol[normalizedSymbol] ?? normalizedSymbol.toLowerCase();
}

export function createMarketDataRefreshResult(
  updates: MarketDataPriceUpdate[] = [],
  failures: MarketDataPriceFailure[] = [],
  provider: MarketDataProvider = "Finnhub",
): MarketDataRefreshResult {
  return {
    failures,
    fetchedAt: new Date().toISOString(),
    provider,
    updates,
  };
}

export function applyMarketDataPriceUpdates(
  data: FinanceData,
  updates: MarketDataPriceUpdate[],
  failures: MarketDataPriceFailure[] = [],
  fetchedAt = new Date().toISOString(),
): FinanceData {
  const stockPrices = new Map(
    updates
      .filter((update) => update.kind === "stock" && isValidMarketPrice(update.newPrice))
      .map((update) => [update.id, update]),
  );
  const cryptoPrices = new Map(
    updates
      .filter((update) => update.kind === "crypto" && isValidMarketPrice(update.newPrice))
      .map((update) => [update.id, update]),
  );
  const stockFailures = new Map(
    failures
      .filter((failure) => failure.kind === "stock")
      .map((failure) => [failure.id, failure]),
  );
  const cryptoFailures = new Map(
    failures
      .filter((failure) => failure.kind === "crypto")
      .map((failure) => [failure.id, failure]),
  );

  if (
    stockPrices.size === 0 &&
    cryptoPrices.size === 0 &&
    stockFailures.size === 0 &&
    cryptoFailures.size === 0
  ) {
    return data;
  }

  return {
    ...data,
    crypto: data.crypto.map((holding) => {
      const update = cryptoPrices.get(holding.id);
      if (update) {
        const updatedAt = update.providerPriceUpdatedAt ?? fetchedAt;
        return {
          ...holding,
          currentPrice: update.newPrice,
          marketPriceError: undefined,
          marketPriceLastAttemptAt: fetchedAt,
          marketPriceStatus: "updated" as const,
          marketPriceUpdatedAt: updatedAt,
        };
      }

      const failure = cryptoFailures.get(holding.id);
      return failure
        ? {
            ...holding,
            marketPriceError: failure.reason,
            marketPriceLastAttemptAt: fetchedAt,
            marketPriceStatus: "failed" as const,
          }
        : holding;
    }),
    stocks: data.stocks.map((stock) => {
      const update = stockPrices.get(stock.id);
      if (update) {
        const updatedAt = update.providerPriceUpdatedAt ?? fetchedAt;
        return {
          ...stock,
          currentPrice: update.newPrice,
          marketPriceError: undefined,
          marketPriceLastAttemptAt: fetchedAt,
          marketPriceStatus: "updated" as const,
          marketPriceUpdatedAt: updatedAt,
        };
      }

      const failure = stockFailures.get(stock.id);
      return failure
        ? {
            ...stock,
            marketPriceError: failure.reason,
            marketPriceLastAttemptAt: fetchedAt,
            marketPriceStatus: "failed" as const,
          }
        : stock;
    }),
  };
}

export function applyMarketDataRefreshResult(
  data: FinanceData,
  result: MarketDataRefreshResult,
): FinanceData {
  return applyMarketDataPriceUpdates(data, result.updates, result.failures, result.fetchedAt);
}

export function isValidMarketPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function sortMarketDataAssetsByOldestUpdate<
  T extends { id: string; marketPriceUpdatedAt?: string; symbol?: string; ticker?: string },
>(assets: T[]) {
  return assets.slice().sort((a, b) => {
    const comparison = getMarketPriceUpdatedTime(a) - getMarketPriceUpdatedTime(b);
    return (
      comparison ||
      getMarketDataAssetSymbol(a).localeCompare(getMarketDataAssetSymbol(b)) ||
      a.id.localeCompare(b.id)
    );
  });
}

export function getMarketPriceUpdatedTime(asset: { marketPriceUpdatedAt?: string }) {
  if (!asset.marketPriceUpdatedAt) {
    return 0;
  }

  const time = Date.parse(asset.marketPriceUpdatedAt);
  return Number.isNaN(time) ? 0 : time;
}

export function isMarketDataAssetStale(
  asset: { marketPriceUpdatedAt?: string },
  maxAgeDays = 7,
  now = new Date(),
) {
  if (!asset.marketPriceUpdatedAt) {
    return true;
  }

  const updatedTime = Date.parse(asset.marketPriceUpdatedAt);
  if (Number.isNaN(updatedTime)) {
    return true;
  }

  return updatedTime < now.getTime() - maxAgeDays * 86_400_000;
}

export function getStaleMarketDataAssets<
  T extends { id: string; marketPriceUpdatedAt?: string; symbol?: string; ticker?: string },
>(assets: T[], maxAgeDays = 7, now = new Date()) {
  return sortMarketDataAssetsByOldestUpdate(
    assets.filter((asset) => isMarketDataAssetStale(asset, maxAgeDays, now)),
  );
}

function getMarketDataAssetSymbol(asset: { symbol?: string; ticker?: string }) {
  return normalizeMarketSymbol(asset.ticker ?? asset.symbol ?? "");
}
