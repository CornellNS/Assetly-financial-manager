export type Frequency =
  | "Daily"
  | "Weekly"
  | "Biweekly"
  | "Semi-monthly"
  | "Monthly"
  | "Quarterly"
  | "Annual";
export type Status = "active" | "canceled";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY";
export type FilingStatus =
  | "Single"
  | "Married filing jointly"
  | "Married filing separately"
  | "Head of household";
export type DeductionMode = "Standard" | "Itemized";
export type TaxAssetType = "Stock" | "Crypto";
export type StockTradeKind = "buy" | "sell";
export type MarketPriceStatus = "manual" | "updated" | "failed";

export const FINANCE_DATA_SCHEMA_VERSION = 16;
export const defaultCurrency: CurrencyCode = "USD";
export const defaultWorkspaceName = "Assetly Financial Manager";
export const graphColorOptions = [
  { label: "Sage", value: "#6fa47b" },
  { label: "Teal", value: "#4d9a8b" },
  { label: "Sky", value: "#3f8ea5" },
  { label: "Cobalt", value: "#4f75c7" },
  { label: "Violet", value: "#8b7ac6" },
  { label: "Plum", value: "#a55fa5" },
  { label: "Rose", value: "#c87969" },
  { label: "Coral", value: "#d86f51" },
  { label: "Amber", value: "#d5a34a" },
  { label: "Olive", value: "#8ea45c" },
  { label: "Steel", value: "#8e989f" },
] as const;
export type GraphColor = (typeof graphColorOptions)[number]["value"];
export const defaultGraphColor: GraphColor = graphColorOptions[0].value;
export const defaultGraphSecondaryColor: GraphColor = graphColorOptions[7].value;

export type WorkspaceSettings = {
  currency: CurrencyCode;
  graphPrimaryColor: GraphColor;
  graphSecondaryColor: GraphColor;
  name: string;
};

export type TaxProfile = {
  taxYear: number;
  filingStatus: FilingStatus;
  deductionMode: DeductionMode;
  standardDeductionAmount: number;
  itemizedDeductions: number;
  taxableInterest: number;
  ordinaryDividends: number;
  qualifiedDividends: number;
  otherOrdinaryIncome: number;
  businessIncome: number;
  rentalRoyaltyIncome: number;
  retirementIncome: number;
  unemploymentIncome: number;
  taxableSocialSecurity: number;
  capitalLossCarryover: number;
  hsaDeduction: number;
  iraDeduction: number;
  studentLoanInterestDeduction: number;
  qbiDeduction: number;
  childTaxCredit: number;
  otherTaxCredits: number;
  ordinaryIncomeTaxRate: number;
  longTermCapitalGainsTaxRate: number;
  qualifiedDividendTaxRate: number;
  additionalInvestmentTaxRate: number;
  selfEmploymentTaxRate: number;
  stateIncomeTaxRate: number;
  localIncomeTaxRate: number;
  federalWithholding: number;
  estimatedPayments: number;
  stateWithholding: number;
  stateEstimatedPayments: number;
  localWithholding: number;
  localEstimatedPayments: number;
  otherAdjustments: number;
};

export type Investment = {
  id: string;
  name: string;
  type: string;
  amountInvested: number;
  currentValue: number;
  dividendIncome: number;
  notes: string;
};

export type StockHolding = {
  id: string;
  ticker: string;
  company: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  marketPriceError?: string;
  marketPriceLastAttemptAt?: string;
  marketPriceStatus?: MarketPriceStatus;
  marketPriceUpdatedAt?: string;
  notes: string;
};

export type StockLot = {
  id: string;
  stockId: string;
  ticker: string;
  acquiredDate: string;
  shares: number;
  remainingShares: number;
  pricePerShare: number;
  fees: number;
  broker: string;
  notes: string;
  dateIsEstimate: boolean;
};

export type StockTradeInput = {
  kind: StockTradeKind;
  shares: number;
  price: number;
  fees: number;
};

export type StockPurchaseInput = {
  acquiredDate: string;
  broker: string;
  company: string;
  currentPrice: number;
  dateIsEstimate: boolean;
  fees: number;
  lotId: string;
  notes: string;
  pricePerShare: number;
  shares: number;
  stockId: string;
  ticker: string;
};

export type CryptoHolding = {
  id: string;
  coin: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketPriceError?: string;
  marketPriceLastAttemptAt?: string;
  marketPriceStatus?: MarketPriceStatus;
  marketPriceUpdatedAt?: string;
  notes: string;
};

export type IncomeSource = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  category: string;
  nextPaymentDate: string;
  active: boolean;
  notes: string;
};

export type Paycheck = {
  id: string;
  incomeSourceId: string;
  employerName: string;
  payDate: string;
  periodStartDate: string;
  periodEndDate: string;
  grossPay: number;
  netPay: number;
  federalIncomeTaxWithheld: number;
  socialSecurityTaxWithheld: number;
  medicareTaxWithheld: number;
  additionalMedicareTaxWithheld: number;
  stateIncomeTaxWithheld: number;
  localIncomeTaxWithheld: number;
  otherGovernmentWithholding: number;
  otherDeductions: number;
  notes: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  currentSaved: number;
  targetAmount: number;
  monthlyContribution: number;
  estimatedCompletionDate: string;
  notes: string;
  isEmergency: boolean;
};

export type CreditCard = {
  id: string;
  cardName: string;
  issuer: string;
  limit: number;
  balance: number;
  currentBalance: number;
  interestBalance: number;
  statementBalance: number;
  statementPaid: number;
  statementClosingDate: string;
  dueDate: string;
  minimumPaymentRate: number;
  minimumPayment: number;
  apr: number;
  autopay: boolean;
  autopayDate: string;
  rewardsType: string;
  notes: string;
};

export type CreditScoreEntry = {
  id: string;
  date: string;
  score: number;
  notes: string;
};

export type DebtStatus =
  | "current"
  | "paid";

export type DebtType =
  | "Student loan"
  | "Auto loan"
  | "Personal loan"
  | "Medical debt"
  | "Mortgage"
  | "BNPL / installment"
  | "Family / friend"
  | "Collections"
  | "Other";

export type DebtAccount = {
  id: string;
  name: string;
  type: DebtType;
  lender: string;
  loanDate: string;
  currentBalance: number;
  originalBalance: number;
  apr: number;
  minimumPayment: number;
  dueDate: string;
  paymentFrequency: Frequency;
  payoffDate: string;
  status: DebtStatus;
  autopay: boolean;
  autopayDate: string;
  collectorName: string;
  originalCreditor: string;
  disputeDeadline: string;
  notes: string;
};

export type DebtPaymentRecord = {
  id: string;
  debtId: string;
  debtName: string;
  date: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  totalDebtBefore: number;
  totalDebtAfter: number;
};

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  category: string;
  nextChargeDate: string;
  paymentMethod: string;
  status: Status;
  notes: string;
};

export type TaxAssetSale = {
  id: string;
  assetType: TaxAssetType;
  symbol: string;
  name: string;
  stockLotId?: string;
  saleGroupId?: string;
  acquiredDate: string;
  soldDate: string;
  proceeds: number;
  costBasis: number;
  fees: number;
  notes: string;
};

export type TaxYearReportStatus = "current" | "finalized" | "projected";
export type TaxProjectionBasis = "actual" | "projected" | "mixed";

export type TaxYearReport = {
  id: string;
  taxYear: number;
  status: TaxYearReportStatus;
  projectionBasis: TaxProjectionBasis;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  notes: string;
  ordinaryIncome: number;
  paycheckGrossPay: number;
  taxableInterest: number;
  ordinaryDividends: number;
  qualifiedDividends: number;
  totalIncome: number;
  actualIncomeToDate: number;
  projectedAnnualIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
  stockShortTermGain: number;
  stockLongTermGain: number;
  stockProceeds: number;
  stockCostBasis: number;
  stockFees: number;
  stockSalesCount: number;
  cryptoShortTermGain: number;
  cryptoLongTermGain: number;
  cryptoProceeds: number;
  cryptoCostBasis: number;
  cryptoFees: number;
  cryptoSalesCount: number;
  deductions: number;
  adjustments: number;
  credits: number;
  federalTaxEstimate: number;
  stateLocalTaxEstimate: number;
  totalTaxEstimate: number;
  projectedAnnualTax: number;
  federalPayments: number;
  stateLocalPayments: number;
  totalPaymentsWithholding: number;
  projectedDueOrRefund: number;
};

export type SeriesPoint = {
  label: string;
  value: number;
};

export type IncomeExpensePoint = {
  label: string;
  income: number;
  expenses: number;
};

export type DashboardIncomeExpensePoint = IncomeExpensePoint & {
  incomeIsFutureProjection?: boolean;
};

export type FinanceData = {
  schemaVersion: typeof FINANCE_DATA_SCHEMA_VERSION;
  workspace: WorkspaceSettings;
  taxProfile: TaxProfile;
  investments: Investment[];
  stocks: StockHolding[];
  stockLots: StockLot[];
  crypto: CryptoHolding[];
  incomeSources: IncomeSource[];
  paychecks: Paycheck[];
  savingsGoals: SavingsGoal[];
  creditCards: CreditCard[];
  creditScoreHistory: CreditScoreEntry[];
  debts: DebtAccount[];
  debtPayments: DebtPaymentRecord[];
  recurringPayments: RecurringPayment[];
  taxAssetSales: TaxAssetSale[];
  taxReports: TaxYearReport[];
  netWorthHistory: SeriesPoint[];
  incomeExpenseHistory: IncomeExpensePoint[];
};

export type CollectionKey =
  | "investments"
  | "stocks"
  | "crypto"
  | "incomeSources"
  | "savingsGoals"
  | "creditCards"
  | "debts"
  | "recurringPayments"
  | "taxAssetSales";

export const collectionLabels: Record<CollectionKey, string> = {
  investments: "investment",
  stocks: "stock holding",
  crypto: "crypto holding",
  incomeSources: "income source",
  savingsGoals: "savings goal",
  creditCards: "credit card",
  debts: "debt",
  recurringPayments: "recurring payment",
  taxAssetSales: "tax sale",
};

