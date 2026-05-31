import {
  coerceFiniteNumber,
  calculateCreditCardMinimumPayment,
  consolidateStockHoldingsByTicker,
  createStarterStockLot,
  defaultCurrency,
  defaultGraphColor,
  defaultGraphSecondaryColor,
  defaultWorkspaceName,
  FINANCE_DATA_SCHEMA_VERSION,
  formatDateInput,
  graphColorOptions,
  mockFinanceData,
  parseDateInput,
  recalculateStockHoldingsFromLots,
} from "./finance-data.ts";
import type {
  CreditCard,
  CreditScoreEntry,
  CryptoHolding,
  CurrencyCode,
  DebtAccount,
  DebtPaymentRecord,
  DebtStatus,
  DebtType,
  DeductionMode,
  FilingStatus,
  FinanceData,
  Frequency,
  GraphColor,
  IncomeExpensePoint,
  IncomeSource,
  Investment,
  MarketPriceStatus,
  Paycheck,
  RecurringPayment,
  SavingsGoal,
  SeriesPoint,
  Status,
  StockHolding,
  StockLot,
  TaxAssetSale,
  TaxAssetType,
  TaxProfile,
  TaxProjectionBasis,
  TaxYearReport,
  TaxYearReportStatus,
  WorkspaceSettings,
} from "./finance-data.ts";

export type FinanceStorageEnvelope = {
  schemaVersion: number;
  data: FinanceData;
};

export type FinanceValidationResult = {
  data: FinanceData;
  issues: string[];
  migrated: boolean;
  ok: boolean;
};

type UnknownRecord = Record<string, unknown>;

const currencies: CurrencyCode[] = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
const graphColors: GraphColor[] = graphColorOptions.map((option) => option.value);
const deductionModes: DeductionMode[] = ["Standard", "Itemized"];
const filingStatuses: FilingStatus[] = [
  "Single",
  "Married filing jointly",
  "Married filing separately",
  "Head of household",
];
const frequencies: Frequency[] = [
  "Daily",
  "Weekly",
  "Biweekly",
  "Semi-monthly",
  "Monthly",
  "Quarterly",
  "Annual",
];
const statuses: Status[] = ["active", "canceled"];
const debtStatuses: DebtStatus[] = ["current", "paid"];
const debtTypes: DebtType[] = [
  "Student loan",
  "Auto loan",
  "Personal loan",
  "Medical debt",
  "Mortgage",
  "BNPL / installment",
  "Family / friend",
  "Collections",
  "Other",
];
const taxAssetTypes: TaxAssetType[] = ["Stock", "Crypto"];
const taxReportStatuses: TaxYearReportStatus[] = ["current", "finalized", "projected"];
const taxProjectionBases: TaxProjectionBasis[] = ["actual", "projected", "mixed"];
const marketPriceStatuses: MarketPriceStatus[] = ["manual", "updated", "failed"];

export function createFinanceStorageEnvelope(data: FinanceData): FinanceStorageEnvelope {
  return {
    schemaVersion: FINANCE_DATA_SCHEMA_VERSION,
    data: normalizeFinanceData(data).data,
  };
}

export function parseFinanceStorageJson(
  storedJson: string,
  fallback: FinanceData = mockFinanceData,
): FinanceValidationResult {
  try {
    return normalizeFinanceData(JSON.parse(storedJson), fallback);
  } catch {
    return {
      data: cloneFinanceData(fallback),
      issues: ["Stored finance data is not valid JSON."],
      migrated: false,
      ok: false,
    };
  }
}

