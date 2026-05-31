import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceCreditCardCycles,
  advanceDebtScheduleAfterPayment,
  advanceFinanceSchedules,
  advanceScheduledDatePastDate,
  applyCreditCardPayment,
  applyDebtPayment,
  calculateCreditCardMinimumPayment,
  calculatePercent,
  calculateSummary,
  calculateTaxSummary,
  applyStockTradeToHolding,
  consolidateStockHoldingsByTicker,
  createStockLotFromBuy,
  creditStatementRemaining,
  defaultGraphSecondaryColor,
  defaultWorkspaceName,
  finalizeTaxYearReport,
  formatDateInput,
  generateTaxYearReport,
  getDashboardIncomeExpenseSeries,
  getMonthlyPaycheckNetSeries,
  getDueDateStatus,
  getWeeklyReportEvents,
  getWeeklyReportCreditCards,
  getWeeklyReportFlowRows,
  getWeeklyReportWeekStart,
  getWeeklyReportWindow,
  hasDemoFinanceData,
  hasUserCreatedFinanceData,
  isLongTermTaxSale,
  markCreditCardStatementPaid,
  mockFinanceData,
  monthlyAmount,
  parseFiniteNumber,
  recalculateStockHoldingFromLots,
  regenerateTaxYearReport,
  removeDemoFinanceData,
  sellStockLotsFifo,
  stackStockPurchase,
  stockSaleTaxRecordFromTrade,
  syncTaxReports,
  taxAssetSaleGain,
} from "./finance-data.ts";
import { normalizeFinanceData } from "./finance-validation.ts";
import {
  applyMarketDataPriceUpdates,
  createMarketDataRefreshResult,
  getCoinGeckoCryptoProviderSymbol,
  getStaleMarketDataAssets,
  isMarketDataAssetStale,
  normalizeCoinGeckoSettingsJson,
  normalizeFinnhubSettingsJson,
  sortMarketDataAssetsByOldestUpdate,
} from "./market-data.ts";
import {
  cleanupLocalWorkspaceStorage,
  financeAgentAuditStorageKey,
  financeAgentPanelStorageKey,
  legacyWeeklyReportHistoryStorageKey,
  weeklyReportHistoryStorageKey,
} from "./storage-cleanup.ts";
import {
  defaultFinanceStorageKey,
  financeStorageRecoveryKey,
  readStoredFinanceData,
} from "./finance-storage.ts";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("finance calculations", () => {
  it("summarizes the sample workspace without non-finite values", () => {
    const summary = calculateSummary(mockFinanceData);

    assert.equal(Number.isFinite(summary.totalNetWorth), true);
    assert.equal(Number.isFinite(summary.monthlyIncome), true);
    assert.equal(Number.isFinite(summary.creditUtilization), true);
    assert.equal(summary.emergencyFund?.name, "Emergency fund");
  });

  it("handles common frequency cadences", () => {
    assert.equal(monthlyAmount(100, "Monthly"), 100);
    assert.equal(monthlyAmount(100, "Semi-monthly"), 200);
    assert.equal(Math.round(monthlyAmount(100, "Biweekly")), 217);
  });

  it("parses only finite numeric input", () => {
    assert.equal(parseFiniteNumber("$1,250.50"), 1250.5);
    assert.equal(parseFiniteNumber(""), null);
    assert.equal(parseFiniteNumber("Infinity"), null);
  });

  it("keeps zero denominators from producing bad progress values", () => {
    assert.equal(calculatePercent(50, 0), 0);
    assert.equal(calculatePercent(50, 100), 50);
  });

  it("includes general debt in total debt and net worth summaries", () => {
    const data = {
      ...mockFinanceData,
      creditCards: [],
      debts: [
        {
          apr: 6.5,
          autopay: true,
          autopayDate: "2026-06-15",
          collectorName: "",
          currentBalance: 5000,
          disputeDeadline: "",
          dueDate: "2026-06-15",
          id: "debt-1",
          lender: "Sample Servicer",
          loanDate: "2025-01-15",
          minimumPayment: 150,
          name: "Student loan",
          notes: "",
          originalBalance: 6500,
          originalCreditor: "",
          paymentFrequency: "Monthly",
          payoffDate: "",
          status: "current",
          type: "Student loan",
        },
      ],
    };
    const summary = calculateSummary(data);

    assert.equal(summary.totalDebtBalance, 5000);
    assert.equal(summary.totalDebtOriginalBalance, 6500);
    assert.equal(summary.totalDebtMinimumPayment, 150);
    assert.equal(summary.totalDebtWithCreditCards, 5000);
    assert.equal(
      summary.totalNetWorth,
      summary.totalInvestments + summary.totalSaved - summary.totalDebtWithCreditCards,
    );
  });

  it("applies debt payments and marks paid debts as paid", () => {
    const debt: Parameters<typeof applyDebtPayment>[0] = {
      apr: 6.5,
      autopay: true,
      autopayDate: "2026-06-15",
      collectorName: "",
      currentBalance: 500,
      disputeDeadline: "",
      dueDate: "2026-06-15",
      id: "debt-1",
      lender: "Sample Servicer",
      loanDate: "2025-01-15",
      minimumPayment: 150,
      name: "Student loan",
      notes: "",
      originalBalance: 6500,
      originalCreditor: "",
      paymentFrequency: "Monthly",
      payoffDate: "",
      status: "current",
      type: "Student loan",
    };

    const partial = applyDebtPayment(debt, { amount: 150 });
    const paid = applyDebtPayment(debt, { amount: 999 });

    assert.equal(partial.currentBalance, 350);
    assert.equal(partial.status, "current");
    assert.equal(paid.currentBalance, 0);
    assert.equal(paid.status, "paid");
  });

  it("maps common crypto symbols to CoinGecko simple price ids", () => {
    assert.equal(getCoinGeckoCryptoProviderSymbol("btc"), "bitcoin");
    assert.equal(getCoinGeckoCryptoProviderSymbol("ETH"), "ethereum");
    assert.equal(getCoinGeckoCryptoProviderSymbol(" sol "), "solana");
    assert.equal(getCoinGeckoCryptoProviderSymbol("BTC/USD"), "bitcoin");
    assert.equal(getCoinGeckoCryptoProviderSymbol("PAXG"), "pax-gold");
  });

  it("applies market refresh updates directly to current prices", () => {
    const result = createMarketDataRefreshResult([
      {
        id: "stk-1",
        kind: "stock",
        newPrice: 210.25,
        oldPrice: mockFinanceData.stocks[0].currentPrice,
        providerSymbol: "AAPL",
        source: "quote",
        symbol: "AAPL",
      },
      {
        id: "cry-1",
        kind: "crypto",
        newPrice: 72000,
        oldPrice: mockFinanceData.crypto[0].currentPrice,
        providerSymbol: "BTC/USD",
        providerPriceUpdatedAt: "2026-05-29T17:55:00.000Z",
        source: "coingecko-simple-price",
        symbol: "BTC",
      },
    ]);

    assert.equal(mockFinanceData.stocks[0].currentPrice, 191.4);
    assert.equal(mockFinanceData.crypto[0].currentPrice, 68250);

    const updated = applyMarketDataPriceUpdates(
      mockFinanceData,
      result.updates,
      result.failures,
      "2026-05-29T18:00:00.000Z",
    );

    assert.equal(updated.stocks[0].currentPrice, 210.25);
    assert.equal(updated.stocks[0].marketPriceStatus, "updated");
    assert.equal(updated.stocks[0].marketPriceUpdatedAt, "2026-05-29T18:00:00.000Z");
    assert.equal(updated.stocks[1].currentPrice, mockFinanceData.stocks[1].currentPrice);
    assert.equal(updated.crypto[0].currentPrice, 72000);
    assert.equal(updated.crypto[0].marketPriceStatus, "updated");
    assert.equal(updated.crypto[0].marketPriceLastAttemptAt, "2026-05-29T18:00:00.000Z");
    assert.equal(updated.crypto[0].marketPriceUpdatedAt, "2026-05-29T17:55:00.000Z");
    assert.equal(updated.crypto[1].currentPrice, mockFinanceData.crypto[1].currentPrice);
  });

  it("keeps failed Finnhub symbols from overwriting saved prices", () => {
    const result = createMarketDataRefreshResult([], [
      {
        id: "stk-1",
        kind: "stock",
        providerSymbol: "NOPE",
        reason: "No current quote returned.",
        symbol: "NOPE",
      },
    ]);
    const updated = applyMarketDataPriceUpdates(
      mockFinanceData,
      result.updates,
      result.failures,
      "2026-05-29T18:05:00.000Z",
    );

    assert.equal(result.failures[0].symbol, "NOPE");
    assert.equal(updated.stocks[0].currentPrice, mockFinanceData.stocks[0].currentPrice);
    assert.equal(updated.stocks[0].marketPriceStatus, "failed");
    assert.equal(updated.stocks[0].marketPriceError, "No current quote returned.");
    assert.equal(updated.stocks[0].marketPriceLastAttemptAt, "2026-05-29T18:05:00.000Z");
  });

  it("sorts market refresh requests by oldest price update first", () => {
    const sorted = sortMarketDataAssetsByOldestUpdate([
      { id: "new", marketPriceUpdatedAt: "2026-05-29T18:00:00.000Z", ticker: "NEW" },
      { id: "never", ticker: "NEVER" },
      { id: "old", marketPriceUpdatedAt: "2026-05-28T18:00:00.000Z", ticker: "OLD" },
    ]);

    assert.deepEqual(sorted.map((item) => item.id), ["never", "old", "new"]);
  });

  it("filters weekly report market refreshes to stale assets", () => {
    const now = new Date("2026-05-29T18:00:00.000Z");
    const staleAssets = getStaleMarketDataAssets(
      [
        { id: "fresh", marketPriceUpdatedAt: "2026-05-28T18:00:00.000Z", ticker: "FRESH" },
        { id: "old", marketPriceUpdatedAt: "2026-05-20T18:00:00.000Z", ticker: "OLD" },
        { id: "exact", marketPriceUpdatedAt: "2026-05-22T18:00:00.000Z", ticker: "EXACT" },
        { id: "never", ticker: "NEVER" },
      ],
      7,
      now,
    );

    assert.equal(isMarketDataAssetStale({ ticker: "NEVER" }, 7, now), true);
    assert.equal(
      isMarketDataAssetStale({ marketPriceUpdatedAt: "2026-05-20T18:00:00.000Z" }, 7, now),
      true,
    );
    assert.equal(
      isMarketDataAssetStale({ marketPriceUpdatedAt: "2026-05-22T18:00:00.000Z" }, 7, now),
      false,
    );
    assert.deepEqual(staleAssets.map((asset) => asset.id), ["never", "old"]);
  });

  it("normalizes missing Finnhub settings to an empty local key", () => {
    assert.equal(normalizeFinnhubSettingsJson(null).apiKey, "");
    assert.equal(normalizeFinnhubSettingsJson("{bad json").apiKey, "");
  });

  it("normalizes missing CoinGecko settings to an empty local key", () => {
    assert.equal(normalizeCoinGeckoSettingsJson(null).apiKey, "");
    assert.equal(normalizeCoinGeckoSettingsJson("{bad json").apiKey, "");
  });

  it("cleans local workspace cache without deleting finance records", () => {
    const storage = new MemoryStorage();
    const recentAuditEntries = Array.from({ length: 55 }, (_, index) => ({
      actions: [],
      createdAt: "2026-05-28T12:00:00.000Z",
      id: `audit-${index}`,
      prompt: "Review finances",
      proposalTitle: "Report",
      status: "applied",
    }));
    storage.setItem(
      financeAgentAuditStorageKey,
      JSON.stringify([
        ...recentAuditEntries,
        {
          actions: [],
          createdAt: "2026-01-01T12:00:00.000Z",
          id: "old-audit",
          prompt: "Old",
          proposalTitle: "Old",
          status: "applied",
        },
        { id: "bad-audit" },
      ]),
    );
    storage.setItem(
      weeklyReportHistoryStorageKey,
      JSON.stringify([
        {
          generatedAt: "2026-04-29T12:00:00.000Z",
          id: "april",
          weekStartDate: "2026-04-27",
        },
        {
          generatedAt: "2026-05-01T12:00:00.000Z",
          id: "may-generated",
          weekStartDate: "2026-04-27",
        },
        {
          id: "may-start",
          weekStartDate: "2026-05-04",
        },
      ]),
    );
    storage.setItem(legacyWeeklyReportHistoryStorageKey, "{bad json");
    storage.setItem("ledger-room-weekly-report:2026-04-01", "{}");
    storage.setItem("ledger-room-weekly-report:2026-05-12", "{}");
    storage.setItem(
      "ledger-room-dismissed-notices",
      JSON.stringify(Array.from({ length: 45 }, (_, index) => `notice-${index}`)),
    );
    storage.setItem(financeAgentPanelStorageKey, JSON.stringify({ height: 400, left: null }));
    storage.setItem(defaultFinanceStorageKey, "keep-finance-data");

    const result = cleanupLocalWorkspaceStorage(
      storage,
      new Date("2026-05-29T12:00:00.000Z"),
    );
    const auditEntries = JSON.parse(
      storage.getItem(financeAgentAuditStorageKey) ?? "[]",
    ) as unknown[];
    const weeklyReports = JSON.parse(
      storage.getItem(weeklyReportHistoryStorageKey) ?? "[]",
    ) as Array<{ id: string }>;
    const dismissedIds = JSON.parse(
      storage.getItem("ledger-room-dismissed-notices") ?? "[]",
    ) as string[];

    assert.equal(auditEntries.length, 50);
    assert.deepEqual(weeklyReports.map((report) => report.id), [
      "may-generated",
      "may-start",
    ]);
    assert.equal(dismissedIds.length, 40);
    assert.equal(storage.getItem(defaultFinanceStorageKey), "keep-finance-data");
    assert.equal(storage.getItem("ledger-room-weekly-report:2026-04-01"), null);
    assert.equal(storage.getItem("ledger-room-weekly-report:2026-05-12"), "{}");
    assert.equal(storage.getItem(financeAgentPanelStorageKey), null);
    assert.equal(storage.getItem(legacyWeeklyReportHistoryStorageKey), null);
    assert.ok(result.trimmedAiAuditEntries > 0);
    assert.ok(result.trimmedWeeklyReports > 0);
  });

  it("moves corrupt saved finance JSON to a recovery key before clearing it", () => {
    const storage = new MemoryStorage();
    storage.setItem(defaultFinanceStorageKey, "{bad json");

    const result = readStoredFinanceData(defaultFinanceStorageKey, mockFinanceData, storage);

    assert.equal(result.ok, false);
    assert.equal(storage.getItem(defaultFinanceStorageKey), null);
    assert.equal(storage.getItem(financeStorageRecoveryKey), "{bad json");
  });

  it("calculates credit card minimum payments from a rate", () => {
    assert.equal(calculateCreditCardMinimumPayment(1840, 2.45), 45.08);
    assert.equal(calculateCreditCardMinimumPayment(125, 0), 0);
  });

  it("separates credit current balance from interest debt", () => {
    const summary = calculateSummary({
      ...mockFinanceData,
      creditCards: [
        {
          ...mockFinanceData.creditCards[0],
          balance: 5000,
          currentBalance: 1200,
          interestBalance: 500,
          statementBalance: 900,
          statementPaid: 300,
          limit: 2000,
        },
      ],
    });

    assert.equal(summary.totalCreditCurrentBalance, 1200);
    assert.equal(summary.totalCreditBalance, 500);
    assert.equal(summary.totalStatementBalance, 900);
    assert.equal(summary.totalStatementPaid, 300);
    assert.equal(summary.totalStatementRemaining, 600);
    assert.equal(summary.creditUtilization, 60);
  });

  it("labels overdue and upcoming dates from an injectable clock", () => {
    const baseDate = new Date(2026, 4, 27);

    assert.equal(getDueDateStatus("2026-05-26", baseDate).label, "1 day overdue");
    assert.equal(getDueDateStatus("2026-05-27", baseDate).label, "Due today");
    assert.equal(getDueDateStatus("2026-06-03", baseDate).label, "7 days");
  });

  it("builds a weekly report window from today through the next 6 days", () => {
    const window = getWeeklyReportWindow(new Date(2026, 4, 29, 14));

    assert.equal(formatDateInput(window.startDate), "2026-05-29");
    assert.equal(formatDateInput(window.endDate), "2026-06-04");
    assert.deepEqual(window.days.map(formatDateInput), [
      "2026-05-29",
      "2026-05-30",
      "2026-05-31",
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
    ]);
  });

  it("anchors generated weekly reports to Monday through Sunday", () => {
    const fridayStart = getWeeklyReportWeekStart(new Date(2026, 4, 29, 14));
    const mondayStart = getWeeklyReportWeekStart(new Date(2026, 5, 1, 9));
    const sundayStart = getWeeklyReportWeekStart(new Date(2026, 4, 31, 23));
    const reportWindow = getWeeklyReportWindow(fridayStart);

    assert.equal(formatDateInput(fridayStart), "2026-05-25");
    assert.equal(formatDateInput(mondayStart), "2026-06-01");
    assert.equal(formatDateInput(sundayStart), "2026-05-25");
    assert.deepEqual(reportWindow.days.map(formatDateInput), [
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
      "2026-05-30",
      "2026-05-31",
    ]);
  });

  it("filters weekly report income, recurring, debt, and card events into the report week", () => {
    const data = {
      ...mockFinanceData,
      creditCards: [
        {
          ...mockFinanceData.creditCards[0],
          autopay: false,
          autopayDate: "",
          dueDate: "2026-06-01",
          statementBalance: 100,
          statementPaid: 20,
        },
      ],
      debts: [
        {
          apr: 7.25,
          autopay: false,
          autopayDate: "",
          collectorName: "",
          currentBalance: 400,
          disputeDeadline: "",
          dueDate: "2026-06-01",
          id: "debt-weekly",
          lender: "Debt Servicer",
          loanDate: "2025-08-10",
          minimumPayment: 30,
          name: "Personal loan",
          notes: "",
          originalBalance: 500,
          originalCreditor: "",
          paymentFrequency: "Monthly" as const,
          payoffDate: "",
          status: "current" as const,
          type: "Personal loan" as const,
        },
      ],
      incomeSources: [
        {
          ...mockFinanceData.incomeSources[0],
          amount: 200,
          frequency: "Weekly" as const,
          nextPaymentDate: "2026-05-31",
        },
      ],
      recurringPayments: [
        {
          ...mockFinanceData.recurringPayments[0],
          amount: 50,
          frequency: "Weekly" as const,
          nextChargeDate: "2026-05-30",
          status: "active" as const,
        },
        {
          ...mockFinanceData.recurringPayments[1],
          amount: 75,
          nextChargeDate: "2026-06-08",
          status: "active" as const,
        },
      ],
    };
    const events = getWeeklyReportEvents(data, new Date(2026, 4, 29));
    const flowRows = getWeeklyReportFlowRows(data, new Date(2026, 4, 29));
    const may30 = flowRows.find((row) => row.dateKey === "2026-05-30");
    const may31 = flowRows.find((row) => row.dateKey === "2026-05-31");
    const jun1 = flowRows.find((row) => row.dateKey === "2026-06-01");

    assert.deepEqual(events.map((event) => `${event.kind}:${event.dateKey}:${event.amount}`), [
      "recurring:2026-05-30:50",
      "income:2026-05-31:200",
      "debt:2026-06-01:30",
      "credit-card:2026-06-01:80",
    ]);
    assert.equal(may30?.recurringOut, 50);
    assert.equal(may31?.income, 200);
    assert.equal(jun1?.debtOut, 30);
    assert.equal(jun1?.cardOut, 80);
    assert.equal(jun1?.net, -110);
  });

  it("fast-forwards old daily weekly report schedules into the report window", () => {
    const data = {
      ...mockFinanceData,
      creditCards: [],
      debts: [],
      incomeSources: [
        {
          ...mockFinanceData.incomeSources[0],
          amount: 10,
          frequency: "Daily" as const,
          nextPaymentDate: "2020-01-01",
        },
      ],
      recurringPayments: [],
    };
    const events = getWeeklyReportEvents(data, new Date(2026, 4, 29));

    assert.deepEqual(events.map((event) => event.dateKey), [
      "2026-05-29",
      "2026-05-30",
      "2026-05-31",
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
    ]);
  });

  it("uses monthly autopay dates for weekly card and debt events", () => {
    const data = {
      ...mockFinanceData,
      creditCards: [
        {
          ...mockFinanceData.creditCards[0],
          autopay: true,
          autopayDate: "2026-06-02",
          dueDate: "2026-06-15",
          statementBalance: 120,
          statementPaid: 20,
        },
      ],
      debts: [
        {
          apr: 7.25,
          autopay: true,
          autopayDate: "2026-06-03",
          collectorName: "",
          currentBalance: 400,
          disputeDeadline: "",
          dueDate: "2026-06-20",
          id: "debt-autopay-weekly",
          lender: "Debt Servicer",
          loanDate: "2025-08-10",
          minimumPayment: 30,
          name: "Personal loan",
          notes: "",
          originalBalance: 500,
          originalCreditor: "",
          paymentFrequency: "Quarterly" as const,
          payoffDate: "",
          status: "current" as const,
          type: "Personal loan" as const,
        },
      ],
      incomeSources: [],
      recurringPayments: [],
    };
    const events = getWeeklyReportEvents(data, new Date(2026, 4, 29));

    assert.deepEqual(events.map((event) => `${event.kind}:${event.dateKey}:${event.typeLabel}:${event.amount}`), [
      "credit-card:2026-06-02:Card autopay:100",
      "debt:2026-06-03:Debt autopay:30",
    ]);
  });

  it("repeats autopay dates monthly into later weekly reports", () => {
    const data = {
      ...mockFinanceData,
      creditCards: [
        {
          ...mockFinanceData.creditCards[0],
          autopay: true,
          autopayDate: "2026-06-02",
          dueDate: "2026-06-15",
          statementBalance: 120,
          statementPaid: 20,
        },
      ],
      debts: [],
      incomeSources: [],
      recurringPayments: [],
    };
    const events = getWeeklyReportEvents(data, new Date(2026, 6, 1));

    assert.deepEqual(events.map((event) => `${event.kind}:${event.dateKey}:${event.typeLabel}:${event.amount}`), [
      "credit-card:2026-07-02:Card autopay:100",
    ]);
  });

  it("scopes weekly report cards to due cards and falls back to all cards", () => {
    const today = new Date(2026, 4, 29);
    const dueCard = {
      ...mockFinanceData.creditCards[0],
      autopay: false,
      autopayDate: "",
      dueDate: "2026-06-01",
      statementBalance: 100,
      statementPaid: 0,
    };
    const laterCard = {
      ...mockFinanceData.creditCards[1],
      autopay: false,
      autopayDate: "",
      dueDate: "2026-06-20",
      statementBalance: 200,
      statementPaid: 0,
    };
    const scopedCards = getWeeklyReportCreditCards(
      {
        ...mockFinanceData,
        creditCards: [dueCard, laterCard],
      },
      today,
    );
    const fallbackCards = getWeeklyReportCreditCards(
      {
        ...mockFinanceData,
        creditCards: [
          { ...dueCard, dueDate: "2026-06-20" },
          laterCard,
        ],
      },
      today,
    );

    assert.deepEqual(scopedCards.map((card) => card.id), [dueCard.id]);
    assert.deepEqual(fallbackCards.map((card) => card.id), [dueCard.id, laterCard.id]);
  });

  it("summarizes tax sales by term and estimates federal tax components", () => {
    const summary = calculateTaxSummary(mockFinanceData);

    assert.equal(Number.isFinite(summary.totalEstimatedFederalTax), true);
    assert.equal(summary.sales.length, mockFinanceData.taxAssetSales.length);
    assert.equal(summary.standardDeduction, 16100);
    assert.equal(summary.netCapitalGain > 0, true);
    assert.equal(summary.capitalLossDeductionEstimate, 0);
  });

  it("uses manual long-term capital gains rate settings", () => {
    const data = {
      ...mockFinanceData,
      incomeSources: [],
      investments: [],
      paychecks: [],
      taxAssetSales: [
        {
          acquiredDate: "2024-01-01",
          assetType: "Stock" as const,
          costBasis: 1000,
          fees: 0,
          id: "tax-long-term",
          name: "Long-term sale",
          notes: "",
          proceeds: 2000,
          soldDate: "2026-01-10",
          symbol: "LTCG",
        },
      ],
      taxProfile: {
        ...mockFinanceData.taxProfile,
        additionalInvestmentTaxRate: 0,
        estimatedPayments: 0,
        federalWithholding: 0,
        longTermCapitalGainsTaxRate: 0,
        ordinaryIncomeTaxRate: 0,
        otherAdjustments: 0,
        qualifiedDividendTaxRate: 0,
        selfEmploymentTaxRate: 0,
        standardDeductionAmount: 0,
      },
    };

    const zeroRateSummary = calculateTaxSummary(data);
    const fifteenRateSummary = calculateTaxSummary({
      ...data,
      taxProfile: {
        ...data.taxProfile,
        longTermCapitalGainsTaxRate: 15,
      },
    });

    assert.equal(zeroRateSummary.longTermCapitalGainTaxEstimate, 0);
    assert.equal(fifteenRateSummary.longTermCapitalGainTaxEstimate, 150);
  });

  it("taxes short-term capital gains with the ordinary income rate", () => {
    const summary = calculateTaxSummary({
      ...mockFinanceData,
      incomeSources: [],
      investments: [],
      paychecks: [],
      taxAssetSales: [
        {
          acquiredDate: "2026-01-01",
          assetType: "Stock" as const,
          costBasis: 1000,
          fees: 0,
          id: "tax-short-term",
          name: "Short-term sale",
          notes: "",
          proceeds: 2000,
          soldDate: "2026-06-01",
          symbol: "STCG",
        },
      ],
      taxProfile: {
        ...mockFinanceData.taxProfile,
        additionalInvestmentTaxRate: 0,
        estimatedPayments: 0,
        federalWithholding: 0,
        longTermCapitalGainsTaxRate: 0,
        ordinaryIncomeTaxRate: 10,
        otherAdjustments: 0,
        qualifiedDividendTaxRate: 0,
        selfEmploymentTaxRate: 0,
        standardDeductionAmount: 0,
      },
    });

    assert.equal(summary.taxableShortTermCapitalGain, 1000);
    assert.equal(summary.ordinaryTaxEstimate, 100);
    assert.equal(summary.longTermCapitalGainTaxEstimate, 0);
  });

  it("counts orphan imported paychecks as standalone ordinary income", () => {
    const data = {
      ...mockFinanceData,
      incomeSources: [],
      paychecks: [
        {
          additionalMedicareTaxWithheld: 0,
          employerName: "Old Employer",
          federalIncomeTaxWithheld: 1000,
          grossPay: 10000,
          id: "pay-orphan",
          incomeSourceId: "missing-source",
          localIncomeTaxWithheld: 0,
          medicareTaxWithheld: 145,
          netPay: 8000,
          notes: "",
          otherDeductions: 0,
          otherGovernmentWithholding: 0,
          payDate: "2026-05-01",
          periodEndDate: "2026-04-30",
          periodStartDate: "2026-04-15",
          socialSecurityTaxWithheld: 620,
          stateIncomeTaxWithheld: 0,
        },
      ],
      taxProfile: {
        ...mockFinanceData.taxProfile,
        businessIncome: 0,
        otherOrdinaryIncome: 0,
        standardDeductionAmount: 0,
      },
    };
    const summary = calculateTaxSummary(data);

    assert.equal(summary.paycheckGrossPay, 10000);
    assert.equal(summary.ordinaryIncome, 10000);
  });

  it("drops imported tax sales with invalid dates before tax calculations", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      taxAssetSales: [
        {
          assetType: "Stock",
          costBasis: 1000,
          id: "tax-invalid",
          name: "Invalid sale",
          proceeds: 5000,
          symbol: "BAD",
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.taxAssetSales.length, 0);
    assert.equal(result.issues.some((issue) => issue.includes("valid acquired and sold dates")), true);
  });

  it("migrates older saved data by adding an empty paycheck log", () => {
    const legacyData = {
      ...mockFinanceData,
      paychecks: undefined,
      schemaVersion: 1,
    };
    const result = normalizeFinanceData(legacyData);

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.deepEqual(result.data.paychecks, []);
  });

  it("migrates older tax profiles with comprehensive planner defaults", () => {
    const legacyData = {
      ...mockFinanceData,
      schemaVersion: 5,
      taxProfile: {
        deductionMode: "Standard",
        estimatedPayments: 0,
        federalWithholding: 0,
        filingStatus: "Single",
        itemizedDeductions: 0,
        otherAdjustments: 0,
        taxYear: 2026,
      },
    };
    const result = normalizeFinanceData(legacyData);

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.equal(result.data.taxProfile.standardDeductionAmount, 16100);
    assert.equal(result.data.taxProfile.ordinaryIncomeTaxRate, 12);
    assert.equal(result.data.taxProfile.longTermCapitalGainsTaxRate, 0);
    assert.equal(result.data.taxProfile.selfEmploymentTaxRate, 14.13);
  });

  it("migrates workspace identity and graph color settings", () => {
    const legacyResult = normalizeFinanceData({
      ...mockFinanceData,
      schemaVersion: 7,
      workspace: {
        currency: "USD",
        graphColor: "#8b7ac6",
      },
    });
    const customResult = normalizeFinanceData({
      ...mockFinanceData,
      workspace: {
        currency: "USD",
        graphPrimaryColor: "#4f75c7",
        graphSecondaryColor: "#d5a34a",
        name: "My Money Room",
      },
    });

    assert.equal(legacyResult.ok, true);
    assert.equal(legacyResult.migrated, true);
    assert.equal(legacyResult.data.workspace.graphPrimaryColor, "#8b7ac6");
    assert.equal(legacyResult.data.workspace.graphSecondaryColor, defaultGraphSecondaryColor);
    assert.equal(legacyResult.data.workspace.name, defaultWorkspaceName);
    assert.equal(customResult.ok, true);
    assert.equal(customResult.data.workspace.graphPrimaryColor, "#4f75c7");
    assert.equal(customResult.data.workspace.graphSecondaryColor, "#d5a34a");
    assert.equal(customResult.data.workspace.name, "My Money Room");
  });

  it("migrates older saved data with an empty tax report list", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      schemaVersion: 9,
      taxReports: undefined,
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.deepEqual(result.data.taxReports, []);
  });

  it("migrates older saved data with an empty credit score history", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      creditScoreHistory: undefined,
      schemaVersion: 10,
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.deepEqual(result.data.creditScoreHistory, []);
  });

  it("migrates older saved data with empty debt and debt payment lists", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      debtPayments: undefined,
      debts: undefined,
      schemaVersion: 14,
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.deepEqual(result.data.debtPayments, []);
    assert.deepEqual(result.data.debts, []);
  });

  it("migrates saved debt taken dates", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      debts: [
        {
          apr: 8.5,
          currentBalance: 900,
          dueDate: "2026-06-15",
          id: "debt-legacy",
          lender: "Legacy Lender",
          minimumPayment: 75,
          name: "Personal loan",
          originalBalance: 1200,
          paymentFrequency: "Monthly",
          status: "current",
          takenDate: "2025-08-10",
          type: "Personal loan",
        },
      ],
      schemaVersion: 14,
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.equal(result.data.debts[0]?.loanDate, "2025-08-10");
  });

  it("migrates autopay dates for cards and debts from due dates", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      creditCards: [
        {
          ...mockFinanceData.creditCards[0],
          autopay: true,
          autopayDate: undefined,
          dueDate: "2026-06-18",
        },
      ],
      debts: [
        {
          apr: 8.5,
          autopay: true,
          currentBalance: 900,
          dueDate: "2026-06-15",
          id: "debt-autopay",
          lender: "Legacy Lender",
          loanDate: "2025-08-10",
          minimumPayment: 75,
          name: "Personal loan",
          originalBalance: 1200,
          paymentFrequency: "Monthly",
          status: "current",
          type: "Personal loan",
        },
      ],
      schemaVersion: 15,
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.equal(result.data.creditCards[0]?.autopayDate, "2026-06-18");
    assert.equal(result.data.debts[0]?.autopayDate, "2026-06-15");
  });

  it("migrates legacy month-only credit score records to dated entries", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      creditScoreHistory: [
        { id: "score-legacy", month: "2026-06", score: 735, notes: "Legacy row." },
      ],
      schemaVersion: 10,
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.deepEqual(result.data.creditScoreHistory, [
      { id: "score-legacy", date: "2026-06-01", score: 735, notes: "Legacy row." },
    ]);
  });

  it("creates and updates the current tax-year report", () => {
    const result = syncTaxReports(
      {
        ...mockFinanceData,
        taxReports: [],
        taxProfile: {
          ...mockFinanceData.taxProfile,
          taxYear: 2025,
        },
      },
      new Date("2026-05-28T12:00:00.000Z"),
    );

    assert.equal(result.changed, true);
    assert.equal(result.data.taxProfile.taxYear, 2026);
    assert.equal(result.data.taxReports.length, 1);
    assert.equal(result.data.taxReports[0].taxYear, 2026);
    assert.equal(result.data.taxReports[0].status, "current");
    assert.equal(result.data.taxReports[0].projectionBasis, "mixed");
  });

  it("rolls current tax reports forward and finalizes older years", () => {
    const result = syncTaxReports(
      {
        ...mockFinanceData,
        taxReports: [
          {
            ...generateTaxYearReport(mockFinanceData, 2025, new Date("2025-06-01T00:00:00.000Z")),
            status: "current",
          },
        ],
      },
      new Date("2026-01-02T00:00:00.000Z"),
    );
    const oldReport = result.data.taxReports.find((report) => report.taxYear === 2025);
    const currentReport = result.data.taxReports.find((report) => report.taxYear === 2026);

    assert.equal(oldReport?.status, "finalized");
    assert.equal(oldReport?.projectionBasis, "actual");
    assert.equal(currentReport?.status, "current");
  });

  it("preserves finalized tax reports during sync", () => {
    const finalized = finalizeTaxYearReport(
      {
        ...mockFinanceData,
        taxReports: [],
      },
      2026,
      new Date("2026-05-28T12:00:00.000Z"),
    ).taxReports[0];
    const result = syncTaxReports(
      {
        ...mockFinanceData,
        taxProfile: {
          ...mockFinanceData.taxProfile,
          federalWithholding: 1,
        },
        taxReports: [finalized],
      },
      new Date("2026-06-01T00:00:00.000Z"),
    );

    assert.equal(result.data.taxReports[0].status, "finalized");
    assert.equal(result.data.taxReports[0].federalPayments, finalized.federalPayments);
  });

  it("regenerates finalized tax reports when requested", () => {
    const finalizedData = finalizeTaxYearReport(
      {
        ...mockFinanceData,
        taxReports: [],
      },
      2026,
      new Date("2026-05-28T12:00:00.000Z"),
    );
    const regenerated = regenerateTaxYearReport(
      {
        ...finalizedData,
        taxProfile: {
          ...finalizedData.taxProfile,
          federalWithholding: 10,
        },
      },
      2026,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    assert.equal(regenerated.taxReports[0].federalPayments, 3210);
  });

  it("splits yearly tax report gains between stock and crypto", () => {
    const report = generateTaxYearReport(mockFinanceData, 2026, new Date("2026-05-28T12:00:00.000Z"));

    assert.equal(report.stockLongTermGain, 2542);
    assert.equal(report.stockShortTermGain, 0);
    assert.equal(report.cryptoLongTermGain, 0);
    assert.equal(report.cryptoShortTermGain, 120);
    assert.equal(report.stockSalesCount, 2);
    assert.equal(report.cryptoSalesCount, 2);
  });

  it("separates ordinary and qualified dividends in yearly reports", () => {
    const report = generateTaxYearReport(
      {
        ...mockFinanceData,
        investments: [
          {
            ...mockFinanceData.investments[0],
            dividendIncome: 50,
          },
        ],
        taxProfile: {
          ...mockFinanceData.taxProfile,
          ordinaryDividends: 25,
          qualifiedDividends: 75,
        },
      },
      2026,
      new Date("2026-05-28T12:00:00.000Z"),
    );

    assert.equal(report.ordinaryDividends, 75);
    assert.equal(report.qualifiedDividends, 75);
  });

  it("uses projected annual income and due/refund math in yearly reports", () => {
    const report = generateTaxYearReport(mockFinanceData, 2026, new Date("2026-05-28T12:00:00.000Z"));

    assert.equal(report.projectedAnnualIncome, report.totalIncome);
    assert.equal(report.projectedAnnualTax, report.totalTaxEstimate);
    assert.equal(
      report.projectedDueOrRefund,
      report.totalTaxEstimate - report.totalPaymentsWithholding,
    );
  });

  it("migrates older stock holdings into starter tax lots", () => {
    const legacyData = {
      ...mockFinanceData,
      schemaVersion: 2,
      stockLots: undefined,
      stocks: [
        {
          averageCost: 100,
          company: "Test Co",
          currentPrice: 125,
          id: "stk-test",
          notes: "Existing holding",
          shares: 4,
          ticker: "test",
        },
      ],
    };
    const result = normalizeFinanceData(legacyData);

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.equal(result.data.stockLots.length, 1);
    assert.equal(result.data.stockLots[0].stockId, "stk-test");
    assert.equal(result.data.stockLots[0].remainingShares, 4);
    assert.equal(result.data.stockLots[0].dateIsEstimate, true);
    assert.equal(result.data.stocks[0].ticker, "TEST");
    assert.equal(result.data.stocks[0].averageCost, 100);
  });

  it("repairs incomplete saved stock purchase lists without dropping holdings", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      schemaVersion: 16,
      stockLots: [],
      stocks: [
        {
          averageCost: 50,
          company: "Recovered Co",
          currentPrice: 60,
          id: "stk-recovered",
          notes: "",
          shares: 10,
          ticker: "RCVR",
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.equal(result.data.stocks[0].shares, 10);
    assert.equal(result.data.stocks[0].averageCost, 50);
    assert.equal(result.data.stockLots[0].stockId, "stk-recovered");
    assert.equal(result.data.stockLots[0].remainingShares, 10);
  });

  it("rejects non-workspace JSON instead of importing a blank workspace", () => {
    const result = normalizeFinanceData({});

    assert.equal(result.ok, false);
    assert.equal(result.data.stocks.length, mockFinanceData.stocks.length);
  });

  it("migrates older credit cards into statement tracking fields", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      schemaVersion: 3,
      creditCards: [
        {
          id: "card-legacy",
          cardName: "Legacy Card",
          issuer: "Discover",
          limit: 1300,
          balance: 500,
          currentBalance: 625,
          interestBalance: 125,
          dueDate: "2026-06-18",
          minimumPayment: 25,
          apr: 0,
          rewardsType: "Cash back",
          notes: "",
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.equal(result.data.creditCards[0].statementBalance, 125);
    assert.equal(result.data.creditCards[0].statementPaid, 0);
    assert.equal(result.data.creditCards[0].statementClosingDate, "2026-05-28");
    assert.equal(result.data.creditCards[0].minimumPaymentRate, 0);
    assert.equal(result.data.creditCards[0].minimumPayment, 25);
  });

  it("normalizes credit card minimum payments from saved rates", () => {
    const result = normalizeFinanceData({
      ...mockFinanceData,
      schemaVersion: 4,
      creditCards: [
        {
          ...mockFinanceData.creditCards[0],
          minimumPayment: 1,
          minimumPaymentRate: 2.5,
          statementBalance: 1000,
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(result.migrated, true);
    assert.equal(result.data.creditCards[0].minimumPaymentRate, 2.5);
    assert.equal(result.data.creditCards[0].minimumPayment, 25);
  });

  it("rotates paid credit card cycles and captures a closed statement", () => {
    const result = advanceCreditCardCycles(
      {
        ...mockFinanceData,
        creditCards: [
          {
            ...mockFinanceData.creditCards[0],
            currentBalance: 5.37,
            dueDate: "2026-05-28",
            interestBalance: 0,
            statementBalance: 0,
            statementClosingDate: "2026-05-28",
            statementPaid: 0,
          },
        ],
      },
      new Date(2026, 4, 29),
    );

    assert.equal(result.changed, true);
    assert.equal(result.data.creditCards[0].statementBalance, 5.37);
    assert.equal(result.data.creditCards[0].statementPaid, 0);
    assert.equal(result.data.creditCards[0].statementClosingDate, "2026-06-28");
    assert.equal(result.data.creditCards[0].dueDate, "2026-06-28");
  });

  it("keeps unpaid overdue credit card statements from rolling forward", () => {
    const result = advanceCreditCardCycles(
      {
        ...mockFinanceData,
        creditCards: [
          {
            ...mockFinanceData.creditCards[0],
            currentBalance: 150,
            dueDate: "2026-05-20",
            interestBalance: 100,
            statementBalance: 100,
            statementClosingDate: "2026-05-28",
            statementPaid: 0,
          },
        ],
      },
      new Date(2026, 4, 29),
    );

    assert.equal(result.changed, true);
    assert.equal(result.data.creditCards[0].statementBalance, 100);
    assert.equal(result.data.creditCards[0].statementPaid, 0);
    assert.equal(result.data.creditCards[0].statementClosingDate, "2026-06-28");
    assert.equal(result.data.creditCards[0].dueDate, "2026-05-20");
  });

  it("advances stale active income and recurring schedules without touching inactive rows", () => {
    const result = advanceFinanceSchedules(
      {
        ...mockFinanceData,
        creditCards: [],
        debts: [],
        incomeSources: [
          {
            active: true,
            amount: 1000,
            category: "Employment",
            frequency: "Monthly",
            id: "income-active",
            name: "Active income",
            nextPaymentDate: "2026-05-15",
            notes: "",
          },
          {
            active: false,
            amount: 1000,
            category: "Employment",
            frequency: "Monthly",
            id: "income-inactive",
            name: "Inactive income",
            nextPaymentDate: "2026-05-15",
            notes: "",
          },
        ],
        recurringPayments: [
          {
            amount: 30,
            category: "Software",
            frequency: "Monthly",
            id: "recurring-active",
            name: "Active subscription",
            nextChargeDate: "2026-01-31",
            notes: "",
            paymentMethod: "Card",
            status: "active",
          },
          {
            amount: 30,
            category: "Software",
            frequency: "Monthly",
            id: "recurring-canceled",
            name: "Canceled subscription",
            nextChargeDate: "2026-05-15",
            notes: "",
            paymentMethod: "Card",
            status: "canceled",
          },
        ],
      },
      new Date(2026, 5, 2),
    );

    assert.equal(result.changed, true);
    assert.equal(result.data.incomeSources[0].nextPaymentDate, "2026-06-15");
    assert.equal(result.data.incomeSources[1].nextPaymentDate, "2026-05-15");
    assert.equal(result.data.recurringPayments[0].nextChargeDate, "2026-06-30");
    assert.equal(result.data.recurringPayments[1].nextChargeDate, "2026-05-15");
  });

  it("rolls autopay debts on startup but keeps manual overdue debts visible", () => {
    const result = advanceFinanceSchedules(
      {
        ...mockFinanceData,
        creditCards: [],
        debts: [
          {
            ...mockFinanceData.debts[0],
            autopay: false,
            autopayDate: "",
            dueDate: "2026-05-15",
            id: "manual-debt",
            paymentFrequency: "Monthly",
            status: "current",
          },
          {
            ...mockFinanceData.debts[0],
            autopay: true,
            autopayDate: "2026-05-14",
            dueDate: "2026-05-15",
            id: "autopay-debt",
            paymentFrequency: "Monthly",
            status: "current",
          },
          {
            ...mockFinanceData.debts[0],
            autopay: true,
            autopayDate: "2026-05-14",
            dueDate: "2026-05-15",
            id: "paid-debt",
            paymentFrequency: "Monthly",
            status: "paid",
          },
        ],
        incomeSources: [],
        recurringPayments: [],
      },
      new Date(2026, 5, 2),
    );

    assert.equal(result.changed, true);
    assert.equal(result.data.debts[0].dueDate, "2026-05-15");
    assert.equal(result.data.debts[1].dueDate, "2026-06-15");
    assert.equal(result.data.debts[1].autopayDate, "2026-06-14");
    assert.equal(result.data.debts[2].dueDate, "2026-05-15");
  });

  it("advances debt schedules past today after recording a payment", () => {
    const debt = advanceDebtScheduleAfterPayment(
      {
        ...mockFinanceData.debts[0],
        autopay: true,
        autopayDate: "2026-06-02",
        dueDate: "2026-06-02",
        paymentFrequency: "Monthly",
        status: "current",
      },
      new Date(2026, 5, 2),
    );

    assert.equal(debt.dueDate, "2026-07-02");
    assert.equal(debt.autopayDate, "2026-07-02");
  });

  it("preserves end-of-month anchors when advancing stale schedules", () => {
    assert.equal(
      advanceScheduledDatePastDate("2026-01-31", "Monthly", new Date(2026, 2, 1)),
      "2026-03-31",
    );
    assert.equal(
      advanceScheduledDatePastDate("2026-05-15", "Semi-monthly", new Date(2026, 4, 16)),
      "2026-05-31",
    );
  });

  it("marks a credit card statement paid by filling the paid amount", () => {
    const card = {
      ...mockFinanceData.creditCards[0],
      currentBalance: 500,
      statementBalance: 125,
      statementPaid: 25,
    };
    const paidCard = markCreditCardStatementPaid(card);

    assert.equal(paidCard.currentBalance, 400);
    assert.equal(paidCard.interestBalance, 400);
    assert.equal(paidCard.balance, 400);
    assert.equal(paidCard.statementBalance, 125);
    assert.equal(paidCard.statementPaid, 125);
    assert.equal(creditStatementRemaining(paidCard), 0);
  });

  it("records a partial credit card statement payment", () => {
    const card = {
      ...mockFinanceData.creditCards[0],
      currentBalance: 500,
      statementBalance: 300,
      statementPaid: 75,
    };
    const paidCard = applyCreditCardPayment(card, {
      statementPayment: 100,
      interestPayment: 0,
    });

    assert.equal(paidCard.currentBalance, 400);
    assert.equal(paidCard.interestBalance, 400);
    assert.equal(paidCard.balance, 400);
    assert.equal(paidCard.statementPaid, 175);
    assert.equal(creditStatementRemaining(paidCard), 125);
  });

  it("records a carried balance payment and syncs legacy balance", () => {
    const card = {
      ...mockFinanceData.creditCards[0],
      balance: 250,
      currentBalance: 500,
      interestBalance: 250,
      statementBalance: 300,
      statementPaid: 300,
    };
    const paidCard = applyCreditCardPayment(card, {
      statementPayment: 0,
      interestPayment: 80,
    });

    assert.equal(paidCard.currentBalance, 420);
    assert.equal(paidCard.interestBalance, 170);
    assert.equal(paidCard.balance, 170);
    assert.equal(paidCard.statementPaid, 300);
  });

  it("records combined credit card payments without double-counting overlapping debt", () => {
    const card = {
      ...mockFinanceData.creditCards[0],
      balance: 200,
      currentBalance: 650,
      interestBalance: 200,
      statementBalance: 300,
      statementPaid: 50,
    };
    const paidCard = applyCreditCardPayment(card, {
      statementPayment: 150,
      interestPayment: 125,
    });

    assert.equal(paidCard.currentBalance, 450);
    assert.equal(paidCard.statementPaid, 200);
    assert.equal(creditStatementRemaining(paidCard), 100);
    assert.equal(paidCard.interestBalance, 0);
    assert.equal(paidCard.balance, 0);
  });

  it("does not let full statement plus carried preset pay the same dollars twice", () => {
    const card = {
      ...mockFinanceData.creditCards[0],
      balance: 20,
      currentBalance: 40,
      interestBalance: 20,
      statementBalance: 20,
      statementPaid: 0,
    };
    const paidCard = applyCreditCardPayment(card, {
      statementPayment: 20,
      interestPayment: 20,
    });

    assert.equal(paidCard.currentBalance, 20);
    assert.equal(paidCard.statementPaid, 20);
    assert.equal(creditStatementRemaining(paidCard), 0);
    assert.equal(paidCard.interestBalance, 0);
    assert.equal(paidCard.balance, 0);
  });

  it("allocates one credit card payment amount by selected balance target", () => {
    const card = {
      ...mockFinanceData.creditCards[0],
      balance: 20,
      currentBalance: 40,
      interestBalance: 20,
      statementBalance: 20,
      statementPaid: 0,
    };
    const statementOnly = applyCreditCardPayment(card, {
      amount: 20,
      target: "lastStatement",
    });
    const paidInFull = applyCreditCardPayment(card, {
      amount: 40,
      target: "currentBalance",
    });
    const carriedOnly = applyCreditCardPayment(card, {
      amount: 20,
      target: "carriedBalance",
    });

    assert.equal(statementOnly.currentBalance, 20);
    assert.equal(statementOnly.statementPaid, 20);
    assert.equal(statementOnly.interestBalance, 0);
    assert.equal(paidInFull.currentBalance, 0);
    assert.equal(paidInFull.statementPaid, 20);
    assert.equal(paidInFull.interestBalance, 0);
    assert.equal(carriedOnly.currentBalance, 20);
    assert.equal(carriedOnly.statementPaid, 0);
    assert.equal(carriedOnly.interestBalance, 0);
  });

  it("caps credit card payment amounts at available balances", () => {
    const card = {
      ...mockFinanceData.creditCards[0],
      balance: 25,
      currentBalance: 30,
      interestBalance: 25,
      statementBalance: 100,
      statementPaid: 90,
    };
    const paidCard = applyCreditCardPayment(card, {
      statementPayment: 1000,
      interestPayment: 1000,
    });

    assert.equal(paidCard.currentBalance, 5);
    assert.equal(paidCard.statementPaid, 100);
    assert.equal(creditStatementRemaining(paidCard), 0);
    assert.equal(paidCard.interestBalance, 0);
    assert.equal(paidCard.balance, 0);
  });

  it("uses paycheck gross pay and federal withholding in tax planning", () => {
    const data = {
      ...mockFinanceData,
      incomeSources: [
        {
          active: true,
          amount: 1000,
          category: "Employment",
          frequency: "Monthly" as const,
          id: "inc-test",
          name: "Test employer",
          nextPaymentDate: "2026-12-31",
          notes: "",
        },
      ],
      investments: [],
      paychecks: [
        {
          additionalMedicareTaxWithheld: 0,
          employerName: "Test employer",
          federalIncomeTaxWithheld: 150,
          grossPay: 1000,
          id: "pay-test",
          incomeSourceId: "inc-test",
          localIncomeTaxWithheld: 10,
          medicareTaxWithheld: 14.5,
          netPay: 760,
          notes: "",
          otherDeductions: 0,
          otherGovernmentWithholding: 0,
          payDate: "2026-12-31",
          periodEndDate: "2026-12-31",
          periodStartDate: "2026-12-18",
          socialSecurityTaxWithheld: 62,
          stateIncomeTaxWithheld: 40,
        },
      ],
      taxAssetSales: [],
      taxProfile: {
        ...mockFinanceData.taxProfile,
        estimatedPayments: 200,
        federalWithholding: 100,
        itemizedDeductions: 0,
        otherAdjustments: 0,
        taxYear: 2026,
      },
    };
    const summary = calculateTaxSummary(data);

    assert.equal(summary.ordinaryIncome, 1000);
    assert.equal(summary.paymentsAndWithholding, 450);
    assert.equal(summary.paycheckFederalIncomeTaxWithheld, 150);
    assert.equal(summary.paycheckFicaWithheld, 76.5);
    assert.equal(summary.paycheckStateLocalWithheld, 50);
  });

  it("aggregates paycheck net pay into monthly chart points", () => {
    const series = getMonthlyPaycheckNetSeries(
      [
        {
          additionalMedicareTaxWithheld: 0,
          employerName: "Test employer",
          federalIncomeTaxWithheld: 100,
          grossPay: 1000,
          id: "pay-1",
          incomeSourceId: "inc-test",
          localIncomeTaxWithheld: 0,
          medicareTaxWithheld: 14.5,
          netPay: 760,
          notes: "",
          otherDeductions: 0,
          otherGovernmentWithholding: 0,
          payDate: "2026-05-01",
          periodEndDate: "2026-04-30",
          periodStartDate: "2026-04-17",
          socialSecurityTaxWithheld: 62,
          stateIncomeTaxWithheld: 0,
        },
        {
          additionalMedicareTaxWithheld: 0,
          employerName: "Test employer",
          federalIncomeTaxWithheld: 100,
          grossPay: 1000,
          id: "pay-2",
          incomeSourceId: "inc-test",
          localIncomeTaxWithheld: 0,
          medicareTaxWithheld: 14.5,
          netPay: 740,
          notes: "",
          otherDeductions: 0,
          otherGovernmentWithholding: 0,
          payDate: "2026-05-15",
          periodEndDate: "2026-05-14",
          periodStartDate: "2026-05-01",
          socialSecurityTaxWithheld: 62,
          stateIncomeTaxWithheld: 0,
        },
      ],
      2026,
    );

    assert.equal(series.find((point) => point.label === "May")?.value, 1500);
  });

  it("omits past dashboard income months until a paycheck exists", () => {
    const [source] = mockFinanceData.incomeSources;
    const series = getDashboardIncomeExpenseSeries(
      {
        incomeSources: [
          {
            ...source,
            active: true,
            amount: 2000,
            frequency: "Monthly",
          },
        ],
        paychecks: [],
      },
      400,
      new Date(2026, 4, 29),
    );

    assert.equal(series[0]?.label, "May");
    assert.equal(series.some((point) => point.label === "Jan"), false);
    assert.equal(series.find((point) => point.label === "May")?.incomeIsFutureProjection, false);
    assert.equal(series.find((point) => point.label === "Jun")?.incomeIsFutureProjection, true);
  });

  it("shows past dashboard income months that have paycheck totals", () => {
    const [source] = mockFinanceData.incomeSources;
    const series = getDashboardIncomeExpenseSeries(
      {
        incomeSources: [
          {
            ...source,
            active: true,
            amount: 2000,
            frequency: "Monthly",
          },
        ],
        paychecks: [
          {
            additionalMedicareTaxWithheld: 0,
            employerName: "Test employer",
            federalIncomeTaxWithheld: 100,
            grossPay: 1000,
            id: "pay-1",
            incomeSourceId: "inc-test",
            localIncomeTaxWithheld: 0,
            medicareTaxWithheld: 14.5,
            netPay: 760,
            notes: "",
            otherDeductions: 0,
            otherGovernmentWithholding: 0,
            payDate: "2026-02-13",
            periodEndDate: "2026-02-12",
            periodStartDate: "2026-01-30",
            socialSecurityTaxWithheld: 62,
            stateIncomeTaxWithheld: 0,
          },
        ],
      },
      400,
      new Date(2026, 4, 29),
    );

    assert.equal(series[0]?.label, "Feb");
    assert.equal(series.find((point) => point.label === "Feb")?.income, 760);
    assert.equal(series.some((point) => point.label === "Jan"), false);
    assert.equal(series.some((point) => point.label === "Mar"), false);
  });

  it("calculates realized gain and holding period for tax lots", () => {
    const [sale] = mockFinanceData.taxAssetSales;

    assert.equal(taxAssetSaleGain(sale), 2202);
    assert.equal(isLongTermTaxSale(sale), true);
  });

  it("applies buy-more stock trades with weighted average cost", () => {
    const stock = mockFinanceData.stocks[0];
    const nextStock = applyStockTradeToHolding(stock, {
      kind: "buy",
      shares: 8,
      price: 200,
      fees: 4,
    });

    assert.equal(nextStock.shares, 40);
    assert.equal(Math.round(nextStock.averageCost * 100) / 100, 163.46);
    assert.equal(nextStock.currentPrice, 200);
  });

  it("creates buy lots and recalculates holding average cost from open lots", () => {
    const stock = {
      averageCost: 100,
      company: "Test Co",
      currentPrice: 120,
      id: "stk-test",
      notes: "",
      shares: 2,
      ticker: "TEST",
    };
    const existingLot = {
      acquiredDate: "2025-01-01",
      broker: "Broker A",
      dateIsEstimate: false,
      fees: 0,
      id: "lot-1",
      notes: "",
      pricePerShare: 100,
      remainingShares: 2,
      shares: 2,
      stockId: "stk-test",
      ticker: "TEST",
    };
    const buyLot = createStockLotFromBuy({
      acquiredDate: "2026-05-27",
      broker: "Broker B",
      holding: stock,
      id: "lot-2",
      notes: "Buy more",
      trade: {
        fees: 4,
        kind: "buy",
        price: 200,
        shares: 2,
      },
    });
    const nextStock = recalculateStockHoldingFromLots(stock, [existingLot, buyLot]);

    assert.equal(buyLot.remainingShares, 2);
    assert.equal(nextStock.shares, 4);
    assert.equal(nextStock.averageCost, 151);
  });

  it("stacks same-ticker stock purchases under the existing holding", () => {
    const stock = {
      ...mockFinanceData.stocks[0],
      marketPriceStatus: "updated" as const,
      marketPriceUpdatedAt: "2026-05-29T12:00:00.000Z",
    };
    const data = {
      ...mockFinanceData,
      stocks: [stock, ...mockFinanceData.stocks.slice(1)],
    };
    const nextData = stackStockPurchase(data, {
      acquiredDate: "2026-05-27",
      broker: "Broker B",
      company: "Apple Inc.",
      currentPrice: 205,
      dateIsEstimate: false,
      fees: 4,
      lotId: "lot-aapl-new",
      notes: "Second AAPL buy",
      pricePerShare: 200,
      shares: 8,
      stockId: "stk-new-aapl",
      ticker: "aapl",
    });
    const nextStock = nextData.stocks.find((item) => item.id === stock.id);
    const newPurchase = nextData.stockLots.find((item) => item.id === "lot-aapl-new");

    assert.equal(nextData.stocks.length, data.stocks.length);
    assert.equal(nextData.stocks.some((item) => item.id === "stk-new-aapl"), false);
    assert.equal(newPurchase?.stockId, stock.id);
    assert.equal(newPurchase?.ticker, "AAPL");
    assert.equal(nextStock?.shares, 40);
    assert.equal(Math.round((nextStock?.averageCost ?? 0) * 100) / 100, 163.46);
    assert.equal(nextStock?.currentPrice, stock.currentPrice);
    assert.equal(nextStock?.marketPriceStatus, "updated");
    assert.equal(nextStock?.marketPriceUpdatedAt, "2026-05-29T12:00:00.000Z");
  });

  it("consolidates duplicate stock holdings into one ticker row", () => {
    const baseStock = {
      ...mockFinanceData.stocks[0],
      id: "stk-googl-1",
      ticker: "GOOGL",
      company: "Alphabet-A",
      shares: 0,
      averageCost: 0,
      currentPrice: 380,
      marketPriceStatus: "updated" as const,
      marketPriceUpdatedAt: "2026-05-20T12:00:00.000Z",
    };
    const duplicateStock = {
      ...baseStock,
      id: "stk-googl-2",
      notes: "Second imported row",
      currentPrice: 382,
      marketPriceUpdatedAt: "2026-05-29T12:00:00.000Z",
    };
    const data = {
      ...mockFinanceData,
      stockLots: [
        {
          acquiredDate: "2026-01-01",
          broker: "Broker A",
          dateIsEstimate: false,
          fees: 0,
          id: "lot-googl-1",
          notes: "",
          pricePerShare: 300,
          remainingShares: 0.1,
          shares: 0.1,
          stockId: "stk-googl-1",
          ticker: "GOOGL",
        },
        {
          acquiredDate: "2026-05-28",
          broker: "Broker B",
          dateIsEstimate: false,
          fees: 1,
          id: "lot-googl-2",
          notes: "",
          pricePerShare: 374,
          remainingShares: 0.369,
          shares: 0.369,
          stockId: "stk-googl-2",
          ticker: "GOOGL",
        },
      ],
      stocks: [baseStock, duplicateStock],
    };
    const consolidated = consolidateStockHoldingsByTicker(data);

    assert.equal(consolidated.stocks.length, 1);
    assert.equal(consolidated.stocks[0].id, "stk-googl-1");
    assert.equal(consolidated.stocks[0].ticker, "GOOGL");
    assert.equal(consolidated.stocks[0].shares, 0.469);
    assert.equal(consolidated.stocks[0].currentPrice, 382);
    assert.equal(consolidated.stocks[0].marketPriceUpdatedAt, "2026-05-29T12:00:00.000Z");
    assert.equal(
      consolidated.stockLots.every((lot) => lot.stockId === "stk-googl-1"),
      true,
    );
  });

  it("creates one holding and one purchase for a new ticker", () => {
    const nextData = stackStockPurchase(mockFinanceData, {
      acquiredDate: "2026-05-27",
      broker: "Broker C",
      company: "Tesla",
      currentPrice: 180,
      dateIsEstimate: false,
      fees: 1,
      lotId: "lot-tsla-new",
      notes: "First TSLA buy",
      pricePerShare: 175,
      shares: 3,
      stockId: "stk-tsla-new",
      ticker: "tsla",
    });
    const newStock = nextData.stocks.find((item) => item.id === "stk-tsla-new");
    const newPurchase = nextData.stockLots.find((item) => item.id === "lot-tsla-new");

    assert.equal(nextData.stocks.length, mockFinanceData.stocks.length + 1);
    assert.equal(newStock?.ticker, "TSLA");
    assert.equal(newStock?.shares, 3);
    assert.equal(Math.round((newStock?.averageCost ?? 0) * 100) / 100, 175.33);
    assert.equal(newStock?.currentPrice, 180);
    assert.equal(newPurchase?.stockId, "stk-tsla-new");
    assert.equal(newPurchase?.remainingShares, 3);
  });

  it("sells stock lots FIFO and creates lot-level tax sales", () => {
    const stock = {
      averageCost: 125,
      company: "Test Co",
      currentPrice: 200,
      id: "stk-test",
      notes: "",
      shares: 4,
      ticker: "TEST",
    };
    const lots = [
      {
        acquiredDate: "2024-01-01",
        broker: "",
        dateIsEstimate: false,
        fees: 2,
        id: "lot-old",
        notes: "",
        pricePerShare: 100,
        remainingShares: 2,
        shares: 2,
        stockId: "stk-test",
        ticker: "TEST",
      },
      {
        acquiredDate: "2026-01-01",
        broker: "",
        dateIsEstimate: false,
        fees: 4,
        id: "lot-new",
        notes: "",
        pricePerShare: 150,
        remainingShares: 2,
        shares: 2,
        stockId: "stk-test",
        ticker: "TEST",
      },
    ];
    const result = sellStockLotsFifo({
      holding: stock,
      lots,
      notes: "",
      saleGroupId: "sale-test",
      soldDate: "2026-05-27",
      trade: {
        fees: 3,
        kind: "sell",
        price: 200,
        shares: 3,
      },
    });

    assert.equal(result.soldShares, 3);
    assert.equal(result.lots.find((lot) => lot.id === "lot-old")?.remainingShares, 0);
    assert.equal(result.lots.find((lot) => lot.id === "lot-new")?.remainingShares, 1);
    assert.equal(result.taxSales.length, 2);
    assert.equal(result.taxSales[0].stockLotId, "lot-old");
    assert.equal(result.taxSales[0].acquiredDate, "2024-01-01");
    assert.equal(result.taxSales[0].proceeds, 400);
    assert.equal(result.taxSales[0].costBasis, 202);
    assert.equal(result.taxSales[0].fees, 2);
    assert.equal(result.taxSales[1].stockLotId, "lot-new");
    assert.equal(result.taxSales[1].costBasis, 152);
    assert.equal(result.taxSales[1].fees, 1);
  });

  it("rejects FIFO stock sells that exceed open purchase shares", () => {
    const stock = {
      averageCost: 125,
      company: "Test Co",
      currentPrice: 200,
      id: "stk-test",
      notes: "",
      shares: 10,
      ticker: "TEST",
    };
    const lots = [
      {
        acquiredDate: "2024-01-01",
        broker: "",
        dateIsEstimate: false,
        fees: 0,
        id: "lot-open",
        notes: "",
        pricePerShare: 100,
        remainingShares: 4,
        shares: 4,
        stockId: "stk-test",
        ticker: "TEST",
      },
    ];
    const result = sellStockLotsFifo({
      holding: stock,
      lots,
      notes: "",
      saleGroupId: "sale-test",
      soldDate: "2026-05-27",
      trade: {
        fees: 0,
        kind: "sell",
        price: 200,
        shares: 8,
      },
    });

    assert.equal(result.soldShares, 0);
    assert.match(result.error ?? "", /Only 4 open TEST shares/);
    assert.equal(result.lots[0].remainingShares, 4);
  });

  it("rejects FIFO stock sells before consumed purchase acquisition dates", () => {
    const stock = {
      averageCost: 125,
      company: "Test Co",
      currentPrice: 200,
      id: "stk-test",
      notes: "",
      shares: 1,
      ticker: "TEST",
    };
    const lots = [
      {
        acquiredDate: "2026-06-01",
        broker: "",
        dateIsEstimate: false,
        fees: 0,
        id: "lot-future",
        notes: "",
        pricePerShare: 100,
        remainingShares: 1,
        shares: 1,
        stockId: "stk-test",
        ticker: "TEST",
      },
    ];
    const result = sellStockLotsFifo({
      holding: stock,
      lots,
      notes: "",
      saleGroupId: "sale-test",
      soldDate: "2026-05-27",
      trade: {
        fees: 0,
        kind: "sell",
        price: 200,
        shares: 1,
      },
    });

    assert.equal(result.soldShares, 0);
    assert.match(result.error ?? "", /Sell date must be on or after 2026-06-01/);
    assert.equal(result.lots[0].remainingShares, 1);
  });

  it("applies stock sells and creates a tax sale draft", () => {
    const stock = mockFinanceData.stocks[0];
    const trade = {
      kind: "sell" as const,
      shares: 2,
      price: 210,
      fees: 1,
    };
    const nextStock = applyStockTradeToHolding(stock, trade);
    const sale = stockSaleTaxRecordFromTrade({
      acquiredDate: "2024-01-01",
      holding: stock,
      notes: "Test sale",
      soldDate: "2026-05-27",
      trade,
    });

    assert.equal(nextStock.shares, 30);
    assert.equal(nextStock.averageCost, stock.averageCost);
    assert.equal(sale.proceeds, 420);
    assert.equal(sale.costBasis, 308.4);
    assert.equal(sale.fees, 1);
  });

  it("removes only fixed demo rows while preserving user-created records", () => {
    const userStock = {
      ...mockFinanceData.stocks[0],
      id: "stk-1770000000000-user01",
      ticker: "GOOGL",
    };
    const userCrypto = {
      ...mockFinanceData.crypto[0],
      id: "cry-1770000000000-user01",
      symbol: "DOGE",
    };
    const userInvestment = {
      ...mockFinanceData.investments[0],
      id: "inv-1770000000000-user01",
      name: "My investing account",
    };
    const userIncome = {
      ...mockFinanceData.incomeSources[0],
      id: "inc-1770000000000-user01",
      name: "Renewable income",
    };
    const userSavings = {
      ...mockFinanceData.savingsGoals[0],
      id: "sav-1770000000000-user01",
      name: "My savings",
    };
    const userCard = {
      ...mockFinanceData.creditCards[0],
      id: "card-1770000000000-user01",
      cardName: "My card",
    };
    const userCreditScore = {
      ...mockFinanceData.creditScoreHistory[0],
      id: "score-1770000000000-user01",
      date: "2026-06-18",
      score: 735,
    };

    const cleaned = removeDemoFinanceData({
      ...mockFinanceData,
      creditCards: [...mockFinanceData.creditCards, userCard],
      creditScoreHistory: [...mockFinanceData.creditScoreHistory, userCreditScore],
      crypto: [...mockFinanceData.crypto, userCrypto],
      incomeSources: [...mockFinanceData.incomeSources, userIncome],
      investments: [...mockFinanceData.investments, userInvestment],
      savingsGoals: [...mockFinanceData.savingsGoals, userSavings],
      stocks: [...mockFinanceData.stocks, userStock],
    });

    assert.deepEqual(cleaned.stocks.map((stock) => stock.id), [userStock.id]);
    assert.deepEqual(cleaned.crypto.map((holding) => holding.id), [userCrypto.id]);
    assert.deepEqual(cleaned.investments.map((item) => item.id), [userInvestment.id]);
    assert.deepEqual(cleaned.incomeSources.map((item) => item.id), [userIncome.id]);
    assert.deepEqual(cleaned.savingsGoals.map((item) => item.id), [userSavings.id]);
    assert.deepEqual(cleaned.creditCards.map((item) => item.id), [userCard.id]);
    assert.deepEqual(cleaned.creditScoreHistory.map((item) => item.id), [userCreditScore.id]);
    assert.deepEqual(cleaned.recurringPayments, []);
    assert.deepEqual(cleaned.taxAssetSales, []);
    assert.deepEqual(cleaned.incomeExpenseHistory, []);
    assert.deepEqual(cleaned.netWorthHistory, []);
    assert.equal(cleaned.taxProfile.federalWithholding, 0);
  });

  it("detects when saved data includes user-created records", () => {
    assert.equal(hasUserCreatedFinanceData(mockFinanceData), false);
    assert.equal(
      hasUserCreatedFinanceData({
        ...mockFinanceData,
        stocks: [
          ...mockFinanceData.stocks,
          {
            ...mockFinanceData.stocks[0],
            id: "stk-1770000000000-user01",
            ticker: "GOOGL",
          },
        ],
      }),
      true,
    );
  });

  it("detects and clears built-in demo records", () => {
    assert.equal(hasDemoFinanceData(mockFinanceData), true);
    assert.equal(hasDemoFinanceData(removeDemoFinanceData(mockFinanceData)), false);
  });

  it("removes exact demo rows even when a demo id was changed", () => {
    const copiedDemoIncome = {
      ...mockFinanceData.incomeSources[2],
      id: "inc-1770000000000-copied",
    };
    const realIncome = {
      ...mockFinanceData.incomeSources[0],
      amount: 1000,
      category: "Employment",
      id: "inc-1770000000000-real",
      name: "Primary salary",
      notes: "DreamToyGarage",
    };

    const cleaned = removeDemoFinanceData({
      ...mockFinanceData,
      incomeSources: [copiedDemoIncome, realIncome],
    });

    assert.deepEqual(cleaned.incomeSources.map((item) => item.id), [realIncome.id]);
  });

});