export const mockFinanceData: FinanceData = {
  schemaVersion: FINANCE_DATA_SCHEMA_VERSION,
  workspace: {
    currency: defaultCurrency,
    graphPrimaryColor: defaultGraphColor,
    graphSecondaryColor: defaultGraphSecondaryColor,
    name: defaultWorkspaceName,
  },
  taxProfile: {
    taxYear: 2026,
    filingStatus: "Single",
    deductionMode: "Standard",
    standardDeductionAmount: 16100,
    itemizedDeductions: 0,
    taxableInterest: 0,
    ordinaryDividends: 0,
    qualifiedDividends: 0,
    otherOrdinaryIncome: 0,
    businessIncome: 0,
    rentalRoyaltyIncome: 0,
    retirementIncome: 0,
    unemploymentIncome: 0,
    taxableSocialSecurity: 0,
    capitalLossCarryover: 0,
    hsaDeduction: 0,
    iraDeduction: 0,
    studentLoanInterestDeduction: 0,
    qbiDeduction: 0,
    childTaxCredit: 0,
    otherTaxCredits: 0,
    ordinaryIncomeTaxRate: 12,
    longTermCapitalGainsTaxRate: 0,
    qualifiedDividendTaxRate: 0,
    additionalInvestmentTaxRate: 0,
    selfEmploymentTaxRate: 14.13,
    stateIncomeTaxRate: 0,
    localIncomeTaxRate: 0,
    federalWithholding: 24800,
    estimatedPayments: 3200,
    stateWithholding: 0,
    stateEstimatedPayments: 0,
    localWithholding: 0,
    localEstimatedPayments: 0,
    otherAdjustments: 7500,
  },
  investments: [
    {
      id: "inv-1",
      name: "Vanguard Roth IRA",
      type: "Retirement",
      amountInvested: 36000,
      currentValue: 49250,
      dividendIncome: 620,
      notes: "Broad index funds, reviewed quarterly.",
    },
    {
      id: "inv-2",
      name: "Brokerage Core ETF",
      type: "Taxable brokerage",
      amountInvested: 24500,
      currentValue: 28740,
      dividendIncome: 310,
      notes: "Long-term taxable growth bucket.",
    },
    {
      id: "inv-3",
      name: "HSA Investment Sweep",
      type: "Health savings",
      amountInvested: 8200,
      currentValue: 9600,
      dividendIncome: 84,
      notes: "Keep first $2k in cash, invest the rest.",
    },
  ],
  stocks: [
    {
      id: "stk-1",
      ticker: "AAPL",
      company: "Apple",
      shares: 32,
      averageCost: 154.2,
      currentPrice: 191.4,
      notes: "Core tech holding.",
    },
    {
      id: "stk-2",
      ticker: "MSFT",
      company: "Microsoft",
      shares: 18,
      averageCost: 316.5,
      currentPrice: 429.7,
      notes: "Cloud and AI exposure.",
    },
    {
      id: "stk-3",
      ticker: "VTI",
      company: "Vanguard Total Stock Market",
      shares: 54,
      averageCost: 216.4,
      currentPrice: 258.3,
      notes: "Market baseline.",
    },
  ],
  stockLots: [
    {
      id: "lot-stk-1-starter",
      stockId: "stk-1",
      ticker: "AAPL",
      acquiredDate: "2024-02-12",
      shares: 32,
      remainingShares: 32,
      pricePerShare: 154.2,
      fees: 0,
      broker: "Sample brokerage",
      notes: "Starter demo purchase.",
      dateIsEstimate: false,
    },
    {
      id: "lot-stk-2-starter",
      stockId: "stk-2",
      ticker: "MSFT",
      acquiredDate: "2024-06-10",
      shares: 18,
      remainingShares: 18,
      pricePerShare: 316.5,
      fees: 0,
      broker: "Sample brokerage",
      notes: "Starter demo purchase.",
      dateIsEstimate: false,
    },
    {
      id: "lot-stk-3-starter",
      stockId: "stk-3",
      ticker: "VTI",
      acquiredDate: "2023-09-05",
      shares: 54,
      remainingShares: 54,
      pricePerShare: 216.4,
      fees: 0,
      broker: "Sample brokerage",
      notes: "Starter demo purchase.",
      dateIsEstimate: false,
    },
  ],
  crypto: [
    {
      id: "cry-1",
      coin: "Bitcoin",
      symbol: "BTC",
      quantity: 0.42,
      averageCost: 43800,
      currentPrice: 68250,
      notes: "Long-term cold storage.",
    },
    {
      id: "cry-2",
      coin: "Ethereum",
      symbol: "ETH",
      quantity: 4.8,
      averageCost: 2450,
      currentPrice: 3420,
      notes: "Main wallet position.",
    },
    {
      id: "cry-3",
      coin: "Solana",
      symbol: "SOL",
      quantity: 64,
      averageCost: 93,
      currentPrice: 148,
      notes: "Higher-volatility satellite.",
    },
  ],
  incomeSources: [
    {
      id: "inc-1",
      name: "Primary salary",
      amount: 7600,
      frequency: "Monthly",
      category: "Employment",
      nextPaymentDate: "2026-06-01",
      active: true,
      notes: "Net monthly direct deposit.",
    },
    {
      id: "inc-2",
      name: "Consulting retainer",
      amount: 1800,
      frequency: "Monthly",
      category: "Business",
      nextPaymentDate: "2026-06-07",
      active: true,
      notes: "Two strategy calls plus async review.",
    },
    {
      id: "inc-3",
      name: "Dividend sweep",
      amount: 540,
      frequency: "Quarterly",
      category: "Investments",
      nextPaymentDate: "2026-06-28",
      active: true,
      notes: "Estimated trailing average.",
    },
    {
      id: "inc-4",
      name: "Old marketplace payout",
      amount: 250,
      frequency: "Monthly",
      category: "Side income",
      nextPaymentDate: "2026-06-14",
      active: false,
      notes: "Paused while product is archived.",
    },
  ],
  paychecks: [],
  savingsGoals: [
    {
      id: "sav-1",
      name: "Emergency fund",
      currentSaved: 18600,
      targetAmount: 30000,
      monthlyContribution: 1500,
      estimatedCompletionDate: "2027-01-01",
      notes: "Six months of baseline expenses.",
      isEmergency: true,
    },
    {
      id: "sav-2",
      name: "Travel sinking fund",
      currentSaved: 3100,
      targetAmount: 6000,
      monthlyContribution: 400,
      estimatedCompletionDate: "2026-12-01",
      notes: "Summer and winter trips.",
      isEmergency: false,
    },
    {
      id: "sav-3",
      name: "Home repairs",
      currentSaved: 5400,
      targetAmount: 10000,
      monthlyContribution: 650,
      estimatedCompletionDate: "2027-02-01",
      notes: "Roof and appliance buffer.",
      isEmergency: false,
    },
  ],
  creditCards: [
    {
      id: "card-1",
      cardName: "Everyday Cash",
      issuer: "Chase",
      limit: 15000,
      balance: 1840,
      currentBalance: 1840,
      interestBalance: 1840,
      statementBalance: 1840,
      statementPaid: 0,
      statementClosingDate: "2026-05-10",
      dueDate: "2026-06-03",
      minimumPaymentRate: 2.45,
      minimumPayment: 45,
      apr: 22.49,
      autopay: true,
      autopayDate: "2026-06-03",
      rewardsType: "Cash back",
      notes: "Autopay statement balance.",
    },
    {
      id: "card-2",
      cardName: "Travel Reserve",
      issuer: "Amex",
      limit: 22000,
      balance: 3820,
      currentBalance: 3820,
      interestBalance: 3820,
      statementBalance: 3820,
      statementPaid: 0,
      statementClosingDate: "2026-05-17",
      dueDate: "2026-06-10",
      minimumPaymentRate: 2.49,
      minimumPayment: 95,
      apr: 24.99,
      autopay: false,
      autopayDate: "",
      rewardsType: "Travel points",
      notes: "Flight purchase posts this cycle.",
    },
    {
      id: "card-3",
      cardName: "Business Plus",
      issuer: "Capital One",
      limit: 12000,
      balance: 1260,
      currentBalance: 1260,
      interestBalance: 1260,
      statementBalance: 1260,
      statementPaid: 0,
      statementClosingDate: "2026-05-24",
      dueDate: "2026-06-17",
      minimumPaymentRate: 2.78,
      minimumPayment: 35,
      apr: 20.99,
      autopay: false,
      autopayDate: "",
      rewardsType: "Miles",
      notes: "Software subscriptions.",
    },
  ],
  creditScoreHistory: [
    { id: "score-1", date: "2026-01-15", score: 704, notes: "New card reported." },
    { id: "score-2", date: "2026-02-14", score: 709, notes: "Utilization moved lower." },
    { id: "score-3", date: "2026-03-16", score: 716, notes: "On-time payments posted." },
    { id: "score-4", date: "2026-04-15", score: 721, notes: "Statement balance paid down." },
    { id: "score-5", date: "2026-05-18", score: 724, notes: "Keeping reported usage low." },
  ],
  debts: [],
  debtPayments: [],
  recurringPayments: [
    {
      id: "rec-1",
      name: "Rent",
      amount: 2450,
      frequency: "Monthly",
      category: "Rent",
      nextChargeDate: "2026-06-01",
      paymentMethod: "Checking",
      status: "active",
      notes: "Includes parking.",
    },
    {
      id: "rec-2",
      name: "Health insurance",
      amount: 420,
      frequency: "Monthly",
      category: "Insurance",
      nextChargeDate: "2026-06-05",
      paymentMethod: "Everyday Cash",
      status: "active",
      notes: "Family plan premium.",
    },
    {
      id: "rec-3",
      name: "Phone plan",
      amount: 96,
      frequency: "Monthly",
      category: "Phone",
      nextChargeDate: "2026-06-08",
      paymentMethod: "Business Plus",
      status: "active",
      notes: "Two lines.",
    },
    {
      id: "rec-4",
      name: "Adobe Creative Cloud",
      amount: 59.99,
      frequency: "Monthly",
      category: "Software",
      nextChargeDate: "2026-06-11",
      paymentMethod: "Business Plus",
      status: "active",
      notes: "Design tools.",
    },
    {
      id: "rec-5",
      name: "Streaming bundle",
      amount: 24.99,
      frequency: "Monthly",
      category: "Entertainment",
      nextChargeDate: "2026-06-18",
      paymentMethod: "Everyday Cash",
      status: "active",
      notes: "Shared household account.",
    },
    {
      id: "rec-6",
      name: "Old analytics tool",
      amount: 49,
      frequency: "Monthly",
      category: "Business",
      nextChargeDate: "2026-07-01",
      paymentMethod: "Business Plus",
      status: "canceled",
      notes: "Canceled, access expires next month.",
    },
  ],
  taxAssetSales: [
    {
      id: "tax-1",
      assetType: "Stock",
      symbol: "AAPL",
      name: "Apple partial sale",
      acquiredDate: "2023-02-10",
      soldDate: "2026-03-14",
      proceeds: 7350,
      costBasis: 5140,
      fees: 8,
      notes: "Long-term purchase sold from taxable brokerage.",
    },
    {
      id: "tax-2",
      assetType: "Crypto",
      symbol: "ETH",
      name: "Ethereum rebalance",
      acquiredDate: "2025-11-20",
      soldDate: "2026-02-11",
      proceeds: 4620,
      costBasis: 3890,
      fees: 42,
      notes: "Short-term sale; exchange CSV needs reconciliation.",
    },
    {
      id: "tax-3",
      assetType: "Crypto",
      symbol: "SOL",
      name: "Solana tax-loss harvest",
      acquiredDate: "2026-01-05",
      soldDate: "2026-04-29",
      proceeds: 1810,
      costBasis: 2360,
      fees: 18,
      notes: "Short-term realized loss.",
    },
    {
      id: "tax-4",
      assetType: "Stock",
      symbol: "VTI",
      name: "VTI older purchase",
      acquiredDate: "2022-06-03",
      soldDate: "2026-01-18",
      proceeds: 6180,
      costBasis: 5840,
      fees: 0,
      notes: "Long-term ETF sale.",
    },
  ],
  taxReports: [],
  netWorthHistory: [
    { label: "Jan", value: 128400 },
    { label: "Feb", value: 131900 },
    { label: "Mar", value: 134200 },
    { label: "Apr", value: 138600 },
    { label: "May", value: 141800 },
    { label: "Jun", value: 146900 },
  ],
  incomeExpenseHistory: [
    { label: "Jan", income: 9700, expenses: 6150 },
    { label: "Feb", income: 9650, expenses: 6420 },
    { label: "Mar", income: 10100, expenses: 6890 },
    { label: "Apr", income: 9940, expenses: 6310 },
    { label: "May", income: 10350, expenses: 6760 },
    { label: "Jun", income: 10180, expenses: 6520 },
  ],
};