export function normalizeFinanceData(
  value: unknown,
  fallback: FinanceData = mockFinanceData,
): FinanceValidationResult {
  const issues: string[] = [];
  const fallbackData = cloneFinanceData(fallback);
  const extracted = extractStoredData(value);

  if (!extracted.ok) {
    return {
      data: fallbackData,
      issues: extracted.issues,
      migrated: false,
      ok: false,
    };
  }

  const source = extracted.data;
  const stocks = sanitizeArray(source.stocks, "stocks", issues, (item, index) =>
    sanitizeStock(item, fallbackId("stk", index), issues),
  );
  const sourceHasStockLots = Array.isArray(source.stockLots);
  const sanitizedStockLots = sourceHasStockLots
    ? sanitizeArray(source.stockLots, "stockLots", issues, (item, index) =>
        sanitizeStockLot(item, fallbackId("lot", index), issues),
      )
    : stocks.map((stock) => createStarterStockLot(stock));
  const repairedStockLots = repairStockLotsForHoldings(stocks, sanitizedStockLots, issues);
  const stockLots = repairedStockLots.lots;
  const data: FinanceData = {
    schemaVersion: FINANCE_DATA_SCHEMA_VERSION,
    workspace: sanitizeWorkspace(source.workspace, fallbackData.workspace, issues),
    taxProfile: sanitizeTaxProfile(source.taxProfile, fallbackData.taxProfile, issues),
    investments: sanitizeArray(source.investments, "investments", issues, (item, index) =>
      sanitizeInvestment(item, fallbackId("inv", index), issues),
    ),
    stocks: recalculateStockHoldingsFromLots(stocks, stockLots),
    stockLots,
    crypto: sanitizeArray(source.crypto, "crypto", issues, (item, index) =>
      sanitizeCrypto(item, fallbackId("cry", index), issues),
    ),
    incomeSources: sanitizeArray(source.incomeSources, "incomeSources", issues, (item, index) =>
      sanitizeIncomeSource(item, fallbackId("inc", index), issues),
    ),
    paychecks: sanitizeArray(source.paychecks, "paychecks", issues, (item, index) =>
      sanitizePaycheck(item, fallbackId("pay", index), issues),
    ),
    savingsGoals: sanitizeArray(source.savingsGoals, "savingsGoals", issues, (item, index) =>
      sanitizeSavingsGoal(item, fallbackId("sav", index), issues),
    ),
    creditCards: sanitizeArray(source.creditCards, "creditCards", issues, (item, index) =>
      sanitizeCreditCard(item, fallbackId("card", index), issues),
    ),
    creditScoreHistory: sanitizeArray(
      source.creditScoreHistory,
      "creditScoreHistory",
      issues,
      (item, index) => sanitizeCreditScoreEntry(item, fallbackId("score", index), issues),
    ),
    debts: sanitizeArray(source.debts, "debts", issues, (item, index) =>
      sanitizeDebtAccount(item, fallbackId("debt", index), issues),
    ),
    debtPayments: sanitizeArray(
      source.debtPayments,
      "debtPayments",
      issues,
      (item, index) => sanitizeDebtPaymentRecord(item, fallbackId("debt-pay", index), issues),
    ),
    recurringPayments: sanitizeArray(
      source.recurringPayments,
      "recurringPayments",
      issues,
      (item, index) => sanitizeRecurringPayment(item, fallbackId("rec", index), issues),
    ),
    taxAssetSales: sanitizeArray(
      source.taxAssetSales,
      "taxAssetSales",
      issues,
      (item, index) => sanitizeTaxAssetSale(item, fallbackId("tax", index), issues),
    ),
    taxReports: sanitizeArray(source.taxReports, "taxReports", issues, (item, index) =>
      sanitizeTaxYearReport(item, fallbackId("tax-report", index), issues),
    ),
    netWorthHistory: sanitizeArray(
      source.netWorthHistory,
      "netWorthHistory",
      issues,
      (item, index) => sanitizeSeriesPoint(item, `Point ${index + 1}`, issues),
    ),
    incomeExpenseHistory: sanitizeArray(
      source.incomeExpenseHistory,
      "incomeExpenseHistory",
      issues,
      (item, index) => sanitizeIncomeExpensePoint(item, `Point ${index + 1}`, issues),
    ),
  };

  const consolidatedData = consolidateStockHoldingsByTicker(data);

  return {
    data: consolidatedData,
    issues,
    migrated: extracted.migrated || repairedStockLots.repaired || consolidatedData !== data,
    ok: true,
  };
}

export function cloneFinanceData(data: FinanceData): FinanceData {
  return {
    ...data,
    workspace: { ...data.workspace },
    taxProfile: { ...data.taxProfile },
    investments: data.investments.map((item) => ({ ...item })),
    stocks: data.stocks.map((item) => ({ ...item })),
    stockLots: data.stockLots.map((item) => ({ ...item })),
    crypto: data.crypto.map((item) => ({ ...item })),
    incomeSources: data.incomeSources.map((item) => ({ ...item })),
    paychecks: data.paychecks.map((item) => ({ ...item })),
    savingsGoals: data.savingsGoals.map((item) => ({ ...item })),
    creditCards: data.creditCards.map((item) => ({ ...item })),
    creditScoreHistory: data.creditScoreHistory.map((item) => ({ ...item })),
    debts: data.debts.map((item) => ({ ...item })),
    debtPayments: data.debtPayments.map((item) => ({ ...item })),
    recurringPayments: data.recurringPayments.map((item) => ({ ...item })),
    taxAssetSales: data.taxAssetSales.map((item) => ({ ...item })),
    taxReports: data.taxReports.map((item) => ({ ...item })),
    netWorthHistory: data.netWorthHistory.map((item) => ({ ...item })),
    incomeExpenseHistory: data.incomeExpenseHistory.map((item) => ({ ...item })),
  };
}