export function formatCurrency(
  value: number,
  compact = false,
  currency: CurrencyCode = defaultCurrency,
) {
  const finiteValue = coerceFiniteNumber(value);

  if (compact) {
    const sign = finiteValue < 0 ? "-" : "";
    const absoluteValue = Math.abs(finiteValue);
    const compactValue =
      absoluteValue >= 1_000_000
        ? `${trimTrailingZero(absoluteValue / 1_000_000)}M`
        : absoluteValue >= 1_000
          ? `${trimTrailingZero(absoluteValue / 1_000)}K`
          : absoluteValue.toFixed(0);

    return `${sign}${getCurrencySymbol(currency)}${compactValue}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: getCurrencyFractionDigits(currency) === 0 ? 0 : 2,
  }).format(finiteValue);
}

function trimTrailingZero(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatPercent(value: number) {
  const finiteValue = coerceFiniteNumber(value);
  return `${finiteValue >= 0 ? "+" : ""}${finiteValue.toFixed(1)}%`;
}

export function monthlyAmount(amount: number, frequency: Frequency) {
  const finiteAmount = coerceFiniteNumber(amount);

  switch (frequency) {
    case "Weekly":
      return (finiteAmount * 52) / 12;
    case "Biweekly":
      return (finiteAmount * 26) / 12;
    case "Daily":
      return (finiteAmount * 365) / 12;
    case "Semi-monthly":
      return finiteAmount * 2;
    case "Quarterly":
      return finiteAmount / 3;
    case "Annual":
      return finiteAmount / 12;
    default:
      return finiteAmount;
  }
}

export const standardDeduction2026: Record<FilingStatus, number> = {
  Single: 16100,
  "Married filing jointly": 32200,
  "Married filing separately": 16100,
  "Head of household": 24150,
};

type TaxBracket = {
  upTo: number;
  rate: number;
};

export const ordinaryTaxBrackets2026: Record<FilingStatus, TaxBracket[]> = {
  Single: [
    { upTo: 12400, rate: 0.1 },
    { upTo: 50400, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201775, rate: 0.24 },
    { upTo: 256225, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  "Married filing jointly": [
    { upTo: 24800, rate: 0.1 },
    { upTo: 100800, rate: 0.12 },
    { upTo: 211400, rate: 0.22 },
    { upTo: 403550, rate: 0.24 },
    { upTo: 512450, rate: 0.32 },
    { upTo: 768700, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  "Married filing separately": [
    { upTo: 12400, rate: 0.1 },
    { upTo: 50400, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201775, rate: 0.24 },
    { upTo: 256225, rate: 0.32 },
    { upTo: 384350, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  "Head of household": [
    { upTo: 17700, rate: 0.1 },
    { upTo: 67450, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201750, rate: 0.24 },
    { upTo: 256200, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
};

type CapitalGainRateThresholds = {
  zeroRateMax: number;
  fifteenRateMax: number;
};

export const longTermCapitalGainThresholds2026: Record<
  FilingStatus,
  CapitalGainRateThresholds
> = {
  Single: { zeroRateMax: 49450, fifteenRateMax: 545500 },
  "Married filing jointly": { zeroRateMax: 98900, fifteenRateMax: 613700 },
  "Married filing separately": { zeroRateMax: 49450, fifteenRateMax: 306850 },
  "Head of household": { zeroRateMax: 66200, fifteenRateMax: 579600 },
};

export const niitThresholds: Record<FilingStatus, number> = {
  Single: 200000,
  "Married filing jointly": 250000,
  "Married filing separately": 125000,
  "Head of household": 200000,
};

export type DateOffset = {
  days?: number;
  months?: number;
};

export type DueDateStatus = {
  days: number | null;
  label: string;
  tone: "blue" | "amber" | "red" | "neutral";
  isOverdue: boolean;
};

export type WeeklyReportWindow = {
  days: Date[];
  endDate: Date;
  startDate: Date;
};

export type WeeklyReportEventKind = "credit-card" | "debt" | "income" | "recurring";

export type WeeklyReportEvent = {
  amount: number;
  collection: "creditCards" | "debts" | "incomeSources" | "recurringPayments";
  date: Date;
  dateKey: string;
  detail: string;
  id: string;
  itemId: string;
  kind: WeeklyReportEventKind;
  label: string;
  typeLabel: string;
};

export type WeeklyReportFlowRow = {
  cardOut: number;
  date: Date;
  dateKey: string;
  debtOut: number;
  income: number;
  net: number;
  recurringOut: number;
};

const dayInMs = 1000 * 60 * 60 * 24;

export function formatDateInput(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getDefaultDateInput(offset: DateOffset = {}, baseDate = new Date()) {
  const nextDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + (offset.months ?? 0),
    baseDate.getDate() + (offset.days ?? 0),
  );

  return formatDateInput(nextDate);
}

function addMonthsClamped(date: Date, months = 1) {
  const targetMonth = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();

  return new Date(
    targetYear,
    normalizedMonth,
    Math.min(date.getDate(), daysInTargetMonth),
  );
}

export function parseDateInput(dateString: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
}

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDaysUntilDate(dateString: string, baseDate = new Date()) {
  const target = parseDateInput(dateString);
  if (!target) {
    return null;
  }

  const diff = target.getTime() - startOfLocalDay(baseDate).getTime();
  return Math.ceil(diff / dayInMs);
}

export function daysUntil(dateString: string, baseDate = new Date()) {
  return getDaysUntilDate(dateString, baseDate) ?? 0;
}

export function isDateWithinNextDays(
  dateString: string,
  windowDays: number,
  baseDate = new Date(),
) {
  const days = getDaysUntilDate(dateString, baseDate);
  return days !== null && days >= 0 && days <= windowDays;
}

export function countDatesWithinNextDays(
  dateStrings: string[],
  windowDays: number,
  baseDate = new Date(),
) {
  return dateStrings.filter((dateString) =>
    isDateWithinNextDays(dateString, windowDays, baseDate),
  ).length;
}

export function getWeeklyReportWindow(today = new Date()): WeeklyReportWindow {
  const startDate = startOfLocalDay(today);
  const days = Array.from({ length: 7 }, (_, index) =>
    new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index),
  );

  return {
    days,
    endDate: days[days.length - 1] ?? startDate,
    startDate,
  };
}

export function getWeeklyReportWeekStart(today = new Date()) {
  const date = startOfLocalDay(today);
  const daysSinceMonday = (date.getDay() + 6) % 7;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
}

export function getWeeklyReportEvents(
  data: Pick<FinanceData, "creditCards" | "debts" | "incomeSources" | "recurringPayments">,
  today = new Date(),
): WeeklyReportEvent[] {
  const week = getWeeklyReportWindow(today);
  const events: WeeklyReportEvent[] = [];

  data.creditCards.forEach((card) => {
    const amount = creditStatementRemaining(card);
    if (amount <= 0) {
      return;
    }

    const scheduleDate = card.autopay ? card.autopayDate || card.dueDate : card.dueDate;
    const eventDates = card.autopay
      ? getDateOccurrencesInRange(scheduleDate, "Monthly", week.startDate, week.endDate)
      : (() => {
          const dueDate = parseDateInput(scheduleDate);
          return dueDate && isDateInRange(dueDate, week.startDate, week.endDate)
            ? [startOfLocalDay(dueDate)]
            : [];
        })();

    eventDates.forEach((eventDate) => {
      events.push({
        amount,
        collection: "creditCards",
        date: eventDate,
        dateKey: formatDateInput(eventDate),
        detail: card.autopay ? `${card.issuer} · Autopay` : card.issuer,
        id: `credit-card-${card.id}-${formatDateInput(eventDate)}`,
        itemId: card.id,
        kind: "credit-card",
        label: card.cardName,
        typeLabel: card.autopay ? "Card autopay" : "Card due",
      });
    });
  });

  data.recurringPayments.forEach((payment) => {
    if (payment.status !== "active") {
      return;
    }

    getDateOccurrencesInRange(
      payment.nextChargeDate,
      payment.frequency,
      week.startDate,
      week.endDate,
    ).forEach((eventDate) => {
      events.push({
        amount: Math.max(coerceFiniteNumber(payment.amount), 0),
        collection: "recurringPayments",
        date: eventDate,
        dateKey: formatDateInput(eventDate),
        detail: `${payment.category} · ${payment.paymentMethod}`,
        id: `recurring-${payment.id}-${formatDateInput(eventDate)}`,
        itemId: payment.id,
        kind: "recurring",
        label: payment.name,
        typeLabel: "Recurring",
      });
    });
  });

  data.debts.forEach((debt) => {
    let remainingBalance = Math.max(coerceFiniteNumber(debt.currentBalance), 0);
    const scheduledAmount = Math.max(coerceFiniteNumber(debt.minimumPayment), 0);
    if (debt.status === "paid" || remainingBalance <= 0 || scheduledAmount <= 0) {
      return;
    }

    const scheduleDate = debt.autopay ? debt.autopayDate || debt.dueDate : debt.dueDate;
    const scheduleFrequency = debt.autopay ? "Monthly" : debt.paymentFrequency;

    getDateOccurrencesInRange(
      scheduleDate,
      scheduleFrequency,
      week.startDate,
      week.endDate,
    ).forEach((eventDate) => {
      const amount = Math.min(scheduledAmount, remainingBalance);
      if (amount <= 0) {
        return;
      }

      remainingBalance = Math.max(remainingBalance - amount, 0);
      events.push({
        amount,
        collection: "debts",
        date: eventDate,
        dateKey: formatDateInput(eventDate),
        detail: debt.autopay
          ? `${debt.lender || debt.type} · Autopay`
          : `${debt.lender || debt.type} · ${debt.paymentFrequency}`,
        id: `debt-${debt.id}-${formatDateInput(eventDate)}`,
        itemId: debt.id,
        kind: "debt",
        label: debt.name,
        typeLabel: debt.autopay ? "Debt autopay" : "Debt payment",
      });
    });
  });

  data.incomeSources.forEach((source) => {
    if (!source.active) {
      return;
    }

    getDateOccurrencesInRange(
      source.nextPaymentDate,
      source.frequency,
      week.startDate,
      week.endDate,
    ).forEach((eventDate) => {
      events.push({
        amount: Math.max(coerceFiniteNumber(source.amount), 0),
        collection: "incomeSources",
        date: eventDate,
        dateKey: formatDateInput(eventDate),
        detail: `${source.category} · ${source.frequency}`,
        id: `income-${source.id}-${formatDateInput(eventDate)}`,
        itemId: source.id,
        kind: "income",
        label: source.name,
        typeLabel: "Income",
      });
    });
  });

  return events.sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      weeklyReportEventKindOrder(a.kind) - weeklyReportEventKindOrder(b.kind) ||
      a.label.localeCompare(b.label),
  );
}

export function getWeeklyReportFlowRows(
  data: Pick<FinanceData, "creditCards" | "debts" | "incomeSources" | "recurringPayments">,
  today = new Date(),
): WeeklyReportFlowRow[] {
  const week = getWeeklyReportWindow(today);
  const events = getWeeklyReportEvents(data, today);
  const eventsByDate = events.reduce((groups, event) => {
    const current = groups.get(event.dateKey) ?? [];
    groups.set(event.dateKey, [...current, event]);
    return groups;
  }, new Map<string, WeeklyReportEvent[]>());

  return week.days.map((date) => {
    const dateKey = formatDateInput(date);
    const dayEvents = eventsByDate.get(dateKey) ?? [];
    const income = dayEvents
      .filter((event) => event.kind === "income")
      .reduce((total, event) => total + event.amount, 0);
    const recurringOut = dayEvents
      .filter((event) => event.kind === "recurring")
      .reduce((total, event) => total + event.amount, 0);
    const cardOut = dayEvents
      .filter((event) => event.kind === "credit-card")
      .reduce((total, event) => total + event.amount, 0);
    const debtOut = dayEvents
      .filter((event) => event.kind === "debt")
      .reduce((total, event) => total + event.amount, 0);

    return {
      cardOut,
      date,
      dateKey,
      debtOut,
      income,
      net: income - recurringOut - cardOut - debtOut,
      recurringOut,
    };
  });
}

export function getWeeklyReportCreditCards(
  data: Pick<FinanceData, "creditCards" | "debts" | "incomeSources" | "recurringPayments">,
  today = new Date(),
) {
  const dueCardIds = new Set(
    getWeeklyReportEvents(data, today)
      .filter((event) => event.kind === "credit-card")
      .map((event) => event.itemId),
  );
  const dueCards = data.creditCards.filter((card) => dueCardIds.has(card.id));

  return dueCards.length > 0 ? dueCards : data.creditCards;
}

export function getDueDateStatus(dateString: string, baseDate = new Date()): DueDateStatus {
  const days = getDaysUntilDate(dateString, baseDate);
  if (days === null) {
    return {
      days,
      label: "No date",
      tone: "neutral",
      isOverdue: false,
    };
  }

  if (days < 0) {
    const overdueDays = Math.abs(days);
    return {
      days,
      label: overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`,
      tone: "red",
      isOverdue: true,
    };
  }

  if (days === 0) {
    return {
      days,
      label: "Due today",
      tone: "amber",
      isOverdue: false,
    };
  }

  return {
    days,
    label: days === 1 ? "1 day" : `${days} days`,
    tone: days <= 7 ? "amber" : "blue",
    isOverdue: false,
  };
}

function isDateInRange(date: Date, rangeStart: Date, rangeEnd: Date) {
  const day = startOfLocalDay(date);
  return day.getTime() >= rangeStart.getTime() && day.getTime() <= rangeEnd.getTime();
}

function getDateOccurrencesInRange(
  dateString: string,
  frequency: Frequency,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const firstDate = parseDateInput(dateString);

  if (!firstDate) {
    return [];
  }

  const firstOccurrence = startOfLocalDay(firstDate);
  const normalizedRangeStart = startOfLocalDay(rangeStart);
  const normalizedRangeEnd = startOfLocalDay(rangeEnd);

  if (frequency === "Semi-monthly") {
    return getSemiMonthlyOccurrencesInRange(
      firstOccurrence,
      normalizedRangeStart,
      normalizedRangeEnd,
    );
  }

  const occurrences: Date[] = [];
  let guard = 0;

  while (guard < 10000) {
    const cursor = addFrequencyDate(firstOccurrence, frequency, guard);
    if (cursor > normalizedRangeEnd) {
      break;
    }

    if (cursor >= normalizedRangeStart) {
      occurrences.push(cursor);
    }

    guard += 1;
  }

  return occurrences;
}

function getSemiMonthlyOccurrencesInRange(
  firstOccurrence: Date,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const occurrences: Date[] = [];
  const anchorDay = firstOccurrence.getDate();
  const firstMonth = new Date(firstOccurrence.getFullYear(), firstOccurrence.getMonth(), 1);
  const startMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const monthCursor = firstMonth > startMonth ? firstMonth : startMonth;
  let cursor = monthCursor;
  let guard = 0;

  while (cursor <= rangeEnd && guard < 600) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days =
      anchorDay <= 14
        ? [anchorDay, Math.min(anchorDay + 15, lastDay)]
        : anchorDay >= 28
          ? [15, lastDay]
          : [anchorDay, lastDay];

    [...new Set(days)]
      .sort((a, b) => a - b)
      .forEach((day) => {
        const eventDate = startOfLocalDay(new Date(year, month, Math.min(day, lastDay)));
        if (
          eventDate >= firstOccurrence &&
          eventDate >= rangeStart &&
          eventDate <= rangeEnd
        ) {
          occurrences.push(eventDate);
        }
      });

    cursor = new Date(year, month + 1, 1);
    guard += 1;
  }

  return occurrences;
}

function addFrequencyDate(date: Date, frequency: Frequency, steps = 1) {
  switch (frequency) {
    case "Daily":
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + steps);
    case "Weekly":
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7 * steps);
    case "Biweekly":
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 14 * steps);
    case "Semi-monthly":
      return addMonthsClamped(date, steps);
    case "Quarterly":
      return addMonthsClamped(date, 3 * steps);
    case "Annual":
      return addMonthsClamped(date, 12 * steps);
    case "Monthly":
    default:
      return addMonthsClamped(date, steps);
  }
}

function weeklyReportEventKindOrder(kind: WeeklyReportEventKind) {
  switch (kind) {
    case "income":
      return 0;
    case "recurring":
      return 1;
    case "debt":
      return 2;
    case "credit-card":
    default:
      return 3;
  }
}

export function stockValue(stock: StockHolding) {
  return multiplyFinite(stock.shares, stock.currentPrice);
}

export function stockCost(stock: StockHolding) {
  return multiplyFinite(stock.shares, stock.averageCost);
}

export function stockLotOpenCost(lot: StockLot) {
  const shares = Math.max(coerceFiniteNumber(lot.shares), 0);
  const remainingShares = Math.min(
    Math.max(coerceFiniteNumber(lot.remainingShares), 0),
    shares,
  );
  const proportionalFees = shares > 0 ? coerceFiniteNumber(lot.fees) * (remainingShares / shares) : 0;

  return remainingShares * coerceFiniteNumber(lot.pricePerShare) + proportionalFees;
}

export function stockLotCostBasisForShares(lot: StockLot, shares: number) {
  const lotShares = Math.max(coerceFiniteNumber(lot.shares), 0);
  const soldShares = Math.min(
    Math.max(coerceFiniteNumber(shares), 0),
    Math.max(coerceFiniteNumber(lot.remainingShares), 0),
  );
  const proportionalFees = lotShares > 0 ? coerceFiniteNumber(lot.fees) * (soldShares / lotShares) : 0;

  return soldShares * coerceFiniteNumber(lot.pricePerShare) + proportionalFees;
}

export function stockLotMarketValue(lot: StockLot, currentPrice: number) {
  return Math.max(coerceFiniteNumber(lot.remainingShares), 0) * Math.max(coerceFiniteNumber(currentPrice), 0);
}

export function stockLotGain(lot: StockLot, currentPrice: number) {
  return stockLotMarketValue(lot, currentPrice) - stockLotOpenCost(lot);
}

export function createStarterStockLot(stock: StockHolding): StockLot {
  return {
    id: `lot-${stock.id}-starter`,
    stockId: stock.id,
    ticker: stock.ticker.toUpperCase(),
    acquiredDate: "2026-01-01",
    shares: Math.max(coerceFiniteNumber(stock.shares), 0),
    remainingShares: Math.max(coerceFiniteNumber(stock.shares), 0),
    pricePerShare: Math.max(coerceFiniteNumber(stock.averageCost), 0),
    fees: 0,
    broker: "",
    notes: stock.notes
      ? `Starter purchase from existing holding. ${stock.notes}`
      : "Starter purchase from existing holding.",
    dateIsEstimate: true,
  };
}

export function createStockLotFromBuy({
  acquiredDate,
  broker,
  dateIsEstimate = false,
  holding,
  id,
  notes,
  trade,
}: {
  acquiredDate: string;
  broker: string;
  dateIsEstimate?: boolean;
  holding: StockHolding;
  id: string;
  notes: string;
  trade: StockTradeInput;
}): StockLot {
  const shares = Math.max(coerceFiniteNumber(trade.shares), 0);

  return {
    acquiredDate,
    broker,
    dateIsEstimate,
    fees: Math.max(coerceFiniteNumber(trade.fees), 0),
    id,
    notes,
    pricePerShare: Math.max(coerceFiniteNumber(trade.price), 0),
    remainingShares: shares,
    shares,
    stockId: holding.id,
    ticker: holding.ticker.toUpperCase(),
  };
}

export function recalculateStockHoldingFromLots(
  holding: StockHolding,
  lots: StockLot[],
) {
  const openLots = lots.filter((lot) => lot.stockId === holding.id && coerceFiniteNumber(lot.remainingShares) > 0);
  const shares = openLots.reduce(
    (total, lot) => total + coerceFiniteNumber(lot.remainingShares),
    0,
  );
  const costBasis = openLots.reduce(
    (total, lot) => total + stockLotOpenCost(lot),
    0,
  );

  return {
    ...holding,
    averageCost: shares > 0 ? costBasis / shares : 0,
    shares,
    ticker: holding.ticker.toUpperCase(),
  };
}

export function recalculateStockHoldingsFromLots(
  holdings: StockHolding[],
  lots: StockLot[],
) {
  return holdings.map((holding) => recalculateStockHoldingFromLots(holding, lots));
}

export function consolidateStockHoldingsByTicker(data: FinanceData): FinanceData {
  const groups = data.stocks.reduce((map, stock) => {
    const ticker = stock.ticker.trim().toUpperCase();
    const groupKey = ticker || `stock:${stock.id}`;
    const current = map.get(groupKey) ?? [];
    map.set(groupKey, [...current, { ...stock, ticker }]);
    return map;
  }, new Map<string, StockHolding[]>());
  const duplicateGroups = [...groups.values()].filter((group) => group.length > 1);

  if (duplicateGroups.length === 0) {
    return data;
  }

  const duplicateStockIds = new Map<string, string>();
  const primaryTickerById = new Map<string, string>();
  duplicateGroups.forEach((group) => {
    const primary = group[0];
    group.forEach((stock) => duplicateStockIds.set(stock.id, primary.id));
    primaryTickerById.set(primary.id, primary.ticker);
  });

  const nextLots = data.stockLots.map((lot) => {
    const primaryStockId = duplicateStockIds.get(lot.stockId);
    if (!primaryStockId) {
      return lot;
    }

    return {
      ...lot,
      stockId: primaryStockId,
      ticker: primaryTickerById.get(primaryStockId) ?? lot.ticker.trim().toUpperCase(),
    };
  });
  const handledTickers = new Set<string>();
  const nextStocks = data.stocks.flatMap((stock) => {
    const ticker = stock.ticker.trim().toUpperCase();
    const groupKey = ticker || `stock:${stock.id}`;
    const group = groups.get(groupKey) ?? [];
    if (group.length <= 1) {
      return [recalculateStockHoldingFromLots({ ...stock, ticker }, nextLots)];
    }

    if (handledTickers.has(groupKey)) {
      return [];
    }

    handledTickers.add(groupKey);
    const primary = group[0];
    const marketSource = getBestStockMarketSource(group);
    const mergedStock = recalculateStockHoldingFromLots(
      {
        ...primary,
        company: firstNonEmptyString(group.map((item) => item.company)) || primary.company,
        currentPrice: marketSource.currentPrice,
        marketPriceError: marketSource.marketPriceError,
        marketPriceLastAttemptAt: marketSource.marketPriceLastAttemptAt,
        marketPriceStatus: marketSource.marketPriceStatus,
        marketPriceUpdatedAt: marketSource.marketPriceUpdatedAt,
        notes: mergeStockNotes(group.map((item) => item.notes)),
        ticker,
      },
      nextLots,
    );

    return [mergedStock];
  });

  return {
    ...data,
    stockLots: nextLots,
    stocks: nextStocks,
  };
}

export function stackStockPurchase(data: FinanceData, purchase: StockPurchaseInput): FinanceData {
  const baseData = consolidateStockHoldingsByTicker(data);
  const ticker = purchase.ticker.trim().toUpperCase();
  const existingStock =
    baseData.stocks.find((stock) => stock.id === purchase.stockId) ??
    baseData.stocks.find((stock) => stock.ticker.toUpperCase() === ticker);
  const baseStock: StockHolding =
    existingStock ??
    {
      averageCost: 0,
      company: purchase.company.trim(),
      currentPrice: Math.max(coerceFiniteNumber(purchase.currentPrice), 0),
      id: purchase.stockId,
      notes: purchase.notes.trim(),
      shares: 0,
      ticker,
    };
  const stockForPurchase = {
    ...baseStock,
    company: baseStock.company || purchase.company.trim(),
    ticker: baseStock.ticker.toUpperCase() || ticker,
  };
  const nextPurchase = createStockLotFromBuy({
    acquiredDate: purchase.acquiredDate,
    broker: purchase.broker.trim(),
    dateIsEstimate: purchase.dateIsEstimate,
    holding: stockForPurchase,
    id: purchase.lotId,
    notes: purchase.notes.trim() || "Stock purchase.",
    trade: {
      fees: Math.max(coerceFiniteNumber(purchase.fees), 0),
      kind: "buy",
      price: Math.max(coerceFiniteNumber(purchase.pricePerShare), 0),
      shares: Math.max(coerceFiniteNumber(purchase.shares), 0),
    },
  });
  const nextLots = [nextPurchase, ...baseData.stockLots];
  const nextStock = recalculateStockHoldingFromLots(stockForPurchase, nextLots);

  return {
    ...baseData,
    stockLots: nextLots,
    stocks: existingStock
      ? baseData.stocks.map((stock) => (stock.id === existingStock.id ? nextStock : stock))
      : [nextStock, ...baseData.stocks],
  };
}

function getBestStockMarketSource(stocks: StockHolding[]) {
  return stocks.reduce((best, stock) => {
    const stockTime = getStockMarketMetadataTime(stock);
    const bestTime = getStockMarketMetadataTime(best);
    if (stockTime > bestTime) {
      return stock;
    }

    if (stockTime === bestTime && stock.currentPrice > 0 && best.currentPrice <= 0) {
      return stock;
    }

    return best;
  }, stocks[0]);
}

function getStockMarketMetadataTime(stock: StockHolding) {
  const updatedTime = stock.marketPriceUpdatedAt ? Date.parse(stock.marketPriceUpdatedAt) : 0;
  if (!Number.isNaN(updatedTime) && updatedTime > 0) {
    return updatedTime;
  }

  const attemptedTime = stock.marketPriceLastAttemptAt
    ? Date.parse(stock.marketPriceLastAttemptAt)
    : 0;
  return Number.isNaN(attemptedTime) ? 0 : attemptedTime;
}

function firstNonEmptyString(values: string[]) {
  return values.map((value) => value.trim()).find(Boolean) ?? "";
}

function mergeStockNotes(notes: string[]) {
  const uniqueNotes = [...new Set(notes.map((note) => note.trim()).filter(Boolean))];
  return uniqueNotes.join("\n");
}

export function sellStockLotsFifo({
  holding,
  lots,
  notes,
  saleGroupId,
  soldDate,
  trade,
}: {
  holding: StockHolding;
  lots: StockLot[];
  notes: string;
  saleGroupId: string;
  soldDate: string;
  trade: StockTradeInput;
}) {
  const requestedShares = Math.max(coerceFiniteNumber(trade.shares), 0);
  const openLots = lots
    .filter((lot) => lot.stockId === holding.id && coerceFiniteNumber(lot.remainingShares) > 0)
    .slice()
    .sort(
      (a, b) =>
        a.acquiredDate.localeCompare(b.acquiredDate) ||
        a.id.localeCompare(b.id),
    );
  const availableShares = openLots.reduce(
    (total, lot) => total + coerceFiniteNumber(lot.remainingShares),
    0,
  );
  const emptySaleResult = {
    lots,
    soldShares: 0,
    taxSales: [] as Array<Omit<TaxAssetSale, "id">>,
  };

  if (requestedShares <= 0) {
    return {
      ...emptySaleResult,
      error: "Enter shares greater than zero before selling.",
    };
  }

  if (requestedShares > availableShares + 0.000001) {
    return {
      ...emptySaleResult,
      error: `Only ${availableShares.toLocaleString()} open ${holding.ticker} shares are available to sell.`,
    };
  }

  const sellShares = requestedShares;
  const saleRows: Array<Omit<TaxAssetSale, "id">> = [];
  const consumedByLot = new Map<string, number>();
  let remainingToSell = sellShares;

  openLots.forEach((lot) => {
    if (remainingToSell <= 0) {
      return;
    }

    const lotRemaining = Math.max(coerceFiniteNumber(lot.remainingShares), 0);
    const consumedShares = Math.min(lotRemaining, remainingToSell);
    consumedByLot.set(lot.id, consumedShares);
    remainingToSell -= consumedShares;
  });

  const invalidDateLot = openLots.find((lot) => {
    const consumedShares = consumedByLot.get(lot.id) ?? 0;
    return consumedShares > 0 && lot.acquiredDate > soldDate;
  });

  if (invalidDateLot) {
    return {
      ...emptySaleResult,
      error: `Sell date must be on or after ${invalidDateLot.acquiredDate} for the oldest consumed purchase.`,
    };
  }

  const updatedLots = lots.map((lot) => {
    const consumedShares = consumedByLot.get(lot.id) ?? 0;
    if (consumedShares <= 0) {
      return lot;
    }

    return {
      ...lot,
      remainingShares: Math.max(coerceFiniteNumber(lot.remainingShares) - consumedShares, 0),
    };
  });

  consumedByLot.forEach((consumedShares, lotId) => {
    const lot = lots.find((item) => item.id === lotId);
    if (!lot || consumedShares <= 0) {
      return;
    }

    const saleFees = sellShares > 0 ? Math.max(coerceFiniteNumber(trade.fees), 0) * (consumedShares / sellShares) : 0;
    saleRows.push({
      acquiredDate: lot.acquiredDate,
      assetType: "Stock",
      costBasis: stockLotCostBasisForShares(lot, consumedShares),
      fees: saleFees,
      name: `${holding.company || holding.ticker} sale`,
      notes:
        notes ||
        `Created from FIFO sale of ${sellShares.toLocaleString()} ${holding.ticker} shares.`,
      proceeds: consumedShares * Math.max(coerceFiniteNumber(trade.price), 0),
      saleGroupId,
      soldDate,
      stockLotId: lot.id,
      symbol: holding.ticker,
    });
  });

  return {
    error: undefined,
    lots: updatedLots,
    soldShares: sellShares,
    taxSales: saleRows,
  };
}

export function applyStockTradeToHolding(
  holding: StockHolding,
  trade: StockTradeInput,
) {
  const tradeShares = Math.max(coerceFiniteNumber(trade.shares), 0);
  const tradePrice = Math.max(coerceFiniteNumber(trade.price), 0);
  const tradeFees = Math.max(coerceFiniteNumber(trade.fees), 0);

  if (tradeShares <= 0) {
    return { ...holding };
  }

  if (trade.kind === "buy") {
    const nextShares = coerceFiniteNumber(holding.shares) + tradeShares;
    const nextCostBasis = stockCost(holding) + tradeShares * tradePrice + tradeFees;

    return {
      ...holding,
      averageCost: nextShares > 0 ? nextCostBasis / nextShares : 0,
      currentPrice: tradePrice > 0 ? tradePrice : holding.currentPrice,
      shares: nextShares,
    };
  }

  const sellShares = Math.min(tradeShares, coerceFiniteNumber(holding.shares));
  const nextShares = Math.max(coerceFiniteNumber(holding.shares) - sellShares, 0);

  return {
    ...holding,
    averageCost: nextShares > 0 ? holding.averageCost : 0,
    currentPrice: tradePrice > 0 ? tradePrice : holding.currentPrice,
    shares: nextShares,
  };
}

export function stockSaleTaxRecordFromTrade({
  acquiredDate,
  holding,
  notes,
  soldDate,
  trade,
}: {
  acquiredDate: string;
  holding: StockHolding;
  notes: string;
  soldDate: string;
  trade: StockTradeInput;
}): Omit<TaxAssetSale, "id"> {
  const sellShares = Math.min(
    Math.max(coerceFiniteNumber(trade.shares), 0),
    coerceFiniteNumber(holding.shares),
  );

  return {
    acquiredDate,
    assetType: "Stock",
    costBasis: sellShares * coerceFiniteNumber(holding.averageCost),
    fees: Math.max(coerceFiniteNumber(trade.fees), 0),
    name: `${holding.company || holding.ticker} sale`,
    notes,
    proceeds: sellShares * Math.max(coerceFiniteNumber(trade.price), 0),
    soldDate,
    symbol: holding.ticker,
  };
}

export function cryptoValue(holding: CryptoHolding) {
  return multiplyFinite(holding.quantity, holding.currentPrice);
}

export function cryptoCost(holding: CryptoHolding) {
  return multiplyFinite(holding.quantity, holding.averageCost);
}

export function taxAssetSaleGain(sale: TaxAssetSale) {
  return (
    coerceFiniteNumber(sale.proceeds) -
    coerceFiniteNumber(sale.costBasis) -
    coerceFiniteNumber(sale.fees)
  );
}

export function taxAssetSaleHoldingDays(sale: TaxAssetSale) {
  const acquired = parseDateInput(sale.acquiredDate);
  const sold = parseDateInput(sale.soldDate);

  if (!acquired || !sold) {
    return null;
  }

  return Math.round((sold.getTime() - acquired.getTime()) / dayInMs);
}