function extractStoredData(value: unknown):
  | { data: UnknownRecord; migrated: boolean; ok: true }
  | { issues: string[]; ok: false } {
  if (!isRecord(value)) {
    return { issues: ["Stored finance data must be an object."], ok: false };
  }

  if ("data" in value) {
    const schemaVersion = readStoredSchemaVersion(value.schemaVersion);
    if (!schemaVersion || schemaVersion > FINANCE_DATA_SCHEMA_VERSION) {
      return {
        issues: [`Unsupported finance data schema version: ${String(value.schemaVersion)}.`],
        ok: false,
      };
    }

    if (!isRecord(value.data)) {
      return { issues: ["Stored finance envelope is missing a data object."], ok: false };
    }

    if (!looksLikeFinanceData(value.data)) {
      return {
        issues: ["Stored finance envelope does not contain Assetly Financial Manager finance data."],
        ok: false,
      };
    }

    return {
      data: value.data,
      migrated: schemaVersion !== FINANCE_DATA_SCHEMA_VERSION,
      ok: true,
    };
  }

  const schemaVersion = readStoredSchemaVersion(value.schemaVersion);
  if (value.schemaVersion !== undefined && (!schemaVersion || schemaVersion > FINANCE_DATA_SCHEMA_VERSION)) {
    return {
      issues: [`Unsupported finance data schema version: ${String(value.schemaVersion)}.`],
      ok: false,
    };
  }

  if (!looksLikeFinanceData(value)) {
    return {
      issues: ["JSON file does not look like an Assetly Financial Manager finance backup."],
      ok: false,
    };
  }

  return {
    data: value,
    migrated: schemaVersion !== FINANCE_DATA_SCHEMA_VERSION,
    ok: true,
  };
}

function looksLikeFinanceData(value: UnknownRecord) {
  const collectionKeys = [
    "investments",
    "stocks",
    "stockLots",
    "crypto",
    "incomeSources",
    "paychecks",
    "savingsGoals",
    "creditCards",
    "debts",
    "recurringPayments",
    "taxAssetSales",
    "taxReports",
    "netWorthHistory",
    "incomeExpenseHistory",
  ];

  return (
    "workspace" in value ||
    "taxProfile" in value ||
    collectionKeys.some((key) => Array.isArray(value[key]))
  );
}

function repairStockLotsForHoldings(
  stocks: StockHolding[],
  lots: StockLot[],
  issues: string[],
) {
  const nextLots = [...lots];
  const usedIds = new Set(nextLots.map((lot) => lot.id));
  let repaired = false;

  stocks.forEach((stock) => {
    const expectedShares = Math.max(coerceFiniteNumber(stock.shares), 0);
    if (expectedShares <= 0) {
      return;
    }

    const openShares = nextLots
      .filter((lot) => lot.stockId === stock.id)
      .reduce((total, lot) => total + Math.max(coerceFiniteNumber(lot.remainingShares), 0), 0);
    const uncoveredShares = expectedShares - openShares;

    if (uncoveredShares <= 0.000001) {
      return;
    }

    const starterLot = {
      ...createStarterStockLot(stock),
      id: uniqueStockLotId(`lot-${stock.id}-starter`, usedIds),
      notes: "Recovered purchase from saved stock holding shares.",
      remainingShares: uncoveredShares,
      shares: uncoveredShares,
    };
    usedIds.add(starterLot.id);
    nextLots.push(starterLot);
    repaired = true;
  });

  if (repaired) {
    issues.push("Recovered missing stock purchases from saved holding totals.");
  }

  return { lots: nextLots, repaired };
}

function uniqueStockLotId(baseId: string, usedIds: Set<string>) {
  if (!usedIds.has(baseId)) {
    return baseId;
  }

  let index = 2;
  while (usedIds.has(`${baseId}-${index}`)) {
    index += 1;
  }

  return `${baseId}-${index}`;
}

function readStoredSchemaVersion(value: unknown) {
  if (value === undefined) {
    return 1;
  }

  if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
    return value;
  }

  return null;
}

function sanitizeWorkspace(
  value: unknown,
  fallback: WorkspaceSettings,
  issues: string[],
): WorkspaceSettings {
  const record = asRecord(value);
  return {
    currency: readEnum(record?.currency, currencies, fallback.currency ?? defaultCurrency, issues),
    graphPrimaryColor: readEnum(
      record?.graphPrimaryColor ?? record?.graphColor,
      graphColors,
      fallback.graphPrimaryColor ?? defaultGraphColor,
      issues,
    ),
    graphSecondaryColor: readEnum(
      record?.graphSecondaryColor,
      graphColors,
      fallback.graphSecondaryColor ?? defaultGraphSecondaryColor,
      issues,
    ),
    name: sanitizeWorkspaceName(record?.name, fallback.name ?? defaultWorkspaceName),
  };
}

function sanitizeTaxProfile(
  value: unknown,
  fallback: TaxProfile,
  issues: string[],
): TaxProfile {
  const record = asRecord(value);
  if (!record) {
    return { ...fallback };
  }

  return {
    taxYear: readTaxYear(record.taxYear, fallback.taxYear),
    filingStatus: readEnum(
      record.filingStatus,
      filingStatuses,
      fallback.filingStatus,
      issues,
    ),
    deductionMode: readEnum(
      record.deductionMode,
      deductionModes,
      fallback.deductionMode,
      issues,
    ),
    standardDeductionAmount: readNonNegativeNumber(
      record.standardDeductionAmount,
      fallback.standardDeductionAmount,
    ),
    itemizedDeductions: readNonNegativeNumber(
      record.itemizedDeductions,
      fallback.itemizedDeductions,
    ),
    taxableInterest: readNonNegativeNumber(record.taxableInterest, fallback.taxableInterest),
    ordinaryDividends: readNonNegativeNumber(record.ordinaryDividends, fallback.ordinaryDividends),
    qualifiedDividends: readNonNegativeNumber(
      record.qualifiedDividends,
      fallback.qualifiedDividends,
    ),
    otherOrdinaryIncome: readNonNegativeNumber(
      record.otherOrdinaryIncome,
      fallback.otherOrdinaryIncome,
    ),
    businessIncome: readNonNegativeNumber(record.businessIncome, fallback.businessIncome),
    rentalRoyaltyIncome: readNonNegativeNumber(
      record.rentalRoyaltyIncome,
      fallback.rentalRoyaltyIncome,
    ),
    retirementIncome: readNonNegativeNumber(record.retirementIncome, fallback.retirementIncome),
    unemploymentIncome: readNonNegativeNumber(
      record.unemploymentIncome,
      fallback.unemploymentIncome,
    ),
    taxableSocialSecurity: readNonNegativeNumber(
      record.taxableSocialSecurity,
      fallback.taxableSocialSecurity,
    ),
    capitalLossCarryover: readNonNegativeNumber(
      record.capitalLossCarryover,
      fallback.capitalLossCarryover,
    ),
    hsaDeduction: readNonNegativeNumber(record.hsaDeduction, fallback.hsaDeduction),
    iraDeduction: readNonNegativeNumber(record.iraDeduction, fallback.iraDeduction),
    studentLoanInterestDeduction: readNonNegativeNumber(
      record.studentLoanInterestDeduction,
      fallback.studentLoanInterestDeduction,
    ),
    qbiDeduction: readNonNegativeNumber(record.qbiDeduction, fallback.qbiDeduction),
    childTaxCredit: readNonNegativeNumber(record.childTaxCredit, fallback.childTaxCredit),
    otherTaxCredits: readNonNegativeNumber(record.otherTaxCredits, fallback.otherTaxCredits),
    ordinaryIncomeTaxRate: readNonNegativeNumber(
      record.ordinaryIncomeTaxRate,
      fallback.ordinaryIncomeTaxRate,
    ),
    longTermCapitalGainsTaxRate: readNonNegativeNumber(
      record.longTermCapitalGainsTaxRate,
      fallback.longTermCapitalGainsTaxRate,
    ),
    qualifiedDividendTaxRate: readNonNegativeNumber(
      record.qualifiedDividendTaxRate,
      fallback.qualifiedDividendTaxRate,
    ),
    additionalInvestmentTaxRate: readNonNegativeNumber(
      record.additionalInvestmentTaxRate,
      fallback.additionalInvestmentTaxRate,
    ),
    selfEmploymentTaxRate: readNonNegativeNumber(
      record.selfEmploymentTaxRate,
      fallback.selfEmploymentTaxRate,
    ),
    stateIncomeTaxRate: readNonNegativeNumber(
      record.stateIncomeTaxRate,
      fallback.stateIncomeTaxRate,
    ),
    localIncomeTaxRate: readNonNegativeNumber(
      record.localIncomeTaxRate,
      fallback.localIncomeTaxRate,
    ),
    federalWithholding: readNonNegativeNumber(
      record.federalWithholding,
      fallback.federalWithholding,
    ),
    estimatedPayments: readNonNegativeNumber(
      record.estimatedPayments,
      fallback.estimatedPayments,
    ),
    stateWithholding: readNonNegativeNumber(record.stateWithholding, fallback.stateWithholding),
    stateEstimatedPayments: readNonNegativeNumber(
      record.stateEstimatedPayments,
      fallback.stateEstimatedPayments,
    ),
    localWithholding: readNonNegativeNumber(record.localWithholding, fallback.localWithholding),
    localEstimatedPayments: readNonNegativeNumber(
      record.localEstimatedPayments,
      fallback.localEstimatedPayments,
    ),
    otherAdjustments: readNonNegativeNumber(record.otherAdjustments, fallback.otherAdjustments),
  };
}