export function isLongTermTaxSale(sale: TaxAssetSale) {
  return (taxAssetSaleHoldingDays(sale) ?? 0) > 365;
}

export function getStandardDeduction2026(filingStatus: FilingStatus) {
  return standardDeduction2026[filingStatus];
}

export function getTaxDeductionAmount(profile: TaxProfile) {
  const standardDeduction = Math.max(
    coerceFiniteNumber(profile.standardDeductionAmount),
    0,
  );
  const itemizedDeductions = Math.max(coerceFiniteNumber(profile.itemizedDeductions), 0);

  return profile.deductionMode === "Itemized"
    ? itemizedDeductions
    : standardDeduction;
}

function taxRateFromPercent(value: number) {
  return Math.max(coerceFiniteNumber(value), 0) / 100;
}

export function estimateMarginalTax(
  taxableIncome: number,
  filingStatus: FilingStatus,
) {
  const finiteIncome = Math.max(coerceFiniteNumber(taxableIncome), 0);
  let previousLimit = 0;
  let tax = 0;

  for (const bracket of ordinaryTaxBrackets2026[filingStatus]) {
    const bracketIncome = Math.min(finiteIncome, bracket.upTo) - previousLimit;
    if (bracketIncome > 0) {
      tax += bracketIncome * bracket.rate;
    }
    if (finiteIncome <= bracket.upTo) {
      break;
    }
    previousLimit = bracket.upTo;
  }

  return tax;
}

export function estimateLongTermCapitalGainTax(
  longTermCapitalGain: number,
  ordinaryTaxableIncome: number,
  filingStatus: FilingStatus,
) {
  const thresholds = longTermCapitalGainThresholds2026[filingStatus];
  const taxableGain = Math.max(coerceFiniteNumber(longTermCapitalGain), 0);
  const ordinaryIncome = Math.max(coerceFiniteNumber(ordinaryTaxableIncome), 0);
  let remainingGain = taxableGain;
  let runningTaxableIncome = ordinaryIncome;
  let tax = 0;

  const zeroRateRoom = Math.max(thresholds.zeroRateMax - runningTaxableIncome, 0);
  const zeroRateGain = Math.min(remainingGain, zeroRateRoom);
  remainingGain -= zeroRateGain;
  runningTaxableIncome += zeroRateGain;

  const fifteenRateRoom = Math.max(
    thresholds.fifteenRateMax - runningTaxableIncome,
    0,
  );
  const fifteenRateGain = Math.min(remainingGain, fifteenRateRoom);
  tax += fifteenRateGain * 0.15;
  remainingGain -= fifteenRateGain;

  if (remainingGain > 0) {
    tax += remainingGain * 0.2;
  }

  return tax;
}

function isPotentialSelfEmploymentSource(source: IncomeSource) {
  const searchable = `${source.name} ${source.category} ${source.notes}`.toLowerCase();
  return [
    "business",
    "consult",
    "contract",
    "freelance",
    "side",
    "self",
    "1099",
  ].some((term) => searchable.includes(term));
}

function paycheckDateInTaxYear(paycheck: Paycheck, taxYear: number) {
  const payDate = parseDateInput(paycheck.payDate);
  return Boolean(payDate && payDate.getFullYear() === taxYear);
}

function addFrequency(date: Date, frequency: Frequency) {
  const nextDate = new Date(date);
  switch (frequency) {
    case "Daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "Weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "Biweekly":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "Semi-monthly":
      nextDate.setDate(nextDate.getDate() + 15);
      break;
    case "Quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "Annual":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case "Monthly":
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  return nextDate;
}

function projectedRemainingIncome(
  source: IncomeSource,
  afterDate: Date,
  taxYear: number,
) {
  const firstScheduledPay = parseDateInput(source.nextPaymentDate);
  if (!source.active || !firstScheduledPay) {
    return 0;
  }

  let payDate = new Date(firstScheduledPay);
  const yearEnd = new Date(taxYear, 11, 31);
  let guard = 0;
  while (payDate <= afterDate && guard < 400) {
    payDate = addFrequency(payDate, source.frequency);
    guard += 1;
  }

  let count = 0;
  while (payDate <= yearEnd && guard < 800) {
    if (payDate.getFullYear() === taxYear) {
      count += 1;
    }
    payDate = addFrequency(payDate, source.frequency);
    guard += 1;
  }

  return count * coerceFiniteNumber(source.amount);
}

function getProjectedOrdinaryIncome({
  data,
  paychecks,
  taxYear,
}: {
  data: FinanceData;
  paychecks: Paycheck[];
  taxYear: number;
}) {
  const sourceIds = new Set(data.incomeSources.map((source) => source.id));
  const paychecksBySource = new Map<string, Paycheck[]>();
  let standalonePaycheckGross = 0;

  paychecks.forEach((paycheck) => {
    const grossPay = coerceFiniteNumber(paycheck.grossPay);
    if (!paycheck.incomeSourceId || !sourceIds.has(paycheck.incomeSourceId)) {
      standalonePaycheckGross += grossPay;
      return;
    }

    paychecksBySource.set(paycheck.incomeSourceId, [
      ...(paychecksBySource.get(paycheck.incomeSourceId) ?? []),
      paycheck,
    ]);
  });

  const sourceIncome = data.incomeSources
    .filter((source) => source.active)
    .reduce((sum, source) => {
      const linkedPaychecks = paychecksBySource.get(source.id) ?? [];
      if (linkedPaychecks.length === 0) {
        return sum + monthlyAmount(source.amount, source.frequency) * 12;
      }

      const actualGross = linkedPaychecks.reduce(
        (total, paycheck) => total + coerceFiniteNumber(paycheck.grossPay),
        0,
      );
      const latestPayDate =
        linkedPaychecks
          .map((paycheck) => parseDateInput(paycheck.payDate))
          .filter((date): date is Date => Boolean(date))
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? new Date(taxYear, 0, 1);

      return sum + actualGross + projectedRemainingIncome(source, latestPayDate, taxYear);
    }, 0);

  return sourceIncome + standalonePaycheckGross;
}

export function calculateTaxSummary(data: FinanceData) {
  const profile = data.taxProfile;
  const taxYear = coerceFiniteNumber(profile.taxYear, new Date().getFullYear());
  const taxYearPaychecks = data.paychecks.filter((paycheck) =>
    paycheckDateInTaxYear(paycheck, taxYear),
  );
  const activeIncomeSources = data.incomeSources.filter((source) => source.active);
  const ordinaryIncome =
    taxYearPaychecks.length > 0
      ? getProjectedOrdinaryIncome({ data, paychecks: taxYearPaychecks, taxYear })
      : activeIncomeSources.reduce(
          (sum, source) => sum + monthlyAmount(source.amount, source.frequency) * 12,
          0,
        );
  const potentialSelfEmploymentIncome = activeIncomeSources
    .filter(isPotentialSelfEmploymentSource)
    .reduce((sum, source) => sum + monthlyAmount(source.amount, source.frequency) * 12, 0) +
    coerceFiniteNumber(profile.businessIncome);
  const trackedInvestmentDividends = data.investments.reduce(
    (sum, item) => sum + coerceFiniteNumber(item.dividendIncome),
    0,
  );
  const ordinaryDividendIncome =
    trackedInvestmentDividends + coerceFiniteNumber(profile.ordinaryDividends);
  const qualifiedDividendIncome = coerceFiniteNumber(profile.qualifiedDividends);
  const manualOrdinaryIncome =
    coerceFiniteNumber(profile.taxableInterest) +
    ordinaryDividendIncome +
    coerceFiniteNumber(profile.otherOrdinaryIncome) +
    coerceFiniteNumber(profile.businessIncome) +
    coerceFiniteNumber(profile.rentalRoyaltyIncome) +
    coerceFiniteNumber(profile.retirementIncome) +
    coerceFiniteNumber(profile.unemploymentIncome) +
    coerceFiniteNumber(profile.taxableSocialSecurity);
  const sales = data.taxAssetSales.map((sale) => ({
    ...sale,
    gain: taxAssetSaleGain(sale),
    holdingDays: taxAssetSaleHoldingDays(sale),
    term: isLongTermTaxSale(sale) ? "Long-term" : "Short-term",
  }));
  const shortTermGains = sales
    .filter((sale) => sale.term === "Short-term" && sale.gain > 0)
    .reduce((sum, sale) => sum + sale.gain, 0);
  const shortTermLosses = sales
    .filter((sale) => sale.term === "Short-term" && sale.gain < 0)
    .reduce((sum, sale) => sum + sale.gain, 0);
  const longTermGains = sales
    .filter((sale) => sale.term === "Long-term" && sale.gain > 0)
    .reduce((sum, sale) => sum + sale.gain, 0);
  const longTermLosses = sales
    .filter((sale) => sale.term === "Long-term" && sale.gain < 0)
    .reduce((sum, sale) => sum + sale.gain, 0);
  const netShortTerm = shortTermGains + shortTermLosses;
  const netLongTerm = longTermGains + longTermLosses;
  const capitalLossCarryover = coerceFiniteNumber(profile.capitalLossCarryover);
  const netCapitalGainBeforeCarryover = netShortTerm + netLongTerm;
  let taxableShortTermCapitalGain = Math.max(netShortTerm, 0);
  let taxableLongTermCapitalGain = Math.max(netLongTerm, 0);

  if (netShortTerm > 0 && netLongTerm < 0) {
    taxableShortTermCapitalGain = Math.max(netShortTerm + netLongTerm, 0);
  }

  if (netLongTerm > 0 && netShortTerm < 0) {
    taxableLongTermCapitalGain = Math.max(netLongTerm + netShortTerm, 0);
  }

  let remainingCarryover = Math.min(
    capitalLossCarryover,
    taxableShortTermCapitalGain + taxableLongTermCapitalGain,
  );
  const longTermCarryoverOffset = Math.min(taxableLongTermCapitalGain, remainingCarryover);
  taxableLongTermCapitalGain -= longTermCarryoverOffset;
  remainingCarryover -= longTermCarryoverOffset;
  const shortTermCarryoverOffset = Math.min(taxableShortTermCapitalGain, remainingCarryover);
  taxableShortTermCapitalGain -= shortTermCarryoverOffset;
  remainingCarryover -= shortTermCarryoverOffset;

  const capitalLossCarryoverApplied = longTermCarryoverOffset + shortTermCarryoverOffset;
  const netCapitalGain = netCapitalGainBeforeCarryover - capitalLossCarryover;

  const lossDeductionLimit =
    profile.filingStatus === "Married filing separately" ? 1500 : 3000;
  const capitalLossDeductionEstimate =
    netCapitalGain < 0 ? Math.min(Math.abs(netCapitalGain), lossDeductionLimit) : 0;
  const deductionAmount = getTaxDeductionAmount(profile);
  const standardDeduction = Math.max(coerceFiniteNumber(profile.standardDeductionAmount), 0);
  const totalAdjustments =
    coerceFiniteNumber(profile.otherAdjustments) +
    coerceFiniteNumber(profile.hsaDeduction) +
    coerceFiniteNumber(profile.iraDeduction) +
    coerceFiniteNumber(profile.studentLoanInterestDeduction) +
    coerceFiniteNumber(profile.qbiDeduction);
  const adjustedOrdinaryIncome = Math.max(
    ordinaryIncome +
      manualOrdinaryIncome +
      taxableShortTermCapitalGain -
      capitalLossDeductionEstimate -
      totalAdjustments,
    0,
  );
  const estimatedTaxableOrdinaryIncome = Math.max(
    adjustedOrdinaryIncome - deductionAmount,
    0,
  );
  const estimatedTaxableIncome =
    estimatedTaxableOrdinaryIncome + taxableLongTermCapitalGain + qualifiedDividendIncome;
  const ordinaryTaxEstimate =
    estimatedTaxableOrdinaryIncome * taxRateFromPercent(profile.ordinaryIncomeTaxRate);
  const longTermCapitalGainTaxEstimate =
    taxableLongTermCapitalGain * taxRateFromPercent(profile.longTermCapitalGainsTaxRate);
  const qualifiedDividendTaxEstimate =
    qualifiedDividendIncome * taxRateFromPercent(profile.qualifiedDividendTaxRate);
  const estimatedAgi = Math.max(
    ordinaryIncome +
      manualOrdinaryIncome +
      qualifiedDividendIncome +
      taxableShortTermCapitalGain +
      taxableLongTermCapitalGain -
      capitalLossDeductionEstimate -
      totalAdjustments,
    0,
  );
  const estimatedNetInvestmentIncome = Math.max(
    coerceFiniteNumber(profile.taxableInterest) +
      ordinaryDividendIncome +
      qualifiedDividendIncome +
      taxableShortTermCapitalGain +
      taxableLongTermCapitalGain,
    0,
  );
  const niitEstimate =
    estimatedNetInvestmentIncome * taxRateFromPercent(profile.additionalInvestmentTaxRate);
  const selfEmploymentTaxEstimate =
    potentialSelfEmploymentIncome > 0
      ? potentialSelfEmploymentIncome * taxRateFromPercent(profile.selfEmploymentTaxRate)
      : 0;
  const federalTaxBeforeCredits =
    ordinaryTaxEstimate +
    longTermCapitalGainTaxEstimate +
    qualifiedDividendTaxEstimate +
    niitEstimate +
    selfEmploymentTaxEstimate;
  const taxCredits =
    coerceFiniteNumber(profile.childTaxCredit) + coerceFiniteNumber(profile.otherTaxCredits);
  const totalEstimatedFederalTax = Math.max(federalTaxBeforeCredits - taxCredits, 0);
  const stateIncomeTaxEstimate =
    estimatedTaxableIncome * taxRateFromPercent(profile.stateIncomeTaxRate);
  const localIncomeTaxEstimate =
    estimatedTaxableIncome * taxRateFromPercent(profile.localIncomeTaxRate);
  const totalEstimatedStateLocalTax = stateIncomeTaxEstimate + localIncomeTaxEstimate;
  const totalEstimatedTax = totalEstimatedFederalTax + totalEstimatedStateLocalTax;
  const paymentsAndWithholding =
    coerceFiniteNumber(profile.federalWithholding) +
    coerceFiniteNumber(profile.estimatedPayments) +
    taxYearPaychecks.reduce(
      (sum, paycheck) => sum + coerceFiniteNumber(paycheck.federalIncomeTaxWithheld),
      0,
    );
  const stateLocalPaymentsAndWithholding =
    coerceFiniteNumber(profile.stateWithholding) +
    coerceFiniteNumber(profile.stateEstimatedPayments) +
    coerceFiniteNumber(profile.localWithholding) +
    coerceFiniteNumber(profile.localEstimatedPayments) +
    taxYearPaychecks.reduce(
      (sum, paycheck) =>
        sum +
        coerceFiniteNumber(paycheck.stateIncomeTaxWithheld) +
        coerceFiniteNumber(paycheck.localIncomeTaxWithheld),
      0,
    );
  const totalPaymentsAndWithholding =
    paymentsAndWithholding + stateLocalPaymentsAndWithholding;
  const paycheckFederalIncomeTaxWithheld = taxYearPaychecks.reduce(
    (sum, paycheck) => sum + coerceFiniteNumber(paycheck.federalIncomeTaxWithheld),
    0,
  );
  const paycheckSocialSecurityTaxWithheld = taxYearPaychecks.reduce(
    (sum, paycheck) => sum + coerceFiniteNumber(paycheck.socialSecurityTaxWithheld),
    0,
  );
  const paycheckMedicareTaxWithheld = taxYearPaychecks.reduce(
    (sum, paycheck) => sum + coerceFiniteNumber(paycheck.medicareTaxWithheld),
    0,
  );
  const paycheckAdditionalMedicareTaxWithheld = taxYearPaychecks.reduce(
    (sum, paycheck) => sum + coerceFiniteNumber(paycheck.additionalMedicareTaxWithheld),
    0,
  );
  const paycheckFicaWithheld =
    paycheckSocialSecurityTaxWithheld +
    paycheckMedicareTaxWithheld +
    paycheckAdditionalMedicareTaxWithheld;
  const paycheckStateLocalWithheld = taxYearPaychecks.reduce(
    (sum, paycheck) =>
      sum +
      coerceFiniteNumber(paycheck.stateIncomeTaxWithheld) +
      coerceFiniteNumber(paycheck.localIncomeTaxWithheld),
    0,
  );
  const paycheckOtherGovernmentWithheld = taxYearPaychecks.reduce(
    (sum, paycheck) => sum + coerceFiniteNumber(paycheck.otherGovernmentWithholding),
    0,
  );
  const paycheckOtherDeductions = taxYearPaychecks.reduce(
    (sum, paycheck) => sum + coerceFiniteNumber(paycheck.otherDeductions),
    0,
  );
  const paycheckNetPay = taxYearPaychecks.reduce(
    (sum, paycheck) => sum + coerceFiniteNumber(paycheck.netPay),
    0,
  );
  const paycheckGrossPay = taxYearPaychecks.reduce(
    (sum, paycheck) =>
      sum + coerceFiniteNumber(paycheck.grossPay),
    0,
  );

  return {
    adjustedOrdinaryIncome,
    capitalLossCarryover,
    capitalLossCarryoverApplied,
    capitalLossDeductionEstimate,
    deductionAmount,
    dividendIncome: ordinaryDividendIncome + qualifiedDividendIncome,
    estimatedAgi,
    estimatedNetInvestmentIncome,
    estimatedTaxableIncome,
    estimatedTaxableOrdinaryIncome,
    federalBalanceDue: totalEstimatedFederalTax - paymentsAndWithholding,
    federalTaxBeforeCredits,
    filingStatus: profile.filingStatus,
    longTermCapitalGainTaxEstimate,
    longTermGains,
    longTermLosses,
    manualOrdinaryIncome,
    netCapitalGain,
    netCapitalGainBeforeCarryover,
    netLongTerm,
    netShortTerm,
    niitEstimate,
    ordinaryDividendIncome,
    ordinaryIncome,
    ordinaryTaxEstimate,
    paymentsAndWithholding,
    paycheckAdditionalMedicareTaxWithheld,
    paycheckFederalIncomeTaxWithheld,
    paycheckFicaWithheld,
    paycheckGrossPay,
    paycheckMedicareTaxWithheld,
    paycheckNetPay,
    paycheckOtherDeductions,
    paycheckOtherGovernmentWithheld,
    paycheckSocialSecurityTaxWithheld,
    paycheckStateLocalWithheld,
    potentialSelfEmploymentIncome,
    qualifiedDividendIncome,
    qualifiedDividendTaxEstimate,
    selfEmploymentTaxEstimate,
    shortTermGains,
    shortTermLosses,
    standardDeduction,
    stateIncomeTaxEstimate,
    stateLocalPaymentsAndWithholding,
    localIncomeTaxEstimate,
    taxableLongTermCapitalGain,
    taxableShortTermCapitalGain,
    taxCredits,
    totalAdjustments,
    totalEstimatedFederalTax,
    totalEstimatedStateLocalTax,
    totalEstimatedTax,
    totalPaymentsAndWithholding,
    estimatedBalanceDue: totalEstimatedTax - totalPaymentsAndWithholding,
    sales,
  };
}

function taxAssetSalesForYear(data: FinanceData, taxYear: number) {
  return data.taxAssetSales.filter((sale) => {
    const soldDate = parseDateInput(sale.soldDate);
    return soldDate?.getFullYear() === taxYear;
  });
}

function taxYearPaychecksToDate(data: FinanceData, taxYear: number, now: Date) {
  return data.paychecks.filter((paycheck) => {
    const payDate = parseDateInput(paycheck.payDate);
    return payDate && payDate.getFullYear() === taxYear && payDate.getTime() <= now.getTime();
  });
}

function summarizeTaxAssetCategory(
  sales: TaxAssetSale[],
  assetType: TaxAssetType,
) {
  return sales
    .filter((sale) => sale.assetType === assetType)
    .reduce(
      (totals, sale) => {
        const gain = taxAssetSaleGain(sale);
        const termKey = isLongTermTaxSale(sale) ? "longTermGain" : "shortTermGain";

        return {
          costBasis: totals.costBasis + coerceFiniteNumber(sale.costBasis),
          count: totals.count + 1,
          fees: totals.fees + coerceFiniteNumber(sale.fees),
          longTermGain:
            totals.longTermGain + (termKey === "longTermGain" ? gain : 0),
          proceeds: totals.proceeds + coerceFiniteNumber(sale.proceeds),
          shortTermGain:
            totals.shortTermGain + (termKey === "shortTermGain" ? gain : 0),
        };
      },
      {
        costBasis: 0,
        count: 0,
        fees: 0,
        longTermGain: 0,
        proceeds: 0,
        shortTermGain: 0,
      },
    );
}

function reportStatusForYear(
  taxYear: number,
  now: Date,
  existing?: Partial<Pick<TaxYearReport, "status">>,
): TaxYearReportStatus {
  if (existing?.status === "finalized") {
    return "finalized";
  }

  if (taxYear < now.getFullYear()) {
    return "finalized";
  }

  return taxYear === now.getFullYear() ? "current" : "projected";
}

function projectionBasisForReport(
  taxYear: number,
  now: Date,
  status: TaxYearReportStatus,
): TaxProjectionBasis {
  if (status === "finalized" || taxYear < now.getFullYear()) {
    return "actual";
  }

  return taxYear > now.getFullYear() ? "projected" : "mixed";
}

export function generateTaxYearReport(
  data: FinanceData,
  taxYear: number,
  now = new Date(),
  existing?: Partial<TaxYearReport>,
): TaxYearReport {
  const nowIso = now.toISOString();
  const taxYearData = {
    ...data,
    taxAssetSales: taxAssetSalesForYear(data, taxYear),
    taxProfile: {
      ...data.taxProfile,
      taxYear,
    },
  };
  const summary = calculateTaxSummary(taxYearData);
  const stock = summarizeTaxAssetCategory(taxYearData.taxAssetSales, "Stock");
  const crypto = summarizeTaxAssetCategory(taxYearData.taxAssetSales, "Crypto");
  const actualPaychecks = taxYearPaychecksToDate(data, taxYear, now);
  const actualIncomeToDate = actualPaychecks.reduce(
    (sum, paycheck) => sum + coerceFiniteNumber(paycheck.grossPay),
    0,
  );
  const status = reportStatusForYear(taxYear, now, existing);
  const projectedAnnualIncome =
    summary.ordinaryIncome + summary.manualOrdinaryIncome + summary.qualifiedDividendIncome;
  const projectedAnnualTax = summary.totalEstimatedTax;

  return {
    actualIncomeToDate,
    adjustedGrossIncome: summary.estimatedAgi,
    adjustments: summary.totalAdjustments,
    createdAt: existing?.createdAt ?? nowIso,
    credits: summary.taxCredits,
    cryptoCostBasis: crypto.costBasis,
    cryptoFees: crypto.fees,
    cryptoLongTermGain: crypto.longTermGain,
    cryptoProceeds: crypto.proceeds,
    cryptoSalesCount: crypto.count,
    cryptoShortTermGain: crypto.shortTermGain,
    deductions: summary.deductionAmount,
    federalPayments: summary.paymentsAndWithholding,
    federalTaxEstimate: summary.totalEstimatedFederalTax,
    finalizedAt:
      status === "finalized" ? existing?.finalizedAt ?? nowIso : existing?.finalizedAt,
    id: existing?.id ?? `tax-report-${taxYear}`,
    notes: existing?.notes ?? "",
    ordinaryDividends: summary.ordinaryDividendIncome,
    ordinaryIncome: summary.ordinaryIncome,
    paycheckGrossPay: summary.paycheckGrossPay,
    projectedAnnualIncome,
    projectedAnnualTax,
    projectedDueOrRefund: summary.estimatedBalanceDue,
    projectionBasis: projectionBasisForReport(taxYear, now, status),
    qualifiedDividends: summary.qualifiedDividendIncome,
    stateLocalPayments: summary.stateLocalPaymentsAndWithholding,
    stateLocalTaxEstimate: summary.totalEstimatedStateLocalTax,
    status,
    stockCostBasis: stock.costBasis,
    stockFees: stock.fees,
    stockLongTermGain: stock.longTermGain,
    stockProceeds: stock.proceeds,
    stockSalesCount: stock.count,
    stockShortTermGain: stock.shortTermGain,
    taxableIncome: summary.estimatedTaxableIncome,
    taxableInterest: coerceFiniteNumber(data.taxProfile.taxableInterest),
    taxYear,
    totalIncome: projectedAnnualIncome,
    totalPaymentsWithholding: summary.totalPaymentsAndWithholding,
    totalTaxEstimate: summary.totalEstimatedTax,
    updatedAt: nowIso,
  };
}

function sortTaxReports(reports: TaxYearReport[]) {
  return reports.slice().sort((a, b) => b.taxYear - a.taxYear || b.updatedAt.localeCompare(a.updatedAt));
}

export function syncTaxReports(
  data: FinanceData,
  now = new Date(),
): { changed: boolean; data: FinanceData } {
  const currentTaxYear = now.getFullYear();
  let changed = data.taxProfile.taxYear !== currentTaxYear;
  const reportsByYear = new Map(data.taxReports.map((report) => [report.taxYear, report]));

  data.taxReports.forEach((report) => {
    if (report.status === "current" && report.taxYear < currentTaxYear) {
      reportsByYear.set(report.taxYear, {
        ...report,
        finalizedAt: report.finalizedAt ?? now.toISOString(),
        projectionBasis: "actual",
        status: "finalized",
        updatedAt: now.toISOString(),
      });
      changed = true;
    }
  });

  const currentReport = reportsByYear.get(currentTaxYear);
  if (!currentReport || currentReport.status !== "finalized") {
    reportsByYear.set(
      currentTaxYear,
      generateTaxYearReport(data, currentTaxYear, now, currentReport),
    );
    changed = true;
  }

  const nextReports = sortTaxReports([...reportsByYear.values()]);
  const nextData = {
    ...data,
    taxProfile: {
      ...data.taxProfile,
      taxYear: currentTaxYear,
    },
    taxReports: nextReports,
  };

  return {
    changed: changed || JSON.stringify(data.taxReports) !== JSON.stringify(nextReports),
    data: nextData,
  };
}

export function regenerateTaxYearReport(
  data: FinanceData,
  taxYear: number,
  now = new Date(),
): FinanceData {
  const existing = data.taxReports.find((report) => report.taxYear === taxYear);
  const regenerated = generateTaxYearReport(data, taxYear, now, existing);
  const reports = sortTaxReports([
    regenerated,
    ...data.taxReports.filter((report) => report.taxYear !== taxYear),
  ]);

  return {
    ...data,
    taxReports: reports,
  };
}

export function finalizeTaxYearReport(
  data: FinanceData,
  taxYear: number,
  now = new Date(),
): FinanceData {
  const existing = data.taxReports.find((report) => report.taxYear === taxYear);
  const finalized = {
    ...generateTaxYearReport(data, taxYear, now, existing),
    finalizedAt: now.toISOString(),
    projectionBasis: "actual" as const,
    status: "finalized" as const,
  };

  return {
    ...data,
    taxReports: sortTaxReports([
      finalized,
      ...data.taxReports.filter((report) => report.taxYear !== taxYear),
    ]),
  };
}

export function calculateSummary(data: FinanceData) {
  const currentYear = new Date().getFullYear();
  const ytdPaychecks = data.paychecks.filter((paycheck) =>
    paycheckDateInTaxYear(paycheck, currentYear),
  );
  const paycheckGrossYtd = ytdPaychecks.reduce(
    (total, paycheck) => total + coerceFiniteNumber(paycheck.grossPay),
    0,
  );
  const paycheckNetYtd = ytdPaychecks.reduce(
    (total, paycheck) => total + coerceFiniteNumber(paycheck.netPay),
    0,
  );
  const paycheckFederalTaxYtd = ytdPaychecks.reduce(
    (total, paycheck) => total + coerceFiniteNumber(paycheck.federalIncomeTaxWithheld),
    0,
  );
  const paycheckFicaYtd = ytdPaychecks.reduce(
    (total, paycheck) =>
      total +
      coerceFiniteNumber(paycheck.socialSecurityTaxWithheld) +
      coerceFiniteNumber(paycheck.medicareTaxWithheld) +
      coerceFiniteNumber(paycheck.additionalMedicareTaxWithheld),
    0,
  );
  const paycheckStateLocalTaxYtd = ytdPaychecks.reduce(
    (total, paycheck) =>
      total +
      coerceFiniteNumber(paycheck.stateIncomeTaxWithheld) +
      coerceFiniteNumber(paycheck.localIncomeTaxWithheld),
    0,
  );
  const manualInvested = data.investments.reduce(
    (total, item) => total + coerceFiniteNumber(item.amountInvested),
    0,
  );
  const manualInvestmentValue = data.investments.reduce(
    (total, item) => total + coerceFiniteNumber(item.currentValue),
    0,
  );
  const stockPortfolioValue = data.stocks.reduce(
    (total, item) => total + stockValue(item),
    0,
  );
  const stockCostBasis = data.stocks.reduce(
    (total, item) => total + stockCost(item),
    0,
  );
  const cryptoPortfolioValue = data.crypto.reduce(
    (total, item) => total + cryptoValue(item),
    0,
  );
  const cryptoCostBasis = data.crypto.reduce(
    (total, item) => total + cryptoCost(item),
    0,
  );
  const monthlyIncome = data.incomeSources
    .filter((source) => source.active)
    .reduce((total, source) => total + monthlyAmount(source.amount, source.frequency), 0);
  const monthlyRecurring = data.recurringPayments
    .filter((payment) => payment.status === "active")
    .reduce((total, payment) => total + monthlyAmount(payment.amount, payment.frequency), 0);
  const emergencyFund = data.savingsGoals.find((goal) => goal.isEmergency) ?? null;
  const totalSaved = data.savingsGoals.reduce(
    (total, goal) => total + coerceFiniteNumber(goal.currentSaved),
    0,
  );
  const totalCreditLimit = data.creditCards.reduce(
    (total, card) => total + coerceFiniteNumber(card.limit),
    0,
  );
  const totalCreditCurrentBalance = data.creditCards.reduce(
    (total, card) => total + creditCurrentBalance(card),
    0,
  );
  const totalCreditBalance = data.creditCards.reduce(
    (total, card) => total + creditInterestBalance(card),
    0,
  );
  const totalStatementBalance = data.creditCards.reduce(
    (total, card) => total + creditStatementBalance(card),
    0,
  );
  const totalStatementPaid = data.creditCards.reduce(
    (total, card) => total + creditStatementPaid(card),
    0,
  );
  const totalStatementRemaining = data.creditCards.reduce(
    (total, card) => total + creditStatementRemaining(card),
    0,
  );
  const activeDebts = data.debts.filter((debt) => debt.status !== "paid");
  const totalDebtBalance = activeDebts.reduce(
    (total, debt) => total + coerceFiniteNumber(debt.currentBalance),
    0,
  );
  const totalDebtOriginalBalance = activeDebts.reduce(
    (total, debt) =>
      total +
      Math.max(
        coerceFiniteNumber(debt.originalBalance),
        coerceFiniteNumber(debt.currentBalance),
      ),
    0,
  );
  const totalDebtMinimumPayment = activeDebts.reduce(
    (total, debt) => total + coerceFiniteNumber(debt.minimumPayment),
    0,
  );
  const totalInvestments =
    manualInvestmentValue + stockPortfolioValue + cryptoPortfolioValue;
  const debt = totalCreditCurrentBalance + totalDebtBalance;
  const totalNetWorth = totalInvestments + totalSaved - debt;
  const investmentCostBasis = manualInvested + stockCostBasis + cryptoCostBasis;
  const investmentGain = totalInvestments - investmentCostBasis;
  const investmentGainPercent = calculatePercent(investmentGain, investmentCostBasis);

  return {
    manualInvested,
    manualInvestmentValue,
    stockPortfolioValue,
    stockCostBasis,
    cryptoPortfolioValue,
    cryptoCostBasis,
    monthlyIncome,
    monthlyRecurring,
    emergencyFund,
    totalSaved,
    totalCreditLimit,
    totalCreditCurrentBalance,
    totalCreditBalance,
    totalStatementBalance,
    totalStatementPaid,
    totalStatementRemaining,
    totalDebtBalance,
    totalDebtOriginalBalance,
    totalDebtMinimumPayment,
    totalDebtWithCreditCards: debt,
    totalInvestments,
    totalNetWorth,
    investmentCostBasis,
    investmentGain,
    investmentGainPercent,
    creditUtilization: calculatePercent(totalCreditCurrentBalance, totalCreditLimit),
    paycheckFederalTaxYtd,
    paycheckFicaYtd,
    paycheckGrossYtd,
    paycheckNetYtd,
    paycheckStateLocalTaxYtd,
  };
}

export function getMonthlyPaycheckNetSeries(
  paychecks: Paycheck[],
  taxYear = new Date().getFullYear(),
) {
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyTotals = monthLabels.map((label) => ({ label, value: 0 }));

  paychecks.forEach((paycheck) => {
    const payDate = parseDateInput(paycheck.payDate);
    if (!payDate || payDate.getFullYear() !== taxYear) {
      return;
    }

    monthlyTotals[payDate.getMonth()].value += coerceFiniteNumber(paycheck.netPay);
  });

  const lastFilledMonth = monthlyTotals.reduce(
    (lastIndex, point, index) => (point.value > 0 ? index : lastIndex),
    -1,
  );

  return lastFilledMonth >= 0 ? monthlyTotals.slice(0, lastFilledMonth + 1) : [];
}

export function getDashboardIncomeExpenseSeries(
  data: Pick<FinanceData, "incomeSources" | "paychecks">,
  monthlyExpenses: number,
  today = new Date(),
): DashboardIncomeExpensePoint[] {
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const estimatedMonthlyIncome = data.incomeSources
    .filter((source) => source.active)
    .reduce((total, source) => total + monthlyAmount(source.amount, source.frequency), 0);
  const paycheckTotalsByMonth = data.paychecks.reduce<
    Map<string, { count: number; total: number }>
  >((totals, paycheck) => {
    const payDate = parseDateInput(paycheck.payDate);
    if (!payDate) {
      return totals;
    }

    const key = getMonthKey(payDate);
    const current = totals.get(key) ?? { count: 0, total: 0 };
    totals.set(key, {
      count: current.count + 1,
      total: current.total + coerceFiniteNumber(paycheck.netPay),
    });
    return totals;
  }, new Map());
  const series: DashboardIncomeExpensePoint[] = [];
  const startMonth = new Date(today.getFullYear(), 0, 1);
  const endMonth = new Date(today.getFullYear(), today.getMonth() + 12, 1);

  for (
    let month = startMonth;
    month.getTime() <= endMonth.getTime();
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  ) {
    const paycheckMonth = paycheckTotalsByMonth.get(getMonthKey(month));
    const isPastMonth = month.getTime() < currentMonth.getTime();

    if (isPastMonth && !paycheckMonth) {
      continue;
    }

    const isFutureMonth = month.getTime() > currentMonth.getTime();
    series.push({
      expenses: monthlyExpenses,
      income: isPastMonth ? paycheckMonth?.total ?? 0 : estimatedMonthlyIncome,
      incomeIsFutureProjection: isFutureMonth && estimatedMonthlyIncome > 0,
      label: formatDashboardFlowMonth(month, today.getFullYear()),
    });
  }

  return series.some((point) => point.income > 0 || point.expenses > 0) ? series : [];
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDashboardFlowMonth(date: Date, currentYear: number) {
  const label = date.toLocaleDateString("en-US", { month: "short" });
  return date.getFullYear() === currentYear
    ? label
    : `${label} '${String(date.getFullYear()).slice(-2)}`;
}

export function creditCurrentBalance(card: CreditCard) {
  return coerceFiniteNumber(card.currentBalance ?? card.balance);
}

export function creditInterestBalance(card: CreditCard) {
  return coerceFiniteNumber(card.interestBalance ?? card.balance);
}

export function creditStatementBalance(card: CreditCard) {
  return coerceFiniteNumber(card.statementBalance ?? card.interestBalance ?? card.balance);
}

export function creditStatementPaid(card: CreditCard) {
  return coerceFiniteNumber(card.statementPaid);
}

export function creditStatementRemaining(card: CreditCard) {
  return Math.max(creditStatementBalance(card) - creditStatementPaid(card), 0);
}

export function calculateCreditCardMinimumPayment(
  statementBalance: number,
  minimumPaymentRate: number,
) {
  const amount =
    coerceFiniteNumber(statementBalance) * Math.max(coerceFiniteNumber(minimumPaymentRate), 0) / 100;

  return Math.round(amount * 100) / 100;
}

export type CreditCardPaymentTarget = "carriedBalance" | "currentBalance" | "lastStatement";

export type CreditCardPaymentInput = {
  amount?: number;
  target?: CreditCardPaymentTarget;
  statementPayment?: number;
  interestPayment?: number;
};

export function applyCreditCardPayment(
  card: CreditCard,
  payment: CreditCardPaymentInput,
): CreditCard {
  const statementBalance = creditStatementBalance(card);
  const statementPaid = creditStatementPaid(card);
  const statementRemaining = creditStatementRemaining(card);
  const currentBalance = Math.max(creditCurrentBalance(card), 0);
  const interestBalance = Math.min(Math.max(creditInterestBalance(card), 0), currentBalance);
  const amountPayment =
    payment.amount === undefined
      ? null
      : Math.min(Math.max(coerceFiniteNumber(payment.amount), 0), currentBalance);

  if (amountPayment !== null) {
    if (payment.target === "carriedBalance") {
      const carriedPayment = Math.min(amountPayment, interestBalance);

      return {
        ...card,
        balance: Math.max(interestBalance - carriedPayment, 0),
        currentBalance: Math.max(currentBalance - carriedPayment, 0),
        interestBalance: Math.max(interestBalance - carriedPayment, 0),
      };
    }

    const statementPayment =
      payment.target === "currentBalance"
        ? Math.min(amountPayment, statementRemaining)
        : Math.min(amountPayment, statementRemaining, currentBalance);
    const remainingPayment = Math.max(amountPayment - statementPayment, 0);
    const interestBalanceAfterStatementPayment = Math.max(
      interestBalance - statementPayment,
      0,
    );
    const interestPayment = Math.min(
      payment.target === "currentBalance" ? remainingPayment : 0,
      interestBalanceAfterStatementPayment,
    );
    const nextInterestBalance = Math.max(
      interestBalanceAfterStatementPayment - interestPayment,
      0,
    );
    const appliedPayment =
      payment.target === "currentBalance" ? amountPayment : statementPayment + interestPayment;

    return {
      ...card,
      balance: nextInterestBalance,
      currentBalance: Math.max(currentBalance - appliedPayment, 0),
      interestBalance: nextInterestBalance,
      statementPaid: Math.min(statementPaid + statementPayment, statementBalance),
    };
  }

  const statementPayment = Math.min(
    Math.max(coerceFiniteNumber(payment.statementPayment), 0),
    statementRemaining,
    currentBalance,
  );
  const interestBalanceAfterStatementPayment = Math.max(
    interestBalance - statementPayment,
    0,
  );
  const currentBalanceAfterStatementPayment = Math.max(
    currentBalance - statementPayment,
    0,
  );
  const interestPayment = Math.min(
    Math.max(coerceFiniteNumber(payment.interestPayment), 0),
    interestBalanceAfterStatementPayment,
    currentBalanceAfterStatementPayment,
  );
  const totalPayment = statementPayment + interestPayment;
  const nextInterestBalance = Math.max(
    interestBalanceAfterStatementPayment - interestPayment,
    0,
  );

  return {
    ...card,
    balance: nextInterestBalance,
    currentBalance: Math.max(currentBalance - totalPayment, 0),
    interestBalance: nextInterestBalance,
    statementPaid: Math.min(statementPaid + statementPayment, statementBalance),
  };
}

export function markCreditCardStatementPaid(card: CreditCard): CreditCard {
  return applyCreditCardPayment(card, {
    statementPayment: creditStatementRemaining(card),
    interestPayment: 0,
  });
}

export type DebtPaymentInput = {
  amount?: number;
};

export function applyDebtPayment(debt: DebtAccount, payment: DebtPaymentInput): DebtAccount {
  const currentBalance = Math.max(coerceFiniteNumber(debt.currentBalance), 0);
  const amount = Math.min(Math.max(coerceFiniteNumber(payment.amount), 0), currentBalance);

  if (amount <= 0) {
    return debt;
  }

  const nextBalance = Math.max(currentBalance - amount, 0);

  return {
    ...debt,
    currentBalance: nextBalance,
    status: nextBalance <= 0 ? "paid" : "current",
  };
}

function advanceScheduledDateUntil(
  dateString: string,
  frequency: Frequency,
  baseDate: Date,
  isStillStale: (daysUntil: number) => boolean,
) {
  const firstDate = parseDateInput(dateString);
  if (!firstDate) {
    return { changed: false, value: dateString };
  }

  if (frequency === "Semi-monthly") {
    const searchEnd = addMonthsClamped(baseDate, 24);
    const nextOccurrence = getSemiMonthlyOccurrencesInRange(
      startOfLocalDay(firstDate),
      startOfLocalDay(firstDate),
      searchEnd,
    ).find((occurrence) => {
      const daysUntil = getDaysUntilDate(formatDateInput(occurrence), baseDate);
      return daysUntil !== null && !isStillStale(daysUntil);
    });

    if (!nextOccurrence) {
      return { changed: false, value: dateString };
    }

    const value = formatDateInput(nextOccurrence);
    return { changed: value !== dateString, value };
  }

  let changed = false;
  let nextDate = firstDate;
  let steps = 0;
  let daysUntilNext = getDaysUntilDate(formatDateInput(nextDate), baseDate);

  while (daysUntilNext !== null && isStillStale(daysUntilNext)) {
    steps += 1;
    nextDate = addFrequencyDate(firstDate, frequency, steps);
    changed = true;
    daysUntilNext = getDaysUntilDate(formatDateInput(nextDate), baseDate);
  }

  return { changed, value: formatDateInput(nextDate) };
}

export function advanceScheduledDatePastDate(
  dateString: string,
  frequency: Frequency,
  baseDate = new Date(),
  includeToday = false,
) {
  return advanceScheduledDateUntil(
    dateString,
    frequency,
    baseDate,
    (daysUntilNext) => (includeToday ? daysUntilNext <= 0 : daysUntilNext < 0),
  ).value;
}

function advanceMonthlyDateAfter(dateString: string, afterDate: Date) {
  let nextDate = parseDateInput(dateString);
  if (!nextDate) {
    return { changed: false, value: dateString };
  }

  let changed = false;
  while (nextDate.getTime() <= afterDate.getTime()) {
    nextDate = addMonthsClamped(nextDate, 1);
    changed = true;
  }

  return { changed, value: formatDateInput(nextDate) };
}

export function advanceCreditCardCycle(
  card: CreditCard,
  baseDate = new Date(),
): { card: CreditCard; changed: boolean } {
  let nextCard = card;
  let changed = false;
  const statementRemaining = creditStatementRemaining(card);
  const statementIsPaid = statementRemaining <= 0;
  const closingDate = parseDateInput(card.statementClosingDate);
  const closingDays = getDaysUntilDate(card.statementClosingDate, baseDate);

  if (closingDate && closingDays !== null && closingDays <= 0) {
    if (statementIsPaid) {
      const capturedStatementBalance = creditCurrentBalance(card);
      nextCard = {
        ...nextCard,
        statementBalance: capturedStatementBalance,
        statementPaid: 0,
      };
      changed ||= capturedStatementBalance !== card.statementBalance || card.statementPaid !== 0;

      const advancedDueAfterClosing = advanceMonthlyDateAfter(nextCard.dueDate, closingDate);
      if (advancedDueAfterClosing.changed) {
        nextCard = {
          ...nextCard,
          dueDate: advancedDueAfterClosing.value,
        };
        changed = true;
      }
    }

    const advancedClosing = advanceScheduledDateUntil(
      nextCard.statementClosingDate,
      "Monthly",
      baseDate,
      (daysUntilNext) => daysUntilNext <= 0,
    );
    if (advancedClosing.changed) {
      nextCard = {
        ...nextCard,
        statementClosingDate: advancedClosing.value,
      };
      changed = true;
    }
  }

  if (statementIsPaid) {
    const advancedDue = advanceScheduledDateUntil(
      nextCard.dueDate,
      "Monthly",
      baseDate,
      (daysUntilNext) => daysUntilNext < 0,
    );
    if (advancedDue.changed) {
      nextCard = {
        ...nextCard,
        dueDate: advancedDue.value,
      };
      changed = true;
    }
  }

  return { card: nextCard, changed };
}

export function advanceDebtScheduleAfterPayment(
  debt: DebtAccount,
  baseDate = new Date(),
) {
  if (debt.status === "paid") {
    return debt;
  }

  return {
    ...debt,
    autopayDate: debt.autopay
      ? advanceScheduledDatePastDate(debt.autopayDate || debt.dueDate, "Monthly", baseDate, true)
      : debt.autopayDate,
    dueDate: advanceScheduledDatePastDate(debt.dueDate, debt.paymentFrequency, baseDate, true),
  };
}

export function advanceFinanceSchedules(
  data: FinanceData,
  baseDate = new Date(),
): { data: FinanceData; changed: boolean } {
  const cycled = advanceCreditCardCycles(data, baseDate);
  let nextData = cycled.data;
  let changed = cycled.changed;

  const incomeSources = nextData.incomeSources.map((source) => {
    if (!source.active) {
      return source;
    }

    const nextPaymentDate = advanceScheduledDatePastDate(
      source.nextPaymentDate,
      source.frequency,
      baseDate,
    );

    if (nextPaymentDate === source.nextPaymentDate) {
      return source;
    }

    changed = true;
    return { ...source, nextPaymentDate };
  });

  if (incomeSources.some((source, index) => source !== nextData.incomeSources[index])) {
    nextData = { ...nextData, incomeSources };
  }

  const recurringPayments = nextData.recurringPayments.map((payment) => {
    if (payment.status !== "active") {
      return payment;
    }

    const nextChargeDate = advanceScheduledDatePastDate(
      payment.nextChargeDate,
      payment.frequency,
      baseDate,
    );

    if (nextChargeDate === payment.nextChargeDate) {
      return payment;
    }

    changed = true;
    return { ...payment, nextChargeDate };
  });

  if (recurringPayments.some((payment, index) => payment !== nextData.recurringPayments[index])) {
    nextData = { ...nextData, recurringPayments };
  }

  const debts = nextData.debts.map((debt) => {
    if (debt.status === "paid" || !debt.autopay) {
      return debt;
    }

    const nextDebt = {
      ...debt,
      autopayDate: advanceScheduledDatePastDate(
        debt.autopayDate || debt.dueDate,
        "Monthly",
        baseDate,
      ),
      dueDate: advanceScheduledDatePastDate(debt.dueDate, debt.paymentFrequency, baseDate),
    };

    if (nextDebt.autopayDate === debt.autopayDate && nextDebt.dueDate === debt.dueDate) {
      return debt;
    }

    changed = true;
    return nextDebt;
  });

  if (debts.some((debt, index) => debt !== nextData.debts[index])) {
    nextData = { ...nextData, debts };
  }

  return { changed, data: changed ? nextData : data };
}

export function advanceCreditCardCycles(
  data: FinanceData,
  baseDate = new Date(),
): { data: FinanceData; changed: boolean } {
  let changed = false;
  const creditCards = data.creditCards.map((card) => {
    const result = advanceCreditCardCycle(card, baseDate);
    changed ||= result.changed;
    return result.card;
  });

  return {
    changed,
    data: changed
      ? {
          ...data,
          creditCards,
        }
      : data,
  };
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function removeDemoFinanceData(data: FinanceData): FinanceData {
  return {
    ...data,
    investments: removeDemoItems(data.investments, mockFinanceData.investments),
    stocks: removeDemoItems(data.stocks, mockFinanceData.stocks),
    stockLots: removeDemoItems(data.stockLots, mockFinanceData.stockLots),
    crypto: removeDemoItems(data.crypto, mockFinanceData.crypto),
    incomeSources: removeDemoItems(data.incomeSources, mockFinanceData.incomeSources),
    paychecks: data.paychecks,
    savingsGoals: removeDemoItems(data.savingsGoals, mockFinanceData.savingsGoals),
    creditCards: removeDemoItems(data.creditCards, mockFinanceData.creditCards),
    debts: removeDemoItems(data.debts, mockFinanceData.debts),
    debtPayments: data.debtPayments,
    creditScoreHistory: removeDemoItems(
      data.creditScoreHistory,
      mockFinanceData.creditScoreHistory,
    ),
    recurringPayments: removeDemoItems(
      data.recurringPayments,
      mockFinanceData.recurringPayments,
    ),
    taxAssetSales: removeDemoItems(data.taxAssetSales, mockFinanceData.taxAssetSales),
    incomeExpenseHistory: [],
    netWorthHistory: [],
    taxProfile: taxProfileMatchesDemo(data.taxProfile)
      ? {
          ...data.taxProfile,
          estimatedPayments: 0,
          federalWithholding: 0,
          itemizedDeductions: 0,
          otherAdjustments: 0,
        }
      : data.taxProfile,
  };
}

export function hasUserCreatedFinanceData(data: FinanceData) {
  return (
    hasUserCreatedItems(data.investments, mockFinanceData.investments) ||
    hasUserCreatedItems(data.stocks, mockFinanceData.stocks) ||
    hasUserCreatedItems(data.stockLots, mockFinanceData.stockLots) ||
    hasUserCreatedItems(data.crypto, mockFinanceData.crypto) ||
    hasUserCreatedItems(data.incomeSources, mockFinanceData.incomeSources) ||
    data.paychecks.length > 0 ||
    hasUserCreatedItems(data.savingsGoals, mockFinanceData.savingsGoals) ||
    hasUserCreatedItems(data.creditCards, mockFinanceData.creditCards) ||
    hasUserCreatedItems(data.debts, mockFinanceData.debts) ||
    data.debtPayments.length > 0 ||
    hasUserCreatedItems(data.creditScoreHistory, mockFinanceData.creditScoreHistory) ||
    hasUserCreatedItems(data.recurringPayments, mockFinanceData.recurringPayments) ||
    hasUserCreatedItems(data.taxAssetSales, mockFinanceData.taxAssetSales)
  );
}

export function hasDemoFinanceData(data: FinanceData) {
  return (
    hasDemoItems(data.investments, mockFinanceData.investments) ||
    hasDemoItems(data.stocks, mockFinanceData.stocks) ||
    hasDemoItems(data.stockLots, mockFinanceData.stockLots) ||
    hasDemoItems(data.crypto, mockFinanceData.crypto) ||
    hasDemoItems(data.incomeSources, mockFinanceData.incomeSources) ||
    hasDemoItems(data.savingsGoals, mockFinanceData.savingsGoals) ||
    hasDemoItems(data.creditCards, mockFinanceData.creditCards) ||
    hasDemoItems(data.debts, mockFinanceData.debts) ||
    hasDemoItems(data.creditScoreHistory, mockFinanceData.creditScoreHistory) ||
    hasDemoItems(data.recurringPayments, mockFinanceData.recurringPayments) ||
    hasDemoItems(data.taxAssetSales, mockFinanceData.taxAssetSales) ||
    historyMatchesDemo(data.incomeExpenseHistory, mockFinanceData.incomeExpenseHistory) ||
    historyMatchesDemo(data.netWorthHistory, mockFinanceData.netWorthHistory) ||
    taxProfileMatchesDemo(data.taxProfile)
  );
}

function removeDemoItems<T extends { id: string }>(items: T[], demoItems: T[]) {
  const demoIds = new Set(demoItems.map((item) => item.id));
  const demoRecords = new Set(demoItems.map((item) => recordWithoutId(item)));
  return items.filter(
    (item) => !demoIds.has(item.id) && !demoRecords.has(recordWithoutId(item)),
  );
}

function hasDemoItems<T extends { id: string }>(items: T[], demoItems: T[]) {
  const demoIds = new Set(demoItems.map((item) => item.id));
  const demoRecords = new Set(demoItems.map((item) => recordWithoutId(item)));
  return items.some(
    (item) => demoIds.has(item.id) || demoRecords.has(recordWithoutId(item)),
  );
}

function hasUserCreatedItems<T extends { id: string }>(items: T[], demoItems: T[]) {
  const demoIds = new Set(demoItems.map((item) => item.id));
  const demoRecords = new Set(demoItems.map((item) => recordWithoutId(item)));
  return items.some(
    (item) => !demoIds.has(item.id) && !demoRecords.has(recordWithoutId(item)),
  );
}

function historyMatchesDemo<T>(history: T[], demoHistory: T[]) {
  return JSON.stringify(history) === JSON.stringify(demoHistory);
}

function recordWithoutId<T extends { id: string }>(item: T) {
  const { id: _id, ...record } = item;
  void _id;
  return JSON.stringify(record);
}

function taxProfileMatchesDemo(profile: TaxProfile) {
  return JSON.stringify(profile) === JSON.stringify(mockFinanceData.taxProfile);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseFiniteNumber(value: unknown) {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/[$,%\s]/g, "").replace(/,/g, "");
  if (normalized === "") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function coerceFiniteNumber(value: unknown, fallback = 0) {
  return parseFiniteNumber(value) ?? fallback;
}

export function multiplyFinite(left: unknown, right: unknown) {
  return coerceFiniteNumber(left) * coerceFiniteNumber(right);
}

export function safeRatio(numerator: unknown, denominator: unknown) {
  const finiteDenominator = coerceFiniteNumber(denominator);
  if (finiteDenominator <= 0) {
    return 0;
  }

  return coerceFiniteNumber(numerator) / finiteDenominator;
}

export function calculatePercent(numerator: unknown, denominator: unknown) {
  return safeRatio(numerator, denominator) * 100;
}

export function savingsGoalProgressPercent(goal: SavingsGoal | null | undefined) {
  if (!goal) {
    return 0;
  }

  return calculatePercent(goal.currentSaved, goal.targetAmount);
}

export function remainingSavingsAmount(goal: SavingsGoal | null | undefined) {
  if (!goal) {
    return 0;
  }

  return Math.max(
    coerceFiniteNumber(goal.targetAmount) - coerceFiniteNumber(goal.currentSaved),
    0,
  );
}

export function getCurrencyFractionDigits(currency: CurrencyCode) {
  return currency === "JPY" ? 0 : 2;
}

export function getCurrencySymbol(currency: CurrencyCode) {
  const parts = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).formatToParts(0);

  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

export function currencyAmountToMinorUnits(
  amount: unknown,
  currency: CurrencyCode = defaultCurrency,
) {
  const multiplier = 10 ** getCurrencyFractionDigits(currency);
  return Math.round(coerceFiniteNumber(amount) * multiplier);
}

export function currencyMinorUnitsToAmount(
  minorUnits: unknown,
  currency: CurrencyCode = defaultCurrency,
) {
  const divisor = 10 ** getCurrencyFractionDigits(currency);
  return coerceFiniteNumber(minorUnits) / divisor;
}