function sanitizeInvestment(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): Investment | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid investment record.");
    return null;
  }

  return {
    id: readString(record.id, fallbackIdValue),
    name: readString(record.name),
    type: readString(record.type),
    amountInvested: readNonNegativeNumber(record.amountInvested),
    currentValue: readNonNegativeNumber(record.currentValue),
    dividendIncome: readNonNegativeNumber(record.dividendIncome),
    notes: readString(record.notes),
  };
}

function sanitizeStock(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): StockHolding | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid stock record.");
    return null;
  }

  return {
    id: readString(record.id, fallbackIdValue),
    ticker: readString(record.ticker).toUpperCase(),
    company: readString(record.company),
    shares: readNonNegativeNumber(record.shares),
    averageCost: readNonNegativeNumber(record.averageCost),
    currentPrice: readNonNegativeNumber(record.currentPrice),
    marketPriceError: readOptionalString(record.marketPriceError),
    marketPriceLastAttemptAt: readDateTimeString(record.marketPriceLastAttemptAt),
    marketPriceStatus: readOptionalEnum(record.marketPriceStatus, marketPriceStatuses),
    marketPriceUpdatedAt: readDateTimeString(record.marketPriceUpdatedAt),
    notes: readString(record.notes),
  };
}

function sanitizeStockLot(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): StockLot | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid stock purchase record.");
    return null;
  }

  const shares = readNonNegativeNumber(record.shares);
  const remainingShares = Math.min(
    readNonNegativeNumber(record.remainingShares ?? record.shares),
    shares,
  );

  return {
    id: readString(record.id, fallbackIdValue),
    stockId: readString(record.stockId),
    ticker: readString(record.ticker).toUpperCase(),
    acquiredDate: readDateInput(record.acquiredDate),
    shares,
    remainingShares,
    pricePerShare: readNonNegativeNumber(record.pricePerShare),
    fees: readNonNegativeNumber(record.fees),
    broker: readString(record.broker),
    notes: readString(record.notes),
    dateIsEstimate: readBoolean(record.dateIsEstimate, false),
  };
}

function sanitizeCrypto(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): CryptoHolding | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid crypto record.");
    return null;
  }

  return {
    id: readString(record.id, fallbackIdValue),
    coin: readString(record.coin),
    symbol: readString(record.symbol).toUpperCase(),
    quantity: readNonNegativeNumber(record.quantity),
    averageCost: readNonNegativeNumber(record.averageCost),
    currentPrice: readNonNegativeNumber(record.currentPrice),
    marketPriceError: readOptionalString(record.marketPriceError),
    marketPriceLastAttemptAt: readDateTimeString(record.marketPriceLastAttemptAt),
    marketPriceStatus: readOptionalEnum(record.marketPriceStatus, marketPriceStatuses),
    marketPriceUpdatedAt: readDateTimeString(record.marketPriceUpdatedAt),
    notes: readString(record.notes),
  };
}

function sanitizeIncomeSource(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): IncomeSource | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid income source record.");
    return null;
  }

  return {
    id: readString(record.id, fallbackIdValue),
    name: readString(record.name),
    amount: readNonNegativeNumber(record.amount),
    frequency: readEnum(record.frequency, frequencies, "Monthly", issues),
    category: readString(record.category),
    nextPaymentDate: readDateInput(record.nextPaymentDate),
    active: readBoolean(record.active, true),
    notes: readString(record.notes),
  };
}

function sanitizePaycheck(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): Paycheck | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid paycheck record.");
    return null;
  }

  return {
    id: readString(record.id, fallbackIdValue),
    incomeSourceId: readString(record.incomeSourceId),
    employerName: readString(record.employerName),
    payDate: readDateInput(record.payDate),
    periodStartDate: readDateInput(record.periodStartDate),
    periodEndDate: readDateInput(record.periodEndDate),
    grossPay: readNonNegativeNumber(record.grossPay),
    netPay: readNonNegativeNumber(record.netPay),
    federalIncomeTaxWithheld: readNonNegativeNumber(record.federalIncomeTaxWithheld),
    socialSecurityTaxWithheld: readNonNegativeNumber(record.socialSecurityTaxWithheld),
    medicareTaxWithheld: readNonNegativeNumber(record.medicareTaxWithheld),
    additionalMedicareTaxWithheld: readNonNegativeNumber(record.additionalMedicareTaxWithheld),
    stateIncomeTaxWithheld: readNonNegativeNumber(record.stateIncomeTaxWithheld),
    localIncomeTaxWithheld: readNonNegativeNumber(record.localIncomeTaxWithheld),
    otherGovernmentWithholding: readNonNegativeNumber(record.otherGovernmentWithholding),
    otherDeductions: readNonNegativeNumber(record.otherDeductions),
    notes: readString(record.notes),
  };
}

function sanitizeSavingsGoal(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): SavingsGoal | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid savings goal record.");
    return null;
  }

  return {
    id: readString(record.id, fallbackIdValue),
    name: readString(record.name),
    currentSaved: readNonNegativeNumber(record.currentSaved),
    targetAmount: readNonNegativeNumber(record.targetAmount),
    monthlyContribution: readNonNegativeNumber(record.monthlyContribution),
    estimatedCompletionDate: readDateInput(record.estimatedCompletionDate),
    notes: readString(record.notes),
    isEmergency: readBoolean(record.isEmergency, false),
  };
}

function sanitizeCreditCard(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): CreditCard | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid credit card record.");
    return null;
  }
  const statementBalance = readNonNegativeNumber(
    record.statementBalance ?? record.interestBalance ?? record.balance,
  );
  const minimumPaymentRate = readNonNegativeNumber(record.minimumPaymentRate);
  const minimumPayment =
    minimumPaymentRate > 0
      ? calculateCreditCardMinimumPayment(statementBalance, minimumPaymentRate)
      : readNonNegativeNumber(record.minimumPayment);
  const dueDate = readDateInput(record.dueDate);
  const autopay = readBoolean(record.autopay, false);

  return {
    id: readString(record.id, fallbackIdValue),
    cardName: readString(record.cardName),
    issuer: readString(record.issuer),
    limit: readNonNegativeNumber(record.limit),
    balance: readNonNegativeNumber(record.interestBalance ?? record.balance),
    currentBalance: readNonNegativeNumber(record.currentBalance ?? record.balance),
    interestBalance: readNonNegativeNumber(record.interestBalance ?? record.balance),
    statementBalance,
    statementPaid: readNonNegativeNumber(record.statementPaid),
    statementClosingDate: readStatementClosingDate(record.statementClosingDate, record.dueDate),
    dueDate,
    minimumPaymentRate,
    minimumPayment,
    apr: readNonNegativeNumber(record.apr),
    autopay,
    autopayDate: readDateInput(record.autopayDate) || (autopay ? dueDate : ""),
    rewardsType: readString(record.rewardsType),
    notes: readString(record.notes),
  };
}

function sanitizeCreditScoreEntry(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): CreditScoreEntry | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid credit score record.");
    return null;
  }
  const date = readCreditScoreDate(record.date, record.month);
  const score = Math.round(coerceFiniteNumber(record.score, 0));

  if (!date || score < 300 || score > 850) {
    issues.push("Skipped invalid credit score record.");
    return null;
  }

  return {
    date,
    id: readString(record.id, fallbackIdValue),
    notes: readString(record.notes),
    score,
  };
}

function sanitizeDebtAccount(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): DebtAccount | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid debt record.");
    return null;
  }

  const currentBalance = readNonNegativeNumber(record.currentBalance ?? record.balance);
  const dueDate = readDateInput(record.dueDate);
  const autopay = readBoolean(record.autopay, false);

  return {
    apr: readNonNegativeNumber(record.apr),
    autopay,
    autopayDate: readDateInput(record.autopayDate) || (autopay ? dueDate : ""),
    collectorName: readString(record.collectorName),
    currentBalance,
    disputeDeadline: readDateInput(record.disputeDeadline),
    dueDate,
    id: readString(record.id, fallbackIdValue),
    lender: readString(record.lender ?? record.servicer ?? record.creditor),
    loanDate: readDateInput(
      record.loanDate ?? record.takenDate ?? record.openedDate ?? record.startDate,
    ),
    minimumPayment: readNonNegativeNumber(record.minimumPayment),
    name: readString(record.name),
    notes: readString(record.notes),
    originalBalance: readNonNegativeNumber(record.originalBalance ?? currentBalance),
    originalCreditor: readString(record.originalCreditor),
    paymentFrequency: readEnum(record.paymentFrequency, frequencies, "Monthly", issues),
    payoffDate: readDateInput(record.payoffDate),
    status: readDebtStatus(record.status, issues),
    type: readEnum(record.type, debtTypes, "Other", issues),
  };
}

function readDebtStatus(value: unknown, issues: string[]): DebtStatus {
  if (value === "paidOff") {
    return "paid";
  }

  return readEnum(value, debtStatuses, "current", issues);
}

function sanitizeDebtPaymentRecord(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): DebtPaymentRecord | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid debt payment record.");
    return null;
  }

  const date = readDateInput(record.date);
  if (!date) {
    issues.push("Skipped debt payment record without a valid date.");
    return null;
  }

  return {
    amount: readNonNegativeNumber(record.amount),
    balanceAfter: readNonNegativeNumber(record.balanceAfter),
    balanceBefore: readNonNegativeNumber(record.balanceBefore),
    date,
    debtId: readString(record.debtId),
    debtName: readString(record.debtName),
    id: readString(record.id, fallbackIdValue),
    totalDebtAfter: readNonNegativeNumber(record.totalDebtAfter),
    totalDebtBefore: readNonNegativeNumber(record.totalDebtBefore),
  };
}

function sanitizeRecurringPayment(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): RecurringPayment | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid recurring payment record.");
    return null;
  }

  return {
    id: readString(record.id, fallbackIdValue),
    name: readString(record.name),
    amount: readNonNegativeNumber(record.amount),
    frequency: readEnum(record.frequency, frequencies, "Monthly", issues),
    category: readString(record.category),
    nextChargeDate: readDateInput(record.nextChargeDate),
    paymentMethod: readString(record.paymentMethod),
    status: readEnum(record.status, statuses, "active", issues),
    notes: readString(record.notes),
  };
}

function sanitizeTaxAssetSale(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): TaxAssetSale | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid tax asset sale record.");
    return null;
  }

  const acquiredDate = readDateInput(record.acquiredDate);
  const soldDate = readDateInput(record.soldDate);
  if (!acquiredDate || !soldDate) {
    issues.push("Skipped tax asset sale without valid acquired and sold dates.");
    return null;
  }

  return {
    id: readString(record.id, fallbackIdValue),
    assetType: readEnum(record.assetType, taxAssetTypes, "Stock", issues),
    symbol: readString(record.symbol).toUpperCase(),
    name: readString(record.name),
    stockLotId: readOptionalString(record.stockLotId),
    saleGroupId: readOptionalString(record.saleGroupId),
    acquiredDate,
    soldDate,
    proceeds: readNonNegativeNumber(record.proceeds),
    costBasis: readNonNegativeNumber(record.costBasis),
    fees: readNonNegativeNumber(record.fees),
    notes: readString(record.notes),
  };
}

function sanitizeTaxYearReport(
  value: unknown,
  fallbackIdValue: string,
  issues: string[],
): TaxYearReport | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid tax report record.");
    return null;
  }
  const taxYear = readTaxYear(record.taxYear, new Date().getFullYear());

  return {
    actualIncomeToDate: readNonNegativeNumber(record.actualIncomeToDate),
    adjustedGrossIncome: readNonNegativeNumber(record.adjustedGrossIncome),
    adjustments: readNonNegativeNumber(record.adjustments),
    createdAt: readString(record.createdAt, new Date().toISOString()),
    credits: readNonNegativeNumber(record.credits),
    cryptoCostBasis: readNonNegativeNumber(record.cryptoCostBasis),
    cryptoFees: readNonNegativeNumber(record.cryptoFees),
    cryptoLongTermGain: coerceFiniteNumber(record.cryptoLongTermGain),
    cryptoProceeds: readNonNegativeNumber(record.cryptoProceeds),
    cryptoSalesCount: readNonNegativeNumber(record.cryptoSalesCount),
    cryptoShortTermGain: coerceFiniteNumber(record.cryptoShortTermGain),
    deductions: readNonNegativeNumber(record.deductions),
    federalPayments: readNonNegativeNumber(record.federalPayments),
    federalTaxEstimate: readNonNegativeNumber(record.federalTaxEstimate),
    finalizedAt: readOptionalString(record.finalizedAt),
    id: readString(record.id, fallbackIdValue),
    notes: readString(record.notes),
    ordinaryDividends: readNonNegativeNumber(record.ordinaryDividends),
    ordinaryIncome: readNonNegativeNumber(record.ordinaryIncome),
    paycheckGrossPay: readNonNegativeNumber(record.paycheckGrossPay),
    projectedAnnualIncome: readNonNegativeNumber(record.projectedAnnualIncome),
    projectedAnnualTax: readNonNegativeNumber(record.projectedAnnualTax),
    projectedDueOrRefund: coerceFiniteNumber(record.projectedDueOrRefund),
    projectionBasis: readEnum(
      record.projectionBasis,
      taxProjectionBases,
      "mixed",
      issues,
    ),
    qualifiedDividends: readNonNegativeNumber(record.qualifiedDividends),
    stateLocalPayments: readNonNegativeNumber(record.stateLocalPayments),
    stateLocalTaxEstimate: readNonNegativeNumber(record.stateLocalTaxEstimate),
    status: readEnum(record.status, taxReportStatuses, "current", issues),
    stockCostBasis: readNonNegativeNumber(record.stockCostBasis),
    stockFees: readNonNegativeNumber(record.stockFees),
    stockLongTermGain: coerceFiniteNumber(record.stockLongTermGain),
    stockProceeds: readNonNegativeNumber(record.stockProceeds),
    stockSalesCount: readNonNegativeNumber(record.stockSalesCount),
    stockShortTermGain: coerceFiniteNumber(record.stockShortTermGain),
    taxableIncome: readNonNegativeNumber(record.taxableIncome),
    taxableInterest: readNonNegativeNumber(record.taxableInterest),
    taxYear,
    totalIncome: readNonNegativeNumber(record.totalIncome),
    totalPaymentsWithholding: readNonNegativeNumber(record.totalPaymentsWithholding),
    totalTaxEstimate: readNonNegativeNumber(record.totalTaxEstimate),
    updatedAt: readString(record.updatedAt, new Date().toISOString()),
  };
}

function sanitizeSeriesPoint(
  value: unknown,
  fallbackLabel: string,
  issues: string[],
): SeriesPoint | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid series point.");
    return null;
  }

  return {
    label: readString(record.label, fallbackLabel),
    value: coerceFiniteNumber(record.value),
  };
}

function sanitizeIncomeExpensePoint(
  value: unknown,
  fallbackLabel: string,
  issues: string[],
): IncomeExpensePoint | null {
  const record = asRecord(value);
  if (!record) {
    issues.push("Skipped invalid income/expense point.");
    return null;
  }

  return {
    label: readString(record.label, fallbackLabel),
    income: coerceFiniteNumber(record.income),
    expenses: coerceFiniteNumber(record.expenses),
  };
}

function sanitizeArray<T>(
  value: unknown,
  name: string,
  issues: string[],
  sanitizeItem: (item: unknown, index: number) => T | null,
) {
  if (!Array.isArray(value)) {
    if (value !== undefined) {
      issues.push(`Missing or invalid ${name} array.`);
    }
    return [];
  }

  return value.flatMap((item, index) => {
    const sanitized = sanitizeItem(item, index);
    return sanitized ? [sanitized] : [];
  });
}

function readString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function sanitizeWorkspaceName(value: unknown, fallback: string) {
  const name = readString(value, fallback).trim();
  return name || defaultWorkspaceName;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readNonNegativeNumber(value: unknown, fallback = 0) {
  return Math.max(coerceFiniteNumber(value, fallback), 0);
}

function readTaxYear(value: unknown, fallback: number) {
  const taxYear = Math.round(coerceFiniteNumber(value, fallback));
  return Math.min(Math.max(taxYear, 2020), 2035);
}

function readDateInput(value: unknown) {
  const dateString = readString(value);
  return parseDateInput(dateString) ? dateString : "";
}

function readDateTimeString(value: unknown) {
  const dateString = readString(value);
  return dateString && !Number.isNaN(Date.parse(dateString)) ? dateString : undefined;
}

function readCreditScoreDate(dateValue: unknown, legacyMonthValue: unknown) {
  const dateString = readDateInput(dateValue);
  if (dateString) {
    return dateString;
  }

  const monthString = readMonthInput(legacyMonthValue);
  return monthString ? `${monthString}-01` : "";
}

function readMonthInput(value: unknown) {
  const monthString = readString(value);
  const match = /^(\d{4})-(\d{2})$/.exec(monthString);
  if (!match) {
    return "";
  }

  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? monthString : "";
}

function readStatementClosingDate(value: unknown, dueDateValue: unknown) {
  const dateString = readDateInput(value);
  if (dateString) {
    return dateString;
  }

  const dueDate = parseDateInput(readString(dueDateValue));
  if (!dueDate) {
    return "";
  }

  return formatDateInput(new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate() - 21,
  ));
}

function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  issues: string[],
) {
  if (typeof value === "string" && allowed.includes(value as T)) {
    return value as T;
  }

  if (value !== undefined) {
    issues.push(`Replaced unsupported enum value: ${String(value)}.`);
  }

  return fallback;
}

function readOptionalEnum<T extends string>(value: unknown, allowed: readonly T[]) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : undefined;
}

function fallbackId(prefix: string, index: number) {
  return `${prefix}-stored-${index + 1}`;
}

function asRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
