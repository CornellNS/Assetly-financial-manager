"use client";

import {
  AlertTriangle,
  Banknote,
  Bell,
  Bot,
  CalendarClock,
  Calculator,
  ChartPie,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Landmark,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Menu,
  Moon,
  Plus,
  PiggyBank,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  createContext,
  FormEvent,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  advanceCreditCardCycles,
  advanceDebtScheduleAfterPayment,
  advanceFinanceSchedules,
  applyCreditCardPayment,
  applyDebtPayment,
  calculateCreditCardMinimumPayment,
  calculateSummary,
  calculateTaxSummary,
  collectionLabels,
  CollectionKey,
  createStockLotFromBuy,
  createId,
  creditCurrentBalance,
  creditInterestBalance,
  creditStatementBalance,
  creditStatementPaid,
  creditStatementRemaining,
  CreditCardPaymentTarget,
  cryptoCost,
  cryptoValue,
  CurrencyCode,
  calculatePercent,
  consolidateStockHoldingsByTicker,
  defaultGraphColor,
  defaultGraphSecondaryColor,
  defaultWorkspaceName,
  FinanceData,
  formatDateInput,
  formatCurrency,
  formatPercent,
  getDefaultDateInput,
  getDashboardIncomeExpenseSeries,
  getDaysUntilDate,
  getDueDateStatus,
  getMonthlyPaycheckNetSeries,
  getWeeklyReportCreditCards,
  getWeeklyReportEvents,
  getWeeklyReportFlowRows,
  getWeeklyReportWindow,
  hasDemoFinanceData,
  graphColorOptions,
  GraphColor,
  mockFinanceData,
  monthlyAmount,
  parseDateInput,
  parseFiniteNumber,
  recalculateStockHoldingFromLots,
  regenerateTaxYearReport,
  remainingSavingsAmount,
  removeDemoFinanceData,
  savingsGoalProgressPercent,
  sellStockLotsFifo,
  stackStockPurchase,
  stockCost,
  stockLotGain,
  stockLotMarketValue,
  StockTradeKind,
  stockValue,
  syncTaxReports,
  taxAssetSaleGain,
  type WeeklyReportEvent,
  type WeeklyReportFlowRow,
} from "@/lib/finance-data";
import {
  defaultFinanceAgentSettings,
  financeAgentSettingsStorageKey,
  financeAgentProviderPresets,
  getFinanceAgentProviderPreset,
  normalizeFinanceAgentSettingsJson,
  readFinanceAgentAuditLog,
  writeFinanceAgentAuditEntry,
  type FinanceAgentAction,
  type FinanceAgentProposal,
  type FinanceAgentProviderPreset,
  type FinanceAgentSettings,
} from "@/lib/finance-agent";
import {
  applyMarketDataRefreshResult,
  coingeckoDocsUrl,
  coingeckoSettingsStorageKey,
  coingeckoSignupUrl,
  createMarketDataRefreshResult,
  defaultCoinGeckoSettings,
  defaultFinnhubSettings,
  finnhubDocsUrl,
  finnhubSettingsStorageKey,
  finnhubSignupUrl,
  getStaleMarketDataAssets,
  normalizeCoinGeckoSettingsJson,
  normalizeFinnhubSettingsJson,
  sortMarketDataAssetsByOldestUpdate,
  type CoinGeckoSettings,
  type FinnhubSettings,
  type MarketDataRefreshResult,
} from "@/lib/market-data";
import {
  defaultFinanceStorageKey,
  readStoredFinanceData as readFinanceStorage,
  writeStoredFinanceData,
} from "@/lib/finance-storage";
import {
  cleanupLocalWorkspaceStorage,
  weeklyReportSnapshotStorageKey,
} from "@/lib/storage-cleanup";
import { normalizeFinanceData } from "@/lib/finance-validation";
import {
  FinanceAgentPanel,
  FormattedAgentText,
  type FinanceAgentPromptRequest,
} from "./finance-agent-panel";
import { DonutChart, IncomeExpenseChart, LineChart, Sparkline } from "./charts";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  cn,
  EmptyState,
  Field,
  ProgressBar,
} from "./ui-kit";
import { controlFocusVisibleRing, focusVisibleRing } from "@/lib/theme";

type SectionKey =
  | "dashboard"
  | "investing"
  | "stocks"
  | "crypto"
  | "income"
  | "tax"
  | "savings"
  | "cards"
  | "recurring"
  | "netWorth"
  | "weeklyReport"
  | "settings";

type EditableItem = FinanceData[CollectionKey][number];
type ModalState = { collection: CollectionKey; item?: EditableItem } | null;
type StockTradeModalState = {
  kind: StockTradeKind;
  stock: FinanceData["stocks"][number];
} | null;
type PaycheckModalState = { item?: FinanceData["paychecks"][number] } | null;
type StockLotModalState = { item: FinanceData["stockLots"][number] } | null;
type CreditCardPaymentModalState = {
  card: FinanceData["creditCards"][number];
} | null;
type DebtPaymentModalState = {
  debt: FinanceData["debts"][number];
} | null;
type CreditScoreModalState = {
  entry?: FinanceData["creditScoreHistory"][number];
} | null;
type MarketRefreshAssetKind = "stock" | "crypto";
type QuickFinancialEntryAction =
  | "cryptoPurchase"
  | "debtPayment"
  | "income"
  | "stockPurchase";
type MarketRefreshStatus = {
  message: string;
  tone: "green" | "amber" | "red";
};
type WeeklyReportSnapshot = {
  generatedAt: string;
  weekEndDate: string;
  weekStartDate: string;
};
type NoticeTone = "amber" | "blue";
type NoticeRecord = {
  id: string;
  text: string;
  title: string;
  tone: NoticeTone;
};
type NoticeCenterState = {
  dismissNotice: (notice: NoticeRecord) => void;
  dismissedIds: Set<string>;
  dismissedNotices: NoticeRecord[];
  registerNotice: (notice: NoticeRecord) => void;
  restoreAllNotices: () => void;
  restoreNotice: (id: string) => void;
};
type CreditCardPaymentDraft = {
  amount?: number;
  target?: CreditCardPaymentTarget;
  statementPayment?: number;
  interestPayment?: number;
};
type DebtPaymentDraft = {
  amount?: number;
};
type PaycheckSavePayload = {
  incomeSource?: FinanceData["incomeSources"][number];
  paycheck: FinanceData["paychecks"][number];
};
type StockTradeDraft = {
  acquiredDate: string;
  addTaxRecord: boolean;
  broker: string;
  dateIsEstimate: boolean;
  fees: number;
  kind: StockTradeKind;
  notes: string;
  price: number;
  shares: number;
  tradeDate: string;
};

type TaxPlannerTab = "estimate" | "reports";
type WeeklyReportTab = "calendar" | "cards" | "flow" | "market" | "upcoming";
type DebtChartMode = "past" | "projected";
type DebtHistoryRange = "1m" | "1y" | "all";

const storageKey = defaultFinanceStorageKey;
const themeStorageKey = "ledger-room-theme";
const dismissedNoticeStorageKey = "ledger-room-dismissed-notices";
const NoticeCenterContext = createContext<NoticeCenterState | null>(null);

type ThemeMode = "light" | "dark";
type DateWindow = "all" | "overdue" | "next7" | "next30";
type ChartPalette = {
  expenseStripe: string;
  expenses: GraphColor;
  primary: GraphColor;
  secondary: GraphColor;
  tertiary: string;
  quaternary: string;
};

const graphStripeColors: Record<GraphColor, string> = {
  "#3f8ea5": "#a9d6df",
  "#4d9a8b": "#b4ddd5",
  "#4f75c7": "#bacaf0",
  "#6fa47b": "#bee0c5",
  "#8b7ac6": "#cfc5ef",
  "#8e989f": "#d5dbdf",
  "#8ea45c": "#d8e4b7",
  "#a55fa5": "#ddb9dd",
  "#c87969": "#efc5bd",
  "#d5a34a": "#f0dcae",
  "#d86f51": "#f3c0af",
};

function pickChartAccentColor(excluded: Set<GraphColor>, index: number) {
  const availableColors = graphColorOptions
    .map((option) => option.value)
    .filter((value) => !excluded.has(value));
  return availableColors[index % availableColors.length] ?? defaultGraphColor;
}

function getChartPalette(
  graphPrimaryColor: GraphColor | undefined,
  graphSecondaryColor: GraphColor | undefined,
): ChartPalette {
  const primary = graphPrimaryColor ?? defaultGraphColor;
  const secondary = graphSecondaryColor ?? defaultGraphSecondaryColor;
  const excluded = new Set<GraphColor>([primary, secondary]);

  return {
    expenseStripe: graphStripeColors[secondary],
    expenses: secondary,
    primary,
    quaternary: pickChartAccentColor(excluded, 1),
    secondary,
    tertiary: pickChartAccentColor(excluded, 0),
  };
}

function getWorkspaceName(workspace: FinanceData["workspace"]) {
  return workspace.name.trim() || defaultWorkspaceName;
}

const sectionHashes: Record<SectionKey, string> = {
  dashboard: "dashboard",
  investing: "investing",
  stocks: "stocks",
  crypto: "crypto",
  income: "income",
  tax: "tax",
  savings: "savings",
  cards: "cards",
  recurring: "recurring",
  netWorth: "net-worth",
  weeklyReport: "weekly-report",
  settings: "settings",
};

type NavItem = {
  key: SectionKey;
  label: string;
  icon: ReactNode;
  collection?: CollectionKey;
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { key: "weeklyReport", label: "Weekly Report", icon: <CalendarClock size={16} /> },
  { key: "investing", label: "Investing", icon: <ChartPie size={16} />, collection: "investments" },
  { key: "stocks", label: "Stocks", icon: <LineChartIcon size={16} />, collection: "stocks" },
  { key: "crypto", label: "Crypto", icon: <Coins size={16} />, collection: "crypto" },
  { key: "income", label: "Income", icon: <Banknote size={16} />, collection: "incomeSources" },
  { key: "tax", label: "Tax Planner", icon: <FileText size={16} />, collection: "taxAssetSales" },
  { key: "savings", label: "Savings", icon: <PiggyBank size={16} />, collection: "savingsGoals" },
  { key: "cards", label: "Debt", icon: <CreditCard size={16} />, collection: "creditCards" },
  { key: "recurring", label: "Recurring", icon: <ReceiptText size={16} />, collection: "recurringPayments" },
  { key: "netWorth", label: "Net Worth", icon: <WalletCards size={16} /> },
  { key: "settings", label: "Settings", icon: <Settings size={16} /> },
];

type FormField = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "checkbox";
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
};

type FormConfig = {
  collection: CollectionKey;
  title: string;
  prefix: string;
  defaults: Record<string, string | number | boolean>;
  fields: FormField[];
};

const frequencies = [
  "Daily",
  "Weekly",
  "Biweekly",
  "Semi-monthly",
  "Monthly",
  "Quarterly",
  "Annual",
];
const recurringCategories = [
  "Software",
  "Insurance",
  "Phone",
  "Rent",
  "Car",
  "Entertainment",
  "Business",
  "Other",
];
const debtTypes = [
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
const debtStatuses = ["current", "paid"];

const formConfigs: Record<CollectionKey, FormConfig> = {
  investments: {
    collection: "investments",
    title: "Investment",
    prefix: "inv",
    defaults: {
      name: "",
      type: "Retirement",
      amountInvested: 0,
      currentValue: 0,
      dividendIncome: 0,
      notes: "",
    },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "type", label: "Type", type: "text", required: true },
      { name: "amountInvested", label: "Amount invested", type: "number", required: true, min: 0, max: 1_000_000_000 },
      { name: "currentValue", label: "Current value", type: "number", required: true, min: 0, max: 1_000_000_000 },
      { name: "dividendIncome", label: "Dividend income", type: "number", required: true, min: 0, max: 100_000_000 },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  stocks: {
    collection: "stocks",
    title: "Stock Purchase",
    prefix: "stk",
    defaults: {
      ticker: "",
      company: "",
      shares: "",
      averageCost: "",
      currentPrice: "",
      acquiredDate: getDefaultDateInput({ months: -12 }),
      initialFees: "",
      broker: "",
      dateIsEstimate: false,
      notes: "",
    },
    fields: [
      { name: "ticker", label: "Ticker", type: "text", required: true },
      { name: "company", label: "Company name", type: "text", required: true },
      { name: "shares", label: "Shares purchased", type: "number", required: true, min: 0.000001, max: 1_000_000_000, step: "0.0001" },
      { name: "averageCost", label: "Purchase price per share", type: "number", required: true, min: 0.000001, max: 1_000_000_000, step: "0.01" },
      { name: "currentPrice", label: "Current market price", type: "number", required: true, min: 0.000001, max: 1_000_000_000, step: "0.01" },
      { name: "acquiredDate", label: "Purchase date", type: "date", required: true },
      { name: "initialFees", label: "Purchase fees", type: "number", min: 0, max: 100_000_000, step: "0.01" },
      { name: "broker", label: "Broker / account", type: "text" },
      { name: "dateIsEstimate", label: "Purchase date is estimate", type: "checkbox" },
      { name: "notes", label: "Purchase notes", type: "textarea" },
    ],
  },
  crypto: {
    collection: "crypto",
    title: "Crypto Holding",
    prefix: "cry",
    defaults: {
      coin: "",
      symbol: "",
      quantity: "",
      averageCost: "",
      currentPrice: "",
      notes: "",
    },
    fields: [
      { name: "coin", label: "Coin", type: "text", required: true },
      { name: "symbol", label: "Symbol", type: "text", required: true },
      { name: "quantity", label: "Quantity", type: "number", required: true, min: 0, max: 1_000_000_000, step: "0.000001" },
      { name: "averageCost", label: "Average cost", type: "number", required: true, min: 0, max: 1_000_000_000, step: "0.01" },
      { name: "currentPrice", label: "Current price", type: "number", required: true, min: 0, max: 1_000_000_000, step: "0.01" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  incomeSources: {
    collection: "incomeSources",
    title: "Income Source",
    prefix: "inc",
    defaults: {
      name: "",
      amount: 0,
      frequency: "Monthly",
      category: "Employment",
      nextPaymentDate: "2026-06-01",
      active: true,
      notes: "",
    },
    fields: [
      { name: "name", label: "Source name", type: "text", required: true },
      { name: "amount", label: "Amount", type: "number", required: true, min: 0, max: 100_000_000 },
      { name: "frequency", label: "Frequency", type: "select", options: frequencies, required: true },
      { name: "category", label: "Category", type: "text", required: true },
      { name: "nextPaymentDate", label: "Next payment date", type: "date", required: true },
      { name: "active", label: "Active", type: "checkbox" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  savingsGoals: {
    collection: "savingsGoals",
    title: "Savings Goal",
    prefix: "sav",
    defaults: {
      name: "",
      currentSaved: 0,
      targetAmount: 0,
      monthlyContribution: 0,
      estimatedCompletionDate: "2026-12-01",
      isEmergency: false,
      notes: "",
    },
    fields: [
      { name: "name", label: "Goal name", type: "text", required: true },
      { name: "currentSaved", label: "Current saved", type: "number", required: true, min: 0, max: 100_000_000 },
      { name: "targetAmount", label: "Target amount", type: "number", required: true, min: 1, max: 100_000_000 },
      { name: "monthlyContribution", label: "Monthly contribution", type: "number", required: true, min: 0, max: 100_000_000 },
      { name: "estimatedCompletionDate", label: "Estimated completion date", type: "date", required: true },
      { name: "isEmergency", label: "Emergency fund", type: "checkbox" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  creditCards: {
    collection: "creditCards",
    title: "Credit Card",
    prefix: "card",
    defaults: {
      cardName: "",
      issuer: "",
      limit: 0,
      balance: 0,
      currentBalance: 0,
      interestBalance: 0,
      statementBalance: 0,
      statementPaid: 0,
      statementClosingDate: "2026-05-15",
      dueDate: "2026-06-01",
      minimumPaymentRate: 0,
      minimumPayment: 0,
      apr: 0,
      autopay: false,
      autopayDate: "",
      rewardsType: "Cash back",
      notes: "",
    },
    fields: [
      { name: "cardName", label: "Card name", type: "text", required: true },
      { name: "issuer", label: "Issuer", type: "text", required: true },
      { name: "limit", label: "Limit", type: "number", required: true, min: 1, max: 100_000_000 },
      { name: "currentBalance", label: "Current balance", type: "number", required: true, min: 0, max: 100_000_000 },
      { name: "statementBalance", label: "Last statement balance", type: "number", required: true, min: 0, max: 100_000_000 },
      { name: "statementPaid", label: "Paid toward statement", type: "number", required: true, min: 0, max: 100_000_000 },
      { name: "interestBalance", label: "Carried / interest balance", type: "number", required: true, min: 0, max: 100_000_000 },
      { name: "statementClosingDate", label: "Statement closing date", type: "date", required: true },
      { name: "dueDate", label: "Payment due date", type: "date", required: true },
      { name: "autopay", label: "Autopay enabled", type: "checkbox" },
      { name: "autopayDate", label: "Autopay date", type: "date" },
      { name: "minimumPaymentRate", label: "Minimum payment rate (%)", type: "number", required: true, min: 0, max: 100, step: "0.01" },
      { name: "apr", label: "APR", type: "number", required: true, min: 0, max: 100, step: "0.01" },
      { name: "rewardsType", label: "Rewards type", type: "text", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  debts: {
    collection: "debts",
    title: "Debt",
    prefix: "debt",
    defaults: {
      name: "",
      type: "Other",
      lender: "",
      loanDate: "",
      currentBalance: 0,
      originalBalance: 0,
      apr: 0,
      minimumPayment: 0,
      dueDate: "2026-06-01",
      paymentFrequency: "Monthly",
      payoffDate: "",
      status: "current",
      autopay: false,
      autopayDate: "",
      collectorName: "",
      originalCreditor: "",
      disputeDeadline: "",
      notes: "",
    },
    fields: [
      { name: "name", label: "Debt name", type: "text", required: true },
      { name: "type", label: "Debt type", type: "select", options: debtTypes, required: true },
      { name: "lender", label: "Lender / servicer / creditor", type: "text", required: true },
      { name: "loanDate", label: "Loan taken date", type: "date", required: true },
      { name: "currentBalance", label: "Current balance", type: "number", required: true, min: 0, max: 1_000_000_000, step: "0.01" },
      { name: "originalBalance", label: "Original balance", type: "number", required: true, min: 0, max: 1_000_000_000, step: "0.01" },
      { name: "apr", label: "Interest rate / APR", type: "number", required: true, min: 0, max: 100, step: "0.01" },
      { name: "minimumPayment", label: "Monthly payment", type: "number", required: true, min: 0, max: 100_000_000, step: "0.01" },
      { name: "dueDate", label: "Payment due date", type: "date", required: true },
      { name: "paymentFrequency", label: "Payment frequency", type: "select", options: frequencies, required: true },
      { name: "payoffDate", label: "Target payoff date", type: "date" },
      { name: "status", label: "Status", type: "select", options: debtStatuses, required: true },
      { name: "autopay", label: "Autopay enabled", type: "checkbox" },
      { name: "autopayDate", label: "Autopay date", type: "date" },
      { name: "collectorName", label: "Collector name", type: "text" },
      { name: "originalCreditor", label: "Original creditor", type: "text" },
      { name: "disputeDeadline", label: "Dispute deadline", type: "date" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  recurringPayments: {
    collection: "recurringPayments",
    title: "Recurring Payment",
    prefix: "rec",
    defaults: {
      name: "",
      amount: 0,
      frequency: "Monthly",
      category: "Software",
      nextChargeDate: "2026-06-01",
      paymentMethod: "",
      status: "active",
      notes: "",
    },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "amount", label: "Amount", type: "number", required: true, min: 0, max: 10_000_000, step: "0.01" },
      { name: "frequency", label: "Billing frequency", type: "select", options: frequencies, required: true },
      { name: "category", label: "Category", type: "select", options: recurringCategories, required: true },
      { name: "nextChargeDate", label: "Next charge date", type: "date", required: true },
      { name: "paymentMethod", label: "Payment method", type: "text", required: true },
      { name: "status", label: "Status", type: "select", options: ["active", "canceled"], required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  taxAssetSales: {
    collection: "taxAssetSales",
    title: "Realized Sale",
    prefix: "tax",
    defaults: {
      assetType: "Stock",
      symbol: "",
      name: "",
      acquiredDate: "2025-01-01",
      soldDate: "2026-01-01",
      proceeds: 0,
      costBasis: 0,
      fees: 0,
      notes: "",
    },
    fields: [
      { name: "assetType", label: "Asset type", type: "select", options: ["Stock", "Crypto"], required: true },
      { name: "symbol", label: "Ticker / symbol", type: "text", required: true },
      { name: "name", label: "Description", type: "text", required: true },
      { name: "acquiredDate", label: "Acquired date", type: "date", required: true },
      { name: "soldDate", label: "Sold date", type: "date", required: true },
      { name: "proceeds", label: "Proceeds", type: "number", required: true, min: 0, max: 1_000_000_000, step: "0.01" },
      { name: "costBasis", label: "Cost basis", type: "number", required: true, min: 0, max: 1_000_000_000, step: "0.01" },
      { name: "fees", label: "Fees / commissions", type: "number", required: true, min: 0, max: 100_000_000, step: "0.01" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
};

type FinanceWorkspaceView = "workspace" | "taxQuestionnaire";
const demoInteractiveSelector =
  "a, button, input, select, textarea, label, [role='button'], [role='tab'], [contenteditable='true']";

export function FinanceWorkspace({
  demoMode = false,
  view = "workspace",
}: {
  demoMode?: boolean;
  view?: FinanceWorkspaceView;
} = {}) {
  const isTaxQuestionnairePage = view === "taxQuestionnaire";
  const disableDemoControls = demoMode && !isTaxQuestionnairePage;
  const {
    data,
    upsertItem,
    deleteItem,
    deletePaycheck,
    deleteStockLot,
    clearDemoData,
    resetData,
    importData,
    applyMarketPriceUpdates,
    applyStockTrade,
    recordCreditCardPayment,
    recordDebtPayment,
    upsertCreditScore,
    regenerateTaxReport,
    storageReady,
    storageStatus,
    updateTaxProfile,
    updateTaxReportNotes,
    updateWorkspace,
    upsertPaycheck,
    upsertStockLot,
  } =
    useFinanceStore();
  const [activeSection, setActiveSection] = useState<SectionKey>(
    isTaxQuestionnairePage ? "tax" : "dashboard",
  );
  const [hashReady, setHashReady] = useState(isTaxQuestionnairePage);
  const [modal, setModal] = useState<ModalState>(null);
  const [paycheckModal, setPaycheckModal] = useState<PaycheckModalState>(null);
  const [stockLotModal, setStockLotModal] = useState<StockLotModalState>(null);
  const [stockTradeModal, setStockTradeModal] = useState<StockTradeModalState>(null);
  const [refreshingMarketKind, setRefreshingMarketKind] =
    useState<MarketRefreshAssetKind | null>(null);
  const [marketRefreshStatus, setMarketRefreshStatus] = useState<
    Record<MarketRefreshAssetKind, MarketRefreshStatus | null>
  >({
    crypto: null,
    stock: null,
  });
  const [weeklyMarketRefreshStatus, setWeeklyMarketRefreshStatus] =
    useState<MarketRefreshStatus | null>(null);
  const [refreshingWeeklyMarket, setRefreshingWeeklyMarket] = useState(false);
  const weeklyMarketRefreshKeyRef = useRef("");
  const [weeklyReportSnapshot, setWeeklyReportSnapshot] =
    useState<WeeklyReportSnapshot>(() => createWeeklyReportSnapshot());
  const [weeklyReportGeneratedThisSession, setWeeklyReportGeneratedThisSession] =
    useState(false);
  const [creditCardPaymentModal, setCreditCardPaymentModal] =
    useState<CreditCardPaymentModalState>(null);
  const [debtPaymentModal, setDebtPaymentModal] =
    useState<DebtPaymentModalState>(null);
  const [creditScoreModal, setCreditScoreModal] = useState<CreditScoreModalState>(null);
  const [creditScoreLedgerOpen, setCreditScoreLedgerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentPromptRequest, setAgentPromptRequest] =
    useState<FinanceAgentPromptRequest | null>(null);
  const [weeklyAgentReportText, setWeeklyAgentReportText] = useState("");
  const [weeklyAgentReportGenerating, setWeeklyAgentReportGenerating] = useState(false);
  const weeklyAgentReportRequestKeyRef = useRef("");
  const [searchQuery, setSearchQuery] = useState("");
  const [noticeCenterOpen, setNoticeCenterOpen] = useState(false);
  const [noticeRegistry, setNoticeRegistry] = useState<Record<string, NoticeRecord>>({});
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<Set<string>>(() => new Set());
  const [dismissedNoticesReady, setDismissedNoticesReady] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [themeReady, setThemeReady] = useState(false);
  const { agentSettings, agentSettingsReady, updateAgentSettings } =
    useFinanceAgentSettings();
  const { finnhubSettings, finnhubSettingsReady, updateFinnhubSettings } =
    useFinnhubSettings();
  const { coingeckoSettings, coingeckoSettingsReady, updateCoinGeckoSettings } =
    useCoinGeckoSettings();
  const summary = useMemo(() => calculateSummary(data), [data]);
  const activeNav: NavItem = isTaxQuestionnairePage
    ? { key: "tax" as const, label: "Tax Questionnaire", icon: <FileText size={16} /> }
    : navItems.find((item) => item.key === activeSection) ?? navItems[0];
  const weeklyHeaderWeekLabel = useMemo(() => {
    const weekStartDate =
      parseDateInput(weeklyReportSnapshot.weekStartDate) ?? startOfCalendarDay(new Date());
    const week = getWeeklyReportWindow(weekStartDate);

    return `${formatShortDate(week.startDate)} - ${formatShortDate(week.endDate)}`;
  }, [weeklyReportSnapshot.weekStartDate]);
  const searchResults = useMemo(
    () => getSearchResults(data, searchQuery),
    [data, searchQuery],
  );
  const upcomingCardPayments = useMemo(
    () => getUpcomingCreditCardPayments(data),
    [data],
  );
  const hasDemoData = useMemo(() => hasDemoFinanceData(data), [data]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => focusFirstInContainer(mobileNavRef.current), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      trapTabFocus(event, mobileNavRef.current);
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [mobileNavOpen]);

  const weeklyStaleStocks = useMemo(
    () => getStaleMarketDataAssets(data.stocks),
    [data.stocks],
  );
  const weeklyStaleCrypto = useMemo(
    () => getStaleMarketDataAssets(data.crypto),
    [data.crypto],
  );
  const weeklyMarketRefreshKey = useMemo(() => {
    const finnhubApiKey = finnhubSettings.apiKey.trim();
    const coingeckoApiKey = coingeckoSettings.apiKey.trim();
    const stockIds = finnhubApiKey ? weeklyStaleStocks.map((stock) => stock.id).join(",") : "";
    const cryptoIds = coingeckoApiKey
      ? weeklyStaleCrypto.map((holding) => holding.id).join(",")
      : "";

    if (!stockIds && !cryptoIds) {
      return "";
    }

    return `finnhub:${finnhubApiKey}|coingecko:${coingeckoApiKey}|stocks:${stockIds}|crypto:${cryptoIds}`;
  }, [coingeckoSettings.apiKey, finnhubSettings.apiKey, weeklyStaleCrypto, weeklyStaleStocks]);
  const dismissedNotices = useMemo(
    () =>
      [...dismissedNoticeIds]
        .map((id) => noticeRegistry[id])
        .filter((notice): notice is NoticeRecord => Boolean(notice)),
    [dismissedNoticeIds, noticeRegistry],
  );
  const registerNotice = useCallback((notice: NoticeRecord) => {
    setNoticeRegistry((current) => {
      const existing = current[notice.id];
      if (
        existing &&
        existing.title === notice.title &&
        existing.text === notice.text &&
        existing.tone === notice.tone
      ) {
        return current;
      }

      return { ...current, [notice.id]: notice };
    });
  }, []);
  const dismissNotice = useCallback(
    (notice: NoticeRecord) => {
      registerNotice(notice);
      setDismissedNoticeIds((current) => new Set(current).add(notice.id));
    },
    [registerNotice],
  );
  const restoreNotice = useCallback((id: string) => {
    setDismissedNoticeIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);
  const restoreAllNotices = useCallback(() => {
    setDismissedNoticeIds(new Set());
  }, []);
  const noticeCenterValue = useMemo<NoticeCenterState>(
    () => ({
      dismissNotice,
      dismissedIds: dismissedNoticeIds,
      dismissedNotices,
      registerNotice,
      restoreAllNotices,
      restoreNotice,
    }),
    [
      dismissNotice,
      dismissedNoticeIds,
      dismissedNotices,
      registerNotice,
      restoreAllNotices,
      restoreNotice,
    ],
  );

  useEffect(() => {
    const themeId = window.setTimeout(() => {
      const storedTheme = window.localStorage.getItem(themeStorageKey);
      const nextTheme =
        storedTheme === "dark" || storedTheme === "light"
          ? storedTheme
          : window.matchMedia?.("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      setTheme(nextTheme);
      setThemeReady(true);
    }, 0);

    return () => window.clearTimeout(themeId);
  }, []);

  useEffect(() => {
    const noticeId = window.setTimeout(() => {
      setDismissedNoticeIds(readDismissedNoticeIds(getBrowserStorage()));
      setDismissedNoticesReady(true);
    }, 0);

    return () => window.clearTimeout(noticeId);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    if (themeReady) {
      window.localStorage.setItem(themeStorageKey, theme);
    }
  }, [theme, themeReady]);

  useEffect(() => {
    if (dismissedNoticesReady) {
      writeDismissedNoticeIds(getBrowserStorage(), dismissedNoticeIds);
    }
  }, [dismissedNoticeIds, dismissedNoticesReady]);

  useEffect(() => {
    if (isTaxQuestionnairePage || !storageReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const result = ensureCurrentWeeklyReportSnapshot(getBrowserStorage());
      setWeeklyReportSnapshot(result.snapshot);
      setWeeklyReportGeneratedThisSession(result.generated);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isTaxQuestionnairePage, storageReady]);

  useEffect(() => {
    if (isTaxQuestionnairePage) {
      return;
    }

    const syncFromHash = () => {
      const section = sectionFromHash(window.location.hash);
      if (section) {
        setActiveSection(section);
      }
      setHashReady(true);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [isTaxQuestionnairePage]);

  useEffect(() => {
    if (isTaxQuestionnairePage || !hashReady) {
      return;
    }
    const nextHash = `#${sectionHashes[activeSection]}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }, [activeSection, hashReady, isTaxQuestionnairePage]);

  useEffect(() => {
    if (
      isTaxQuestionnairePage ||
      activeSection !== "weeklyReport" ||
      !agentSettingsReady ||
      !storageReady ||
      !agentSettings.apiKey.trim()
    ) {
      return;
    }

    const requestKey = [
      weeklyReportSnapshot.weekStartDate,
      agentSettings.providerName,
      agentSettings.model,
    ].join("|");

    if (weeklyAgentReportRequestKeyRef.current === requestKey) {
      return;
    }

    weeklyAgentReportRequestKeyRef.current = requestKey;
    setWeeklyAgentReportText("");
    setWeeklyAgentReportGenerating(true);
    setAgentPromptRequest({
      id: createId("weekly-agent-report"),
      prompt: getWeeklyAgentReportPrompt(),
      source: "weeklyReport",
    });
  }, [
    activeSection,
    agentSettings.apiKey,
    agentSettings.model,
    agentSettings.providerName,
    agentSettingsReady,
    isTaxQuestionnairePage,
    storageReady,
    weeklyReportSnapshot.weekStartDate,
  ]);

  const selectSection = (section: SectionKey) => {
    if (isTaxQuestionnairePage) {
      window.location.href = `/#${sectionHashes[section]}`;
      return;
    }

    setActiveSection(section);
    setMobileNavOpen(false);
  };
  const preventDemoInteraction = useCallback(
    (event: SyntheticEvent) => {
      if (!disableDemoControls) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("[data-demo-nav='true']")) {
        return;
      }

      if (!target.closest(demoInteractiveSelector)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    [disableDemoControls],
  );
  const openWeeklyAgentReport = () => {
    setAgentOpen(true);
    if (agentPromptRequest?.source === "weeklyReport") {
      return;
    }

    const prompt = getWeeklyAgentReportPrompt();
    setAgentPromptRequest({
      assistantText: weeklyAgentReportText.trim() || undefined,
      id: createId("weekly-agent-report"),
      prompt,
      source: "weeklyReport",
    });
  };

  const openAdd = (collection: CollectionKey) => setModal({ collection });
  const openEdit = (collection: CollectionKey, item: EditableItem) =>
    setModal({ collection, item });
  const closeModal = () => setModal(null);
  const openQuickFinancialEntry = (action: QuickFinancialEntryAction) => {
    if (action === "income") {
      selectSection("income");
      return;
    }

    if (action === "cryptoPurchase") {
      selectSection("crypto");
      return;
    }

    if (action === "debtPayment") {
      selectSection("cards");
      return;
    }

    selectSection("stocks");
  };
  const openSearchResult = (result: SearchResult) => {
    selectSection(result.section);
    setSearchQuery("");
    openEdit(result.collection, result.item);
  };
  const clearDashboardDemoData = () => {
    if (
      window.confirm(
        "Clear built-in demo data only? This first downloads a backup, then removes fixed sample rows. User-created rows stay.",
      )
    ) {
      downloadFinanceBackup(data);
      clearDemoData();
    }
  };
  const applyAgentProposal = (proposal: FinanceAgentProposal, prompt: string) => {
    try {
      const preparedActions = proposal.actions.map((action) =>
        prepareFinanceAgentAction(action, data),
      );
      preparedActions.forEach((action) =>
        applyPreparedFinanceAgentAction(action, {
          deleteItem,
          recordCreditCardPayment,
          updateTaxProfile,
          upsertCreditScore,
          upsertItem,
        }),
      );
      writeFinanceAgentAuditEntry(
        {
          actions: proposal.actions,
          createdAt: new Date().toISOString(),
          id: createId("agent-audit"),
          prompt,
          proposalTitle: proposal.title,
          status: "applied",
        },
        getBrowserStorage(),
      );
      return {
        message: `Applied ${proposal.actions.length} action${
          proposal.actions.length === 1 ? "" : "s"
        }.`,
        ok: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "The proposal could not be applied.";
      writeFinanceAgentAuditEntry(
        {
          actions: proposal.actions,
          createdAt: new Date().toISOString(),
          error: message,
          id: createId("agent-audit"),
          prompt,
          proposalTitle: proposal.title,
          status: "failed",
        },
        getBrowserStorage(),
      );
      return { message, ok: false };
    }
  };
  const cancelAgentProposal = (proposal: FinanceAgentProposal, prompt: string) => {
    writeFinanceAgentAuditEntry(
      {
        actions: proposal.actions,
        createdAt: new Date().toISOString(),
        id: createId("agent-audit"),
        prompt,
        proposalTitle: proposal.title,
        status: "canceled",
      },
      getBrowserStorage(),
    );
  };
  const refreshMarketPrices = async (assetKind: MarketRefreshAssetKind) => {
    const isCryptoRefresh = assetKind === "crypto";
    const apiKey = isCryptoRefresh
      ? coingeckoSettings.apiKey.trim()
      : finnhubSettings.apiKey.trim();
    const providerLabel = isCryptoRefresh ? "CoinGecko" : "Finnhub";
    if (!apiKey) {
      setMarketRefreshStatus((current) => ({
        ...current,
        [assetKind]: {
          message: `Add a ${providerLabel} API key in Settings.`,
          tone: "amber",
        },
      }));
      return;
    }

    setMarketRefreshStatus((current) => ({ ...current, [assetKind]: null }));
    setRefreshingMarketKind(assetKind);

    try {
      const response = await fetch(
        isCryptoRefresh ? "/api/market-data/coingecko" : "/api/market-data/finnhub",
        {
          body: JSON.stringify(
            isCryptoRefresh
              ? {
                  apiKey,
                  crypto: sortMarketDataAssetsByOldestUpdate(data.crypto).map((holding) => ({
                    currentPrice: holding.currentPrice,
                    id: holding.id,
                    marketPriceUpdatedAt: holding.marketPriceUpdatedAt,
                    symbol: holding.symbol,
                  })),
                }
              : {
                  apiKey,
                  stocks: sortMarketDataAssetsByOldestUpdate(data.stocks).map((stock) => ({
                    currentPrice: stock.currentPrice,
                    id: stock.id,
                    marketPriceUpdatedAt: stock.marketPriceUpdatedAt,
                    symbol: stock.ticker,
                  })),
                },
          ),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        },
      );
      const body = (await response.json()) as MarketDataRefreshResult & { error?: string };
      if (!response.ok) {
        setMarketRefreshStatus((current) => ({
          ...current,
          [assetKind]: {
            message: body.error ?? `${providerLabel} refresh failed.`,
            tone: "red",
          },
        }));
        return;
      }

      applyMarketPriceUpdates(body);
      setMarketRefreshStatus((current) => ({
        ...current,
        [assetKind]: getMarketRefreshStatus(body, assetKind),
      }));
    } catch (error) {
      setMarketRefreshStatus((current) => ({
        ...current,
        [assetKind]: {
          message: error instanceof Error ? error.message : `${providerLabel} refresh failed.`,
          tone: "red",
        },
      }));
    } finally {
      setRefreshingMarketKind(null);
    }
  };

  const refreshWeeklyStaleMarketPrices = useCallback(async () => {
    const finnhubApiKey = finnhubSettings.apiKey.trim();
    const coingeckoApiKey = coingeckoSettings.apiKey.trim();
    if (refreshingWeeklyMarket) {
      return;
    }

    const staleAssetCount = weeklyStaleStocks.length + weeklyStaleCrypto.length;
    const staleStocksToRefresh = finnhubApiKey ? weeklyStaleStocks : [];
    const staleCryptoToRefresh = coingeckoApiKey ? weeklyStaleCrypto : [];
    const refreshableAssetCount = staleStocksToRefresh.length + staleCryptoToRefresh.length;
    if (staleAssetCount === 0) {
      setWeeklyMarketRefreshStatus({
        message: "Market prices current this week.",
        tone: "green",
      });
      return;
    }
    if (refreshableAssetCount === 0) {
      return;
    }

    setRefreshingWeeklyMarket(true);
    setWeeklyMarketRefreshStatus({
      message: `Refreshing ${refreshableAssetCount} stale ${refreshableAssetCount === 1 ? "asset" : "assets"}...`,
      tone: "amber",
    });

    try {
      const requests: Array<Promise<MarketDataRefreshResult>> = [];

      if (staleStocksToRefresh.length > 0) {
        requests.push(
          fetchMarketDataRefresh("/api/market-data/finnhub", {
            apiKey: finnhubApiKey,
            stocks: staleStocksToRefresh.map((stock) => ({
              currentPrice: stock.currentPrice,
              id: stock.id,
              marketPriceUpdatedAt: stock.marketPriceUpdatedAt,
              symbol: stock.ticker,
            })),
          }),
        );
      }

      if (staleCryptoToRefresh.length > 0) {
        requests.push(
          fetchMarketDataRefresh("/api/market-data/coingecko", {
            apiKey: coingeckoApiKey,
            crypto: staleCryptoToRefresh.map((holding) => ({
              currentPrice: holding.currentPrice,
              id: holding.id,
              marketPriceUpdatedAt: holding.marketPriceUpdatedAt,
              symbol: holding.symbol,
            })),
          }),
        );
      }

      const results = await Promise.all(requests);
      results.forEach((result) => applyMarketPriceUpdates(result));
      setWeeklyMarketRefreshStatus(
        getWeeklyMarketRefreshStatus(combineMarketDataRefreshResults(results)),
      );
    } catch (error) {
      setWeeklyMarketRefreshStatus({
        message: error instanceof Error ? error.message : "Market refresh failed.",
        tone: "red",
      });
    } finally {
      setRefreshingWeeklyMarket(false);
    }
  }, [
    applyMarketPriceUpdates,
    coingeckoSettings.apiKey,
    finnhubSettings.apiKey,
    refreshingWeeklyMarket,
    weeklyStaleCrypto,
    weeklyStaleStocks,
  ]);

  useEffect(() => {
    const shouldRefreshForWeeklyReport =
      activeSection === "weeklyReport" || weeklyReportGeneratedThisSession;

    if (
      isTaxQuestionnairePage ||
      !shouldRefreshForWeeklyReport ||
      !finnhubSettingsReady ||
      !coingeckoSettingsReady
    ) {
      return;
    }

    if (weeklyStaleStocks.length + weeklyStaleCrypto.length === 0) {
      setWeeklyMarketRefreshStatus({
        message: "Market prices current this week.",
        tone: "green",
      });
      return;
    }

    const hasRefreshableWeeklyMarket =
      (Boolean(finnhubSettings.apiKey.trim()) && weeklyStaleStocks.length > 0) ||
      (Boolean(coingeckoSettings.apiKey.trim()) && weeklyStaleCrypto.length > 0);

    if (!hasRefreshableWeeklyMarket) {
      weeklyMarketRefreshKeyRef.current = "";
      setWeeklyMarketRefreshStatus(null);
      return;
    }

    if (!weeklyMarketRefreshKey || weeklyMarketRefreshKeyRef.current === weeklyMarketRefreshKey) {
      return;
    }

    weeklyMarketRefreshKeyRef.current = weeklyMarketRefreshKey;
    void refreshWeeklyStaleMarketPrices();
  }, [
    activeSection,
    coingeckoSettings.apiKey,
    coingeckoSettingsReady,
    finnhubSettings.apiKey,
    finnhubSettingsReady,
    isTaxQuestionnairePage,
    refreshWeeklyStaleMarketPrices,
    weeklyMarketRefreshKey,
    weeklyReportGeneratedThisSession,
    weeklyStaleCrypto.length,
    weeklyStaleStocks.length,
  ]);

  if (!storageReady) {
    return <WorkspaceLoadingShell />;
  }

  const chartPalette = getChartPalette(
    data.workspace.graphPrimaryColor,
    data.workspace.graphSecondaryColor,
  );
  const workspaceName = getWorkspaceName(data.workspace);

  return (
    <NoticeCenterContext.Provider value={noticeCenterValue}>
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors"
      data-demo-mode={disableDemoControls ? "true" : undefined}
      onBeforeInputCapture={preventDemoInteraction}
      onChangeCapture={preventDemoInteraction}
      onClickCapture={preventDemoInteraction}
      onInputCapture={preventDemoInteraction}
      onPointerDownCapture={preventDemoInteraction}
      onSubmitCapture={preventDemoInteraction}
    >
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[248px_1fr]">
        <aside className="sticky top-0 z-30 hidden h-screen border-r border-[var(--line)] bg-[var(--paper)]/95 px-3 py-4 lg:block">
          <Sidebar
            activeSection={activeSection}
            onSelect={selectSection}
            onOpenAgent={() => setAgentOpen(true)}
            netWorth={summary.totalNetWorth}
            storageReady={storageReady}
            storageStatus={storageStatus}
            workspaceName={workspaceName}
          />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur md:px-6 lg:px-8 relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  aria-controls="mobile-navigation"
                  aria-expanded={mobileNavOpen}
                  aria-haspopup="dialog"
                  aria-label="Open navigation"
                  className="lg:hidden"
                  data-demo-nav="true"
                  size="icon"
                  variant="secondary"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu size={16} />
                </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span>Workspace</span>
                    <ChevronRight size={13} />
                    <span className="truncate">{activeNav.label}</span>
                  </div>
                  <h1
                    className={cn(
                      "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 font-semibold text-[var(--foreground)]",
                      activeSection === "weeklyReport" ? "text-lg" : "text-xl",
                    )}
                  >
                    <span className="truncate">{activeNav.label}</span>
                    {!isTaxQuestionnairePage && activeSection === "weeklyReport" ? (
                      <span className="shrink-0 font-mono text-xs font-medium text-[var(--muted)]">
                        {weeklyHeaderWeekLabel}
                      </span>
                    ) : null}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  aria-controls="notice-center"
                  aria-expanded={noticeCenterOpen}
                  aria-haspopup="dialog"
                  aria-label="Alerts"
                  size="icon"
                  variant="ghost"
                  onClick={() => setNoticeCenterOpen((open) => !open)}
                >
                  <Bell size={14} />
                </Button>
                {!isTaxQuestionnairePage ? (
                  <label className="hidden h-9 items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm text-[var(--muted)] md:flex">
                    <Search size={15} />
                    <input
                      className="w-40 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-soft)]"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search records"
                      value={searchQuery}
                    />
                  </label>
                ) : null}
                {!isTaxQuestionnairePage && activeNav.collection ? (
                  <Button variant="primary" onClick={() => openAdd(activeNav.collection!)}>
                    <Plus size={15} />
                    New
                  </Button>
                ) : null}
              </div>
            </div>
            {noticeCenterOpen ? (
              <NoticeCenterPopover
                notices={dismissedNotices}
                onClose={() => setNoticeCenterOpen(false)}
                onRestore={restoreNotice}
                onRestoreAll={restoreAllNotices}
              />
            ) : null}
            <nav aria-label="Primary" className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  aria-current={activeSection === item.key ? "page" : undefined}
                  className={cn(
                    "flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition",
                    focusVisibleRing,
                    activeSection === item.key
                      ? "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] shadow-sm"
                      : "border-transparent text-[var(--muted)] hover:bg-[var(--paper-muted)]",
                  )}
                  data-demo-nav="true"
                  onClick={() => selectSection(item.key)}
                  type="button"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </header>

          <main className="px-4 py-5 md:px-6 lg:px-8">
            {!isTaxQuestionnairePage && activeSection === "dashboard" && hasDemoData ? (
              <DemoDataNotice onClear={clearDashboardDemoData} />
            ) : null}
            {!isTaxQuestionnairePage ? (
              <CreditCardPaymentNotice
                payments={upcomingCardPayments}
                onViewCards={() => selectSection("cards")}
              />
            ) : null}
            {!isTaxQuestionnairePage ? (
              <div className="mb-4 md:hidden">
              <label className="flex h-9 items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm text-[var(--muted)]">
                <Search size={15} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-soft)]"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search records"
                  value={searchQuery}
                />
              </label>
              </div>
            ) : null}
            {searchQuery.trim() ? (
              <SearchResults
                query={searchQuery}
                results={searchResults}
                onOpen={openSearchResult}
              />
            ) : null}
            {isTaxQuestionnairePage ? (
              <TaxQuestionnaireView
                data={data}
                onBack={() => {
                  window.location.href = "/#tax";
                }}
                onChange={updateTaxProfile}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "dashboard" ? (
              <DashboardSection
                chartPalette={chartPalette}
                data={data}
                summary={summary}
                onEdit={openEdit}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "weeklyReport" ? (
              <WeeklyReportSection
                agentReportText={weeklyAgentReportText}
                agentReportGenerating={weeklyAgentReportGenerating}
                chartPalette={chartPalette}
                data={data}
                hasFinnhubApiKey={Boolean(finnhubSettings.apiKey.trim())}
                hasCoinGeckoApiKey={Boolean(coingeckoSettings.apiKey.trim())}
                hasAgentApiKey={Boolean(agentSettings.apiKey.trim())}
                marketRefreshStatus={weeklyMarketRefreshStatus}
                refreshingMarket={refreshingWeeklyMarket}
                staleCryptoCount={weeklyStaleCrypto.length}
                staleStockCount={weeklyStaleStocks.length}
                summary={summary}
                snapshot={weeklyReportSnapshot}
                onEdit={openEdit}
                onQuickEntry={openQuickFinancialEntry}
                onOpenAgentReport={openWeeklyAgentReport}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "investing" ? (
              <InvestingSection
                chartPalette={chartPalette}
                data={data}
                summary={summary}
                onAdd={() => openAdd("investments")}
                onEdit={(item) => openEdit("investments", item)}
                onDelete={(id) => deleteItem("investments", id)}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "stocks" ? (
              <StocksSection
                data={data}
                hasFinnhubApiKey={Boolean(finnhubSettings.apiKey.trim())}
                refreshStatus={marketRefreshStatus.stock}
                refreshingPrices={refreshingMarketKind === "stock"}
                onAdd={() => openAdd("stocks")}
                onEdit={(item) => openEdit("stocks", item)}
                onDelete={(id) => deleteItem("stocks", id)}
                onRefreshPrices={() => refreshMarketPrices("stock")}
                onTrade={(stock, kind) => setStockTradeModal({ kind, stock })}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "crypto" ? (
              <CryptoSection
                chartPalette={chartPalette}
                data={data}
                hasCoinGeckoApiKey={Boolean(coingeckoSettings.apiKey.trim())}
                refreshStatus={marketRefreshStatus.crypto}
                refreshingPrices={refreshingMarketKind === "crypto"}
                onAdd={() => openAdd("crypto")}
                onEdit={(item) => openEdit("crypto", item)}
                onDelete={(id) => deleteItem("crypto", id)}
                onRefreshPrices={() => refreshMarketPrices("crypto")}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "income" ? (
              <IncomeSection
                chartPalette={chartPalette}
                data={data}
                onAdd={() => openAdd("incomeSources")}
                onAddPaycheck={() => setPaycheckModal({})}
                onEdit={(item) => openEdit("incomeSources", item)}
                onEditPaycheck={(item) => setPaycheckModal({ item })}
                onDelete={(id) => deleteItem("incomeSources", id)}
                onDeletePaycheck={(id) => deletePaycheck(id)}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "tax" ? (
              <TaxSection
                chartPalette={chartPalette}
                data={data}
                onAdd={() => openAdd("taxAssetSales")}
                onDelete={(id) => deleteItem("taxAssetSales", id)}
                onEdit={(item) => openEdit("taxAssetSales", item)}
                onOpenQuestionnaire={() => {
                  window.location.href = "/tax-questionnaire";
                }}
                onRegenerateReport={regenerateTaxReport}
                onUpdateReportNotes={updateTaxReportNotes}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "savings" ? (
              <SavingsSection
                data={data}
                summary={summary}
                onAdd={() => openAdd("savingsGoals")}
                onEdit={(item) => openEdit("savingsGoals", item)}
                onDelete={(id) => deleteItem("savingsGoals", id)}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "cards" ? (
              <CardsSection
                data={data}
                summary={summary}
                onAdd={() => openAdd("creditCards")}
                onAddDebt={() => openAdd("debts")}
                onEdit={(item) => openEdit("creditCards", item)}
                onEditDebt={(item) => openEdit("debts", item)}
                onDelete={(id) => deleteItem("creditCards", id)}
                onDeleteDebt={(id) => deleteItem("debts", id)}
                onRecordDebtPayment={(debt) => setDebtPaymentModal({ debt })}
                onRecordPayment={(card) => setCreditCardPaymentModal({ card })}
                onAddCreditScore={() => setCreditScoreModal({})}
                onOpenCreditScoreLedger={() => setCreditScoreLedgerOpen(true)}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "recurring" ? (
              <RecurringSection
                data={data}
                onAdd={() => openAdd("recurringPayments")}
                onEdit={(item) => openEdit("recurringPayments", item)}
                onDelete={(id) => deleteItem("recurringPayments", id)}
              />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "netWorth" ? (
              <NetWorthSection chartPalette={chartPalette} data={data} summary={summary} />
            ) : null}
            {!isTaxQuestionnairePage && activeSection === "settings" ? (
              <SettingsSection
                agentSettings={agentSettings}
                agentSettingsReady={agentSettingsReady}
                coingeckoSettings={coingeckoSettings}
                coingeckoSettingsReady={coingeckoSettingsReady}
                data={data}
                finnhubSettings={finnhubSettings}
                finnhubSettingsReady={finnhubSettingsReady}
                onClearDemoData={clearDemoData}
                onAgentSettingsChange={updateAgentSettings}
                onCoinGeckoSettingsChange={updateCoinGeckoSettings}
                onFinnhubSettingsChange={updateFinnhubSettings}
                onImport={importData}
                onReset={resetData}
                onThemeChange={setTheme}
                onWorkspaceChange={updateWorkspace}
                storageReady={storageReady}
                storageStatus={storageStatus}
                theme={theme}
              />
            ) : null}
          </main>
        </div>
      </div>

      {mobileNavOpen ? (
        <div
          aria-label="Navigation"
          aria-modal="true"
          className="fixed inset-0 z-50 lg:hidden"
          id="mobile-navigation"
          role="dialog"
        >
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-black/20"
            data-demo-nav="true"
            onClick={() => setMobileNavOpen(false)}
            type="button"
          />
          <div
            className="absolute left-0 top-0 h-full w-[82vw] max-w-80 border-r border-[var(--line)] bg-[var(--paper)] p-3 shadow-2xl"
            ref={mobileNavRef}
            tabIndex={-1}
          >
            <Sidebar
              activeSection={activeSection}
              onSelect={selectSection}
              onOpenAgent={() => {
                setAgentOpen(true);
                setMobileNavOpen(false);
              }}
              netWorth={summary.totalNetWorth}
              storageReady={storageReady}
              storageStatus={storageStatus}
              workspaceName={workspaceName}
            />
          </div>
        </div>
      ) : null}

      {!isTaxQuestionnairePage ? (
        <FinanceAgentPanel
          activeSectionLabel={activeNav.label}
          data={data}
          onPromptAssistantText={(request, text) => {
            if (request.source === "weeklyReport") {
              setWeeklyAgentReportText(text);
            }
          }}
          onPromptStatusChange={(request, status) => {
            if (request.source === "weeklyReport") {
              setWeeklyAgentReportGenerating(status === "submitted" || status === "streaming");
            }
          }}
          onApplyProposal={applyAgentProposal}
          onCancelProposal={cancelAgentProposal}
          onClose={() => setAgentOpen(false)}
          onOpenSettings={() => selectSection("settings")}
          open={agentOpen}
          promptRequest={agentPromptRequest}
          settings={agentSettings}
        />
      ) : null}

      {modal ? (
        <EditorSheet
          key={`${modal.collection}-${modal.item?.id ?? "new"}`}
          data={data}
          modal={modal}
          onClose={closeModal}
          onDeleteStockPurchase={deleteStockLot}
          onEditStockPurchase={(item) => setStockLotModal({ item })}
          onSave={(collection, item) => {
            upsertItem(collection, item);
            closeModal();
          }}
        />
      ) : null}
      {creditCardPaymentModal ? (
        <CreditCardPaymentSheet
          card={creditCardPaymentModal.card}
          onClose={() => setCreditCardPaymentModal(null)}
          onSave={(payment) => {
            recordCreditCardPayment(creditCardPaymentModal.card.id, payment);
            setCreditCardPaymentModal(null);
          }}
        />
      ) : null}
      {debtPaymentModal ? (
        <DebtPaymentSheet
          debt={debtPaymentModal.debt}
          onClose={() => setDebtPaymentModal(null)}
          onSave={(payment) => {
            recordDebtPayment(debtPaymentModal.debt.id, payment);
            setDebtPaymentModal(null);
          }}
        />
      ) : null}
      {creditScoreModal ? (
        <CreditScoreSheet
          entry={creditScoreModal.entry}
          onClose={() => setCreditScoreModal(null)}
          onSave={(entry) => {
            upsertCreditScore(entry);
            setCreditScoreModal(null);
          }}
        />
      ) : null}
      {creditScoreLedgerOpen ? (
        <CreditScoreLedgerSheet
          entries={data.creditScoreHistory}
          onAdd={() => {
            setCreditScoreLedgerOpen(false);
            setCreditScoreModal({});
          }}
          onClose={() => setCreditScoreLedgerOpen(false)}
          onEdit={(entry) => {
            setCreditScoreLedgerOpen(false);
            setCreditScoreModal({ entry });
          }}
        />
      ) : null}
      {stockTradeModal ? (
        <StockTradeSheet
          modal={stockTradeModal}
          onClose={() => setStockTradeModal(null)}
          onSave={(trade) => {
            applyStockTrade(stockTradeModal.stock.id, trade);
            setStockTradeModal(null);
          }}
        />
      ) : null}
      {paycheckModal ? (
        <PaycheckSheet
          data={data}
          modal={paycheckModal}
          onClose={() => setPaycheckModal(null)}
          onSave={(payload) => {
            upsertPaycheck(payload);
            setPaycheckModal(null);
          }}
        />
      ) : null}
      {stockLotModal ? (
        <StockLotSheet
          data={data}
          modal={stockLotModal}
          onClose={() => setStockLotModal(null)}
          onSave={(lot) => {
            upsertStockLot(lot);
            setStockLotModal(null);
          }}
        />
      ) : null}
    </div>
    </NoticeCenterContext.Provider>
  );
}

function getMarketRefreshStatus(
  result: MarketDataRefreshResult,
  assetKind: MarketRefreshAssetKind,
): MarketRefreshStatus {
  const refreshedCount = result.updates.length;
  const failedCount = result.failures.length;
  const assetLabel = assetKind === "stock" ? "stock" : "crypto";
  const pluralAssetLabel = assetKind === "stock" ? "stocks" : "crypto";

  if (refreshedCount > 0 && failedCount > 0) {
    return {
      message: `Updated ${refreshedCount} ${refreshedCount === 1 ? assetLabel : pluralAssetLabel}; ${failedCount} failed.`,
      tone: "amber",
    };
  }

  if (refreshedCount > 0) {
    return {
      message: `Updated ${refreshedCount} ${refreshedCount === 1 ? assetLabel : pluralAssetLabel}.`,
      tone: "green",
    };
  }

  return {
    message:
      failedCount > 0
        ? `No prices updated; ${failedCount} ${failedCount === 1 ? "symbol" : "symbols"} failed.`
        : "No prices updated.",
    tone: "red",
  };
}

async function fetchMarketDataRefresh(endpoint: string, requestBody: object) {
  const response = await fetch(endpoint, {
    body: JSON.stringify(requestBody),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const body = (await response.json()) as MarketDataRefreshResult & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Market refresh failed.");
  }

  return body;
}

function combineMarketDataRefreshResults(results: MarketDataRefreshResult[]) {
  return createMarketDataRefreshResult(
    results.flatMap((result) => result.updates),
    results.flatMap((result) => result.failures),
    results.length === 1 ? results[0].provider : "Mixed",
  );
}

function getWeeklyMarketRefreshStatus(result: MarketDataRefreshResult): MarketRefreshStatus {
  const updatedCount = result.updates.length;
  const failedCount = result.failures.length;

  if (updatedCount > 0 && failedCount > 0) {
    return {
      message: `Updated ${updatedCount}; ${failedCount} failed.`,
      tone: "amber",
    };
  }

  if (updatedCount > 0) {
    return {
      message: `Updated ${updatedCount} ${updatedCount === 1 ? "asset" : "assets"}.`,
      tone: "green",
    };
  }

  return {
    message:
      failedCount > 0
        ? `No prices updated; ${failedCount} ${failedCount === 1 ? "asset" : "assets"} failed.`
        : "No stale prices updated.",
    tone: failedCount > 0 ? "red" : "green",
  };
}

function CreditCardPaymentSheet({
  card,
  onClose,
  onSave,
}: {
  card: FinanceData["creditCards"][number];
  onClose: () => void;
  onSave: (payment: CreditCardPaymentDraft) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const statementRemaining = creditStatementRemaining(card);
  const currentBalance = creditCurrentBalance(card);
  const carriedBalance = Math.min(creditInterestBalance(card), currentBalance);
  const [payTarget, setPayTarget] = useState<CreditCardPaymentTarget>("lastStatement");
  const [paymentPreset, setPaymentPreset] = useState<"custom" | "full">("full");
  const [customAmount, setCustomAmount] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const selectedBalance =
    payTarget === "currentBalance"
      ? currentBalance
      : payTarget === "carriedBalance"
        ? carriedBalance
        : Math.min(statementRemaining, currentBalance);
  const selectedBalanceLabel = getCreditCardPaymentTargetLabel(payTarget);

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>("select, input, button")?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      trapTabFocus(event, sheetRef.current);
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  const validatePayment = () => {
    const nextErrors: FormErrors = {};
    let amount = selectedBalance;

    if (paymentPreset === "custom") {
      const value = parseFiniteNumber(customAmount);
      if (value === null) {
        nextErrors.customAmount = "Enter a finite amount.";
      } else if (value < 0) {
        nextErrors.customAmount = "Must be at least 0.";
      } else if (value > selectedBalance) {
        nextErrors.customAmount = `Amount cannot exceed ${formatCurrency(selectedBalance)}.`;
      } else {
        amount = value;
      }
    }

    if (amount <= 0 && Object.keys(nextErrors).length === 0) {
      setFormError("Enter at least one payment amount.");
    } else {
      setFormError("");
    }

    setErrors(nextErrors);
    return {
      amount,
      errors: nextErrors,
    };
  };

  const updatePayTarget = (value: string) => {
    setPayTarget(
      value === "currentBalance" || value === "carriedBalance" || value === "lastStatement"
        ? value
        : "lastStatement",
    );
    setFormError("");
    setErrors({});
  };

  const updatePaymentPreset = (value: string) => {
    setPaymentPreset(value === "custom" ? "custom" : "full");
    setFormError("");
    setErrors({});
  };

  const updateCustomAmount = (value: string) => {
    setCustomAmount(value);
    setFormError("");
    setErrors((current) => {
      if (!current.customAmount) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.customAmount;
      return nextErrors;
    });
  };

  const customPaymentAmount = parseFiniteNumber(customAmount) ?? 0;
  const paymentAmount =
    paymentPreset === "custom"
      ? Math.min(Math.max(customPaymentAmount, 0), selectedBalance)
      : selectedBalance;
  const hasPayment = paymentAmount > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validatePayment();
    if (Object.keys(validation.errors).length > 0) {
      return;
    }

    if (validation.amount <= 0) {
      return;
    }

    onSave({
      amount: validation.amount,
      target: payTarget,
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close payment editor"
        className="absolute inset-0 bg-[#242321]/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--background-raised)] shadow-2xl"
        ref={sheetRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p
              className="text-xs font-medium uppercase text-[var(--muted-soft)]"
              id={descriptionId}
            >
              Credit card payment
            </p>
            <h2 className="truncate text-lg font-semibold text-[var(--foreground)]" id={titleId}>
              {card.cardName}
            </h2>
          </div>
          <Button
            aria-label="Close payment editor"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="grid flex-1 content-start gap-3 overflow-y-auto p-4 sm:grid-cols-2">
            <PaymentSummaryStat label="Current balance" value={formatCurrency(currentBalance)} />
            <PaymentSummaryStat label="Payment" value={formatCurrency(paymentAmount)} emphasis />
            <PaymentSummaryStat label={selectedBalanceLabel} value={formatCurrency(selectedBalance)} compact />
            <PaymentSummaryStat
              label="After payment"
              value={formatCurrency(Math.max(currentBalance - paymentAmount, 0))}
              compact
            />
            <div className="sm:col-span-2">
              <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                <span>Pay</span>
                <select
                  className={cn(
                    "h-9 rounded-lg border px-3 text-sm transition",
                    "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                    controlFocusVisibleRing,
                  )}
                  onChange={(event) => updatePayTarget(event.target.value)}
                  value={payTarget}
                >
                  <option value="lastStatement">Last statement</option>
                  <option value="carriedBalance">Carried balance</option>
                  <option value="currentBalance">Current balance</option>
                </select>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                <span>Preset</span>
                <select
                  className={cn(
                    "h-9 rounded-lg border px-3 text-sm transition",
                    "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                    controlFocusVisibleRing,
                  )}
                  onChange={(event) => updatePaymentPreset(event.target.value)}
                  value={paymentPreset}
                >
                  <option value="full">Pay in full</option>
                  <option value="custom">Custom amount</option>
                </select>
              </label>
            </div>
            {paymentPreset === "custom" ? (
              <div className="sm:col-span-2">
                <Field
                  aria-describedby={errors.customAmount ? `${titleId}-customAmount-error` : undefined}
                  aria-invalid={Boolean(errors.customAmount)}
                  label="Custom amount"
                  max={selectedBalance}
                  min={0}
                  onChange={(event) => updateCustomAmount(event.target.value)}
                  step="0.01"
                  type="number"
                  value={customAmount}
                />
                {errors.customAmount ? (
                  <FieldError id={`${titleId}-customAmount-error`}>
                    {errors.customAmount}
                  </FieldError>
                ) : null}
              </div>
            ) : null}
            {formError ? (
              <div className="sm:col-span-2">
                <FieldError id={`${titleId}-payment-error`}>{formError}</FieldError>
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!hasPayment} type="submit" variant="primary">
              Pay
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function getCreditCardPaymentTargetLabel(target: CreditCardPaymentTarget) {
  if (target === "currentBalance") {
    return "Current balance";
  }

  if (target === "carriedBalance") {
    return "Carried balance";
  }

  return "Last statement";
}

function DebtPaymentSheet({
  debt,
  onClose,
  onSave,
}: {
  debt: FinanceData["debts"][number];
  onClose: () => void;
  onSave: (payment: DebtPaymentDraft) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const currentBalance = Math.max(debt.currentBalance, 0);
  const monthlyPayment = Math.min(Math.max(debt.minimumPayment, 0), currentBalance);
  const [paymentPreset, setPaymentPreset] = useState<"custom" | "monthly">("monthly");
  const [customAmount, setCustomAmount] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>("select, input, button")?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      trapTabFocus(event, sheetRef.current);
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  const validatePayment = () => {
    const nextErrors: FormErrors = {};
    let amount = monthlyPayment;

    if (paymentPreset === "custom") {
      const value = parseFiniteNumber(customAmount);
      if (value === null) {
        nextErrors.customAmount = "Enter a finite amount.";
      } else if (value < 0) {
        nextErrors.customAmount = "Must be at least 0.";
      } else if (value > currentBalance) {
        nextErrors.customAmount = `Amount cannot exceed ${formatCurrency(currentBalance)}.`;
      } else {
        amount = value;
      }
    }

    if (amount <= 0 && Object.keys(nextErrors).length === 0) {
      setFormError("Enter a payment amount.");
    } else {
      setFormError("");
    }

    setErrors(nextErrors);
    return {
      amount,
      errors: nextErrors,
    };
  };

  const updatePaymentPreset = (value: string) => {
    setPaymentPreset(value === "custom" ? "custom" : "monthly");
    setFormError("");
    setErrors({});
  };

  const updateCustomAmount = (value: string) => {
    setCustomAmount(value);
    setFormError("");
    setErrors((current) => {
      if (!current.customAmount) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.customAmount;
      return nextErrors;
    });
  };

  const customPaymentAmount = parseFiniteNumber(customAmount) ?? 0;
  const paymentAmount =
    paymentPreset === "custom"
      ? Math.min(Math.max(customPaymentAmount, 0), currentBalance)
      : monthlyPayment;
  const hasPayment = paymentAmount > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validatePayment();
    if (Object.keys(validation.errors).length > 0 || validation.amount <= 0) {
      return;
    }

    onSave({ amount: validation.amount });
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close debt payment editor"
        className="absolute inset-0 bg-[#242321]/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--background-raised)] shadow-2xl"
        ref={sheetRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p
              className="text-xs font-medium uppercase text-[var(--muted-soft)]"
              id={descriptionId}
            >
              Debt payment
            </p>
            <h2 className="truncate text-lg font-semibold text-[var(--foreground)]" id={titleId}>
              {debt.name}
            </h2>
          </div>
          <Button
            aria-label="Close debt payment editor"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="grid flex-1 content-start gap-3 overflow-y-auto p-4 sm:grid-cols-2">
            <PaymentSummaryStat label="Current balance" value={formatCurrency(currentBalance)} />
            <PaymentSummaryStat label="Payment" value={formatCurrency(paymentAmount)} emphasis />
            <PaymentSummaryStat
              label="Monthly payment"
              value={formatCurrency(monthlyPayment)}
              compact
            />
            <PaymentSummaryStat
              label="After payment"
              value={formatCurrency(Math.max(currentBalance - paymentAmount, 0))}
              compact
            />
            <div className="sm:col-span-2">
              <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                <span>Preset</span>
                <select
                  className={cn(
                    "h-9 rounded-lg border px-3 text-sm transition",
                    "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                    controlFocusVisibleRing,
                  )}
                  onChange={(event) => updatePaymentPreset(event.target.value)}
                  value={paymentPreset}
                >
                  <option value="monthly">Pay monthly payment</option>
                  <option value="custom">Custom amount</option>
                </select>
              </label>
            </div>
            {paymentPreset === "custom" ? (
              <div className="sm:col-span-2">
                <Field
                  aria-describedby={errors.customAmount ? `${titleId}-customAmount-error` : undefined}
                  aria-invalid={Boolean(errors.customAmount)}
                  label="Custom amount"
                  max={currentBalance}
                  min={0}
                  onChange={(event) => updateCustomAmount(event.target.value)}
                  step="0.01"
                  type="number"
                  value={customAmount}
                />
                {errors.customAmount ? (
                  <FieldError id={`${titleId}-customAmount-error`}>
                    {errors.customAmount}
                  </FieldError>
                ) : null}
              </div>
            ) : null}
            {formError ? (
              <div className="sm:col-span-2">
                <FieldError id={`${titleId}-payment-error`}>{formError}</FieldError>
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!hasPayment} type="submit" variant="primary">
              Pay
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function PaymentSummaryStat({
  label,
  value,
  compact = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border border-[var(--line)] bg-[var(--paper-subtle)] px-3 py-2",
        compact && "py-1.5",
        emphasis && "border-[var(--line-strong)] bg-[var(--paper)]",
      )}
    >
      <p className="truncate text-[10px] font-semibold uppercase text-[var(--muted-soft)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate font-mono font-semibold text-[var(--foreground)]",
          compact ? "text-sm" : "text-base",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CreditScoreSheet({
  entry,
  onClose,
  onSave,
}: {
  entry?: FinanceData["creditScoreHistory"][number];
  onClose: () => void;
  onSave: (entry: FinanceData["creditScoreHistory"][number]) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState({
    date: entry?.date ?? getDefaultDateInput(),
    notes: entry?.notes ?? "",
    score: entry ? String(entry.score) : "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      trapTabFocus(event, sheetRef.current);
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  const updateField = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const validateCreditScore = () => {
    const nextErrors: FormErrors = {};
    const score = Math.round(parseFiniteNumber(form.score) ?? 0);

    if (!parseDateInput(form.date)) {
      nextErrors.date = "Choose a valid date.";
    }

    if (!form.score.trim()) {
      nextErrors.score = "Enter a credit score.";
    } else if (score < 300 || score > 850) {
      nextErrors.score = "Score must be between 300 and 850.";
    }

    setErrors(nextErrors);
    return { errors: nextErrors, score };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateCreditScore();
    if (Object.keys(validation.errors).length > 0) {
      return;
    }

    onSave({
      id: entry?.id ?? createId("score"),
      date: form.date,
      notes: form.notes.trim(),
      score: validation.score,
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close credit score editor"
        className="absolute inset-0 bg-[#242321]/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--background-raised)] shadow-2xl"
        ref={sheetRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p
              className="text-xs font-medium uppercase text-[var(--muted-soft)]"
              id={descriptionId}
            >
              Credit score tracker
            </p>
            <h2 className="truncate text-lg font-semibold text-[var(--foreground)]" id={titleId}>
              {entry ? "Update score entry" : "Add score entry"}
            </h2>
          </div>
          <Button
            aria-label="Close credit score editor"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
            <div>
              <Field
                aria-describedby={errors.date ? `${titleId}-date-error` : undefined}
                aria-invalid={Boolean(errors.date)}
                label="Score date"
                onChange={(event) => updateField("date", event.target.value)}
                type="date"
                value={form.date}
              />
              {errors.date ? (
                <FieldError id={`${titleId}-date-error`}>{errors.date}</FieldError>
              ) : null}
            </div>
            <div>
              <Field
                aria-describedby={errors.score ? `${titleId}-score-error` : undefined}
                aria-invalid={Boolean(errors.score)}
                label="Credit score"
                max={850}
                min={300}
                onChange={(event) => updateField("score", event.target.value)}
                step={1}
                type="number"
                value={form.score}
              />
              {errors.score ? (
                <FieldError id={`${titleId}-score-error`}>{errors.score}</FieldError>
              ) : null}
            </div>
            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              <span>Notes</span>
              <textarea
                className={cn(
                  "min-h-28 rounded-lg border p-3 text-sm transition",
                  "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                  controlFocusVisibleRing,
                )}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Add what changed around this score check..."
                value={form.notes}
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save score
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function CreditScoreLedgerSheet({
  entries,
  onAdd,
  onClose,
  onEdit,
}: {
  entries: FinanceData["creditScoreHistory"];
  onAdd: () => void;
  onClose: () => void;
  onEdit: (entry: FinanceData["creditScoreHistory"][number]) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const sortedEntries = sortCreditScoreHistoryDescending(entries);

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>("button")?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      trapTabFocus(event, sheetRef.current);
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close credit score ledger"
        className="absolute inset-0 bg-[#242321]/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-[var(--line)] bg-[var(--background-raised)] shadow-2xl"
        ref={sheetRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p
              className="text-xs font-medium uppercase text-[var(--muted-soft)]"
              id={descriptionId}
            >
              Score history
            </p>
            <h2 className="truncate text-lg font-semibold text-[var(--foreground)]" id={titleId}>
              Credit score ledger
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" onClick={onAdd}>
              <Plus size={14} />
              Add score
            </Button>
            <Button
              aria-label="Close credit score ledger"
              size="icon"
              variant="ghost"
              onClick={onClose}
            >
              <X size={17} />
            </Button>
          </div>
        </div>
        <div className="grid flex-1 content-start gap-3 overflow-y-auto p-4">
          {sortedEntries.length === 0 ? (
            <EmptyState
              icon={<LineChartIcon size={18} />}
              title="No score history"
              description="Add a dated score entry to start the ledger."
              action={
                <Button variant="primary" onClick={onAdd}>
                  <Plus size={15} />
                  Add score
                </Button>
              }
            />
          ) : (
            sortedEntries.map((entry) => {
              const priorEntry = nextOlderCreditScoreEntry(sortedEntries, entry);
              const delta = priorEntry ? entry.score - priorEntry.score : null;

              return (
                <button
                  className={cn(
                    "grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3 text-left transition hover:bg-[var(--paper-subtle)] sm:grid-cols-[120px_1fr_auto]",
                    focusVisibleRing,
                  )}
                  key={entry.id}
                  onClick={() => onEdit(entry)}
                  type="button"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-[var(--foreground)]">
                      {entry.score}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDateLabel(entry.date)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-6 text-[var(--foreground-soft)]">
                      {entry.notes || "No notes"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    {delta !== null ? (
                      <Badge tone={delta >= 0 ? "green" : "red"}>
                        {delta >= 0 ? "+" : ""}
                        {delta}
                      </Badge>
                    ) : null}
                    <Badge tone={creditScoreBadgeTone(entry.score)}>
                      {creditScoreBand(entry.score)}
                    </Badge>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}

function PaymentPresetButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-7 items-center rounded-md border border-[var(--line-strong)] bg-[var(--paper)] px-2.5 text-xs font-medium text-[var(--foreground-soft)] transition",
        "hover:border-[var(--muted-soft)] hover:bg-[var(--paper-subtle)] disabled:pointer-events-none disabled:opacity-45",
        focusVisibleRing,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function WorkspaceLoadingShell() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <Card className="w-full max-w-sm p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)]">
            <Landmark size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold">{defaultWorkspaceName}</p>
            <p className="text-xs text-[var(--muted)]">Loading local workspace</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-2 rounded-full bg-[var(--paper-muted)]" />
          <div className="h-2 w-2/3 rounded-full bg-[var(--paper-muted)]" />
        </div>
      </Card>
    </div>
  );
}

function downloadFinanceBackup(data: FinanceData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `assetly-financial-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.URL.revokeObjectURL(url);
}

type StorageStatus = {
  message: string;
  tone: "green" | "amber" | "red";
};

function useFinanceStore() {
  const [data, setData] = useState<FinanceData>(mockFinanceData);
  const [storageReady, setStorageReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    message: "Loading local records",
    tone: "amber",
  });
  const skipNextStorageWriteRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      cleanupLocalWorkspaceStorage(getBrowserStorage());
      const result = readFinanceStorage();
      if (!result.ok) {
        skipNextStorageWriteRef.current = true;
      }
      const consolidated = consolidateStockHoldingsByTicker(result.data);
      const advanced = advanceFinanceSchedules(consolidated);
      const synced = syncTaxReports(advanced.data);
      const nextData = synced.data;
      setData(nextData);
      setStorageStatus(
        nextData === result.data &&
          consolidated === result.data &&
          !advanced.changed &&
          !synced.changed
          ? getStorageReadStatus(result)
          : getStorageWriteStatus(writeStoredFinanceData(nextData)),
      );
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setData((current) => consolidateStockHoldingsByTicker(current));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (skipNextStorageWriteRef.current) {
        skipNextStorageWriteRef.current = false;
        return;
      }

      setStorageStatus(getStorageWriteStatus(writeStoredFinanceData(data)));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [data, storageReady]);

  const upsertItem = (collection: CollectionKey, item: EditableItem) => {
    setData((current) => {
      if (collection === "stocks") {
        return upsertStockHoldingFromEditor(current, item as StockEditorItem);
      }

      const existingItems = current[collection] as EditableItem[];
      const exists = existingItems.some((entry) => entry.id === item.id);
      const nextItems = exists
        ? existingItems.map((entry) => (entry.id === item.id ? item : entry))
        : [item, ...existingItems];
      const nextData = {
        ...current,
        [collection]: nextItems,
      };

      return collection === "creditCards"
        ? advanceCreditCardCycles(nextData).data
        : shouldSyncTaxReportsForCollection(collection)
          ? syncTaxReports(nextData).data
          : nextData;
    });
  };

  const deleteItem = (collection: CollectionKey, id: string) => {
    if (collection === "stocks") {
      setData((current) => {
        const normalizedCurrent = consolidateStockHoldingsByTicker(current);

        return {
          ...normalizedCurrent,
          stockLots: normalizedCurrent.stockLots.filter((lot) => lot.stockId !== id),
          stocks: normalizedCurrent.stocks.filter((stock) => stock.id !== id),
        };
      });
      return;
    }

    setData((current) => {
      const nextData = {
        ...current,
        [collection]: (current[collection] as EditableItem[]).filter(
          (item) => item.id !== id,
        ),
      };

      return shouldSyncTaxReportsForCollection(collection)
        ? syncTaxReports(nextData).data
        : nextData;
    });
  };

  const upsertPaycheck = ({ incomeSource, paycheck }: PaycheckSavePayload) => {
    setData((current) => {
      const paycheckExists = current.paychecks.some((entry) => entry.id === paycheck.id);
      const sourceExists = incomeSource
        ? current.incomeSources.some((source) => source.id === incomeSource.id)
        : false;

      const nextData = {
        ...current,
        incomeSources: incomeSource
          ? sourceExists
            ? current.incomeSources.map((source) =>
                source.id === incomeSource.id ? incomeSource : source,
              )
            : [incomeSource, ...current.incomeSources]
          : current.incomeSources,
        paychecks: paycheckExists
          ? current.paychecks.map((entry) => (entry.id === paycheck.id ? paycheck : entry))
          : [paycheck, ...current.paychecks],
      };

      return syncTaxReports(nextData).data;
    });
  };

  const deletePaycheck = (id: string) => {
    setData((current) =>
      syncTaxReports({
        ...current,
        paychecks: current.paychecks.filter((paycheck) => paycheck.id !== id),
      }).data,
    );
  };

  const recordCreditCardPayment = (id: string, payment: CreditCardPaymentDraft) => {
    setData((current) => {
      const nextData = {
        ...current,
        creditCards: current.creditCards.map((card) =>
          card.id === id ? applyCreditCardPayment(card, payment) : card,
        ),
      };

      return advanceCreditCardCycles(nextData).data;
    });
  };

  const recordDebtPayment = (id: string, payment: DebtPaymentDraft) => {
    setData((current) => {
      const existingDebt = current.debts.find((debt) => debt.id === id);
      if (!existingDebt) {
        return current;
      }

      const nextDebt = advanceDebtScheduleAfterPayment(
        applyDebtPayment(existingDebt, payment),
      );
      const paidAmount = Math.max(existingDebt.currentBalance - nextDebt.currentBalance, 0);
      if (paidAmount <= 0) {
        return current;
      }

      const nextData = {
        ...current,
        debts: current.debts.map((debt) => (debt.id === id ? nextDebt : debt)),
      };
      const beforeSummary = calculateSummary(current);
      const afterSummary = calculateSummary(nextData);

      return {
        ...nextData,
        debtPayments: [
          {
            amount: paidAmount,
            balanceAfter: nextDebt.currentBalance,
            balanceBefore: existingDebt.currentBalance,
            date: formatDateInput(),
            debtId: existingDebt.id,
            debtName: existingDebt.name,
            id: createId("debt-pay"),
            totalDebtAfter: afterSummary.totalDebtWithCreditCards,
            totalDebtBefore: beforeSummary.totalDebtWithCreditCards,
          },
          ...current.debtPayments,
        ],
      };
    });
  };

  const upsertCreditScore = (entry: FinanceData["creditScoreHistory"][number]) => {
    setData((current) => {
      const existing = current.creditScoreHistory.some((item) => item.id === entry.id);
      const nextHistory = existing
        ? current.creditScoreHistory.map((item) =>
            item.id === entry.id ? entry : item,
          )
        : [entry, ...current.creditScoreHistory];

      return {
        ...current,
        creditScoreHistory: sortCreditScoreHistoryDescending(nextHistory),
      };
    });
  };

  const upsertStockLot = (lot: FinanceData["stockLots"][number]) => {
    setData((current) => {
      const normalizedCurrent = consolidateStockHoldingsByTicker(current);
      if (normalizedCurrent.taxAssetSales.some((sale) => sale.stockLotId === lot.id)) {
        window.alert("This purchase has already been used in a tax sale. Keep it unchanged for tax history.");
        return normalizedCurrent;
      }

      const stock = normalizedCurrent.stocks.find((item) => item.id === lot.stockId);
      if (!stock) {
        return normalizedCurrent;
      }

      const normalizedLot = {
        ...lot,
        remainingShares: Math.min(lot.remainingShares, lot.shares),
        ticker: stock.ticker,
      };
      const lotExists = normalizedCurrent.stockLots.some((item) => item.id === lot.id);
      const nextLots = lotExists
        ? normalizedCurrent.stockLots.map((item) =>
            item.id === lot.id ? normalizedLot : item,
          )
        : [normalizedLot, ...normalizedCurrent.stockLots];
      const nextStock = recalculateStockHoldingFromLots(stock, nextLots);

      return consolidateStockHoldingsByTicker({
        ...normalizedCurrent,
        stockLots: nextLots,
        stocks: normalizedCurrent.stocks.map((item) =>
          item.id === stock.id ? nextStock : item,
        ),
      });
    });
  };

  const deleteStockLot = (id: string) => {
    setData((current) => {
      const normalizedCurrent = consolidateStockHoldingsByTicker(current);
      if (normalizedCurrent.taxAssetSales.some((sale) => sale.stockLotId === id)) {
        window.alert("This purchase has already been used in a tax sale. Keep it for tax history.");
        return normalizedCurrent;
      }

      const lot = normalizedCurrent.stockLots.find((item) => item.id === id);
      const nextLots = normalizedCurrent.stockLots.filter((item) => item.id !== id);
      const nextStocks = lot
        ? normalizedCurrent.stocks.map((stock) =>
            stock.id === lot.stockId
              ? recalculateStockHoldingFromLots(stock, nextLots)
              : stock,
          )
        : normalizedCurrent.stocks;

      return consolidateStockHoldingsByTicker({
        ...normalizedCurrent,
        stockLots: nextLots,
        stocks: nextStocks,
      });
    });
  };

  const applyStockTrade = (stockId: string, trade: StockTradeDraft) => {
    setData((current) => {
      const requestedHolding = current.stocks.find((stock) => stock.id === stockId);
      const normalizedCurrent = consolidateStockHoldingsByTicker(current);
      const holding =
        normalizedCurrent.stocks.find((stock) => stock.id === stockId) ??
        (requestedHolding
          ? normalizedCurrent.stocks.find(
              (stock) => stock.ticker === requestedHolding.ticker.toUpperCase(),
            )
          : undefined);
      if (!holding) {
        return normalizedCurrent;
      }

      const tradeInput = {
        fees: trade.fees,
        kind: trade.kind,
        price: trade.price,
        shares: trade.shares,
      };

      if (trade.kind === "buy") {
        const nextLot = createStockLotFromBuy({
          acquiredDate: trade.acquiredDate,
          broker: trade.broker,
          dateIsEstimate: trade.dateIsEstimate,
          holding,
          id: createId("lot"),
          notes: trade.notes,
          trade: tradeInput,
        });
        const nextLots = [nextLot, ...normalizedCurrent.stockLots];
        const nextHolding = {
          ...recalculateStockHoldingFromLots(
            { ...holding, currentPrice: trade.price || holding.currentPrice },
            nextLots,
          ),
          notes: appendStockTradeNote(holding.notes, trade),
        };

        return consolidateStockHoldingsByTicker({
          ...normalizedCurrent,
          stockLots: nextLots,
          stocks: normalizedCurrent.stocks.map((stock) =>
            stock.id === holding.id ? nextHolding : stock,
          ),
        });
      }

      const saleGroupId = createId("sale");
      const sold = sellStockLotsFifo({
        holding,
        lots: normalizedCurrent.stockLots,
        notes: trade.notes,
        saleGroupId,
        soldDate: trade.tradeDate,
        trade: tradeInput,
      });
      if (sold.error) {
        window.alert(sold.error);
        return normalizedCurrent;
      }
      const nextHolding = {
        ...recalculateStockHoldingFromLots(
          { ...holding, currentPrice: trade.price || holding.currentPrice },
          sold.lots,
        ),
        notes: appendStockTradeNote(holding.notes, {
          ...trade,
          shares: sold.soldShares,
        }),
      };
      const nextTaxSales =
        trade.addTaxRecord
          ? sold.taxSales.map((sale) => ({ id: createId("tax"), ...sale }))
          : [];

      const nextData = {
        ...normalizedCurrent,
        stockLots: sold.lots,
        stocks: normalizedCurrent.stocks.map((stock) =>
          stock.id === holding.id ? nextHolding : stock,
        ),
        taxAssetSales: nextTaxSales.length > 0
          ? [...nextTaxSales, ...normalizedCurrent.taxAssetSales]
          : normalizedCurrent.taxAssetSales,
      };

      const finalData = nextTaxSales.length > 0 ? syncTaxReports(nextData).data : nextData;
      return consolidateStockHoldingsByTicker(finalData);
    });
  };

  const resetData = () => {
    const nextData = syncTaxReports(mockFinanceData).data;
    setData(nextData);
    setStorageStatus(getStorageWriteStatus(writeStoredFinanceData(nextData)));
  };

  const importData = (nextData: FinanceData) => {
    const consolidated = consolidateStockHoldingsByTicker(nextData);
    const cycled = advanceCreditCardCycles(consolidated);
    const synced = syncTaxReports(cycled.data);
    setData(synced.data);
    setStorageStatus(getStorageWriteStatus(writeStoredFinanceData(synced.data)));
  };

  const applyMarketPriceUpdates = (result: MarketDataRefreshResult) => {
    setData((current) =>
      consolidateStockHoldingsByTicker(
        applyMarketDataRefreshResult(consolidateStockHoldingsByTicker(current), result),
      ),
    );
  };

  const clearDemoData = () => {
    const nextData = syncTaxReports(removeDemoFinanceData(data)).data;
    setData(nextData);
    setStorageStatus(getStorageWriteStatus(writeStoredFinanceData(nextData)));
  };

  const updateWorkspace = (workspace: Partial<FinanceData["workspace"]>) => {
    setData((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        ...workspace,
      },
    }));
  };

  const updateTaxProfile = (taxProfile: Partial<FinanceData["taxProfile"]>) => {
    setData((current) =>
      syncTaxReports({
        ...current,
        taxProfile: {
          ...current.taxProfile,
          ...taxProfile,
        },
      }).data,
    );
  };

  const regenerateTaxReport = (taxYear: number) => {
    setData((current) => regenerateTaxYearReport(current, taxYear));
  };

  const updateTaxReportNotes = (taxYear: number, notes: string) => {
    setData((current) => ({
      ...current,
      taxReports: current.taxReports.map((report) =>
        report.taxYear === taxYear
          ? { ...report, notes, updatedAt: new Date().toISOString() }
          : report,
      ),
    }));
  };

  return {
    data,
    upsertItem,
    upsertPaycheck,
    upsertStockLot,
    applyMarketPriceUpdates,
    applyStockTrade,
    clearDemoData,
    deleteItem,
    deletePaycheck,
    deleteStockLot,
    resetData,
    importData,
    recordCreditCardPayment,
    recordDebtPayment,
    upsertCreditScore,
    regenerateTaxReport,
    storageReady,
    storageStatus,
    updateTaxProfile,
    updateTaxReportNotes,
    updateWorkspace,
  };
}

function useFinanceAgentSettings() {
  const [agentSettings, setAgentSettings] = useState<FinanceAgentSettings>({
    ...defaultFinanceAgentSettings,
  });
  const [agentSettingsReady, setAgentSettingsReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storage = getBrowserStorage();
      setAgentSettings(
        normalizeFinanceAgentSettingsJson(
          storage?.getItem(financeAgentSettingsStorageKey) ?? null,
        ),
      );
      setAgentSettingsReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const updateAgentSettings = (settings: Partial<FinanceAgentSettings>) => {
    setAgentSettings((current) => {
      const selectedPreset = settings.preset
        ? getFinanceAgentProviderPreset(settings.preset)
        : null;
      const next = {
        ...current,
        ...(selectedPreset && selectedPreset.id !== "custom"
          ? {
              baseURL: selectedPreset.baseURL,
              model: selectedPreset.defaultModel,
              providerName: selectedPreset.providerName,
            }
          : null),
        ...settings,
        provider: "openai-compatible" as const,
      };
      getBrowserStorage()?.setItem(financeAgentSettingsStorageKey, JSON.stringify(next));
      return next;
    });
  };

  return { agentSettings, agentSettingsReady, updateAgentSettings };
}

function useFinnhubSettings() {
  const [finnhubSettings, setFinnhubSettings] = useState<FinnhubSettings>({
    ...defaultFinnhubSettings,
  });
  const [finnhubSettingsReady, setFinnhubSettingsReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storage = getBrowserStorage();
      setFinnhubSettings(
        normalizeFinnhubSettingsJson(storage?.getItem(finnhubSettingsStorageKey) ?? null),
      );
      setFinnhubSettingsReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const updateFinnhubSettings = (settings: Partial<FinnhubSettings>) => {
    setFinnhubSettings((current) => {
      const next = {
        ...current,
        ...settings,
      };
      getBrowserStorage()?.setItem(finnhubSettingsStorageKey, JSON.stringify(next));
      return next;
    });
  };

  return { finnhubSettings, finnhubSettingsReady, updateFinnhubSettings };
}

function useCoinGeckoSettings() {
  const [coingeckoSettings, setCoinGeckoSettings] = useState<CoinGeckoSettings>({
    ...defaultCoinGeckoSettings,
  });
  const [coingeckoSettingsReady, setCoinGeckoSettingsReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storage = getBrowserStorage();
      setCoinGeckoSettings(
        normalizeCoinGeckoSettingsJson(storage?.getItem(coingeckoSettingsStorageKey) ?? null),
      );
      setCoinGeckoSettingsReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const updateCoinGeckoSettings = (settings: Partial<CoinGeckoSettings>) => {
    setCoinGeckoSettings((current) => {
      const next = {
        ...current,
        ...settings,
      };
      getBrowserStorage()?.setItem(coingeckoSettingsStorageKey, JSON.stringify(next));
      return next;
    });
  };

  return { coingeckoSettings, coingeckoSettingsReady, updateCoinGeckoSettings };
}

type PreparedFinanceAgentAction =
  | { collection: CollectionKey; item: EditableItem; type: "upsertItem" }
  | { collection: CollectionKey; id: string; type: "deleteItem" }
  | { taxProfile: FinanceData["taxProfile"]; type: "updateTaxProfile" }
  | {
      cardId: string;
      payment: CreditCardPaymentDraft;
      type: "recordCreditCardPayment";
    }
  | { entry: FinanceData["creditScoreHistory"][number]; type: "upsertCreditScore" };

type FinanceAgentApplyHandlers = {
  deleteItem: (collection: CollectionKey, id: string) => void;
  recordCreditCardPayment: (id: string, payment: CreditCardPaymentDraft) => void;
  updateTaxProfile: (taxProfile: Partial<FinanceData["taxProfile"]>) => void;
  upsertCreditScore: (entry: FinanceData["creditScoreHistory"][number]) => void;
  upsertItem: (collection: CollectionKey, item: EditableItem) => void;
};

function prepareFinanceAgentAction(
  action: FinanceAgentAction,
  data: FinanceData,
): PreparedFinanceAgentAction {
  if (action.type === "upsertItem") {
    return {
      collection: action.collection,
      item: prepareFinanceAgentItem(action.collection, action.item, data),
      type: "upsertItem",
    };
  }

  if (action.type === "deleteItem") {
    const exists = data[action.collection].some((item) => item.id === action.id);
    if (!exists) {
      throw new Error(`Could not find ${action.collection} record ${action.id}.`);
    }

    return { collection: action.collection, id: action.id, type: "deleteItem" };
  }

  if (action.type === "updateTaxProfile") {
    const normalized = normalizeFinanceData(
      {
        ...data,
        taxProfile: {
          ...data.taxProfile,
          ...action.updates,
        },
      },
      data,
    );
    if (!normalized.ok) {
      throw new Error("The tax profile update did not pass validation.");
    }

    return { taxProfile: normalized.data.taxProfile, type: "updateTaxProfile" };
  }

  if (action.type === "recordCreditCardPayment") {
    const card = data.creditCards.find((item) => item.id === action.cardId);
    if (!card) {
      throw new Error(`Could not find credit card ${action.cardId}.`);
    }

    const payment = {
      interestPayment: Math.max(parseFiniteNumber(action.payment.interestPayment) ?? 0, 0),
      statementPayment: Math.max(parseFiniteNumber(action.payment.statementPayment) ?? 0, 0),
    };
    if (payment.interestPayment + payment.statementPayment <= 0) {
      throw new Error("Credit card payment must be greater than zero.");
    }
    if (payment.statementPayment > creditStatementRemaining(card)) {
      throw new Error("Statement payment cannot exceed the remaining statement balance.");
    }
    if (payment.interestPayment > creditInterestBalance(card)) {
      throw new Error("Interest payment cannot exceed the carried balance.");
    }

    return { cardId: action.cardId, payment, type: "recordCreditCardPayment" };
  }

  const record = readAgentRecord(action.entry, "credit score entry");
  const date = readAgentString(record.date);
  const score = Math.round(parseFiniteNumber(record.score) ?? 0);
  if (!parseDateInput(date)) {
    throw new Error("Credit score entry needs a valid date.");
  }
  if (score < 300 || score > 850) {
    throw new Error("Credit score must be between 300 and 850.");
  }

  return {
    entry: {
      date,
      id: readAgentString(record.id) || createId("score"),
      notes: readAgentString(record.notes),
      score,
    },
    type: "upsertCreditScore",
  };
}

function applyPreparedFinanceAgentAction(
  action: PreparedFinanceAgentAction,
  handlers: FinanceAgentApplyHandlers,
) {
  if (action.type === "upsertItem") {
    handlers.upsertItem(action.collection, action.item);
    return;
  }
  if (action.type === "deleteItem") {
    handlers.deleteItem(action.collection, action.id);
    return;
  }
  if (action.type === "updateTaxProfile") {
    handlers.updateTaxProfile(action.taxProfile);
    return;
  }
  if (action.type === "recordCreditCardPayment") {
    handlers.recordCreditCardPayment(action.cardId, action.payment);
    return;
  }
  handlers.upsertCreditScore(action.entry);
}

function prepareFinanceAgentItem(
  collection: CollectionKey,
  value: Record<string, unknown>,
  data: FinanceData,
) {
  const config = formConfigs[collection];
  const record = readAgentRecord(value, collection);
  const id = readAgentString(record.id) || createId(config.prefix);
  const existing = (data[collection] as EditableItem[]).find((item) => item.id === id);
  const form: Record<string, FormValue> = {
    ...(config.defaults as Record<string, FormValue>),
  };

  if (existing) {
    Object.entries(existing as Record<string, unknown>).forEach(([key, itemValue]) => {
      form[key] = toAgentFormValue(itemValue);
    });
  }

  Object.entries(record).forEach(([key, itemValue]) => {
    if (key !== "id") {
      form[key] = toAgentFormValue(itemValue);
    }
  });

  const validation = validateEditorForm(config, form);
  const errors = Object.values(validation.errors);
  if (errors.length > 0) {
    throw new Error(`${config.title} proposal is invalid: ${errors[0]}`);
  }

  return {
    id,
    ...validation.values,
  } as EditableItem;
}

function toAgentFormValue(value: unknown): FormValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return "";
}

function readAgentRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new Error(`The ${label} proposal is missing a valid record.`);
}

function readAgentString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBrowserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function focusFirstInContainer(container: HTMLElement | null) {
  container?.querySelector<HTMLElement>(focusableSelector)?.focus();
}

function trapTabFocus(event: KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== "Tab" || !container) {
    return;
  }

  const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((element) => element.offsetParent !== null || element === document.activeElement);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (!firstElement || !lastElement) {
    event.preventDefault();
    container.focus();
    return;
  }

  if (!container.contains(document.activeElement)) {
    event.preventDefault();
    firstElement.focus();
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function createWeeklyReportSnapshot(now = new Date()): WeeklyReportSnapshot {
  const reportStart = startOfCalendarDay(now);
  const reportWindow = getWeeklyReportWindow(reportStart);

  return {
    generatedAt: now.toISOString(),
    weekEndDate: formatDateInput(reportWindow.endDate),
    weekStartDate: formatDateInput(reportWindow.startDate),
  };
}

function ensureCurrentWeeklyReportSnapshot(storage: Storage | null, now = new Date()) {
  const currentSnapshot = createWeeklyReportSnapshot(now);
  const storedSnapshot = readWeeklyReportSnapshot(storage);

  if (
    storedSnapshot &&
    storedSnapshot.weekStartDate === currentSnapshot.weekStartDate &&
    storedSnapshot.weekEndDate === currentSnapshot.weekEndDate
  ) {
    return { generated: false, snapshot: storedSnapshot };
  }

  writeWeeklyReportSnapshot(storage, currentSnapshot);
  return { generated: true, snapshot: currentSnapshot };
}

function readWeeklyReportSnapshot(storage: Storage | null) {
  if (!storage) {
    return null;
  }

  try {
    return normalizeWeeklyReportSnapshot(
      JSON.parse(storage.getItem(weeklyReportSnapshotStorageKey) ?? "null"),
    );
  } catch {
    return null;
  }
}

function writeWeeklyReportSnapshot(
  storage: Storage | null,
  snapshot: WeeklyReportSnapshot,
) {
  if (!storage) {
    return;
  }

  storage.setItem(weeklyReportSnapshotStorageKey, JSON.stringify(snapshot));
}

function normalizeWeeklyReportSnapshot(value: unknown): WeeklyReportSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const generatedAt = typeof record.generatedAt === "string" ? record.generatedAt : "";
  const weekStartDate =
    typeof record.weekStartDate === "string" ? record.weekStartDate : "";
  const weekEndDate = typeof record.weekEndDate === "string" ? record.weekEndDate : "";

  if (
    Number.isNaN(Date.parse(generatedAt)) ||
    !parseDateInput(weekStartDate) ||
    !parseDateInput(weekEndDate)
  ) {
    return null;
  }

  return {
    generatedAt,
    weekEndDate,
    weekStartDate,
  };
}

function readDismissedNoticeIds(storage: Storage | null) {
  if (!storage) {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(storage.getItem(dismissedNoticeStorageKey) ?? "[]");
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [],
    );
  } catch {
    return new Set<string>();
  }
}

function writeDismissedNoticeIds(storage: Storage | null, ids: Set<string>) {
  if (!storage) {
    return;
  }

  storage.setItem(dismissedNoticeStorageKey, JSON.stringify([...ids]));
}

function shouldSyncTaxReportsForCollection(collection: CollectionKey) {
  return collection === "investments" ||
    collection === "incomeSources" ||
    collection === "taxAssetSales";
}

type StockEditorItem = FinanceData["stocks"][number] & {
  acquiredDate?: string;
  broker?: string;
  dateIsEstimate?: boolean;
  initialFees?: number;
};

function upsertStockHoldingFromEditor(
  current: FinanceData,
  item: StockEditorItem,
): FinanceData {
  const existingStock = current.stocks.find((stock) => stock.id === item.id);
  const cleanStock = {
    averageCost: Math.max(Number(item.averageCost) || 0, 0),
    company: item.company,
    currentPrice: Math.max(Number(item.currentPrice) || 0, 0),
    id: item.id,
    marketPriceError: item.marketPriceError,
    marketPriceLastAttemptAt: item.marketPriceLastAttemptAt,
    marketPriceStatus: item.marketPriceStatus,
    marketPriceUpdatedAt: item.marketPriceUpdatedAt,
    notes: item.notes,
    shares: Math.max(Number(item.shares) || 0, 0),
    ticker: item.ticker.toUpperCase(),
  };

  if (!existingStock) {
    return stackStockPurchase(current, {
      acquiredDate: item.acquiredDate || getDefaultDateInput({ months: -12 }),
      broker: item.broker ?? "",
      company: cleanStock.company,
      currentPrice: cleanStock.currentPrice,
      dateIsEstimate: Boolean(item.dateIsEstimate),
      fees: Math.max(Number(item.initialFees) || 0, 0),
      lotId: createId("lot"),
      notes: item.notes,
      pricePerShare: cleanStock.averageCost,
      shares: cleanStock.shares,
      stockId: cleanStock.id,
      ticker: cleanStock.ticker,
    });
  }

  const nextLots = current.stockLots.map((lot) =>
    lot.stockId === cleanStock.id ? { ...lot, ticker: cleanStock.ticker } : lot,
  );
  const nextStock = recalculateStockHoldingFromLots(cleanStock, nextLots);

  return consolidateStockHoldingsByTicker({
    ...current,
    stockLots: nextLots,
    stocks: current.stocks.map((stock) => (stock.id === cleanStock.id ? nextStock : stock)),
  });
}

function getStorageReadStatus(result: ReturnType<typeof readFinanceStorage>): StorageStatus {
  if (!result.storageAvailable) {
    return { message: "Storage unavailable", tone: "amber" };
  }

  if (!result.ok) {
    return { message: "Saved data reset after a validation issue", tone: "red" };
  }

  if (result.issues.length > 0) {
    return { message: "Saved data loaded with minor repairs", tone: "amber" };
  }

  return {
    message: result.migrated ? "Saved data migrated" : "Saved locally",
    tone: "green",
  };
}

function getStorageWriteStatus(
  result: ReturnType<typeof writeStoredFinanceData>,
): StorageStatus {
  if (!result.storageAvailable) {
    return { message: "Storage unavailable", tone: "amber" };
  }

  if (!result.ok) {
    return { message: "Save failed", tone: "red" };
  }

  return { message: "Saved locally", tone: "green" };
}

type SearchResult = {
  id: string;
  collection: CollectionKey;
  section: SectionKey;
  title: string;
  detail: string;
  item: EditableItem;
};

const collectionSections: Record<CollectionKey, SectionKey> = {
  investments: "investing",
  stocks: "stocks",
  crypto: "crypto",
  incomeSources: "income",
  taxAssetSales: "tax",
  savingsGoals: "savings",
  creditCards: "cards",
  debts: "cards",
  recurringPayments: "recurring",
};

function sectionFromHash(hash: string) {
  const normalized = hash.replace(/^#/, "").trim().toLowerCase();
  return (
    Object.entries(sectionHashes).find(([, value]) => value === normalized)?.[0] as
      | SectionKey
      | undefined
  );
}

function getSearchResults(data: FinanceData, query: string): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return (Object.keys(collectionLabels) as CollectionKey[])
    .flatMap((collection) =>
      (data[collection] as EditableItem[]).map((item) => {
        const { title, detail } = recordTitle(collection, item);
        return {
          id: item.id,
          collection,
          detail,
          item,
          section: collectionSections[collection],
          title,
        };
      }),
    )
    .filter((result) =>
      JSON.stringify(result.item).toLowerCase().includes(normalized) ||
      result.title.toLowerCase().includes(normalized) ||
      result.detail.toLowerCase().includes(normalized),
    )
    .slice(0, 12);
}

function recordTitle(collection: CollectionKey, item: EditableItem) {
  switch (collection) {
    case "investments": {
      const investment = item as FinanceData["investments"][number];
      return { title: investment.name, detail: investment.type };
    }
    case "stocks": {
      const stock = item as FinanceData["stocks"][number];
      return { title: stock.ticker, detail: stock.company };
    }
    case "crypto": {
      const holding = item as FinanceData["crypto"][number];
      return { title: holding.coin, detail: holding.symbol };
    }
    case "incomeSources": {
      const source = item as FinanceData["incomeSources"][number];
      return { title: source.name, detail: source.category };
    }
    case "taxAssetSales": {
      const sale = item as FinanceData["taxAssetSales"][number];
      return { title: sale.symbol, detail: sale.name };
    }
    case "savingsGoals": {
      const goal = item as FinanceData["savingsGoals"][number];
      return { title: goal.name, detail: goal.isEmergency ? "Emergency fund" : "Savings goal" };
    }
    case "creditCards": {
      const card = item as FinanceData["creditCards"][number];
      return { title: card.cardName, detail: card.issuer };
    }
    case "debts": {
      const debt = item as FinanceData["debts"][number];
      return { title: debt.name, detail: debt.lender || debt.type };
    }
    case "recurringPayments": {
      const payment = item as FinanceData["recurringPayments"][number];
      return { title: payment.name, detail: payment.category };
    }
  }
}

function SearchResults({
  query,
  results,
  onOpen,
}: {
  query: string;
  results: SearchResult[];
  onOpen: (result: SearchResult) => void;
}) {
  return (
    <Card className="mb-5 overflow-hidden">
      <CardHeader title="Search results" eyebrow={`${results.length} matches`}>
        Results for &quot;{query.trim()}&quot;
      </CardHeader>
      {results.length === 0 ? (
        <EmptyState
          icon={<Search size={18} />}
          title="No matching records"
          description="Try a card name, ticker, payment method, amount, note, or category."
        />
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {results.map((result) => (
            <button
              key={`${result.collection}-${result.id}`}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[var(--paper-subtle)]",
                focusVisibleRing,
              )}
              onClick={() => onOpen(result)}
              type="button"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--foreground-soft)]">
                  {result.title}
                </p>
                <p className="truncate text-xs text-[var(--muted)]">{result.detail}</p>
              </div>
              <Badge tone="blue">{navItems.find((item) => item.key === result.section)?.label}</Badge>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

type UpcomingCreditCardPayment = {
  amount: number;
  card: FinanceData["creditCards"][number];
  daysUntilDue: number;
};

function getUpcomingCreditCardPayments(data: FinanceData): UpcomingCreditCardPayment[] {
  return data.creditCards
    .map((card) => ({
      amount: creditStatementRemaining(card),
      card,
      daysUntilDue: getDaysUntilDate(card.autopay ? card.autopayDate || card.dueDate : card.dueDate),
    }))
    .filter(
      (
        payment,
      ): payment is UpcomingCreditCardPayment =>
        payment.amount > 0 &&
        payment.daysUntilDue !== null &&
        payment.daysUntilDue <= 7,
    )
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

function DemoDataNotice({ onClear }: { onClear: () => void }) {
  return (
    <section
      className="mb-4 flex flex-col gap-3 rounded-lg border border-[var(--tone-blue-border)] bg-[var(--tone-blue-bg)] p-3 text-[var(--tone-blue-fg)] sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={16} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Clear demo data</p>
          <p className="mt-1 text-sm leading-6">
            Remove Assetly sample records before entering your real financial data.
          </p>
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={onClear}>
        <Trash2 size={14} />
        Clear demo data
      </Button>
    </section>
  );
}

function CreditCardPaymentNotice({
  payments,
  onViewCards,
}: {
  payments: UpcomingCreditCardPayment[];
  onViewCards: () => void;
}) {
  if (payments.length === 0) {
    return null;
  }

  const totalDue = payments.reduce((total, payment) => total + payment.amount, 0);
  const soonest = payments[0];
  const overduePayments = payments.filter((payment) => payment.daysUntilDue < 0);
  const hasOverdue = overduePayments.length > 0;
  const title = hasOverdue
    ? overduePayments.length === 1
      ? "Missed credit card payment"
      : "Missed credit card payments"
    : payments.length === 1
      ? "Credit card payment due soon"
      : "Credit card payments due soon";
  const text =
    payments.length === 1
      ? `${soonest.card.cardName}: ${formatCurrency(soonest.amount)} statement balance left, ${paymentDuePhrase(soonest.card.dueDate)}.`
      : hasOverdue
        ? `${overduePayments.length} missed statement payments need attention. Total statement balance left: ${formatCurrency(totalDue)}. Oldest: ${soonest.card.cardName}, ${paymentDuePhrase(soonest.card.dueDate)}.`
        : `${payments.length} statement payments totaling ${formatCurrency(totalDue)} are due in the next 7 days. Soonest: ${soonest.card.cardName}, ${paymentDuePhrase(soonest.card.dueDate)}.`;
  const tones = hasOverdue
    ? "border-[var(--tone-red-border)] bg-[var(--tone-red-bg)] text-[var(--tone-red-fg)]"
    : "border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] text-[var(--tone-amber-fg)]";

  return (
    <section
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between",
        tones,
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={16} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6">{text}</p>
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={onViewCards}>
        View cards
      </Button>
    </section>
  );
}

function paymentDuePhrase(date: string) {
  const status = getDueDateStatus(date);
  if (status.label === "Due today") {
    return "due today";
  }

  if (status.isOverdue) {
    return status.label;
  }

  return `due in ${status.label}`;
}

function Sidebar({
  activeSection,
  onSelect,
  onOpenAgent,
  netWorth,
  storageReady,
  storageStatus,
  workspaceName,
}: {
  activeSection: SectionKey;
  onSelect: (section: SectionKey) => void;
  onOpenAgent: () => void;
  netWorth: number;
  storageReady: boolean;
  storageStatus: StorageStatus;
  workspaceName: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center gap-3 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] shadow-sm">
          <Landmark size={17} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{workspaceName}</p>
          <p className="truncate text-xs text-[var(--muted)]">Private finance workspace</p>
        </div>
      </div>
      <div className="mb-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3">
        <p className="text-[11px] font-medium uppercase text-[var(--muted-soft)]">Net worth</p>
        <p className="mt-1 font-mono text-xl font-semibold">{formatCurrency(netWorth)}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>Storage</span>
          <Badge tone={storageReady ? storageStatus.tone : "amber"}>
            {storageReady ? storageStatus.message : "Loading"}
          </Badge>
        </div>
      </div>
      <nav aria-label="Workspace sections" className="grid gap-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            aria-current={activeSection === item.key ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2 rounded-lg px-2.5 text-left text-sm transition",
              focusVisibleRing,
              activeSection === item.key
                ? "bg-[var(--paper-muted)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--paper-subtle)] hover:text-[var(--foreground)]",
            )}
            data-demo-nav="true"
            onClick={() => onSelect(item.key)}
            type="button"
          >
            <span className="grid h-6 w-6 place-items-center text-[var(--muted)]">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
        <button
          className={cn(
            "mt-1 flex h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2.5 text-left text-sm text-[var(--foreground-soft)] shadow-sm transition hover:border-[var(--line-strong)] hover:bg-[var(--paper-subtle)]",
            focusVisibleRing,
          )}
          onClick={onOpenAgent}
          type="button"
        >
          <span className="grid h-6 w-6 place-items-center text-[var(--muted)]">
            <Bot size={16} />
          </span>
          <span className="truncate">Spawn AI Agent</span>
        </button>
      </nav>
      <div className="mt-auto rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck size={16} />
          Local browser data
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          Saved in this browser profile only. It is not encrypted or synced by this app.
        </p>
      </div>
    </div>
  );
}

function DashboardSection({
  chartPalette,
  data,
  summary,
  onEdit,
}: {
  chartPalette: ChartPalette;
  data: FinanceData;
  summary: ReturnType<typeof calculateSummary>;
  onEdit: (collection: CollectionKey, item: EditableItem) => void;
}) {
  const netWorthHistory = removeDemoNetWorthHistory(data.netWorthHistory);
  const netWorthSeries = withCurrentValue(netWorthHistory, summary.totalNetWorth);
  const scheduledMonthlyExpenses =
    summary.monthlyRecurring + getMonthlyDebtPaymentTotal(data);
  const incomeExpenseSeries = getDashboardIncomeExpenseSeries(data, scheduledMonthlyExpenses);
  const netWorthTrend = trendFromSeries(netWorthSeries);

  return (
    <div className="grid gap-5">
      <NoticeCard
        tone="amber"
        title="Privacy and accuracy"
        text="This workspace stores financial records in localStorage on this device. Values are manual estimates, and manual investment accounts may overlap with stock or crypto holdings if you enter the same assets twice."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={<WalletCards size={18} />}
          label="Total net worth"
          value={formatCurrency(summary.totalNetWorth)}
          trend={`${formatPercent(netWorthTrend)} vs first saved month`}
          trendTone={netWorthTrend >= 0 ? "green" : "red"}
          chartPalette={chartPalette}
          sparkline={netWorthSeries.map((point) => point.value)}
        />
        <MetricCard
          icon={<Banknote size={18} />}
          label="Monthly income"
          value={formatCurrency(summary.monthlyIncome)}
          trend="Current active sources"
          trendTone="green"
          chartPalette={chartPalette}
          sparkline={incomeExpenseSeries.map((point) => point.income)}
        />
        <MetricCard
          icon={<ChartPie size={18} />}
          label="Total investments"
          value={formatCurrency(summary.totalInvestments)}
          trend={formatPercent(summary.investmentGainPercent)}
          trendTone={summary.investmentGainPercent >= 0 ? "green" : "red"}
          chartPalette={chartPalette}
        />
        <MetricCard
          icon={<PiggyBank size={18} />}
          label="Emergency fund"
          value={formatCurrency(summary.emergencyFund?.currentSaved ?? 0)}
          trend={`${emergencyProgress(summary).toFixed(1)}% funded`}
          trendTone="blue"
        />
        <MetricCard
          icon={<CreditCard size={18} />}
          label="Card current balance"
          value={formatCurrency(summary.totalCreditCurrentBalance)}
          trend={`${summary.creditUtilization.toFixed(1)}% utilization`}
          trendTone={summary.creditUtilization > 30 ? "amber" : "green"}
        />
        <MetricCard
          icon={<CalendarClock size={18} />}
          label="Recurring payments"
          value={formatCurrency(summary.monthlyRecurring)}
          trend="Next 30 days"
          trendTone="neutral"
        />
      </div>

      <CashCalendar data={data} onEdit={onEdit} />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Net worth trend" eyebrow="Current value adjusted">
            Last point reflects current manual records.
          </CardHeader>
          <div className="px-4 py-4">
            <LineChart data={netWorthSeries} color={chartPalette.primary} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Portfolio allocation" eyebrow="Assets" />
          <div className="px-4 py-5">
            <DonutChart data={portfolioAllocation(summary, chartPalette)} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5">
        <Card>
          <CardHeader title="Income vs expenses" eyebrow="Monthly flow">
            Past months use paycheck totals. Current and future months use active income sources. Expenses include recurring payments and scheduled debt payments.
          </CardHeader>
          <div className="px-4">
            <IncomeExpenseChart
              colors={{
                expenses: chartPalette.expenses,
                income: chartPalette.primary,
              }}
              data={incomeExpenseSeries}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function WeeklyReportSection({
  agentReportGenerating,
  agentReportText,
  chartPalette,
  data,
  hasAgentApiKey,
  hasCoinGeckoApiKey,
  hasFinnhubApiKey,
  marketRefreshStatus,
  refreshingMarket,
  staleCryptoCount,
  staleStockCount,
  summary,
  snapshot,
  onEdit,
  onOpenAgentReport,
  onQuickEntry,
}: {
  agentReportGenerating: boolean;
  agentReportText: string;
  chartPalette: ChartPalette;
  data: FinanceData;
  hasAgentApiKey: boolean;
  hasCoinGeckoApiKey: boolean;
  hasFinnhubApiKey: boolean;
  marketRefreshStatus: MarketRefreshStatus | null;
  refreshingMarket: boolean;
  staleCryptoCount: number;
  staleStockCount: number;
  summary: ReturnType<typeof calculateSummary>;
  snapshot: WeeklyReportSnapshot;
  onEdit: (collection: CollectionKey, item: EditableItem) => void;
  onOpenAgentReport: () => void;
  onQuickEntry: (action: QuickFinancialEntryAction) => void;
}) {
  const [activeTab, setActiveTab] = useState<WeeklyReportTab>("calendar");
  const weekStartDate = useMemo(
    () => parseDateInput(snapshot.weekStartDate) ?? startOfCalendarDay(new Date()),
    [snapshot.weekStartDate],
  );
  const week = useMemo(() => getWeeklyReportWindow(weekStartDate), [weekStartDate]);
  const events = useMemo(() => getWeeklyReportEvents(data, week.startDate), [data, week.startDate]);
  const flowRows = useMemo(() => getWeeklyReportFlowRows(data, week.startDate), [data, week.startDate]);
  const eventsByDate = useMemo(() => groupWeeklyReportEventsByDate(events), [events]);
  const totals = getWeeklyFlowTotals(flowRows);
  const tabOptions: { icon: ReactNode; key: WeeklyReportTab; label: string }[] = [
    { icon: <CalendarClock size={14} />, key: "calendar", label: "Calendar" },
    { icon: <ChartPie size={14} />, key: "flow", label: "Week Flow" },
    { icon: <LineChartIcon size={14} />, key: "market", label: "Market" },
    { icon: <ReceiptText size={14} />, key: "upcoming", label: "Upcoming" },
    { icon: <CreditCard size={14} />, key: "cards", label: "Cards" },
  ];
  const quickEntryOptions: { key: QuickFinancialEntryAction; label: string }[] = [
    { key: "income", label: "Entering income" },
    { key: "debtPayment", label: "Debt payment" },
    { key: "stockPurchase", label: "Stock purchase" },
    { key: "cryptoPurchase", label: "Crypto purchase" },
  ];

  return (
    <SectionStack>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard icon={<Banknote size={18} />} label="Income" value={formatCurrency(totals.income)} trend="This week" trendTone="green" />
          <MetricCard icon={<ReceiptText size={18} />} label="Outgoing" value={formatCurrency(totals.outgoing)} trend="Bills + debt + cards" trendTone={totals.outgoing > 0 ? "amber" : "green"} />
          <MetricCard icon={<CircleDollarSign size={18} />} label="Net flow" value={formatCurrency(totals.net)} trend="Weekly net" trendTone={totals.net >= 0 ? "green" : "red"} />
        </div>
        <WeeklyAgentReportCard
          generating={agentReportGenerating}
          hasAgentApiKey={hasAgentApiKey}
          reportText={agentReportText}
          onOpen={onOpenAgentReport}
        />
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-2">
            {tabOptions.map((tab) => (
              <button
                aria-pressed={activeTab === tab.key}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition",
                  focusVisibleRing,
                  activeTab === tab.key
                    ? "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] shadow-sm"
                    : "border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)] hover:bg-[var(--paper-muted)]",
                )}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Plus
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={14}
            />
            <select
              aria-label="Enter financial data"
              className={cn(
                "h-8 cursor-pointer appearance-none rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] pl-8 pr-8 text-xs font-medium text-[var(--foreground)] shadow-sm transition hover:bg-[var(--paper-muted)]",
                controlFocusVisibleRing,
              )}
              onChange={(event) => {
                const action = event.target.value as QuickFinancialEntryAction | "";
                if (action) {
                  onQuickEntry(action);
                  event.target.value = "";
                }
              }}
              value=""
            >
              <option value="">Enter Financial Data</option>
              {quickEntryOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={14}
            />
          </div>
        </div>
      </Card>
      {activeTab === "calendar" ? (
        <WeeklyCalendarTab
          data={data}
          eventsByDate={eventsByDate}
          weekDays={week.days}
          onEdit={onEdit}
        />
      ) : null}
      {activeTab === "flow" ? (
        <WeeklyFlowTab chartPalette={chartPalette} rows={flowRows} />
      ) : null}
      {activeTab === "market" ? (
        <WeeklyMarketTab
          data={data}
          hasCoinGeckoApiKey={hasCoinGeckoApiKey}
          hasFinnhubApiKey={hasFinnhubApiKey}
          refreshStatus={marketRefreshStatus}
          refreshing={refreshingMarket}
          staleCryptoCount={staleCryptoCount}
          staleStockCount={staleStockCount}
          summary={summary}
        />
      ) : null}
      {activeTab === "upcoming" ? (
        <WeeklyUpcomingTab data={data} events={events} onEdit={onEdit} />
      ) : null}
      {activeTab === "cards" ? (
        <WeeklyCardsTab
          data={data}
          weekStart={week.startDate}
          onEdit={(card) => onEdit("creditCards", card)}
        />
      ) : null}
    </SectionStack>
  );
}

function WeeklyAgentReportCard({
  generating,
  hasAgentApiKey,
  reportText,
  onOpen,
}: {
  generating: boolean;
  hasAgentApiKey: boolean;
  reportText: string;
  onOpen: () => void;
}) {
  const hasReport = reportText.trim().length > 0;
  const badgeLabel = !hasAgentApiKey ? "Needs key" : generating ? "Generating" : "Ready";

  return (
    <Card className="h-full overflow-hidden">
      <div className="flex min-h-28 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)]">
            <Bot size={17} />
          </div>
          <Badge tone={hasAgentApiKey ? (generating ? "blue" : "green") : "amber"}>
            {badgeLabel}
          </Badge>
        </div>
        <p className="mt-3 text-xs font-medium text-[var(--muted)]">AI agent report</p>
        <div className="relative mt-1 max-h-24 overflow-hidden text-sm leading-6 text-[var(--foreground-soft)]">
          {hasReport ? (
            <FormattedAgentText text={reportText} />
          ) : (
            <p>
              {hasAgentApiKey
                ? "Generating a weekly cash-flow report for this page..."
                : "Add an AI key in Settings to generate the weekly coaching report."}
            </p>
          )}
          {hasReport ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[var(--paper)]" />
          ) : null}
        </div>
        <button
          className={cn(
            "mt-auto self-start pt-2 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]",
            focusVisibleRing,
          )}
          onClick={onOpen}
          type="button"
        >
          see more....
        </button>
      </div>
    </Card>
  );
}

function WeeklyCalendarTab({
  data,
  eventsByDate,
  weekDays,
  onEdit,
}: {
  data: FinanceData;
  eventsByDate: Map<string, WeeklyReportEvent[]>;
  weekDays: Date[];
  onEdit: (collection: CollectionKey, item: EditableItem) => void;
}) {
  const todayKey = formatDateInput(new Date());
  const totalEvents = weekDays.reduce((total, day) => {
    const dateKey = formatDateInput(day);
    return total + (eventsByDate.get(dateKey)?.length ?? 0);
  }, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Weekly cash calendar" eyebrow="Cash events">
        {totalEvents > 0
          ? `${totalEvents} scheduled ${totalEvents === 1 ? "event" : "events"} this week.`
          : "No scheduled cash events this week."}
      </CardHeader>
      <div className="grid gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {weekDays.map((day) => {
          const dateKey = formatDateInput(day);
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;
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
          const outgoing = recurringOut + cardOut + debtOut;
          const net = income - outgoing;

          return (
            <div
              className={cn(
                "flex min-h-[210px] flex-col rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3",
                isToday && "border-[var(--tone-green-border)] bg-[var(--paper)] ring-1 ring-inset ring-[var(--tone-green-border)]",
              )}
              key={dateKey}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--foreground-soft)]">
                      {formatWeekday(day)}
                    </p>
                    {isToday ? (
                      <span className="rounded border border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] px-1.5 py-0.5 text-[9px] font-medium uppercase text-[var(--tone-green-fg)]">
                        Today
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">{formatShortDate(day)}</p>
                </div>
                <Badge tone={net >= 0 ? "green" : "red"}>{formatCurrency(net, true)}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <CashDayStat label="Income" tone="green" value={formatCurrency(income)} />
                <CashDayStat label="Out" tone={outgoing > 0 ? "amber" : "green"} value={formatCurrency(outgoing)} />
              </div>
              <div className="mt-3 grid flex-1 content-start gap-1.5">
                {dayEvents.length > 0 ? (
                  dayEvents.slice(0, 6).map((event) => (
                    <WeeklyEventButton
                      data={data}
                      event={event}
                      key={event.id}
                      variant="calendar"
                      onEdit={onEdit}
                    />
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-[var(--line)] px-2 py-2 text-center text-xs text-[var(--muted)]">
                    No events
                  </p>
                )}
                {dayEvents.length > 6 ? (
                  <p className="px-1 text-[10px] text-[var(--muted)]">
                    +{dayEvents.length - 6} more scheduled
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function WeeklyFlowTab({
  chartPalette,
  rows,
}: {
  chartPalette: ChartPalette;
  rows: WeeklyReportFlowRow[];
}) {
  const chartRows = rows.map((row) => ({
    expenses: row.recurringOut + row.cardOut + row.debtOut,
    income: row.income,
    label: formatWeekday(row.date),
  }));
  const hasFlowActivity = rows.some(
    (row) => row.income > 0 || row.recurringOut > 0 || row.debtOut > 0 || row.cardOut > 0,
  );

  if (!hasFlowActivity) {
    return (
      <Card>
        <CardHeader title="Income vs expenses" eyebrow="This week" />
        <div className="px-4 pb-4">
          <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper-subtle)] px-3 py-6 text-center text-sm text-[var(--muted)]">
            No scheduled cash events for this report window.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader title="Income vs expenses" eyebrow="This week" />
        <div className="px-4">
          <IncomeExpenseChart
            ariaLabel="Weekly income and expense bar chart"
            colors={{
              expenses: chartPalette.expenses,
              income: chartPalette.primary,
            }}
            data={chartRows}
          />
        </div>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Daily flow" eyebrow="Next 7 days" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Weekly daily cash flow</caption>
            <thead className="border-b border-[var(--line)] text-xs uppercase text-[var(--muted-soft)]">
              <tr>
                <th className="px-4 py-2 font-medium" scope="col">Day</th>
                <th className="px-4 py-2 font-medium" scope="col">Income</th>
                <th className="px-4 py-2 font-medium" scope="col">Recurring</th>
                <th className="px-4 py-2 font-medium" scope="col">Debt</th>
                <th className="px-4 py-2 font-medium" scope="col">Cards</th>
                <th className="px-4 py-2 font-medium" scope="col">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b border-[var(--line)] last:border-b-0" key={row.dateKey}>
                  <th className="px-4 py-2 text-left font-normal" scope="row">
                    <p className="font-medium text-[var(--foreground-soft)]">{formatWeekday(row.date)}</p>
                    <p className="text-xs text-[var(--muted)]">{formatShortDate(row.date)}</p>
                  </th>
                  <td className="px-4 py-2 font-mono text-[var(--tone-green-fg)]">{formatCurrency(row.income)}</td>
                  <td className="px-4 py-2 font-mono text-[var(--tone-amber-fg)]">{formatCurrency(row.recurringOut)}</td>
                  <td className="px-4 py-2 font-mono text-[var(--tone-amber-fg)]">{formatCurrency(row.debtOut)}</td>
                  <td className="px-4 py-2 font-mono text-[var(--tone-amber-fg)]">{formatCurrency(row.cardOut)}</td>
                  <td className={cn("px-4 py-2 font-mono", row.net >= 0 ? "text-[var(--tone-green-fg)]" : "text-[var(--tone-red-fg)]")}>
                    {formatCurrency(row.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function WeeklyMarketTab({
  data,
  hasCoinGeckoApiKey,
  hasFinnhubApiKey,
  refreshStatus,
  refreshing,
  staleCryptoCount,
  staleStockCount,
  summary,
}: {
  data: FinanceData;
  hasCoinGeckoApiKey: boolean;
  hasFinnhubApiKey: boolean;
  refreshStatus: MarketRefreshStatus | null;
  refreshing: boolean;
  staleCryptoCount: number;
  staleStockCount: number;
  summary: ReturnType<typeof calculateSummary>;
}) {
  const stockGain = summary.stockPortfolioValue - summary.stockCostBasis;
  const cryptoGain = summary.cryptoPortfolioValue - summary.cryptoCostBasis;
  const marketValue = summary.stockPortfolioValue + summary.cryptoPortfolioValue;
  const marketCost = summary.stockCostBasis + summary.cryptoCostBasis;
  const marketGain = marketValue - marketCost;
  const staleCount = staleStockCount + staleCryptoCount;
  const hasAnyMarketApiKey = hasFinnhubApiKey || hasCoinGeckoApiKey;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<LineChartIcon size={18} />} label="Stocks" value={formatCurrency(summary.stockPortfolioValue)} trend={formatCurrency(stockGain)} trendTone={stockGain >= 0 ? "green" : "red"} />
        <MetricCard icon={<Coins size={18} />} label="Crypto" value={formatCurrency(summary.cryptoPortfolioValue)} trend={formatCurrency(cryptoGain)} trendTone={cryptoGain >= 0 ? "green" : "red"} />
        <MetricCard icon={<TrendingUp size={18} />} label="Market gain / loss" value={formatCurrency(marketGain)} trend={formatPercent(calculatePercent(marketGain, marketCost))} trendTone={marketGain >= 0 ? "green" : "red"} />
        <MetricCard icon={<Bell size={18} />} label="Tracked assets" value={`${data.stocks.length + data.crypto.length}`} trend={hasAnyMarketApiKey ? "Verified" : "Cached prices"} trendTone={hasAnyMarketApiKey ? "green" : "amber"} />
      </div>
      <Card>
        <CardHeader title="Weekly market cache" eyebrow="Market APIs">
          {refreshing
            ? "Refreshing stale prices now."
            : refreshStatus?.message ??
              (hasAnyMarketApiKey
                ? `${staleCount} stale ${staleCount === 1 ? "asset" : "assets"} queued when this report opens.`
                : "No market API keys saved. Showing cached stock and crypto prices.")}
        </CardHeader>
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <MiniStat label="Stock stale" value={`${staleStockCount}`} />
          <MiniStat label="Crypto stale" value={`${staleCryptoCount}`} />
          <MiniStat label="Total market value" value={formatCurrency(marketValue)} />
        </div>
      </Card>
    </div>
  );
}

function WeeklyUpcomingTab({
  data,
  events,
  onEdit,
}: {
  data: FinanceData;
  events: WeeklyReportEvent[];
  onEdit: (collection: CollectionKey, item: EditableItem) => void;
}) {
  const recurringEvents = events.filter((event) => event.kind === "recurring");
  const debtEvents = events.filter((event) => event.kind === "debt");
  const incomeEvents = events.filter((event) => event.kind === "income");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <WeeklyEventList
        data={data}
        emptyText="No recurring payments this week."
        events={recurringEvents}
        title="Recurring payments"
        onEdit={onEdit}
      />
      <WeeklyEventList
        data={data}
        emptyText="No debt payments this week."
        events={debtEvents}
        title="Debt payments"
        onEdit={onEdit}
      />
      <WeeklyEventList
        data={data}
        emptyText="No income scheduled this week."
        events={incomeEvents}
        title="Income"
        onEdit={onEdit}
      />
    </div>
  );
}

function WeeklyCardsTab({
  data,
  weekStart,
  onEdit,
}: {
  data: FinanceData;
  weekStart: Date;
  onEdit: (card: FinanceData["creditCards"][number]) => void;
}) {
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const cards = getWeeklyReportCreditCards(data, weekStart);
  const activeCardIndex = Math.min(selectedCardIndex, Math.max(cards.length - 1, 0));
  const selectedCard = cards[activeCardIndex];

  if (!selectedCard) {
    return (
      <Card>
        <EmptyState
          description="Add cards to review due dates, statement balances, and payoff context in the weekly report."
          icon={<CreditCard size={18} />}
          title="No credit cards"
        />
      </Card>
    );
  }

  const currentBalance = creditCurrentBalance(selectedCard);
  const interestBalance = creditInterestBalance(selectedCard);
  const statementBalance = creditStatementBalance(selectedCard);
  const statementPaid = creditStatementPaid(selectedCard);
  const statementRemaining = creditStatementRemaining(selectedCard);
  const utilization = calculatePercent(currentBalance, selectedCard.limit);
  const payoff = payoffEstimate(selectedCard);
  const hasMultipleCards = cards.length > 1;
  const showPreviousCard = () => {
    setSelectedCardIndex(activeCardIndex === 0 ? cards.length - 1 : activeCardIndex - 1);
  };
  const showNextCard = () => {
    setSelectedCardIndex(activeCardIndex === cards.length - 1 ? 0 : activeCardIndex + 1);
  };

  return (
    <Card className="mx-auto flex min-h-[344px] w-full max-w-xl flex-col overflow-hidden">
      <button
        className={cn("block w-full flex-1 p-4 text-left transition hover:bg-[var(--paper-subtle)]", focusVisibleRing)}
        onClick={() => onEdit(selectedCard)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <PrimaryCell title={selectedCard.cardName} detail={selectedCard.issuer} />
          <DueBadge date={selectedCard.dueDate} />
        </div>
        <div className="mt-4">
          <ProgressBar
            value={utilization}
            label={`${formatCurrency(currentBalance)} of ${formatCurrency(selectedCard.limit)}`}
            tone={utilization > 30 ? "amber" : "green"}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <MiniStat label="Stmt left" value={formatCurrency(statementRemaining)} compact />
          <MiniStat label="Stmt bal." value={formatCurrency(statementBalance)} compact />
          <MiniStat label="Stmt paid" value={formatCurrency(statementPaid)} compact />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <MiniStat label="Interest bal." value={formatCurrency(interestBalance)} compact />
          <MiniStat label="Minimum" value={formatCurrency(selectedCard.minimumPayment)} compact />
          <MiniStat label="APR" value={`${selectedCard.apr.toFixed(2)}%`} compact />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <MiniStat label="Statement closes" value={selectedCard.statementClosingDate} compact />
          <MiniStat label="Min payoff" value={payoff.label} compact />
        </div>
      </button>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
        <Button
          aria-label="Show previous credit card"
          disabled={!hasMultipleCards}
          size="sm"
          variant="ghost"
          onClick={showPreviousCard}
        >
          <ChevronLeft size={14} />
          Previous
        </Button>
        <span className="shrink-0 font-mono text-xs text-[var(--muted)]">
          {activeCardIndex + 1}/{cards.length}
        </span>
        <Button
          aria-label="Show next credit card"
          disabled={!hasMultipleCards}
          size="sm"
          variant="ghost"
          onClick={showNextCard}
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </Card>
  );
}

function WeeklyEventList({
  data,
  emptyText,
  events,
  title,
  onEdit,
}: {
  data: FinanceData;
  emptyText: string;
  events: WeeklyReportEvent[];
  title: string;
  onEdit: (collection: CollectionKey, item: EditableItem) => void;
}) {
  const total = events.reduce((sum, event) => sum + event.amount, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} eyebrow={formatCurrency(total)} />
      {events.length > 0 ? (
        <div className="divide-y divide-[var(--line)]">
          {events.map((event) => (
            <WeeklyEventButton
              data={data}
              event={event}
              key={event.id}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">{emptyText}</p>
      )}
    </Card>
  );
}

function WeeklyEventButton({
  data,
  event,
  variant = "list",
  onEdit,
}: {
  data: FinanceData;
  event: WeeklyReportEvent;
  variant?: "calendar" | "list";
  onEdit: (collection: CollectionKey, item: EditableItem) => void;
}) {
  const item = findWeeklyReportEventItem(data, event);
  const isCalendar = variant === "calendar";
  const amount = (
    <p
      className={cn(
        "shrink-0 font-mono text-xs font-medium",
        weeklyEventTextClass(event.kind),
      )}
    >
      {event.kind === "income" ? "+" : "-"}
      {formatCurrency(event.amount)}
    </p>
  );

  return (
    <button
      className={cn(
        isCalendar
          ? "block w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-left transition hover:bg-[var(--paper-muted)]"
          : "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-[var(--paper-muted)]",
        focusVisibleRing,
      )}
      disabled={!item}
      onClick={() => {
        if (item) {
          onEdit(event.collection, item);
        }
      }}
      type="button"
    >
      <div className={cn("min-w-0", isCalendar && "w-full")}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", weeklyEventDotClass(event.kind))} />
            <p className="truncate text-xs font-medium text-[var(--foreground-soft)]">
              {event.label}
            </p>
          </div>
          {isCalendar ? amount : null}
        </div>
        <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">
          {isCalendar
            ? `${event.typeLabel} - ${event.detail}`
            : `${formatShortDate(event.date)} · ${event.typeLabel} · ${event.detail}`}
        </p>
      </div>
      {isCalendar ? null : amount}
    </button>
  );
}

function groupWeeklyReportEventsByDate(events: WeeklyReportEvent[]) {
  return events.reduce((groups, event) => {
    const current = groups.get(event.dateKey) ?? [];
    groups.set(event.dateKey, [...current, event]);
    return groups;
  }, new Map<string, WeeklyReportEvent[]>());
}

function getWeeklyFlowTotals(rows: WeeklyReportFlowRow[]) {
  const income = rows.reduce((total, row) => total + row.income, 0);
  const recurringOut = rows.reduce((total, row) => total + row.recurringOut, 0);
  const debtOut = rows.reduce((total, row) => total + row.debtOut, 0);
  const cardOut = rows.reduce((total, row) => total + row.cardOut, 0);
  const outgoing = recurringOut + debtOut + cardOut;

  return {
    cardOut,
    debtOut,
    income,
    net: income - outgoing,
    outgoing,
    recurringOut,
  };
}

function getWeeklyAgentReportPrompt() {
  return [
    "Create a concise weekly finance coaching report for this user.",
    "Use readable Markdown with short section headings, bullets, bold labels, and light emojis where they make the report easier to scan.",
    "Use the saved finance workspace data to review last week where history exists, then explain how that affects the week ahead.",
    "Focus first on cash lasting until the next paycheck, required bills, recurring payments, credit-card due dates, minimum debt payments, and any obvious cash-flow pressure.",
    "Adapt the advice to the user's current situation: if debt is the priority, give a debt-reduction plan; if cash flow is stable, give a plan for savings, investing, and longer-term goals such as building stock balances or preparing to buy real estate.",
    "Include five short sections: Cash runway, Last week signals, Week-ahead risks, Plan adjustments, and One action for today.",
    "Do not invent missing numbers. If data is missing, say what the user should enter next. Do not create edit proposals or tool actions unless the user explicitly asks for changes.",
  ].join("\n");
}

function findWeeklyReportEventItem(data: FinanceData, event: WeeklyReportEvent) {
  switch (event.collection) {
    case "creditCards":
      return data.creditCards.find((item) => item.id === event.itemId) ?? null;
    case "incomeSources":
      return data.incomeSources.find((item) => item.id === event.itemId) ?? null;
    case "debts":
      return data.debts.find((item) => item.id === event.itemId) ?? null;
    case "recurringPayments":
      return data.recurringPayments.find((item) => item.id === event.itemId) ?? null;
    default:
      return null;
  }
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function weeklyEventDotClass(kind: WeeklyReportEvent["kind"]) {
  if (kind === "income") {
    return "bg-[var(--tone-green-fg)]";
  }

  if (kind === "credit-card") {
    return "bg-[var(--tone-red-fg)]";
  }

  return "bg-[var(--tone-amber-fg)]";
}

function weeklyEventTextClass(kind: WeeklyReportEvent["kind"]) {
  if (kind === "income") {
    return "text-[var(--tone-green-fg)]";
  }

  if (kind === "credit-card") {
    return "text-[var(--tone-red-fg)]";
  }

  return "text-[var(--tone-amber-fg)]";
}

type CashCalendarEventKind = "credit-card" | "debt" | "recurring" | "income";
type CashCalendarEventTone = "amber" | "green" | "red";

type CashCalendarEvent = {
  amount: number;
  collection: CollectionKey;
  date: Date;
  dateKey: string;
  detail: string;
  id: string;
  item: EditableItem;
  kind: CashCalendarEventKind;
  label: string;
  tone: CashCalendarEventTone;
  typeLabel: string;
};

function CashCalendar({
  data,
  onEdit,
}: {
  data: FinanceData;
  onEdit: (collection: CollectionKey, item: EditableItem) => void;
}) {
  const today = startOfCalendarDay(new Date());
  const todayKey = calendarDateKey(today);
  const [visibleMonth, setVisibleMonth] = useState(() => firstDayOfMonth(today));
  const [selectedDateKey, setSelectedDateKey] = useState(() => todayKey);
  const calendarDays = useMemo(() => getCalendarGridDays(visibleMonth), [visibleMonth]);
  const events = useMemo(() => getCashCalendarEvents(data, visibleMonth), [data, visibleMonth]);
  const eventsByDate = useMemo(() => groupCalendarEventsByDate(events), [events]);
  const selectedEvents = eventsByDate.get(selectedDateKey) ?? [];
  const selectedIncomeTotal = selectedEvents
    .filter((event) => event.kind === "income")
    .reduce((total, event) => total + event.amount, 0);
  const selectedOutgoingTotal = selectedEvents
    .filter((event) => event.kind !== "income")
    .reduce((total, event) => total + event.amount, 0);
  const selectedNetTotal = selectedIncomeTotal - selectedOutgoingTotal;
  const monthlyIncomeTotal = events
    .filter((event) => event.kind === "income")
    .reduce((total, event) => total + event.amount, 0);
  const monthlyOutgoingTotal = events
    .filter((event) => event.kind !== "income")
    .reduce((total, event) => total + event.amount, 0);
  const monthlyNetTotal = monthlyIncomeTotal - monthlyOutgoingTotal;
  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const selectedDate = parseCalendarDateKey(selectedDateKey);
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "Selected day";
  const selectedPanelTitle = selectedDateKey === todayKey ? "Today" : "Selected day";
  const isCurrentVisibleMonth =
    visibleMonth.getFullYear() === today.getFullYear() &&
    visibleMonth.getMonth() === today.getMonth();

  const moveMonth = (months: number) => {
    const nextMonth = addCalendarMonths(visibleMonth, months);
    setVisibleMonth(nextMonth);
    setSelectedDateKey(defaultSelectedCalendarKey(nextMonth));
  };

  const goToToday = () => {
    setVisibleMonth(firstDayOfMonth(today));
    setSelectedDateKey(todayKey);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Cash calendar"
        eyebrow={isCurrentVisibleMonth ? "This month" : "Month view"}
        action={
          <div className="flex items-center gap-1">
            <Button
              aria-label="Previous month"
              size="icon"
              variant="ghost"
              onClick={() => moveMonth(-1)}
            >
              <ChevronRight className="rotate-180" size={15} />
            </Button>
            <Button
              aria-label="Jump to current month"
              className="min-w-[7rem]"
              size="sm"
              variant="ghost"
              onClick={goToToday}
            >
              {monthLabel}
            </Button>
            <Button
              aria-label="Next month"
              size="icon"
              variant="ghost"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight size={15} />
            </Button>
          </div>
        }
      >
        {monthLabel}
      </CardHeader>
      <div className="p-2">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-2 text-[9px] text-[var(--muted)]">
            <CalendarLegendDot tone="green" label="Income" />
            <CalendarLegendDot tone="amber" label="Bills/debt" />
            <CalendarLegendDot tone="red" label="Cards" />
          </div>
          <div className="grid w-full grid-cols-3 gap-1.5 sm:w-auto sm:min-w-[240px]">
            <CashDayStat label="Income" tone="green" value={formatCurrency(monthlyIncomeTotal)} />
            <CashDayStat label="Out" tone="amber" value={formatCurrency(monthlyOutgoingTotal)} />
            <CashDayStat
              label="Net"
              tone={monthlyNetTotal >= 0 ? "green" : "red"}
              value={formatCurrency(monthlyNetTotal)}
            />
          </div>
        </div>

        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-x-auto">
          <div className="min-w-[640px] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper-subtle)]">
            <div className="grid grid-cols-7 border-b border-[var(--line)]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="border-r border-[var(--line)] px-1.5 py-1 text-center text-[9px] font-medium uppercase text-[var(--muted-soft)] last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[56px]">
              {calendarDays.map((day) => {
                const dateKey = calendarDateKey(day);
                const dayEvents = eventsByDate.get(dateKey) ?? [];
                const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                const isSelected = dateKey === selectedDateKey;
                const isToday = dateKey === todayKey;
                const dayLabel = day.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                const eventLabel = `${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`;
                const dayIncomeTotal = calendarEventsTotal(dayEvents, "income");
                const dayBillTotal = calendarEventsTotal(dayEvents, "recurring");
                const dayDebtTotal = calendarEventsTotal(dayEvents, "debt");
                const dayCardTotal = calendarEventsTotal(dayEvents, "credit-card");
                const dayOutgoingTotal = dayBillTotal + dayDebtTotal + dayCardTotal;
                const hasEvents = dayEvents.length > 0;
                const isEndOfWeek = day.getDay() === 6;

                return (
                  <button
                    key={dateKey}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${dayLabel}. ${eventLabel}.`}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex h-full min-w-0 flex-col overflow-hidden border-b border-[var(--line)] p-1 text-left transition",
                      focusVisibleRing,
                      !isEndOfWeek && "border-r border-[var(--line)]",
                      "bg-[var(--paper-subtle)]",
                      isSelected && "bg-[var(--paper)] ring-1 ring-inset ring-[var(--tone-green-border)]",
                      !isCurrentMonth && "opacity-45",
                    )}
                    onClick={() => setSelectedDateKey(dateKey)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={cn(
                          "grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold text-[var(--muted)]",
                          isToday && "bg-[var(--primary)] text-[var(--primary-foreground)]",
                          hasEvents && !isToday && "text-[var(--foreground-soft)]",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {hasEvents ? (
                        <span className="rounded-full border border-[var(--line)] bg-[var(--paper-subtle)] px-1 py-0 text-[8px] font-medium text-[var(--muted)]">
                          {dayEvents.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 grid min-h-0 gap-0.5 overflow-hidden">
                      {dayIncomeTotal > 0 ? (
                        <p className="truncate font-mono text-[10px] font-semibold leading-3 text-[var(--tone-green-fg)]">
                          +{formatCurrency(dayIncomeTotal, true)}
                        </p>
                      ) : null}
                      {dayOutgoingTotal > 0 ? (
                        <p className="truncate font-mono text-[10px] font-semibold leading-3 text-[var(--tone-amber-fg)]">
                          -{formatCurrency(dayOutgoingTotal, true)}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          </div>

          <aside className="flex min-w-0 flex-col rounded-md border border-[var(--line)] bg-[var(--paper-subtle)] xl:min-h-[352px]">
            <div className="border-b border-[var(--line)] px-2 py-1.5">
              <div className="min-w-0">
                <p className="text-[9px] font-medium uppercase text-[var(--muted-soft)]">
                  {selectedPanelTitle}
                </p>
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {selectedDateLabel}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}
                </p>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                <CashDayStat label="Income" tone="green" value={formatCurrency(selectedIncomeTotal)} />
                <CashDayStat label="Out" tone="amber" value={formatCurrency(selectedOutgoingTotal)} />
                <CashDayStat
                  label="Net"
                  tone={selectedNetTotal >= 0 ? "green" : "red"}
                  value={formatCurrency(selectedNetTotal)}
                />
              </div>
            </div>
            {selectedEvents.length > 0 ? (
              <div className="min-h-0 flex-1 divide-y divide-[var(--line)] overflow-y-auto">
                {selectedEvents.map((event) => (
                  <button
                    key={event.id}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left transition hover:bg-[var(--paper-muted)]",
                      focusVisibleRing,
                    )}
                    onClick={() => onEdit(event.collection, event.item)}
                    type="button"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", calendarEventDotClass(event.tone))} />
                        <p className="truncate text-xs font-medium text-[var(--foreground-soft)]">
                          {event.label}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">
                        {event.typeLabel} - {event.detail}
                      </p>
                    </div>
                    <p className={cn("shrink-0 font-mono text-xs font-medium", calendarEventTextClass(event.tone))}>
                      {event.kind === "income" ? "+" : "-"}
                      {formatCurrency(event.amount)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid flex-1 place-items-center px-2 py-4 text-center">
                <div>
                  <CalendarClock className="mx-auto text-[var(--muted-soft)]" size={16} />
                  <p className="mt-1.5 text-xs font-medium text-[var(--foreground-soft)]">
                    No cash events
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                    Pick another date to review income, bills, cards, or debt payments.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Card>
  );
}

function CashDayStat({
  label,
  tone,
  value,
}: {
  label: string;
  tone: CashCalendarEventTone;
  value: string;
}) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--paper)] px-1.5 py-1">
      <p className="truncate text-[9px] font-medium uppercase text-[var(--muted-soft)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate font-mono text-[11px] font-semibold",
          calendarEventTextClass(tone),
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CalendarLegendDot({ label, tone }: { label: string; tone: CashCalendarEventTone }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", calendarEventDotClass(tone))} />
      {label}
    </span>
  );
}

function calendarEventsTotal(events: CashCalendarEvent[], kind: CashCalendarEventKind) {
  return events
    .filter((event) => event.kind === kind)
    .reduce((total, event) => total + event.amount, 0);
}

function getCashCalendarEvents(
  data: FinanceData,
  visibleMonth: Date,
): CashCalendarEvent[] {
  const monthStart = firstDayOfMonth(visibleMonth);
  const monthEnd = lastDayOfMonth(visibleMonth);
  const today = startOfCalendarDay(new Date());
  const events: CashCalendarEvent[] = [];

  data.creditCards.forEach((card) => {
    const amount = creditStatementRemaining(card);
    if (amount <= 0) {
      return;
    }

    const scheduleDate = card.autopay ? card.autopayDate || card.dueDate : card.dueDate;
    const eventDates = card.autopay
      ? getCalendarOccurrences(scheduleDate, "Monthly", monthStart, monthEnd)
      : (() => {
          const dueDate = parseDateInput(scheduleDate);
          return dueDate && isCalendarDateInRange(dueDate, monthStart, monthEnd)
            ? [startOfCalendarDay(dueDate)]
            : [];
        })();

    eventDates.forEach((eventDate) => {
      events.push({
        amount,
        collection: "creditCards",
        date: eventDate,
        dateKey: calendarDateKey(eventDate),
        detail: card.autopay ? `${card.issuer} · Autopay` : card.issuer,
        id: `credit-card-${card.id}-${calendarDateKey(eventDate)}`,
        item: card,
        kind: "credit-card",
        label: card.cardName,
        tone: eventDate < today ? "red" : "amber",
        typeLabel: card.autopay ? "Card autopay" : "Card due",
      });
    });
  });

  data.recurringPayments.forEach((payment) => {
    if (payment.status !== "active") {
      return;
    }

    getCalendarOccurrences(payment.nextChargeDate, payment.frequency, monthStart, monthEnd)
      .forEach((eventDate) => {
        events.push({
          amount: Math.max(Number(payment.amount) || 0, 0),
          collection: "recurringPayments",
          date: eventDate,
          dateKey: calendarDateKey(eventDate),
          detail: `${payment.category} · ${payment.paymentMethod}`,
          id: `recurring-${payment.id}-${calendarDateKey(eventDate)}`,
          item: payment,
          kind: "recurring",
          label: payment.name,
          tone: "amber",
          typeLabel: "Recurring",
        });
      });
  });

  data.debts.forEach((debt) => {
    let remainingBalance = Math.max(Number(debt.currentBalance) || 0, 0);
    const scheduledAmount = Math.max(Number(debt.minimumPayment) || 0, 0);
    if (debt.status === "paid" || remainingBalance <= 0 || scheduledAmount <= 0) {
      return;
    }

    const scheduleDate = debt.autopay ? debt.autopayDate || debt.dueDate : debt.dueDate;
    const scheduleFrequency = debt.autopay ? "Monthly" : debt.paymentFrequency;

    getCalendarOccurrences(scheduleDate, scheduleFrequency, monthStart, monthEnd)
      .forEach((eventDate) => {
        const amount = Math.min(scheduledAmount, remainingBalance);
        if (amount <= 0) {
          return;
        }

        remainingBalance = Math.max(remainingBalance - amount, 0);
        events.push({
          amount,
          collection: "debts",
          date: eventDate,
          dateKey: calendarDateKey(eventDate),
          detail: debt.autopay
            ? `${debt.lender || debt.type} · Autopay`
            : `${debt.lender || debt.type} · ${debt.paymentFrequency}`,
          id: `debt-${debt.id}-${calendarDateKey(eventDate)}`,
          item: debt,
          kind: "debt",
          label: debt.name,
          tone: "amber",
          typeLabel: debt.autopay ? "Debt autopay" : "Debt payment",
        });
      });
  });

  data.incomeSources.forEach((source) => {
    if (!source.active) {
      return;
    }

    getCalendarOccurrences(source.nextPaymentDate, source.frequency, monthStart, monthEnd)
      .forEach((eventDate) => {
        events.push({
          amount: Math.max(Number(source.amount) || 0, 0),
          collection: "incomeSources",
          date: eventDate,
          dateKey: calendarDateKey(eventDate),
          detail: `${source.category} · ${source.frequency}`,
          id: `income-${source.id}-${calendarDateKey(eventDate)}`,
          item: source,
          kind: "income",
          label: source.name,
          tone: "green",
          typeLabel: "Income",
        });
      });
  });

  return events.sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      calendarEventKindOrder(a.kind) - calendarEventKindOrder(b.kind) ||
      a.label.localeCompare(b.label),
  );
}

function groupCalendarEventsByDate(events: CashCalendarEvent[]) {
  return events.reduce((groups, event) => {
    const currentEvents = groups.get(event.dateKey) ?? [];
    groups.set(event.dateKey, [...currentEvents, event]);
    return groups;
  }, new Map<string, CashCalendarEvent[]>());
}

function getCalendarGridDays(visibleMonth: Date) {
  const monthStart = firstDayOfMonth(visibleMonth);
  const gridStart = addCalendarDays(monthStart, -monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => addCalendarDays(gridStart, index));
}

function getCalendarOccurrences(
  dateString: string,
  frequency: FinanceData["incomeSources"][number]["frequency"],
  rangeStart: Date,
  rangeEnd: Date,
) {
  const firstDate = parseDateInput(dateString);

  if (!firstDate) {
    return [];
  }

  const firstOccurrence = startOfCalendarDay(firstDate);
  const normalizedRangeStart = startOfCalendarDay(rangeStart);
  const normalizedRangeEnd = startOfCalendarDay(rangeEnd);

  if (frequency === "Semi-monthly") {
    return getSemiMonthlyCalendarOccurrences(
      firstOccurrence,
      normalizedRangeStart,
      normalizedRangeEnd,
    );
  }

  const occurrences: Date[] = [];
  let guard = 0;

  while (guard < 10000) {
    const cursor = addCalendarFrequency(firstOccurrence, frequency, guard);
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

function getSemiMonthlyCalendarOccurrences(
  firstOccurrence: Date,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const occurrences: Date[] = [];
  const anchorDay = firstOccurrence.getDate();
  const firstMonth = firstDayOfMonth(firstOccurrence);
  const startMonth = firstDayOfMonth(rangeStart);
  let cursor = firstMonth > startMonth ? firstMonth : startMonth;
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
        const eventDate = startOfCalendarDay(new Date(year, month, Math.min(day, lastDay)));
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

function addCalendarFrequency(
  date: Date,
  frequency: FinanceData["incomeSources"][number]["frequency"],
  steps = 1,
) {
  switch (frequency) {
    case "Daily":
      return addCalendarDays(date, steps);
    case "Weekly":
      return addCalendarDays(date, 7 * steps);
    case "Biweekly":
      return addCalendarDays(date, 14 * steps);
    case "Semi-monthly":
      return addCalendarMonths(date, steps);
    case "Quarterly":
      return addCalendarMonths(date, 3 * steps);
    case "Annual":
      return addCalendarMonths(date, 12 * steps);
    case "Monthly":
    default:
      return addCalendarMonths(date, steps);
  }
}

function firstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function lastDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addCalendarDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfCalendarDay(nextDate);
}

function addCalendarMonths(date: Date, months: number) {
  const targetMonth = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();

  return startOfCalendarDay(
    new Date(targetYear, normalizedMonth, Math.min(date.getDate(), daysInTargetMonth)),
  );
}

function startOfCalendarDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calendarDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseCalendarDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function defaultSelectedCalendarKey(visibleMonth: Date) {
  const today = startOfCalendarDay(new Date());
  const monthStart = firstDayOfMonth(visibleMonth);

  return today.getFullYear() === monthStart.getFullYear() &&
    today.getMonth() === monthStart.getMonth()
    ? calendarDateKey(today)
    : calendarDateKey(monthStart);
}

function isCalendarDateInRange(date: Date, rangeStart: Date, rangeEnd: Date) {
  const day = startOfCalendarDay(date);
  return day >= rangeStart && day <= rangeEnd;
}

function calendarEventKindOrder(kind: CashCalendarEventKind) {
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

function calendarEventDotClass(tone: CashCalendarEventTone) {
  switch (tone) {
    case "green":
      return "bg-[var(--tone-green-fill)]";
    case "red":
      return "bg-[var(--tone-red-fill)]";
    case "amber":
    default:
      return "bg-[var(--tone-amber-fill)]";
  }
}

function calendarEventTextClass(tone: CashCalendarEventTone) {
  switch (tone) {
    case "green":
      return "text-[var(--tone-green-fg)]";
    case "red":
      return "text-[var(--tone-red-fg)]";
    case "amber":
    default:
      return "text-[var(--tone-amber-fg)]";
  }
}

function InvestingSection({
  chartPalette,
  data,
  summary,
  onAdd,
  onEdit,
  onDelete,
}: {
  chartPalette: ChartPalette;
  data: FinanceData;
  summary: ReturnType<typeof calculateSummary>;
  onAdd: () => void;
  onEdit: (item: FinanceData["investments"][number]) => void;
  onDelete: (id: string) => void;
}) {
  const dividendIncome = data.investments.reduce(
    (sum, item) => sum + item.dividendIncome,
    0,
  );

  return (
    <SectionStack>
      <NoticeCard
        tone="blue"
        title="Allocation scope"
        text="Manual investment accounts, stock holdings, and crypto holdings are separate buckets here. Avoid entering the same brokerage assets in more than one bucket unless you want them counted twice."
      />
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<CircleDollarSign size={18} />} label="Total invested" value={formatCurrency(summary.investmentCostBasis)} trend="Cost basis" />
        <MetricCard icon={<ChartPie size={18} />} label="Portfolio value" value={formatCurrency(summary.totalInvestments)} trend={formatCurrency(summary.investmentGain)} trendTone={summary.investmentGain >= 0 ? "green" : "red"} />
        <MetricCard icon={<TrendingUp size={18} />} label="Gain / loss" value={formatPercent(summary.investmentGainPercent)} trend="All assets" trendTone={summary.investmentGainPercent >= 0 ? "green" : "red"} />
        <MetricCard icon={<DollarSign size={18} />} label="Dividend income" value={formatCurrency(dividendIncome)} trend="Manual entries" trendTone="blue" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Asset allocation" eyebrow="Investing" />
          <div className="px-4 py-5">
            <DonutChart data={portfolioAllocation(summary, chartPalette)} />
          </div>
        </Card>
        <InvestmentTable
          items={data.investments}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </SectionStack>
  );
}

function StocksSection({
  data,
  hasFinnhubApiKey,
  refreshStatus,
  refreshingPrices,
  onAdd,
  onEdit,
  onDelete,
  onRefreshPrices,
  onTrade,
}: {
  data: FinanceData;
  hasFinnhubApiKey: boolean;
  refreshStatus: MarketRefreshStatus | null;
  refreshingPrices: boolean;
  onAdd: () => void;
  onEdit: (item: FinanceData["stocks"][number]) => void;
  onDelete: (id: string) => void;
  onRefreshPrices: () => void;
  onTrade: (item: FinanceData["stocks"][number], kind: StockTradeKind) => void;
}) {
  const displayData = useMemo(() => consolidateStockHoldingsByTicker(data), [data]);
  const stocks = displayData.stocks;
  const totalValue = stocks.reduce((sum, stock) => sum + stockValue(stock), 0);
  const totalCost = stocks.reduce((sum, stock) => sum + stockCost(stock), 0);
  const gain = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;
  const largestHolding = stocks
    .slice()
    .sort((a, b) => stockValue(b) - stockValue(a))[0];
  const sortedStocks = useMemo(
    () => sortStocksByOldestMarketPrice(stocks),
    [stocks],
  );
  const stockLotsByHolding = useMemo(() => {
    const lotsByHolding = new Map<string, FinanceData["stockLots"]>();

    displayData.stockLots.forEach((lot) => {
      const lots = lotsByHolding.get(lot.stockId) ?? [];
      lots.push(lot);
      lotsByHolding.set(lot.stockId, lots);
    });

    lotsByHolding.forEach((lots) => {
      lots.sort(
        (a, b) =>
          Number(b.remainingShares > 0) - Number(a.remainingShares > 0) ||
          a.acquiredDate.localeCompare(b.acquiredDate) ||
          a.id.localeCompare(b.id),
      );
    });

    return lotsByHolding;
  }, [displayData.stockLots]);

  return (
    <SectionStack>
      <NoticeCard
        tone="blue"
        title="Stock prices and purchases"
        text="Finnhub can refresh current prices on demand. Holdings summarize open purchases, and FIFO purchases feed stock sale tax records."
      />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<LineChartIcon size={18} />} label="Stock portfolio" value={formatCurrency(totalValue)} trend={formatPercent(gainPercent)} trendTone={gain >= 0 ? "green" : "red"} />
        <MetricCard icon={<TrendingUp size={18} />} label="Total gain / loss" value={formatCurrency(gain)} trend="Market value" trendTone={gain >= 0 ? "green" : "red"} />
        <MetricCard icon={<Bell size={18} />} label="Watchlist" value={`${stocks.length} holdings`} trend={hasFinnhubApiKey ? "Verified" : "Needs API key"} trendTone={hasFinnhubApiKey ? "green" : "amber"} />
      </div>
      <Card>
        <CardHeader title="Manual price snapshot" eyebrow="Stocks" />
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <MiniStat label="Cost basis" value={formatCurrency(totalCost)} />
          <MiniStat label="Largest holding" value={largestHolding?.ticker ?? "None"} />
          <MiniStat
            label="Largest value"
            value={largestHolding ? formatCurrency(stockValue(largestHolding)) : "$0"}
          />
        </div>
      </Card>
      <DataTable
        title="Watchlist and portfolio"
        eyebrow={refreshStatus?.message}
        emptyTitle="No stock holdings"
        emptyDescription="Add a stock purchase to start the table."
        items={sortedStocks}
        extraAction={
          <Button disabled={stocks.length === 0 || refreshingPrices} size="sm" onClick={onRefreshPrices}>
            <RefreshCcw size={14} />
            {refreshingPrices ? "Updating..." : "Update Prices"}
          </Button>
        }
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        columns={[
          {
            header: "Ticker",
            cell: (stock) => (
              <div>
                <p className="font-mono text-sm font-semibold">{stock.ticker}</p>
                <p className="max-w-44 truncate text-xs text-[var(--muted)]">{stock.company}</p>
              </div>
            ),
          },
          {
            header: "Shares / purchases",
            cell: (stock) => (
              <StockLotsCell
                asOfDate={`${data.taxProfile.taxYear}-12-31`}
                lots={stockLotsByHolding.get(stock.id) ?? []}
                stock={stock}
              />
            ),
          },
          { header: "Average cost", cell: (stock) => formatCurrency(stock.averageCost) },
          {
            header: "Current price",
            cell: (stock) => (
              <MarketPriceCell
                error={stock.marketPriceError}
                price={stock.currentPrice}
                status={stock.marketPriceStatus}
                updatedAt={stock.marketPriceUpdatedAt}
              />
            ),
          },
          { header: "Total value", cell: (stock) => formatCurrency(stockValue(stock)) },
          {
            header: "Gain/loss",
            cell: (stock) => {
              const gainValue = stockValue(stock) - stockCost(stock);
              return <GainBadge value={gainValue} basis={stockCost(stock)} />;
            },
          },
          {
            header: "Trade",
            cell: (stock) => (
              <div className="flex min-w-32 gap-1">
                <Button
                  aria-label={`Buy more ${stock.ticker}`}
                  size="sm"
                  onClick={() => onTrade(stock, "buy")}
                >
                  <Plus size={13} />
                  Buy
                </Button>
                <Button
                  aria-label={`Sell ${stock.ticker}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => onTrade(stock, "sell")}
                >
                  Sell
                </Button>
              </div>
            ),
          },
          { header: "Notes", cell: (stock) => <NoteCell value={stock.notes} /> },
        ]}
      />
    </SectionStack>
  );
}

function StockLotsCell({
  asOfDate,
  lots,
  stock,
}: {
  asOfDate: string;
  lots: FinanceData["stockLots"];
  stock: FinanceData["stocks"][number];
}) {
  const openLots = lots.filter((lot) => lot.remainingShares > 0);
  const closedLots = lots.length - openLots.length;
  const displayedLots = openLots.length > 0 ? openLots : lots.slice(0, 2);

  return (
    <div className="min-w-[250px] max-w-[360px]">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-sm text-[var(--foreground-soft)]">
          {stock.shares.toLocaleString()} shares
        </span>
        <span className="text-xs text-[var(--muted)]">
          {openLots.length} open purchase{openLots.length === 1 ? "" : "s"}
          {closedLots > 0 ? `, ${closedLots} closed` : ""}
        </span>
      </div>
      {displayedLots.length > 0 ? (
        <div className="mt-1.5 grid max-h-24 overflow-y-auto pr-1">
          {displayedLots.map((lot) => {
            const lotValue = stockLotMarketValue(lot, stock.currentPrice);
            const lotGainValue = stockLotGain(lot, stock.currentPrice);
            const isPositive = lotGainValue >= 0;

            return (
              <div
                className="grid grid-cols-[minmax(112px,1fr)_auto_auto] items-center gap-2 border-t border-[var(--line)] py-1.5 first:border-t-0 first:pt-0"
                key={lot.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-medium text-[var(--foreground-soft)]">
                    {lot.remainingShares.toLocaleString()} / {lot.shares.toLocaleString()} sh
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {lot.acquiredDate} at {formatCurrency(lot.pricePerShare)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-[var(--foreground-soft)]">
                    {formatCurrency(lotValue)}
                  </p>
                  <p
                    className={cn(
                      "font-mono text-xs",
                      isPositive ? "text-[var(--tone-green-fg)]" : "text-[var(--tone-red-fg)]",
                    )}
                  >
                    {formatCurrency(lotGainValue)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <LotTermBadge asOfDate={asOfDate} lot={lot} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-1 text-xs text-[var(--muted)]">No purchases recorded</p>
      )}
    </div>
  );
}

function MarketPriceCell({
  error,
  price,
  status,
  updatedAt,
}: {
  error?: string;
  price: number;
  status?: FinanceData["stocks"][number]["marketPriceStatus"];
  updatedAt?: string;
}) {
  return (
    <div className="grid gap-1">
      <span className="font-mono text-sm text-[var(--foreground-soft)]">
        {formatCurrency(price)}
      </span>
      {status === "failed" ? (
        <span title={error || "Market API did not return a price."}>
          <Badge tone="red">Update failed</Badge>
        </span>
      ) : updatedAt ? (
        <span className="text-xs text-[var(--muted)]" title={formatMarketPriceDateTime(updatedAt)}>
          {formatMarketPriceAge(updatedAt)}
        </span>
      ) : (
        <span className="text-xs text-[var(--muted)]">Not refreshed</span>
      )}
    </div>
  );
}

function formatMarketPriceAge(value: string) {
  const date = new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) {
    return "Not refreshed";
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const updatedDayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const elapsedDays = Math.floor(
    (todayStart.getTime() - updatedDayStart.getTime()) / 86_400_000,
  );

  if (elapsedDays <= 0) {
    return "Updated Today";
  }

  if (elapsedDays === 1) {
    return "Updated Yesterday";
  }

  if (elapsedDays < 7) {
    return "Updated This week";
  }

  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  ) {
    return "Updated This month";
  }

  if (date.getFullYear() === now.getFullYear()) {
    return "Updated This year";
  }

  return "Updated Long ago";
}

function formatMarketPriceDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No refresh timestamp"
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function sortStocksByOldestMarketPrice(stocks: FinanceData["stocks"]) {
  return stocks.slice().sort((a, b) => {
    const comparison = getMarketPriceSortTime(a) - getMarketPriceSortTime(b);
    return comparison || a.ticker.localeCompare(b.ticker) || a.id.localeCompare(b.id);
  });
}

function getMarketPriceSortTime(item: { marketPriceUpdatedAt?: string }) {
  if (!item.marketPriceUpdatedAt) {
    return 0;
  }

  const time = Date.parse(item.marketPriceUpdatedAt);
  return Number.isNaN(time) ? 0 : time;
}

function CryptoSection({
  chartPalette,
  data,
  hasCoinGeckoApiKey,
  refreshStatus,
  refreshingPrices,
  onAdd,
  onEdit,
  onDelete,
  onRefreshPrices,
}: {
  chartPalette: ChartPalette;
  data: FinanceData;
  hasCoinGeckoApiKey: boolean;
  refreshStatus: MarketRefreshStatus | null;
  refreshingPrices: boolean;
  onAdd: () => void;
  onEdit: (item: FinanceData["crypto"][number]) => void;
  onDelete: (id: string) => void;
  onRefreshPrices: () => void;
}) {
  const totalValue = data.crypto.reduce((sum, holding) => sum + cryptoValue(holding), 0);
  const totalCost = data.crypto.reduce((sum, holding) => sum + cryptoCost(holding), 0);
  const gain = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

  return (
    <SectionStack>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<Coins size={18} />} label="Total crypto value" value={formatCurrency(totalValue)} trend={formatPercent(gainPercent)} trendTone={gain >= 0 ? "green" : "red"} />
        <MetricCard icon={<TrendingUp size={18} />} label="Gain / loss" value={formatCurrency(gain)} trend={hasCoinGeckoApiKey ? "Verified" : "Needs API key"} trendTone={hasCoinGeckoApiKey ? "green" : "amber"} />
        <MetricCard icon={<ChartPie size={18} />} label="Holdings" value={`${data.crypto.length} coins`} trend="Allocation" trendTone="blue" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Allocation" eyebrow="Crypto" />
          <div className="px-4 py-5">
            <DonutChart
              data={data.crypto.map((holding, index) => ({
                label: holding.symbol,
                value: cryptoValue(holding),
                color: [
                  chartPalette.primary,
                  chartPalette.secondary,
                  chartPalette.tertiary,
                  chartPalette.quaternary,
                ][index % 4],
              }))}
            />
          </div>
        </Card>
        <DataTable
          title="Crypto holdings"
          eyebrow={refreshStatus?.message ?? "Manual tracker"}
          emptyTitle="No crypto holdings"
          emptyDescription="Add a coin, quantity, and manual price to calculate value."
          items={data.crypto}
          extraAction={
            <Button disabled={data.crypto.length === 0 || refreshingPrices} size="sm" onClick={onRefreshPrices}>
              <RefreshCcw size={14} />
              {refreshingPrices ? "Updating..." : "Update Prices"}
            </Button>
          }
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          columns={[
            {
              header: "Coin",
              cell: (holding) => (
                <div>
                  <p className="text-sm font-semibold">{holding.coin}</p>
                  <p className="font-mono text-xs text-[var(--muted)]">{holding.symbol}</p>
                </div>
              ),
            },
            { header: "Quantity", cell: (holding) => holding.quantity.toLocaleString() },
            { header: "Average cost", cell: (holding) => formatCurrency(holding.averageCost) },
            {
              header: "Current price",
              cell: (holding) => (
                <MarketPriceCell
                  error={holding.marketPriceError}
                  price={holding.currentPrice}
                  status={holding.marketPriceStatus}
                  updatedAt={holding.marketPriceUpdatedAt}
                />
              ),
            },
            { header: "Total value", cell: (holding) => formatCurrency(cryptoValue(holding)) },
            {
              header: "Gain/loss",
              cell: (holding) => {
                const gainValue = cryptoValue(holding) - cryptoCost(holding);
                return <GainBadge value={gainValue} basis={cryptoCost(holding)} />;
              },
            },
          ]}
        />
      </div>
    </SectionStack>
  );
}

function IncomeSection({
  chartPalette,
  data,
  onAdd,
  onAddPaycheck,
  onEdit,
  onEditPaycheck,
  onDelete,
  onDeletePaycheck,
}: {
  chartPalette: ChartPalette;
  data: FinanceData;
  onAdd: () => void;
  onAddPaycheck: () => void;
  onEdit: (item: FinanceData["incomeSources"][number]) => void;
  onEditPaycheck: (item: FinanceData["paychecks"][number]) => void;
  onDelete: (id: string) => void;
  onDeletePaycheck: (id: string) => void;
}) {
  const [dateWindow, setDateWindow] = useState<DateWindow>("next30");
  const [paycheckYear, setPaycheckYear] = useState(data.taxProfile.taxYear);
  const summary = useMemo(() => calculateSummary(data), [data]);
  const activeSources = data.incomeSources.filter((source) => source.active);
  const filteredSources = data.incomeSources.filter((source) =>
    matchesDateWindow(source.nextPaymentDate, dateWindow),
  );
  const sourcePaycheckStats = useMemo(() => getPaycheckStatsBySource(data.paychecks), [data.paychecks]);
  const paycheckYears = useMemo(() => {
    const years = new Set([data.taxProfile.taxYear]);
    data.paychecks.forEach((paycheck) => {
      const payDate = parseDateInput(paycheck.payDate);
      if (payDate) {
        years.add(payDate.getFullYear());
      }
    });
    return [...years].sort((a, b) => b - a);
  }, [data.paychecks, data.taxProfile.taxYear]);
  const filteredPaychecks = data.paychecks
    .filter((paycheck) => {
      const payDate = parseDateInput(paycheck.payDate);
      return payDate?.getFullYear() === paycheckYear;
    })
    .slice()
    .sort((a, b) => b.payDate.localeCompare(a.payDate));
  const paycheckYearTotals = filteredPaychecks.reduce(
    (totals, paycheck) => ({
      federal: totals.federal + paycheck.federalIncomeTaxWithheld,
      fica:
        totals.fica +
        paycheck.socialSecurityTaxWithheld +
        paycheck.medicareTaxWithheld +
        paycheck.additionalMedicareTaxWithheld,
      gross: totals.gross + paycheck.grossPay,
      net: totals.net + paycheck.netPay,
      stateLocal:
        totals.stateLocal +
        paycheck.stateIncomeTaxWithheld +
        paycheck.localIncomeTaxWithheld,
    }),
    { federal: 0, fica: 0, gross: 0, net: 0, stateLocal: 0 },
  );
  const monthlyIncome = activeSources.reduce(
    (sum, source) => sum + monthlyAmount(source.amount, source.frequency),
    0,
  );
  const paycheckChartSeries = getMonthlyPaycheckNetSeries(data.paychecks, paycheckYear);
  const incomeHistorySeries = removeDemoIncomeExpenseHistory(data.incomeExpenseHistory).map((point) => ({
    label: point.label,
    value: point.income,
  }));
  const incomeChartSeries =
    paycheckChartSeries.length > 0
      ? paycheckChartSeries
      : incomeHistorySeries.length > 0
        ? incomeHistorySeries
        : monthlyIncome > 0
          ? [{ label: "Current", value: monthlyIncome }]
          : [];
  const nextPayment = activeSources
    .filter((source) => {
      const days = getDaysUntilDate(source.nextPaymentDate);
      return days !== null && days >= 0;
    })
    .slice()
    .sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate))[0];

  return (
    <SectionStack>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<Banknote size={18} />} label="Monthly estimated income" value={formatCurrency(monthlyIncome)} trend={`${activeSources.length} active`} trendTone="green" />
        <MetricCard icon={<CalendarClock size={18} />} label="Next payment" value={nextPayment ? formatCurrency(nextPayment.amount) : "$0"} trend={nextPayment?.nextPaymentDate ?? "No date"} trendTone="blue" />
        <MetricCard icon={<ReceiptText size={18} />} label="Inactive sources" value={`${data.incomeSources.length - activeSources.length}`} trend="Paused" trendTone="neutral" />
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard icon={<ReceiptText size={18} />} label="Gross pay YTD" value={formatCurrency(summary.paycheckGrossYtd)} trend={`${data.paychecks.length} paychecks`} trendTone="blue" />
        <MetricCard icon={<WalletCards size={18} />} label="Net pay YTD" value={formatCurrency(summary.paycheckNetYtd)} trend="Cash flow" trendTone="green" />
        <MetricCard icon={<Landmark size={18} />} label="Federal tax YTD" value={formatCurrency(summary.paycheckFederalTaxYtd)} trend="Income tax only" trendTone="amber" />
        <MetricCard icon={<ShieldCheck size={18} />} label="FICA YTD" value={formatCurrency(summary.paycheckFicaYtd)} trend="SS + Medicare" trendTone="neutral" />
        <MetricCard icon={<FileText size={18} />} label="State/local YTD" value={formatCurrency(summary.paycheckStateLocalTaxYtd)} trend="Tracked only" trendTone="neutral" />
      </div>
      <Card>
        <CardHeader title="Monthly income trend" eyebrow="Income" />
        <div className="px-4 py-4">
          <LineChart data={incomeChartSeries} color={chartPalette.primary} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Payment date filter" eyebrow="Income" />
        <div className="p-4">
          <DateFilterBar value={dateWindow} onChange={setDateWindow} />
        </div>
      </Card>
      <DataTable
        title="Income sources"
        eyebrow={dateWindowLabel(dateWindow)}
        emptyTitle="No income sources"
        emptyDescription="Add salary, business, investment, or side income."
        items={filteredSources}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        columns={[
          { header: "Source", cell: (source) => <PrimaryCell title={source.name} detail={source.category} /> },
          { header: "Amount", cell: (source) => formatCurrency(source.amount) },
          { header: "Frequency", cell: (source) => source.frequency },
          { header: "Monthly est.", cell: (source) => formatCurrency(monthlyAmount(source.amount, source.frequency)) },
          { header: "Next payment", cell: (source) => source.nextPaymentDate },
          {
            header: "Paychecks",
            cell: (source) => {
              const stats = sourcePaycheckStats.get(source.id);
              return stats ? (
                <div>
                  <p className="font-mono text-sm font-medium">{stats.count}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Latest {stats.latestDate}
                  </p>
                </div>
              ) : (
                <span className="text-xs text-[var(--muted)]">None linked</span>
              );
            },
          },
          {
            header: "Status",
            cell: (source) => <Badge tone={source.active ? "green" : "neutral"}>{source.active ? "Active" : "Inactive"}</Badge>,
          },
          { header: "Notes", cell: (source) => <NoteCell value={source.notes} /> },
        ]}
      />
      <Card>
        <CardHeader
          title="Paycheck year"
          eyebrow={`${paycheckYear} totals`}
          action={
            <select
              className={cn(
                "h-8 rounded-lg border px-2.5 text-xs transition",
                "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                controlFocusVisibleRing,
              )}
              onChange={(event) => setPaycheckYear(Number(event.target.value))}
              value={paycheckYear}
            >
              {paycheckYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          }
        />
        <div className="grid gap-3 p-4 md:grid-cols-6">
          <MiniStat label="Gross" value={formatCurrency(paycheckYearTotals.gross)} />
          <MiniStat label="Net" value={formatCurrency(paycheckYearTotals.net)} />
          <MiniStat label="Federal tax" value={formatCurrency(paycheckYearTotals.federal)} />
          <MiniStat label="FICA" value={formatCurrency(paycheckYearTotals.fica)} />
          <MiniStat label="State/local" value={formatCurrency(paycheckYearTotals.stateLocal)} />
        </div>
      </Card>
      <DataTable
        title="Paychecks"
        eyebrow={`Tax year ${paycheckYear}`}
        emptyTitle="No paychecks"
        emptyDescription="Add a paycheck to use actual gross pay, net pay, and withholdings."
        items={filteredPaychecks}
        onAdd={onAddPaycheck}
        onEdit={onEditPaycheck}
        onDelete={onDeletePaycheck}
        columns={[
          {
            header: "Pay date",
            cell: (paycheck) => (
              <PrimaryCell
                title={paycheck.payDate}
                detail={`${paycheck.periodStartDate} to ${paycheck.periodEndDate}`}
              />
            ),
          },
          {
            header: "Employer",
            cell: (paycheck) => (
              <PrimaryCell
                title={paycheck.employerName}
                detail={incomeSourceName(data, paycheck.incomeSourceId)}
              />
            ),
          },
          { header: "Gross", cell: (paycheck) => formatCurrency(paycheck.grossPay) },
          { header: "Net", cell: (paycheck) => formatCurrency(paycheck.netPay) },
          {
            header: "Federal tax",
            cell: (paycheck) => formatCurrency(paycheck.federalIncomeTaxWithheld),
          },
          {
            header: "FICA",
            cell: (paycheck) =>
              formatCurrency(
                paycheck.socialSecurityTaxWithheld +
                  paycheck.medicareTaxWithheld +
                  paycheck.additionalMedicareTaxWithheld,
              ),
          },
          {
            header: "State/local",
            cell: (paycheck) =>
              formatCurrency(paycheck.stateIncomeTaxWithheld + paycheck.localIncomeTaxWithheld),
          },
          { header: "Notes", cell: (paycheck) => <NoteCell value={paycheck.notes} /> },
        ]}
      />
    </SectionStack>
  );
}

function getPaycheckStatsBySource(paychecks: FinanceData["paychecks"]) {
  const stats = new Map<string, { count: number; latestDate: string }>();

  paychecks.forEach((paycheck) => {
    if (!paycheck.incomeSourceId) {
      return;
    }

    const current = stats.get(paycheck.incomeSourceId);
    stats.set(paycheck.incomeSourceId, {
      count: (current?.count ?? 0) + 1,
      latestDate:
        !current || paycheck.payDate > current.latestDate
          ? paycheck.payDate
          : current.latestDate,
    });
  });

  return stats;
}

function incomeSourceName(data: FinanceData, incomeSourceId: string) {
  return data.incomeSources.find((source) => source.id === incomeSourceId)?.name ?? "No source";
}

function TaxSection({
  chartPalette,
  data,
  onAdd,
  onDelete,
  onEdit,
  onOpenQuestionnaire,
  onRegenerateReport,
  onUpdateReportNotes,
}: {
  chartPalette: ChartPalette;
  data: FinanceData;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onEdit: (item: FinanceData["taxAssetSales"][number]) => void;
  onOpenQuestionnaire: () => void;
  onRegenerateReport: (taxYear: number) => void;
  onUpdateReportNotes: (taxYear: number, notes: string) => void;
}) {
  const [taxTab, setTaxTab] = useState<TaxPlannerTab>("estimate");
  const taxSummary = useMemo(() => calculateTaxSummary(data), [data]);
  const profile = data.taxProfile;
  const taxBalance = taxSummary.estimatedBalanceDue;
  const gainPositive = taxSummary.netCapitalGain >= 0;
  const potentialForms = [
    ["Income", "W-2, 1099-NEC, 1099-MISC, Schedule C if business"],
    ["Stocks", "1099-B, Form 8949, Schedule D"],
    ["Crypto", "1099-DA/CSV records, Form 8949, digital asset question"],
    ["Dividends", "1099-DIV, qualified vs ordinary dividend split"],
  ];

  return (
    <SectionStack>
      <TaxPlannerTabs value={taxTab} onChange={setTaxTab} />
      {taxTab === "reports" ? (
        <TaxReportsSection
          data={data}
          onRegenerate={onRegenerateReport}
          onUpdateNotes={onUpdateReportNotes}
        />
      ) : (
        <>
      <NoticeCard
        tone="amber"
        title="Tax planning estimate"
        text="This is an educational planner for U.S. federal tax prep, not tax advice. Use gross income, reconcile against broker/exchange forms, and ask a tax professional about wash sales, state taxes, self-employment expenses, options, RSUs, collectibles, and unusual purchases."
      />
      <Card>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground-soft)]">
              Tax questionnaire
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Walk through income, deductions, credits, payments, and document reminders in a guided private view.
            </p>
          </div>
          <Button onClick={onOpenQuestionnaire}>
            <FileText size={15} />
            Open questionnaire
          </Button>
          <Button onClick={() => setTaxTab("reports")} variant="ghost">
            Yearly reports
          </Button>
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={<Banknote size={18} />}
          label="Tracked income"
          value={formatCurrency(taxSummary.ordinaryIncome)}
          trend={data.paychecks.length > 0 ? "Paychecks + projection" : "Annualized sources"}
          trendTone="blue"
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label="Net capital gain"
          value={formatCurrency(taxSummary.netCapitalGain)}
          trend={gainPositive ? "Realized gain" : "Realized loss"}
          trendTone={gainPositive ? "green" : "red"}
        />
        <MetricCard
          icon={<Calculator size={18} />}
          label="Taxable income"
          value={formatCurrency(taxSummary.estimatedTaxableIncome)}
          trend={`${profile.deductionMode} deduction`}
          trendTone="neutral"
        />
        <MetricCard
          icon={<ReceiptText size={18} />}
          label="Federal estimate"
          value={formatCurrency(taxSummary.totalEstimatedFederalTax)}
          trend="Manual rates after credits"
          trendTone="amber"
        />
        <MetricCard
          icon={<WalletCards size={18} />}
          label={taxBalance >= 0 ? "Projected due" : "Projected refund"}
          value={formatCurrency(Math.abs(taxBalance))}
          trend="After payments"
          trendTone={taxBalance >= 0 ? "red" : "green"}
        />
        <MetricCard
          icon={<FileText size={18} />}
          label="Realized sales"
          value={`${data.taxAssetSales.length}`}
          trend="Manual history"
          trendTone="blue"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="Capital gains picture" eyebrow="Short vs long term">
            Short-term gains are estimated with ordinary income. Long-term gains use your planner rate.
          </CardHeader>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <MiniStat label="Short-term net" value={formatCurrency(taxSummary.netShortTerm)} />
            <MiniStat label="Long-term net" value={formatCurrency(taxSummary.netLongTerm)} />
            <MiniStat
              label="Capital loss deduction"
              value={formatCurrency(taxSummary.capitalLossDeductionEstimate)}
            />
            <MiniStat
              label="Additional investment tax"
              value={formatCurrency(taxSummary.niitEstimate)}
            />
          </div>
          <div className="px-4 pb-4">
            <DonutChart
              ariaLabel="Taxable income mix"
              data={[
                {
                  label: "Ordinary taxable income",
                  value: taxSummary.estimatedTaxableOrdinaryIncome,
                  color: chartPalette.primary,
                },
                {
                  label: "Taxable long-term gains",
                  value: taxSummary.taxableLongTermCapitalGain,
                  color: chartPalette.secondary,
                },
                {
                  label: "Taxable short-term gains",
                  value: taxSummary.taxableShortTermCapitalGain,
                  color: chartPalette.tertiary,
                },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Tax form map" eyebrow="Prep checklist">
            Match each row against tax documents before filing.
          </CardHeader>
          <div className="divide-y divide-[var(--line)]">
            {potentialForms.map(([label, detail]) => (
              <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr]">
                <p className="text-sm font-semibold text-[var(--foreground-soft)]">{label}</p>
                <p className="text-sm leading-6 text-[var(--muted)]">{detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <TaxGuideGrid />

      <TaxIncomeHistoryCard data={data} />

      <DataTable
        title="Realized stock and crypto sales"
        eyebrow="Form 8949 style history"
        emptyTitle="No realized sales"
        emptyDescription="Add sold stocks or crypto disposals to estimate capital gains and organize tax history."
        items={data.taxAssetSales}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        columns={[
          {
            header: "Asset",
            cell: (sale) => (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-semibold">{sale.symbol}</p>
                  <Badge tone={sale.assetType === "Crypto" ? "amber" : "blue"}>
                    {sale.assetType}
                  </Badge>
                </div>
                <p className="max-w-52 truncate text-xs text-[var(--muted)]">{sale.name}</p>
              </div>
            ),
          },
          { header: "Acquired", cell: (sale) => sale.acquiredDate },
          { header: "Sold", cell: (sale) => sale.soldDate },
          {
            header: "Term",
            cell: (sale) => {
              const days = taxSummary.sales.find((item) => item.id === sale.id)?.holdingDays;
              return (
                <div>
                  <TaxTermBadge sale={sale} />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {days === null || days === undefined ? "Unknown" : `${days} days`}
                  </p>
                </div>
              );
            },
          },
          { header: "Proceeds", cell: (sale) => formatCurrency(sale.proceeds) },
          { header: "Cost basis", cell: (sale) => formatCurrency(sale.costBasis) },
          { header: "Fees", cell: (sale) => formatCurrency(sale.fees) },
          {
            header: "Gain/loss",
            cell: (sale) => <GainBadge value={taxAssetSaleGain(sale)} basis={sale.costBasis} />,
          },
          { header: "Notes", cell: (sale) => <NoteCell value={sale.notes} /> },
        ]}
      />
        </>
      )}
    </SectionStack>
  );
}

function TaxPlannerTabs({
  onChange,
  value,
}: {
  onChange: (value: TaxPlannerTab) => void;
  value: TaxPlannerTab;
}) {
  const tabs: Array<{ label: string; value: TaxPlannerTab }> = [
    { label: "Estimate", value: "estimate" },
    { label: "Yearly Reports", value: "reports" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          aria-pressed={value === tab.value}
          className={cn(
            "inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition",
            focusVisibleRing,
            value === tab.value
              ? "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] shadow-sm"
              : "border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)] hover:bg-[var(--paper-muted)] hover:text-[var(--foreground)]",
          )}
          onClick={() => onChange(tab.value)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TaxReportsSection({
  data,
  onRegenerate,
  onUpdateNotes,
}: {
  data: FinanceData;
  onRegenerate: (taxYear: number) => void;
  onUpdateNotes: (taxYear: number, notes: string) => void;
}) {
  const [selectedYear, setSelectedYear] = useState(data.taxProfile.taxYear);
  const reports = data.taxReports.slice().sort((a, b) => b.taxYear - a.taxYear);
  const report = reports.find((item) => item.taxYear === selectedYear) ?? reports[0];
  const canRegenerateReport = report?.status === "finalized";

  if (!report) {
    return (
      <Card>
        <EmptyState
          icon={<FileText size={18} />}
          title="No tax reports yet"
          description="A current-year report will appear after saved tax data is synced."
        />
      </Card>
    );
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tax-report-${report.taxYear}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader title="Yearly tax reports" eyebrow="Filing summaries">
          Live reports update automatically. Finalized years stay stable unless rebuilt.
        </CardHeader>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              <span>Tax year</span>
              <select
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm transition",
                  "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                  controlFocusVisibleRing,
                )}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                value={report.taxYear}
              >
                {reports.map((item) => (
                  <option key={item.id} value={item.taxYear}>
                    {item.taxYear}
                  </option>
                ))}
              </select>
            </label>
            <div className="pt-5">
              <Badge tone={taxReportBadgeTone(report.status)}>
                {taxReportStatusLabel(report)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canRegenerateReport ? (
              <Button onClick={() => onRegenerate(report.taxYear)}>
                <RefreshCcw size={15} />
                Rebuild
              </Button>
            ) : null}
            <Button onClick={handleExport} variant="ghost">
              <Download size={15} />
              Export
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={<Banknote size={18} />} label="Total income" value={formatCurrency(report.totalIncome)} trend={report.projectionBasis} trendTone="blue" />
        <MetricCard icon={<Calculator size={18} />} label="Taxable income" value={formatCurrency(report.taxableIncome)} trend="Estimate" trendTone="neutral" />
        <MetricCard icon={<ReceiptText size={18} />} label="Federal estimate" value={formatCurrency(report.federalTaxEstimate)} trend="Federal" trendTone="amber" />
        <MetricCard icon={<Landmark size={18} />} label="State/local" value={formatCurrency(report.stateLocalTaxEstimate)} trend="State + local" trendTone="neutral" />
        <MetricCard icon={<WalletCards size={18} />} label="Payments" value={formatCurrency(report.totalPaymentsWithholding)} trend="Withholding" trendTone="green" />
        <MetricCard
          icon={<FileText size={18} />}
          label={report.projectedDueOrRefund >= 0 ? "Projected due" : "Projected refund"}
          value={formatCurrency(Math.abs(report.projectedDueOrRefund))}
          trend="After payments"
          trendTone={report.projectedDueOrRefund >= 0 ? "red" : "green"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TaxReportCategoryCard
          title="Income"
          eyebrow="Ordinary income"
          rows={[
            ["Projected annual income", report.projectedAnnualIncome],
            ["Actual income to date", report.actualIncomeToDate],
            ["Paycheck gross pay", report.paycheckGrossPay],
            ["Taxable interest", report.taxableInterest],
            ["Adjusted gross income", report.adjustedGrossIncome],
          ]}
        />
        <TaxReportCategoryCard
          title="Dividends"
          eyebrow="1099-DIV"
          rows={[
            ["Ordinary dividends", report.ordinaryDividends],
            ["Qualified dividends", report.qualifiedDividends],
          ]}
        />
        <TaxReportCategoryCard
          title="Stocks"
          eyebrow={`${report.stockSalesCount} realized sale${report.stockSalesCount === 1 ? "" : "s"}`}
          rows={[
            ["Short-term gain/loss", report.stockShortTermGain],
            ["Long-term gain/loss", report.stockLongTermGain],
            ["Proceeds", report.stockProceeds],
            ["Cost basis", report.stockCostBasis],
            ["Fees", report.stockFees],
          ]}
        />
        <TaxReportCategoryCard
          title="Crypto"
          eyebrow={`${report.cryptoSalesCount} realized disposal${report.cryptoSalesCount === 1 ? "" : "s"}`}
          rows={[
            ["Short-term gain/loss", report.cryptoShortTermGain],
            ["Long-term gain/loss", report.cryptoLongTermGain],
            ["Proceeds", report.cryptoProceeds],
            ["Cost basis", report.cryptoCostBasis],
            ["Fees", report.cryptoFees],
          ]}
        />
        <TaxReportCategoryCard
          title="Deductions and credits"
          eyebrow="Filing reductions"
          rows={[
            ["Deductions", report.deductions],
            ["Adjustments", report.adjustments],
            ["Credits", report.credits],
          ]}
        />
        <TaxReportCategoryCard
          title="Payments"
          eyebrow="Withholding and estimates"
          rows={[
            ["Federal payments", report.federalPayments],
            ["State/local payments", report.stateLocalPayments],
            ["Total payments", report.totalPaymentsWithholding],
            ["Total estimated tax", report.totalTaxEstimate],
          ]}
        />
      </div>

      <Card>
        <CardHeader title="Report notes" eyebrow="Read-only report with editable notes">
          Add reminders for filing software, source documents, and reconciliation.
        </CardHeader>
        <div className="p-4">
          <textarea
            className={cn(
              "min-h-28 w-full rounded-lg border p-3 text-sm transition",
              "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
              controlFocusVisibleRing,
            )}
            onChange={(event) => onUpdateNotes(report.taxYear, event.target.value)}
            placeholder="Add filing notes for this tax year..."
            value={report.notes}
          />
        </div>
      </Card>
    </div>
  );
}

function TaxReportCategoryCard({
  eyebrow,
  rows,
  title,
}: {
  eyebrow: string;
  rows: Array<[string, number]>;
  title: string;
}) {
  return (
    <Card>
      <CardHeader title={title} eyebrow={eyebrow} />
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <MiniStat key={label} label={label} value={formatCurrency(value)} />
        ))}
      </div>
    </Card>
  );
}

function taxReportBadgeTone(status: FinanceData["taxReports"][number]["status"]) {
  if (status === "finalized") {
    return "green";
  }

  return status === "projected" ? "blue" : "amber";
}

function taxReportStatusLabel(report: FinanceData["taxReports"][number]) {
  if (report.status === "finalized") {
    return "Finalized";
  }

  if (report.status === "projected") {
    return "Projected";
  }

  return "Current projection";
}

type TaxProfileNumberKey = {
  [Key in keyof FinanceData["taxProfile"]]: FinanceData["taxProfile"][Key] extends number
    ? Key
    : never;
}[keyof FinanceData["taxProfile"]];

type TaxProfileNumberGroup = {
  title: string;
  description: string;
  fields: Array<{
    label: string;
    name: TaxProfileNumberKey;
    step?: string;
  }>;
};

const taxQuestionnaireGroups: TaxProfileNumberGroup[] = [
  {
    title: "Rates",
    description: "Manual rates keep the questionnaire usable across tax years and income levels.",
    fields: [
      { name: "ordinaryIncomeTaxRate", label: "Ordinary income tax rate (%)" },
      { name: "longTermCapitalGainsTaxRate", label: "Long-term capital gains tax rate (%)" },
      { name: "qualifiedDividendTaxRate", label: "Qualified dividend rate (%)" },
      { name: "additionalInvestmentTaxRate", label: "Additional investment tax rate (%)" },
      { name: "selfEmploymentTaxRate", label: "Self-employment tax rate (%)" },
      { name: "stateIncomeTaxRate", label: "State income tax rate (%)" },
      { name: "localIncomeTaxRate", label: "Local income tax rate (%)" },
    ],
  },
  {
    title: "Income",
    description: "Add taxable income that is not already captured by paycheck records.",
    fields: [
      { name: "taxableInterest", label: "Taxable interest" },
      { name: "ordinaryDividends", label: "Ordinary dividends" },
      { name: "qualifiedDividends", label: "Qualified dividends" },
      { name: "otherOrdinaryIncome", label: "Other ordinary income" },
      { name: "businessIncome", label: "Business / 1099 income" },
      { name: "rentalRoyaltyIncome", label: "Rental / royalty income" },
      { name: "retirementIncome", label: "Retirement income" },
      { name: "unemploymentIncome", label: "Unemployment income" },
      { name: "taxableSocialSecurity", label: "Taxable Social Security" },
    ],
  },
  {
    title: "Deductions",
    description: "Use positive values; the planner subtracts eligible deductions and adjustments.",
    fields: [
      { name: "standardDeductionAmount", label: "Standard deduction amount" },
      { name: "itemizedDeductions", label: "Itemized deductions" },
      { name: "hsaDeduction", label: "HSA deduction" },
      { name: "iraDeduction", label: "IRA deduction" },
      { name: "studentLoanInterestDeduction", label: "Student loan interest deduction" },
      { name: "qbiDeduction", label: "QBI deduction" },
      { name: "otherAdjustments", label: "Other adjustments" },
    ],
  },
  {
    title: "Investments",
    description: "Capital gains are estimated from realized sale rows and these reusable tax-year settings.",
    fields: [
      { name: "capitalLossCarryover", label: "Capital loss carryover" },
    ],
  },
  {
    title: "Credits",
    description: "Credits reduce the estimated federal tax bill after tax is calculated.",
    fields: [
      { name: "childTaxCredit", label: "Child tax credit" },
      { name: "otherTaxCredits", label: "Other tax credits" },
    ],
  },
  {
    title: "Payments",
    description: "Withholding and estimated payments reduce projected amount due.",
    fields: [
      { name: "federalWithholding", label: "Other federal withholding" },
      { name: "estimatedPayments", label: "Federal estimated payments" },
      { name: "stateWithholding", label: "State withholding" },
      { name: "stateEstimatedPayments", label: "State estimated payments" },
      { name: "localWithholding", label: "Local withholding" },
      { name: "localEstimatedPayments", label: "Local estimated payments" },
    ],
  },
];

const taxDocumentChecklist = [
  "W-2",
  "1099-INT",
  "1099-DIV",
  "1099-B",
  "Crypto CSV / 1099-DA",
  "1099-NEC / 1099-MISC",
  "1099-R",
  "SSA-1099",
  "1098-E",
  "HSA forms",
];

function TaxQuestionnaireView({
  data,
  onBack,
  onChange,
}: {
  data: FinanceData;
  onBack: () => void;
  onChange: (profile: Partial<FinanceData["taxProfile"]>) => void;
}) {
  const profile = data.taxProfile;
  const summary = useMemo(() => calculateTaxSummary(data), [data]);
  const filingStatuses: FinanceData["taxProfile"]["filingStatus"][] = [
    "Single",
    "Married filing jointly",
    "Married filing separately",
    "Head of household",
  ];
  const deductionModes: FinanceData["taxProfile"]["deductionMode"][] = [
    "Standard",
    "Itemized",
  ];
  const updateNumber = (name: TaxProfileNumberKey, value: string) => {
    const nextValue =
      name === "taxYear"
        ? Math.round(Math.max(parseFiniteNumber(value) ?? 0, 0))
        : Math.max(parseFiniteNumber(value) ?? 0, 0);
    onChange({ [name]: nextValue } as Partial<FinanceData["taxProfile"]>);
  };

  return (
    <SectionStack>
      <NoticeCard
        tone="amber"
        title="Private tax questionnaire"
        text="This guided page uses the same local tax planner fields. It does not send data anywhere or add new persisted schema fields."
      />
      <Card>
        <CardHeader
          title="Tax questionnaire"
          eyebrow={`Tax year ${profile.taxYear}`}
          action={
            <Button onClick={onBack} variant="ghost">
              Back to planner
            </Button>
          }
        >
          Work through filing basics, income, deductions, investment settings, credits, payments, and documents.
        </CardHeader>
        <div className="grid gap-4 p-4 xl:grid-cols-[1fr_300px]">
          <div className="grid gap-4">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3">
              <div className="mb-3">
                <h3 className="text-xs font-semibold uppercase text-[var(--foreground-soft)]">
                  Filing basics
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Set the reusable assumptions for this tax year.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                  <span>Tax year</span>
                  <input
                    className={cn(
                      "h-9 rounded-lg border px-3 text-sm transition",
                      "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                      controlFocusVisibleRing,
                    )}
                    max={2035}
                    min={2020}
                    onChange={(event) => updateNumber("taxYear", event.target.value)}
                    type="number"
                    value={profile.taxYear}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)] sm:col-span-1">
                  <span>Filing status</span>
                  <select
                    className={cn(
                      "h-9 rounded-lg border px-3 text-sm transition",
                      "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                      controlFocusVisibleRing,
                    )}
                    onChange={(event) =>
                      onChange({
                        filingStatus: event.target
                          .value as FinanceData["taxProfile"]["filingStatus"],
                      })
                    }
                    value={profile.filingStatus}
                  >
                    {filingStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                  <span>Deduction mode</span>
                  <select
                    className={cn(
                      "h-9 rounded-lg border px-3 text-sm transition",
                      "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                      controlFocusVisibleRing,
                    )}
                    onChange={(event) =>
                      onChange({
                        deductionMode: event.target
                          .value as FinanceData["taxProfile"]["deductionMode"],
                      })
                    }
                    value={profile.deductionMode}
                  >
                    {deductionModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            {taxQuestionnaireGroups.map((group) => (
              <div key={group.title} className="rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3">
                <div className="mb-3">
                  <h3 className="text-xs font-semibold uppercase text-[var(--foreground-soft)]">
                    {group.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">{group.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {group.fields.map((field) => (
                    <TaxNumberField
                      key={field.name}
                      label={field.label}
                      onChange={(value) => updateNumber(field.name, value)}
                      step={field.step}
                      value={profile[field.name]}
                    />
                  ))}
                </div>
                {group.title === "Rates" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-[var(--muted)]">
                      Capital gain presets
                    </span>
                    {[0, 15, 20].map((rate) => (
                      <PaymentPresetButton
                        key={rate}
                        onClick={() => onChange({ longTermCapitalGainsTaxRate: rate })}
                      >
                        {rate}%
                      </PaymentPresetButton>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="grid content-start gap-3">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3">
              <h3 className="text-xs font-semibold uppercase text-[var(--foreground-soft)]">
                Data pulled in
              </h3>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                The estimate includes saved income sources, paycheck history, realized tax sales, and the manual fields on this page.
              </p>
            </div>
            <MiniStat label="Projected federal tax" value={formatCurrency(summary.totalEstimatedFederalTax)} />
            <MiniStat
              label={summary.estimatedBalanceDue >= 0 ? "Projected due" : "Projected refund"}
              value={formatCurrency(Math.abs(summary.estimatedBalanceDue))}
            />
            <MiniStat label="Tracked ordinary income" value={formatCurrency(summary.ordinaryIncome)} />
            <MiniStat label="Manual income add-ons" value={formatCurrency(summary.manualOrdinaryIncome)} />
            <MiniStat label="Gross pay" value={formatCurrency(summary.paycheckGrossPay)} />
            <MiniStat label="Paycheck federal tax" value={formatCurrency(summary.paycheckFederalIncomeTaxWithheld)} />
            <MiniStat label="Paycheck FICA tracked" value={formatCurrency(summary.paycheckFicaWithheld)} />
            <MiniStat label="State/local tracked" value={formatCurrency(summary.paycheckStateLocalWithheld)} />
            <MiniStat label="Realized sales" value={String(data.taxAssetSales.length)} />
            <MiniStat label="Short-term net" value={formatCurrency(summary.netShortTerm)} />
            <MiniStat label="Long-term net" value={formatCurrency(summary.netLongTerm)} />
            <MiniStat label="Deduction used" value={formatCurrency(summary.deductionAmount)} />
            <MiniStat label="Tax credits" value={formatCurrency(summary.taxCredits)} />
            <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3">
              <h3 className="text-xs font-semibold uppercase text-[var(--foreground-soft)]">
                Document checklist
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {taxDocumentChecklist.map((document) => (
                  <Badge key={document} tone="neutral">
                    {document}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </SectionStack>
  );
}

function TaxNumberField({
  label,
  onChange,
  step = "0.01",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  step?: string;
  value: number;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
      <span>{label}</span>
      <input
        className={cn(
          "h-9 rounded-lg border px-3 text-sm transition",
          "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
          controlFocusVisibleRing,
        )}
        min={0}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function TaxGuideGrid() {
  const guides = [
    {
      title: "Capital gains basics",
      text: "Basis is what you paid, proceeds are what you received, and fees reduce the gain estimate. Assets held one year or less are short-term; more than one year is long-term.",
    },
    {
      title: "Crypto needs extra records",
      text: "Crypto sales, swaps, payments, rewards, staking, mining, and fees can create reportable records. Keep exchange CSVs, wallet histories, dates, units, fair market value, and basis.",
    },
    {
      title: "Losses and carryovers",
      text: "Capital losses offset capital gains first. If losses exceed gains, this planner estimates the common federal loss deduction cap and flags the remaining carryover concept.",
    },
    {
      title: "Self-employment reminder",
      text: "Business, consulting, contractor, freelance, and side income may need Schedule C and self-employment tax after expenses. The estimate is intentionally rough.",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {guides.map((guide) => (
        <Card key={guide.title}>
          <div className="p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">{guide.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{guide.text}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TaxIncomeHistoryCard({ data }: { data: FinanceData }) {
  const [tableQuery, setTableQuery] = useState("");
  const incomeRows = data.incomeSources
    .slice()
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  const filteredIncomeRows = useMemo(
    () => incomeRows.filter((source) => recordMatchesQuery(source, tableQuery)),
    [incomeRows, tableQuery],
  );
  const annualIncome = incomeRows.reduce(
    (sum, source) => sum + (source.active ? monthlyAmount(source.amount, source.frequency) * 12 : 0),
    0,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Income history for tax prep"
        eyebrow="Annualized sources"
        action={
          incomeRows.length > 0 ? (
            <TableSearchControl
              label="Search income history"
              onChange={setTableQuery}
              value={tableQuery}
            />
          ) : null
        }
      >
        Use gross income for tax estimates; net direct deposit amounts will understate taxable wages.
      </CardHeader>
      <div className="grid gap-3 p-4 md:grid-cols-3">
        <MiniStat label="Active annualized income" value={formatCurrency(annualIncome)} />
        <MiniStat
          label="Income sources"
          value={`${incomeRows.filter((source) => source.active).length} active`}
        />
        <MiniStat
          label="Inactive history"
          value={`${incomeRows.filter((source) => !source.active).length} paused`}
        />
      </div>
      {incomeRows.length === 0 ? (
        <EmptyState
          icon={<Banknote size={18} />}
          title="No income history"
          description="Add income sources so the tax planner can annualize them."
        />
      ) : filteredIncomeRows.length === 0 ? (
        <EmptyState
          icon={<Search size={18} />}
          title="No matching income rows"
          description="No income history matches the current table search."
          action={
            <Button onClick={() => setTableQuery("")}>
              <X size={15} />
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <caption className="sr-only">Tax planner income history</caption>
            <thead>
              <tr className="bg-[var(--paper-subtle)] text-xs font-medium text-[var(--muted)]">
                {[
                  "Source",
                  "Amount",
                  "Frequency",
                  "Annualized",
                  "Category",
                  "Next payment",
                  "Status",
                  "Notes",
                ].map((header) => (
                  <th
                    key={header}
                    className="border-b border-[var(--line)] px-4 py-2.5"
                    scope="col"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredIncomeRows.map((source) => (
                <tr key={source.id} className="transition hover:bg-[var(--paper-subtle)]">
                  <th
                    className="border-b border-[var(--line)] px-4 py-3 text-[var(--foreground-soft)]"
                    scope="row"
                  >
                    <PrimaryCell title={source.name} detail={source.category} />
                  </th>
                  <td className="border-b border-[var(--line)] px-4 py-3 text-[var(--foreground-soft)]">
                    {formatCurrency(source.amount)}
                  </td>
                  <td className="border-b border-[var(--line)] px-4 py-3 text-[var(--foreground-soft)]">
                    {source.frequency}
                  </td>
                  <td className="border-b border-[var(--line)] px-4 py-3 text-[var(--foreground-soft)]">
                    {source.active
                      ? formatCurrency(monthlyAmount(source.amount, source.frequency) * 12)
                      : formatCurrency(0)}
                  </td>
                  <td className="border-b border-[var(--line)] px-4 py-3 text-[var(--foreground-soft)]">
                    {source.category}
                  </td>
                  <td className="border-b border-[var(--line)] px-4 py-3 text-[var(--foreground-soft)]">
                    {source.nextPaymentDate}
                  </td>
                  <td className="border-b border-[var(--line)] px-4 py-3 text-[var(--foreground-soft)]">
                    <Badge tone={source.active ? "green" : "neutral"}>
                      {source.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="border-b border-[var(--line)] px-4 py-3 text-[var(--foreground-soft)]">
                    <NoteCell value={source.notes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function TaxTermBadge({ sale }: { sale: FinanceData["taxAssetSales"][number] }) {
  const acquired = parseDateInput(sale.acquiredDate);
  const sold = parseDateInput(sale.soldDate);
  if (!acquired || !sold) {
    return <Badge tone="neutral">Unknown</Badge>;
  }

  const isLongTerm = sold.getTime() - acquired.getTime() > 365 * 24 * 60 * 60 * 1000;
  return (
    <Badge tone={isLongTerm ? "green" : "amber"}>
      {isLongTerm ? "Long-term" : "Short-term"}
    </Badge>
  );
}

function LotTermBadge({
  asOfDate,
  lot,
}: {
  asOfDate: string;
  lot: FinanceData["stockLots"][number];
}) {
  const acquired = parseDateInput(lot.acquiredDate);
  const asOf = parseDateInput(asOfDate);
  if (!acquired || !asOf) {
    return <Badge tone="neutral">Unknown</Badge>;
  }

  const heldDays = Math.round((asOf.getTime() - acquired.getTime()) / (24 * 60 * 60 * 1000));
  return (
    <Badge tone={heldDays > 365 ? "green" : "amber"}>
      {heldDays > 365 ? "Long-term" : "Short-term"}
    </Badge>
  );
}

function appendStockTradeNote(existingNotes: string, trade: StockTradeDraft) {
  const action = trade.kind === "buy" ? "Bought" : "Sold";
  const tradeLine = `${trade.tradeDate}: ${action} ${trade.shares.toLocaleString()} shares at ${formatCurrency(trade.price)}${trade.fees > 0 ? ` with ${formatCurrency(trade.fees)} fees` : ""}${trade.notes ? ` - ${trade.notes}` : ""}`;
  const trimmedNotes = existingNotes.trim();

  return trimmedNotes ? `${trimmedNotes}\n${tradeLine}` : tradeLine;
}

function SavingsSection({
  data,
  summary,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: FinanceData;
  summary: ReturnType<typeof calculateSummary>;
  onAdd: () => void;
  onEdit: (item: FinanceData["savingsGoals"][number]) => void;
  onDelete: (id: string) => void;
}) {
  const emergency = summary.emergencyFund;
  const emergencyGoals = data.savingsGoals.filter((goal) => goal.isEmergency);
  const emergencyPercent = savingsGoalProgressPercent(emergency);

  return (
    <SectionStack>
      {emergencyGoals.length > 1 ? (
        <NoticeCard
          tone="amber"
          title="Multiple emergency funds"
          text={`${emergencyGoals.length} goals are marked as emergency funds. Summary cards use the first one found, so consider keeping a single primary emergency fund flag.`}
        />
      ) : null}
      {emergency ? (
        <Card className="overflow-hidden">
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px] lg:items-center">
            <div className="min-w-0">
              <Badge tone="green">Main goal</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{emergency.name}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {formatCurrency(emergency.currentSaved)} saved toward{" "}
                {formatCurrency(emergency.targetAmount)}
              </p>
              <div className="mt-5 max-w-xl">
                <ProgressBar value={emergencyPercent} label="Emergency fund progress" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MiniStat label="Monthly contribution" value={formatCurrency(emergency.monthlyContribution)} />
              <MiniStat label="Completion" value={emergency.estimatedCompletionDate} />
              <MiniStat label="Remaining" value={formatCurrency(remainingSavingsAmount(emergency))} />
            </div>
          </div>
        </Card>
      ) : null}
      <DataTable
        title="Savings goals"
        eyebrow="Emergency and sinking funds"
        emptyTitle="No savings goals"
        emptyDescription="Create an emergency fund or a focused savings goal."
        items={data.savingsGoals}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        columns={[
          {
            header: "Goal",
            cell: (goal) => (
              <div>
                <p className="text-sm font-semibold">{goal.name}</p>
                {goal.isEmergency ? <Badge tone="green">Emergency fund</Badge> : null}
              </div>
            ),
          },
          { header: "Saved", cell: (goal) => formatCurrency(goal.currentSaved) },
          { header: "Target", cell: (goal) => formatCurrency(goal.targetAmount) },
          {
            header: "Progress",
            cell: (goal) => (
              <div className="min-w-36">
                <ProgressBar
                  value={savingsGoalProgressPercent(goal)}
                />
              </div>
            ),
          },
          { header: "Monthly", cell: (goal) => formatCurrency(goal.monthlyContribution) },
          { header: "Completion", cell: (goal) => goal.estimatedCompletionDate },
          { header: "Notes", cell: (goal) => <NoteCell value={goal.notes} /> },
        ]}
      />
    </SectionStack>
  );
}

function CardsSection({
  data,
  summary,
  onAdd,
  onAddDebt,
  onEdit,
  onEditDebt,
  onDelete,
  onDeleteDebt,
  onAddCreditScore,
  onOpenCreditScoreLedger,
  onRecordDebtPayment,
  onRecordPayment,
}: {
  data: FinanceData;
  summary: ReturnType<typeof calculateSummary>;
  onAdd: () => void;
  onAddDebt: () => void;
  onEdit: (item: FinanceData["creditCards"][number]) => void;
  onEditDebt: (item: FinanceData["debts"][number]) => void;
  onDelete: (id: string) => void;
  onDeleteDebt: (id: string) => void;
  onAddCreditScore: () => void;
  onOpenCreditScoreLedger: () => void;
  onRecordDebtPayment: (debt: FinanceData["debts"][number]) => void;
  onRecordPayment: (card: FinanceData["creditCards"][number]) => void;
}) {
  const [dateWindow, setDateWindow] = useState<DateWindow>("next30");
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const filteredCards = data.creditCards.filter((card) =>
    matchesDateWindow(
      card.autopay ? card.autopayDate || card.dueDate : card.dueDate,
      dateWindow,
    ),
  );
  const activeCardIndex =
    filteredCards.length === 0 ? 0 : Math.min(selectedCardIndex, filteredCards.length - 1);
  const selectedCard = filteredCards[activeCardIndex];
  const totalCardMinimumPayment = data.creditCards.reduce(
    (total, card) =>
      total + (creditCurrentBalance(card) > 0 ? Math.max(card.minimumPayment, 0) : 0),
    0,
  );
  const totalMonthlyDebtPayments = getMonthlyDebtPaymentTotal(data);
  const totalMonthlyPayments = totalCardMinimumPayment + totalMonthlyDebtPayments;
  const debtRows = data.debts
    .slice()
    .sort((a, b) => {
      if (a.status === "paid" && b.status !== "paid") {
        return 1;
      }
      if (a.status !== "paid" && b.status === "paid") {
        return -1;
      }
      return daysUntilDate(a.dueDate) - daysUntilDate(b.dueDate);
    });
  const cardScheduleDate = (card: FinanceData["creditCards"][number]) =>
    card.autopay ? card.autopayDate || card.dueDate : card.dueDate;

  return (
    <SectionStack>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="grid min-h-28 gap-3 p-4 sm:grid-cols-3">
            <BalanceSummaryMetric
              icon={<CreditCard size={18} />}
              label="Current balance"
              value={formatCurrency(summary.totalCreditCurrentBalance)}
              trend={`${summary.creditUtilization.toFixed(1)}% utilization`}
              trendTone={summary.creditUtilization > 30 ? "amber" : "green"}
            />
            <BalanceSummaryMetric
              icon={<ReceiptText size={18} />}
              label="Last statement"
              value={formatCurrency(summary.totalStatementBalance)}
              trend={`${formatCurrency(summary.totalStatementRemaining)} left`}
              trendTone={summary.totalStatementRemaining > 0 ? "amber" : "green"}
            />
            <BalanceSummaryMetric
              icon={<TrendingDown size={18} />}
              label="Interest balance"
              value={formatCurrency(summary.totalCreditBalance)}
              trend={summary.totalCreditBalance > 0 ? "Carried debt" : "No carried debt"}
              trendTone={summary.totalCreditBalance > 0 ? "amber" : "green"}
            />
          </div>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard
            icon={<TrendingDown size={18} />}
            label="Total debt"
            value={formatCurrency(summary.totalDebtWithCreditCards)}
            trend="Cards + debt"
            trendTone={summary.totalDebtWithCreditCards > 0 ? "amber" : "green"}
          />
          <MetricCard
            icon={<ReceiptText size={18} />}
            label="Monthly payments"
            value={formatCurrency(totalMonthlyPayments)}
            trend={`${formatCurrency(totalMonthlyDebtPayments)} debt`}
            trendTone={totalMonthlyPayments > 0 ? "blue" : "green"}
          />
        </div>
      </div>
      <Card>
        <CardHeader title="Due date filter" eyebrow="Cards" />
        <div className="p-4">
          <DateFilterBar value={dateWindow} onChange={setDateWindow} />
        </div>
      </Card>
      <div className="grid gap-3 lg:grid-cols-3">
        {selectedCard ? (
          (() => {
          const card = selectedCard;
          const currentBalance = creditCurrentBalance(card);
          const interestBalance = creditInterestBalance(card);
          const statementBalance = creditStatementBalance(card);
          const statementPaid = creditStatementPaid(card);
          const statementRemaining = creditStatementRemaining(card);
          const utilization = calculatePercent(currentBalance, card.limit);
          const payoff = payoffEstimate(card);
          const hasMultipleCards = filteredCards.length > 1;
          const activeCardNumber = activeCardIndex + 1;
          const showPreviousCard = () => {
            setSelectedCardIndex(
              activeCardIndex === 0 ? filteredCards.length - 1 : activeCardIndex - 1,
            );
          };
          const showNextCard = () => {
            setSelectedCardIndex(
              activeCardIndex === filteredCards.length - 1 ? 0 : activeCardIndex + 1,
            );
          };

          return (
            <Card className="flex min-h-[344px] flex-col overflow-hidden" key={card.id}>
              <button
                className={cn("block w-full flex-1 p-4 text-left transition hover:bg-[var(--paper-subtle)]", focusVisibleRing)}
                onClick={() => onEdit(card)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <PrimaryCell title={card.cardName} detail={card.issuer} />
                  <DueBadge date={card.dueDate} />
                </div>
                <div className="mt-4">
                  <ProgressBar
                    value={utilization}
                    label={`${formatCurrency(currentBalance)} of ${formatCurrency(card.limit)}`}
                    tone={utilization > 30 ? "amber" : "green"}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <MiniStat label="Stmt left" value={formatCurrency(statementRemaining)} compact />
                  <MiniStat label="Stmt bal." value={formatCurrency(statementBalance)} compact />
                  <MiniStat label="Stmt paid" value={formatCurrency(statementPaid)} compact />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <MiniStat label="Interest bal." value={formatCurrency(interestBalance)} compact />
                  <MiniStat label="Minimum" value={formatCurrency(card.minimumPayment)} compact />
                  <MiniStat label="APR" value={`${card.apr.toFixed(2)}%`} compact />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <MiniStat label="Statement closes" value={card.statementClosingDate} compact />
                  <MiniStat label="Min payoff" value={payoff.label} compact />
                </div>
              </button>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
                <Button
                  aria-label="Show previous credit card"
                  disabled={!hasMultipleCards}
                  size="sm"
                  variant="ghost"
                  onClick={showPreviousCard}
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>
                <span className="shrink-0 font-mono text-xs text-[var(--muted)]">
                  {filteredCards.length > 0 ? `${activeCardNumber}/${filteredCards.length}` : "0/0"}
                </span>
                <Button
                  aria-label="Show next credit card"
                  disabled={!hasMultipleCards}
                  size="sm"
                  variant="ghost"
                  onClick={showNextCard}
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            </Card>
          );
        })()
        ) : null}
        <CreditScoreTrackerCard
          entries={data.creditScoreHistory}
          onAdd={onAddCreditScore}
          onOpenLedger={onOpenCreditScoreLedger}
        />
        <DebtPaydownCard
          data={data}
          summary={summary}
          onAddDebt={onAddDebt}
        />
      </div>
      <DataTable
        title="Credit cards"
        eyebrow={dateWindowLabel(dateWindow)}
        emptyTitle="No credit cards"
        emptyDescription="Add cards to track current balance, statement balance, utilization, and due dates."
        items={filteredCards}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        columns={[
          { header: "Card", cell: (card) => <PrimaryCell title={card.cardName} detail={card.issuer} /> },
          {
            header: "Pay",
            cell: (card) => (
              <Button
                aria-label={`Pay ${card.cardName}`}
                disabled={creditCurrentBalance(card) <= 0}
                size="sm"
                variant="secondary"
                onClick={() => onRecordPayment(card)}
              >
                Pay
              </Button>
            ),
          },
          { header: "Limit", cell: (card) => formatCurrency(card.limit) },
          { header: "Current", cell: (card) => formatCurrency(creditCurrentBalance(card)) },
          { header: "Last stmt", cell: (card) => formatCurrency(creditStatementBalance(card)) },
          {
            header: "Stmt left",
            cell: (card) => {
              const statementRemaining = creditStatementRemaining(card);

              return (
                <div
                  className={cn(
                    "inline-flex flex-col items-start gap-0.5",
                    statementRemaining > 0 ? "text-[var(--tone-amber-fg)]" : undefined,
                  )}
                >
                  <span>{formatCurrency(statementRemaining)}</span>
                  {statementRemaining > 0 ? (
                    <span className="whitespace-nowrap text-xs font-semibold uppercase leading-tight tracking-normal">
                      Pay ASAP
                    </span>
                  ) : null}
                </div>
              );
            },
          },
          { header: "Stmt paid", cell: (card) => formatCurrency(creditStatementPaid(card)) },
          {
            header: "Interest bal.",
            cell: (card) => {
              const interestBalance = creditInterestBalance(card);

              return (
                <div
                  className={cn(
                    "inline-flex flex-col items-start gap-0.5",
                    interestBalance > 0 ? "text-[var(--tone-red-fg)]" : undefined,
                  )}
                >
                  <span>{formatCurrency(interestBalance)}</span>
                  {interestBalance > 0 ? (
                    <span className="whitespace-nowrap text-xs font-semibold uppercase leading-tight tracking-normal">
                      Pay ASAP
                    </span>
                  ) : null}
                </div>
              );
            },
          },
          {
            header: "Utilization",
            cell: (card) => (
              <div className="min-w-32">
                <ProgressBar
                  value={calculatePercent(creditCurrentBalance(card), card.limit)}
                  tone={calculatePercent(creditCurrentBalance(card), card.limit) > 30 ? "amber" : "green"}
                />
              </div>
            ),
          },
          { header: "Closes", cell: (card) => card.statementClosingDate },
          { header: "Due", cell: (card) => <DueBadge date={cardScheduleDate(card)} /> },
          { header: "Minimum", cell: (card) => formatCurrency(card.minimumPayment) },
          { header: "APR", cell: (card) => `${card.apr.toFixed(2)}%` },
          {
            header: "Payoff est.",
            cell: (card) => {
              const payoff = payoffEstimate(card);
              return (
                <div>
                  <p className="font-mono text-sm font-medium">{payoff.label}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatCurrency(payoff.interest)} interest
                  </p>
                </div>
              );
            },
          },
          { header: "Rewards", cell: (card) => card.rewardsType },
        ]}
      />
      <DataTable
        title="Debt"
        eyebrow={`${data.debts.length} tracked`}
        emptyTitle="No debts tracked"
        emptyDescription="Add loans, medical balances, installment plans, collections, or other non-card debt."
        items={debtRows}
        onAdd={onAddDebt}
        onEdit={onEditDebt}
        onDelete={onDeleteDebt}
        columns={[
          {
            header: "Debt",
            cell: (debt) => <PrimaryCell title={debt.name} detail={debt.lender || debt.type} />,
          },
          {
            header: "Pay",
            cell: (debt) => (
              <Button
                aria-label={`Pay ${debt.name}`}
                disabled={debt.currentBalance <= 0 || debt.status === "paid"}
                size="sm"
                variant="secondary"
                onClick={() => onRecordDebtPayment(debt)}
              >
                Pay
              </Button>
            ),
          },
          { header: "Type", cell: (debt) => debt.type },
          {
            header: "Taken",
            cell: (debt) => debt.loanDate ? formatDateLabel(debt.loanDate) : "Not set",
          },
          { header: "Balance", cell: (debt) => formatCurrency(debt.currentBalance) },
          { header: "Original", cell: (debt) => formatCurrency(debt.originalBalance) },
          { header: "APR", cell: (debt) => `${debt.apr.toFixed(2)}%` },
          { header: "Monthly", cell: (debt) => formatCurrency(debt.minimumPayment) },
          { header: "Due", cell: (debt) => <DueBadge date={debt.dueDate} /> },
          {
            header: "Status",
            cell: (debt) => (
              <Badge tone={debtStatusTone(debt.status)}>
                {debtStatusLabel(debt.status)}
              </Badge>
            ),
          },
          {
            header: "Payoff est.",
            cell: (debt) => {
              const payoff = debtPayoffEstimate(debt);
              return (
                <div>
                  <p className="font-mono text-sm font-medium">{payoff.label}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatCurrency(payoff.interest)} interest
                  </p>
                </div>
              );
            },
          },
          { header: "Notes", cell: (debt) => <NoteCell value={debt.notes} /> },
        ]}
      />
    </SectionStack>
  );
}

function DebtPaydownCard({
  data,
  summary,
  onAddDebt,
}: {
  data: FinanceData;
  summary: ReturnType<typeof calculateSummary>;
  onAddDebt: () => void;
}) {
  const [debtChartMode, setDebtChartMode] = useState<DebtChartMode>("projected");
  const [debtHistoryRange, setDebtHistoryRange] = useState<DebtHistoryRange>("all");
  const projectionItems = getDebtProjectionItems(data);
  const projectionSeries = getDebtPaydownSeries(data);
  const pastSeries = getDebtPastSeries(
    data,
    summary.totalDebtWithCreditCards,
    debtHistoryRange,
  );
  const lastProjectedBalance = projectionSeries.at(-1)?.value ?? summary.totalDebtBalance;
  const totalEnteredDebt = getTotalEnteredDebt(data, summary.totalDebtWithCreditCards);
  const totalDebtDrop = Math.max(totalEnteredDebt - summary.totalDebtWithCreditCards, 0);
  const monthlyMinimum = totalMonthlyDebtPayment(data);
  const hasPastDebtHistory = totalEnteredDebt > 0 || data.debtPayments.length > 0;
  const activeSeries = debtChartMode === "past" ? pastSeries : projectionSeries;
  const hasProjectedDebt = summary.totalDebtBalance > 0;
  const activeChartColor =
    debtChartMode === "past" ? "#6fa47b" : hasProjectedDebt ? "#c96b5b" : "#6fa47b";
  const chartStartLabel = activeSeries[0]?.label ?? "";
  const chartEndLabel = activeSeries.at(-1)?.label ?? "";

  return (
    <Card className="h-full overflow-hidden">
      <div className="flex min-h-[344px] flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)]">
              <TrendingDown size={16} />
            </div>
            <PrimaryCell
              title="Total debt tracker"
              detail={`${projectionItems.length} active balance${projectionItems.length === 1 ? "" : "s"}`}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!hasProjectedDebt ? (
              <Button
                aria-label="Add debt"
                size="icon"
                title="Add debt"
                variant="ghost"
                onClick={onAddDebt}
              >
                <Plus size={14} />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <div className="grid w-40 shrink-0 grid-cols-[1.35fr_1fr] rounded border border-[var(--line)] bg-[var(--paper-subtle)] p-px">
            {(["projected", "past"] as const).map((mode) => (
              <button
                aria-label={mode === "projected" ? "Projected debt graph" : "Past debt graph"}
                aria-pressed={debtChartMode === mode}
                className={cn(
                  "flex h-[18px] min-w-0 items-center justify-center rounded-[3px] px-1.5 text-center text-[4px] font-medium leading-none transition",
                  focusVisibleRing,
                  debtChartMode === mode
                    ? "bg-[var(--paper)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground-soft)]",
                )}
                key={mode}
                onClick={() => setDebtChartMode(mode)}
                type="button"
              >
                <span className="inline-flex h-full w-full items-center justify-center whitespace-nowrap text-center">
                  {mode === "projected" ? "Projected" : "Past"}
                </span>
              </button>
            ))}
          </div>
          {debtChartMode === "past" ? (
            <div className="flex shrink-0 gap-0.5">
              {(["all", "1y", "1m"] as const).map((range) => (
                <button
                  aria-pressed={debtHistoryRange === range}
                  className={cn(
                    "flex h-[18px] w-8 items-center justify-center rounded-[3px] border px-1 text-center text-[4px] font-medium uppercase leading-none transition",
                    focusVisibleRing,
                    debtHistoryRange === range
                      ? "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]"
                      : "border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)] hover:text-[var(--foreground-soft)]",
                  )}
                  key={range}
                  onClick={() => setDebtHistoryRange(range)}
                  type="button"
                >
                  <span className="inline-flex h-full w-full items-center justify-center whitespace-nowrap text-center">
                    {range}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="shrink-0 truncate text-right text-[6px] font-medium uppercase leading-none text-[var(--muted)]">
              {chartStartLabel} / {chartEndLabel}
            </p>
          )}
        </div>

        <div className="mt-0">
          <LineChart
            ariaLabel={
              debtChartMode === "past"
                ? "Total debt history"
                : "Debt paydown projection"
            }
            bottomPadding={34}
            className="h-36"
            color={activeChartColor}
            data={activeSeries}
            description={
              debtChartMode === "past"
                ? hasPastDebtHistory
                  ? "Historical total debt entered by the user and how that balance has gone down."
                  : "No debt history has been recorded yet, so the past balance starts at the current total."
                : hasProjectedDebt
                  ? "Projected regular debt balance using saved monthly payments and APRs."
                  : "No regular debt is currently tracked, so the projected balance remains at zero."
            }
            pointValueLabelClassName="fill-[#3f3a34] text-[10px] font-semibold"
            pointValueLabelStrokeWidth="3"
            showCaption={false}
            topPadding={12}
            xAxisLabelBottomOffset={10}
            xAxisLabelClassName="fill-[#8b857c] text-[11px] font-medium"
            yAxisLabelClassName="fill-[#8b857c] text-base font-medium"
          />
        </div>

        <div className="mt-1 grid grid-cols-3 gap-2">
          {debtChartMode === "past" ? (
            <>
              <MiniStat label="Entered" value={formatCurrency(totalEnteredDebt)} compact />
              <MiniStat label="Down" value={formatCurrency(totalDebtDrop)} compact />
              <MiniStat label="Now" value={formatCurrency(summary.totalDebtWithCreditCards)} compact />
            </>
          ) : (
            <>
              <MiniStat label="Debt" value={formatCurrency(summary.totalDebtBalance)} compact />
              <MiniStat label="Monthly" value={formatCurrency(monthlyMinimum)} compact />
              <MiniStat label="24 mo" value={formatCurrency(lastProjectedBalance)} compact />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function CreditScoreTrackerCard({
  entries,
  onAdd,
  onOpenLedger,
}: {
  entries: FinanceData["creditScoreHistory"];
  onAdd: () => void;
  onOpenLedger: () => void;
}) {
  const sortedEntries = sortCreditScoreHistoryAscending(entries);
  const latest = sortedEntries.at(-1);
  const previous = sortedEntries.at(-2);
  const scoreChange = latest && previous ? latest.score - previous.score : 0;
  const latestTone = latest ? creditScoreBadgeTone(latest.score) : "neutral";
  const trendLabel = latest
    ? previous
      ? `${scoreChange >= 0 ? "+" : ""}${scoreChange} vs prior`
      : "First entry"
    : "No score yet";

  return (
    <Card className="h-full overflow-hidden">
      <div className="flex min-h-[298px] flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)]">
              <LineChartIcon size={16} />
            </div>
            <PrimaryCell
              title="Credit score"
              detail={latest ? formatDateLabel(latest.date) : "Dated score log"}
            />
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[var(--muted)]">Latest score</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-[var(--foreground)]">
              {latest ? latest.score : "--"}
            </p>
          </div>
          <Badge tone={latestTone}>{latest ? creditScoreBand(latest.score) : "Start"}</Badge>
        </div>

        <div className="mt-4">
          <CreditScoreMiniChart entries={sortedEntries} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <MiniStat label="Change" value={latest ? trendLabel : "--"} compact />
          <MiniStat label="Entries" value={`${entries.length}`} compact />
          <MiniStat
            label="Range"
            value={entries.length > 0 ? creditScoreRangeLabel(entries) : "--"}
            compact
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button className="w-full" size="sm" variant="ghost" onClick={onOpenLedger}>
            See more
          </Button>
          <Button className="w-full" size="sm" onClick={onAdd}>
            Add score
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CreditScoreMiniChart({ entries }: { entries: FinanceData["creditScoreHistory"] }) {
  const chartEntries = entries.slice(-6);
  const width = 300;
  const height = 78;
  const leftPadding = 30;
  const rightPadding = 12;
  const topPadding = 10;
  const baseline = 54;
  const plotWidth = width - leftPadding - rightPadding;
  const plotHeight = baseline - topPadding;

  if (chartEntries.length === 0) {
    return (
      <div className="grid h-[78px] place-items-center rounded-md border border-dashed border-[var(--line)] text-xs text-[var(--muted)]">
        No scores logged
      </div>
    );
  }

  const scores = chartEntries.map((entry) => entry.score);
  const scoreMin = Math.min(...scores);
  const scoreMax = Math.max(...scores);
  const domainMin = Math.max(300, scoreMin === scoreMax ? scoreMin - 10 : scoreMin - 20);
  const domainMax = Math.min(850, scoreMin === scoreMax ? scoreMax + 10 : scoreMax + 20);
  const domainSpan = Math.max(domainMax - domainMin, 1);
  const sparseSeries = chartEntries.length <= 2;
  const xFor = (index: number) =>
    sparseSeries
      ? leftPadding + 26 + index * 90
      : leftPadding + (plotWidth / Math.max(chartEntries.length - 1, 1)) * index;
  const yFor = (score: number) =>
    baseline - ((score - domainMin) / domainSpan) * plotHeight;
  const points = chartEntries
    .map((entry, index) => `${xFor(index)},${yFor(entry.score)}`)
    .join(" ");
  const first = chartEntries[0];
  const last = chartEntries.at(-1) ?? first;

  return (
    <svg
      aria-label="Credit score trend"
      className="h-[78px] w-full overflow-visible"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {[0, 0.5, 1].map((position) => {
        const y = topPadding + plotHeight * position;
        return (
          <line
            key={position}
            stroke="var(--line)"
            strokeDasharray={position === 1 ? undefined : "3 4"}
            x1={leftPadding}
            x2={width - rightPadding}
            y1={y}
            y2={y}
          />
        );
      })}
      <text fill="var(--muted-soft)" fontSize="9" x="0" y={topPadding + 3}>
        {domainMax}
      </text>
      <text fill="var(--muted-soft)" fontSize="9" x="0" y={baseline + 3}>
        {domainMin}
      </text>
      <polyline
        fill="none"
        points={points}
        stroke="var(--primary)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      {chartEntries.map((entry, index) => (
        <circle
          cx={xFor(index)}
          cy={yFor(entry.score)}
          fill="var(--paper)"
          key={entry.id}
          r="3"
          stroke="var(--primary)"
          strokeWidth="2"
        />
      ))}
      {chartEntries.length === 1 ? (
        <text fill="var(--muted)" fontSize="9" textAnchor="middle" x={xFor(0)} y="74">
          {formatShortDateLabel(first.date)}
        </text>
      ) : (
        <>
          <text fill="var(--muted)" fontSize="9" x={leftPadding} y="74">
            {formatShortDateLabel(first.date)}
          </text>
          <text
            fill="var(--muted)"
            fontSize="9"
            textAnchor="end"
            x={width - rightPadding}
            y="74"
          >
            {formatShortDateLabel(last.date)}
          </text>
        </>
      )}
    </svg>
  );
}

function RecurringSection({
  data,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: FinanceData;
  onAdd: () => void;
  onEdit: (item: FinanceData["recurringPayments"][number]) => void;
  onDelete: (id: string) => void;
}) {
  const [dateWindow, setDateWindow] = useState<DateWindow>("next30");
  const activePayments = data.recurringPayments.filter((payment) => payment.status === "active");
  const filteredPayments = data.recurringPayments
    .filter((payment) => matchesDateWindow(payment.nextChargeDate, dateWindow))
    .sort((a, b) => daysUntilDate(a.nextChargeDate) - daysUntilDate(b.nextChargeDate));
  const monthlyTotal = activePayments.reduce(
    (sum, payment) => sum + monthlyAmount(payment.amount, payment.frequency),
    0,
  );
  const next7 = activePayments.filter((payment) =>
    matchesDateWindow(payment.nextChargeDate, "next7"),
  ).length;
  const next30 = activePayments.filter((payment) =>
    matchesDateWindow(payment.nextChargeDate, "next30"),
  ).length;

  return (
    <SectionStack>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={<ReceiptText size={18} />} label="Monthly recurring total" value={formatCurrency(monthlyTotal)} trend={`${activePayments.length} active`} trendTone="amber" />
        <MetricCard icon={<CalendarClock size={18} />} label="Next 7 days" value={`${next7}`} trend="Upcoming charges" trendTone={next7 > 0 ? "amber" : "green"} />
        <MetricCard icon={<Bell size={18} />} label="Next 30 days" value={`${next30}`} trend="Scheduled" trendTone="blue" />
      </div>
      <Card>
        <CardHeader title="Charge date filter" eyebrow="Recurring" />
        <div className="p-4">
          <DateFilterBar value={dateWindow} onChange={setDateWindow} />
        </div>
      </Card>
      <DataTable
        title="Recurring payments"
        eyebrow={dateWindowLabel(dateWindow)}
        emptyTitle="No recurring payments"
        emptyDescription="Add subscriptions and bills to monitor monthly commitments."
        items={filteredPayments}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        columns={[
          { header: "Name", cell: (payment) => <PrimaryCell title={payment.name} detail={payment.category} /> },
          { header: "Amount", cell: (payment) => formatCurrency(payment.amount) },
          { header: "Frequency", cell: (payment) => payment.frequency },
          { header: "Monthly est.", cell: (payment) => formatCurrency(monthlyAmount(payment.amount, payment.frequency)) },
          { header: "Next charge", cell: (payment) => payment.nextChargeDate },
          { header: "Payment method", cell: (payment) => payment.paymentMethod },
          {
            header: "Status",
            cell: (payment) => <Badge tone={payment.status === "active" ? "green" : "neutral"}>{payment.status}</Badge>,
          },
          { header: "Notes", cell: (payment) => <NoteCell value={payment.notes} /> },
        ]}
      />
    </SectionStack>
  );
}

function NetWorthSection({
  chartPalette,
  data,
  summary,
}: {
  chartPalette: ChartPalette;
  data: FinanceData;
  summary: ReturnType<typeof calculateSummary>;
}) {
  const netWorthSeries = withCurrentValue(
    removeDemoNetWorthHistory(data.netWorthHistory),
    summary.totalNetWorth,
  );
  const netWorthTrend = trendFromSeries(netWorthSeries);
  const assets = [
    { label: "Manual investment accounts", value: summary.manualInvestmentValue, color: chartPalette.primary },
    { label: "Stock holdings", value: summary.stockPortfolioValue, color: chartPalette.secondary },
    { label: "Crypto holdings", value: summary.cryptoPortfolioValue, color: chartPalette.tertiary },
    { label: "Cash savings goals", value: summary.totalSaved, color: chartPalette.quaternary },
  ];
  const debt = summary.totalDebtWithCreditCards;

  return (
    <SectionStack>
      <NoticeCard
        tone="amber"
        title="Net worth limitations"
        text="Net worth is calculated from the records in this app only. Manual investment accounts can double-count stocks or crypto if they represent the same brokerage assets."
      />
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<WalletCards size={18} />} label="Net worth" value={formatCurrency(summary.totalNetWorth)} trend={`${formatPercent(netWorthTrend)} vs first saved month`} trendTone={netWorthTrend >= 0 ? "green" : "red"} />
        <MetricCard icon={<TrendingUp size={18} />} label="Assets" value={formatCurrency(summary.totalInvestments + summary.totalSaved)} trend="Tracked assets only" trendTone="green" />
        <MetricCard icon={<TrendingDown size={18} />} label="Debt" value={formatCurrency(debt)} trend="Cards + debts" trendTone={debt > 0 ? "amber" : "green"} />
        <MetricCard icon={<PiggyBank size={18} />} label="Cash savings" value={formatCurrency(summary.totalSaved)} trend={`${data.savingsGoals.length} goals`} trendTone="blue" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Net worth trend" eyebrow="Current value adjusted">
            Last point reflects current manual records.
          </CardHeader>
          <div className="px-4 py-4">
            <LineChart data={netWorthSeries} color={chartPalette.primary} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Asset mix" eyebrow="Current" />
          <div className="px-4 py-5">
            <DonutChart data={assets} />
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Breakdown" eyebrow="Assets and liabilities" />
        <div className="grid gap-3 p-4 md:grid-cols-5">
          {assets.map((asset) => (
            <MiniStat key={asset.label} label={asset.label} value={formatCurrency(asset.value)} />
          ))}
          <MiniStat label="Credit cards" value={`-${formatCurrency(summary.totalCreditCurrentBalance)}`} />
          <MiniStat label="Debt accounts" value={`-${formatCurrency(summary.totalDebtBalance)}`} />
        </div>
      </Card>
    </SectionStack>
  );
}

function SettingsSection({
  agentSettings,
  agentSettingsReady,
  coingeckoSettings,
  coingeckoSettingsReady,
  data,
  finnhubSettings,
  finnhubSettingsReady,
  onAgentSettingsChange,
  onClearDemoData,
  onCoinGeckoSettingsChange,
  onFinnhubSettingsChange,
  onImport,
  onReset,
  onThemeChange,
  onWorkspaceChange,
  storageReady,
  storageStatus,
  theme,
}: {
  agentSettings: FinanceAgentSettings;
  agentSettingsReady: boolean;
  coingeckoSettings: CoinGeckoSettings;
  coingeckoSettingsReady: boolean;
  data: FinanceData;
  finnhubSettings: FinnhubSettings;
  finnhubSettingsReady: boolean;
  onAgentSettingsChange: (settings: Partial<FinanceAgentSettings>) => void;
  onClearDemoData: () => void;
  onCoinGeckoSettingsChange: (settings: Partial<CoinGeckoSettings>) => void;
  onFinnhubSettingsChange: (settings: Partial<FinnhubSettings>) => void;
  onImport: (data: FinanceData) => void;
  onReset: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  onWorkspaceChange: (workspace: Partial<FinanceData["workspace"]>) => void;
  storageReady: boolean;
  storageStatus: StorageStatus;
  theme: ThemeMode;
}) {
  const [importStatus, setImportStatus] = useState("");
  const [agentTestStatus, setAgentTestStatus] = useState<{
    message: string;
    tone: "green" | "amber" | "red";
  } | null>(null);
  const [finnhubTestStatus, setFinnhubTestStatus] = useState<{
    message: string;
    tone: "green" | "amber" | "red";
  } | null>(null);
  const [coingeckoTestStatus, setCoinGeckoTestStatus] = useState<{
    message: string;
    tone: "green" | "amber" | "red";
  } | null>(null);
  const [testingAgent, setTestingAgent] = useState(false);
  const [testingFinnhub, setTestingFinnhub] = useState(false);
  const [testingCoinGecko, setTestingCoinGecko] = useState(false);
  const [agentAuditCount, setAgentAuditCount] = useState(0);
  const counts = [
    ["Investments", data.investments.length],
    ["Stocks", data.stocks.length],
    ["Stock purchases", data.stockLots.length],
    ["Crypto", data.crypto.length],
    ["Income", data.incomeSources.length],
    ["Paychecks", data.paychecks.length],
    ["Tax sales", data.taxAssetSales.length],
    ["Savings", data.savingsGoals.length],
    ["Cards", data.creditCards.length],
    ["Debt", data.debts.length],
    ["Debt payments", data.debtPayments.length],
    ["Recurring", data.recurringPayments.length],
  ];
  const handleExport = () => {
    downloadFinanceBackup(data);
  };
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = normalizeFinanceData(parsed);
      if (!result.ok) {
        setImportStatus("Import failed: backup does not match this workspace format.");
        return;
      }
      onImport(result.data);
      setImportStatus(
        result.issues.length > 0
          ? `Imported ${file.name} with ${result.issues.length} repaired fields.`
          : `Imported ${file.name}.`,
      );
    } catch {
      setImportStatus("Import failed: choose a valid JSON backup.");
    }
  };
  const handleReset = () => {
    if (
      window.confirm(
        "Reset this workspace to sample data? This replaces your current local records.",
      )
    ) {
      onReset();
    }
  };
  const handleClearDemoData = () => {
    if (
      window.confirm(
        "Clear built-in demo data only? This first downloads a backup, then removes fixed sample rows like AAPL/MSFT/VTI, BTC/ETH/SOL, demo income, demo savings, demo cards, demo bills, demo tax sales, and demo chart history. User-created rows stay.",
      )
    ) {
      handleExport();
      onClearDemoData();
      setImportStatus("Demo data cleared. User-created rows were preserved.");
    }
  };
  const handleAgentConnectionTest = async () => {
    setTestingAgent(true);
    setAgentTestStatus(null);

    try {
      const response = await fetch("/api/finance-agent/test", {
        body: JSON.stringify({ settings: agentSettings }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setAgentTestStatus({
          message: body.error ?? "Connection test failed.",
          tone: "red",
        });
        return;
      }

      setAgentTestStatus({
        message: body.message ?? "Connection test passed.",
        tone: "green",
      });
    } catch (error) {
      setAgentTestStatus({
        message: error instanceof Error ? error.message : "Connection test failed.",
        tone: "red",
      });
    } finally {
      setTestingAgent(false);
    }
  };
  const handleFinnhubConnectionTest = async () => {
    const apiKey = finnhubSettings.apiKey.trim();
    if (!apiKey) {
      setFinnhubTestStatus({
        message: "Paste a Finnhub API key first.",
        tone: "amber",
      });
      return;
    }

    setTestingFinnhub(true);
    setFinnhubTestStatus(null);

    try {
      const response = await fetch("/api/market-data/finnhub", {
        body: JSON.stringify({
          apiKey,
          crypto: [],
          stocks: [{ currentPrice: 0, id: "test-aapl", symbol: "AAPL" }],
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json()) as MarketDataRefreshResult & { error?: string };
      if (!response.ok) {
        setFinnhubTestStatus({
          message: body.error ?? "Finnhub test failed.",
          tone: "red",
        });
        return;
      }

      const firstFailure = body.failures[0];
      setFinnhubTestStatus(
        body.updates.length > 0
          ? { message: "Finnhub key works.", tone: "green" }
          : {
              message: firstFailure?.reason ?? "Finnhub responded, but no quote came back.",
              tone: "red",
            },
      );
    } catch (error) {
      setFinnhubTestStatus({
        message: error instanceof Error ? error.message : "Finnhub test failed.",
        tone: "red",
      });
    } finally {
      setTestingFinnhub(false);
    }
  };
  const handleCoinGeckoConnectionTest = async () => {
    const apiKey = coingeckoSettings.apiKey.trim();
    if (!apiKey) {
      setCoinGeckoTestStatus({
        message: "Paste a CoinGecko API key first.",
        tone: "amber",
      });
      return;
    }

    setTestingCoinGecko(true);
    setCoinGeckoTestStatus(null);

    try {
      const response = await fetch("/api/market-data/coingecko", {
        body: JSON.stringify({
          apiKey,
          crypto: [{ currentPrice: 0, id: "test-btc", symbol: "BTC" }],
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json()) as MarketDataRefreshResult & { error?: string };
      if (!response.ok) {
        setCoinGeckoTestStatus({
          message: body.error ?? "CoinGecko test failed.",
          tone: "red",
        });
        return;
      }

      const firstFailure = body.failures[0];
      setCoinGeckoTestStatus(
        body.updates.length > 0
          ? { message: "CoinGecko key works.", tone: "green" }
          : {
              message: firstFailure?.reason ?? "CoinGecko responded, but no price came back.",
              tone: "red",
            },
      );
    } catch (error) {
      setCoinGeckoTestStatus({
        message: error instanceof Error ? error.message : "CoinGecko test failed.",
        tone: "red",
      });
    } finally {
      setTestingCoinGecko(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAgentAuditCount(readFinanceAgentAuditLog(getBrowserStorage()).length);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const selectedAgentPreset = getFinanceAgentProviderPreset(agentSettings.preset);
  const isCustomAgentProvider = selectedAgentPreset.id === "custom";
  const canTestAgentConnection =
    Boolean(agentSettings.apiKey.trim()) &&
    Boolean(agentSettings.model.trim()) &&
    Boolean(agentSettings.baseURL.trim());
  const canTestFinnhubConnection = Boolean(finnhubSettings.apiKey.trim());
  const canTestCoinGeckoConnection = Boolean(coingeckoSettings.apiKey.trim());
  const handleAgentPresetChange = (preset: FinanceAgentProviderPreset) => {
    onAgentSettingsChange({ preset });
  };

  return (
    <SectionStack>
      <NoticeCard
        tone="amber"
        title="Privacy warning"
        text="Records are stored in browser localStorage. This is convenient for private local use, but it is not encrypted and can be cleared by browser data cleanup."
      />
      <Card>
        <CardHeader title="Workspace data" eyebrow="Settings" />
        <div className="grid gap-3 p-4 md:grid-cols-4">
          {counts.map(([label, value]) => (
            <MiniStat key={label} label={String(label)} value={String(value)} />
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Workspace identity" eyebrow="Name" />
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-sm font-medium text-[var(--foreground-soft)]">
              Sidebar workspace name
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Rename the workspace label shown in the sidebar. The private workspace subtitle stays fixed.
            </p>
          </div>
          <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
            <span>Workspace name</span>
            <input
              className={cn(
                "h-9 rounded-lg border px-3 text-sm transition",
                "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                controlFocusVisibleRing,
              )}
              maxLength={48}
              onChange={(event) => onWorkspaceChange({ name: event.target.value })}
              placeholder={defaultWorkspaceName}
              value={data.workspace.name}
            />
          </label>
        </div>
      </Card>
      <Card>
        <CardHeader title="Appearance" eyebrow="Theme" />
        <div className="grid gap-5 p-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-sm font-medium text-[var(--foreground-soft)]">Light / dark mode</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Uses the app theme tokens and persists on this device.
            </p>
          </div>
          <div className="flex rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-1">
            <Button
              size="sm"
              variant={theme === "light" ? "secondary" : "ghost"}
              onClick={() => onThemeChange("light")}
            >
              <Sun size={14} />
              Light
            </Button>
            <Button
              size="sm"
              variant={theme === "dark" ? "secondary" : "ghost"}
              onClick={() => onThemeChange("dark")}
            >
              <Moon size={14} />
              Dark
            </Button>
          </div>
          <div className="border-t border-[var(--line)] pt-4 lg:col-span-2">
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground-soft)]">Graph colors</p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Primary drives income and trend lines. Secondary drives comparison bars and second-series chart colors.
                </p>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-[var(--muted-soft)]">
                    Primary
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {graphColorOptions.map((option) => (
                      <button
                        key={option.value}
                        aria-label={`Use ${option.label} as primary graph color`}
                        aria-pressed={data.workspace.graphPrimaryColor === option.value}
                        className={cn(
                          "inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition",
                          focusVisibleRing,
                          data.workspace.graphPrimaryColor === option.value
                            ? "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] shadow-sm"
                            : "border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)] hover:bg-[var(--paper-muted)] hover:text-[var(--foreground)]",
                        )}
                        onClick={() => onWorkspaceChange({ graphPrimaryColor: option.value })}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: option.value }}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-[var(--muted-soft)]">
                    Secondary
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {graphColorOptions.map((option) => (
                      <button
                        key={option.value}
                        aria-label={`Use ${option.label} as secondary graph color`}
                        aria-pressed={data.workspace.graphSecondaryColor === option.value}
                        className={cn(
                          "inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition",
                          focusVisibleRing,
                          data.workspace.graphSecondaryColor === option.value
                            ? "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] shadow-sm"
                            : "border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)] hover:bg-[var(--paper-muted)] hover:text-[var(--foreground)]",
                        )}
                        onClick={() => onWorkspaceChange({ graphSecondaryColor: option.value })}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: option.value }}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Workspace currency" eyebrow="Display" />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--foreground-soft)]">Currency format</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Stored with the workspace for future database/API sync. Existing sample
              values are still manual amounts.
            </p>
          </div>
          <select
            className={cn(
              "h-9 rounded-lg border px-3 text-sm transition",
              "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
              controlFocusVisibleRing,
            )}
            onChange={(event) =>
              onWorkspaceChange({ currency: event.target.value as CurrencyCode })
            }
            value={data.workspace.currency}
          >
            {(["USD", "EUR", "GBP", "CAD", "AUD", "JPY"] as CurrencyCode[]).map(
              (currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ),
            )}
          </select>
        </div>
      </Card>
      <Card>
        <CardHeader
          title="Finnhub Market Data"
          eyebrow="Price API"
          action={
            <Badge tone={finnhubSettings.apiKey.trim() ? "green" : "amber"}>
              {finnhubSettings.apiKey.trim() ? "Key saved" : "No key"}
            </Badge>
          }
        />
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="text-sm font-medium text-[var(--foreground-soft)]">
              Stock refresh
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The Finnhub key is stored locally under{" "}
              <span className="font-mono">{finnhubSettingsStorageKey}</span> and is used only when
              you manually refresh stock prices.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 text-sm font-medium text-[var(--foreground-soft)] shadow-sm transition hover:border-[var(--muted-soft)] hover:bg-[var(--paper-subtle)]",
                  focusVisibleRing,
                )}
                href={finnhubSignupUrl}
                rel="noreferrer"
                target="_blank"
              >
                Get free Finnhub API key
                <ExternalLink size={14} />
              </a>
              <a
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-transparent px-3.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--paper-muted)] hover:text-[var(--foreground)]",
                  focusVisibleRing,
                )}
                href={finnhubDocsUrl}
                rel="noreferrer"
                target="_blank"
              >
                API docs
                <ExternalLink size={14} />
              </a>
            </div>
            {finnhubTestStatus ? (
              <div className="mt-3">
                <Badge tone={finnhubTestStatus.tone}>{finnhubTestStatus.message}</Badge>
              </div>
            ) : null}
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              <span>Finnhub API key</span>
              <input
                autoComplete="off"
                className={cn(
                  "h-9 rounded-lg border px-3 font-mono text-sm transition",
                  "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                  controlFocusVisibleRing,
                )}
                disabled={!finnhubSettingsReady}
                onChange={(event) => {
                  onFinnhubSettingsChange({ apiKey: event.target.value });
                  setFinnhubTestStatus(null);
                }}
                placeholder="Paste Finnhub API key"
                type="password"
                value={finnhubSettings.apiKey}
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                disabled={!canTestFinnhubConnection || testingFinnhub}
                onClick={handleFinnhubConnectionTest}
              >
                {testingFinnhub ? "Testing..." : "Test key"}
              </Button>
              <Button
                disabled={!finnhubSettings.apiKey.trim()}
                onClick={() => {
                  onFinnhubSettingsChange({ apiKey: "" });
                  setFinnhubTestStatus(null);
                }}
                variant="danger"
              >
                Clear key
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader
          title="CoinGecko Crypto Data"
          eyebrow="Price API"
          action={
            <Badge tone={coingeckoSettings.apiKey.trim() ? "green" : "amber"}>
              {coingeckoSettings.apiKey.trim() ? "Key saved" : "No key"}
            </Badge>
          }
        />
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="text-sm font-medium text-[var(--foreground-soft)]">
              Crypto refresh
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The CoinGecko key is stored locally under{" "}
              <span className="font-mono">{coingeckoSettingsStorageKey}</span> and is used only
              when you manually refresh crypto prices.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 text-sm font-medium text-[var(--foreground-soft)] shadow-sm transition hover:border-[var(--muted-soft)] hover:bg-[var(--paper-subtle)]",
                  focusVisibleRing,
                )}
                href={coingeckoSignupUrl}
                rel="noreferrer"
                target="_blank"
              >
                Get free CoinGecko API key
                <ExternalLink size={14} />
              </a>
              <a
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-transparent px-3.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--paper-muted)] hover:text-[var(--foreground)]",
                  focusVisibleRing,
                )}
                href={coingeckoDocsUrl}
                rel="noreferrer"
                target="_blank"
              >
                API docs
                <ExternalLink size={14} />
              </a>
            </div>
            {coingeckoTestStatus ? (
              <div className="mt-3">
                <Badge tone={coingeckoTestStatus.tone}>{coingeckoTestStatus.message}</Badge>
              </div>
            ) : null}
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              <span>CoinGecko API key</span>
              <input
                autoComplete="off"
                className={cn(
                  "h-9 rounded-lg border px-3 font-mono text-sm transition",
                  "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                  controlFocusVisibleRing,
                )}
                disabled={!coingeckoSettingsReady}
                onChange={(event) => {
                  onCoinGeckoSettingsChange({ apiKey: event.target.value });
                  setCoinGeckoTestStatus(null);
                }}
                placeholder="Paste CoinGecko API key"
                type="password"
                value={coingeckoSettings.apiKey}
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                disabled={!canTestCoinGeckoConnection || testingCoinGecko}
                onClick={handleCoinGeckoConnectionTest}
              >
                {testingCoinGecko ? "Testing..." : "Test key"}
              </Button>
              <Button
                disabled={!coingeckoSettings.apiKey.trim()}
                onClick={() => {
                  onCoinGeckoSettingsChange({ apiKey: "" });
                  setCoinGeckoTestStatus(null);
                }}
                variant="danger"
              >
                Clear key
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader
          title="AI Agent API"
          eyebrow="Local key"
          action={
            <Badge tone={agentSettings.apiKey ? "green" : "amber"}>
              {agentSettings.apiKey ? "Key saved" : "No key"}
            </Badge>
          }
        />
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="text-sm font-medium text-[var(--foreground-soft)]">
              Provider connection
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The agent uses your own API key. The key is stored locally under{" "}
              <span className="font-mono">{financeAgentSettingsStorageKey}</span> and is not part of
              workspace exports.
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Applied or canceled AI review cards are logged locally. Current log:{" "}
              {agentAuditCount} entries.
            </p>
            {agentTestStatus ? (
              <div className="mt-3">
                <Badge tone={agentTestStatus.tone}>{agentTestStatus.message}</Badge>
              </div>
            ) : null}
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              <span>Provider</span>
              <select
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm transition",
                  "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                  controlFocusVisibleRing,
                )}
                disabled={!agentSettingsReady}
                onChange={(event) =>
                  handleAgentPresetChange(event.target.value as FinanceAgentProviderPreset)
                }
                value={selectedAgentPreset.id}
              >
                {financeAgentProviderPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              <span>Model</span>
              <input
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm transition",
                  "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                  controlFocusVisibleRing,
                )}
                disabled={!agentSettingsReady}
                onChange={(event) => onAgentSettingsChange({ model: event.target.value })}
                placeholder={selectedAgentPreset.defaultModel || "model name"}
                value={agentSettings.model}
              />
            </label>
            {isCustomAgentProvider ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                  <span>Provider name</span>
                  <input
                    className={cn(
                      "h-9 rounded-lg border px-3 text-sm transition",
                      "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                      controlFocusVisibleRing,
                    )}
                    disabled={!agentSettingsReady}
                    onChange={(event) =>
                      onAgentSettingsChange({ providerName: event.target.value })
                    }
                    placeholder="custom"
                    value={agentSettings.providerName}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                  <span>Base URL</span>
                  <input
                    className={cn(
                      "h-9 rounded-lg border px-3 text-sm transition",
                      "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                      controlFocusVisibleRing,
                    )}
                    disabled={!agentSettingsReady}
                    onChange={(event) => onAgentSettingsChange({ baseURL: event.target.value })}
                    placeholder="https://api.provider.com/v1"
                    value={agentSettings.baseURL}
                  />
                </label>
              </div>
            ) : null}
            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              <span>API key</span>
              <input
                autoComplete="off"
                className={cn(
                  "h-9 rounded-lg border px-3 font-mono text-sm transition",
                  "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                  controlFocusVisibleRing,
                )}
                disabled={!agentSettingsReady}
                onChange={(event) => onAgentSettingsChange({ apiKey: event.target.value })}
                placeholder={selectedAgentPreset.keyPlaceholder}
                type="password"
                value={agentSettings.apiKey}
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                disabled={!canTestAgentConnection || testingAgent}
                onClick={handleAgentConnectionTest}
              >
                {testingAgent ? "Testing..." : "Test connection"}
              </Button>
              <Button
                disabled={!agentSettings.apiKey}
                onClick={() => onAgentSettingsChange({ apiKey: "" })}
                variant="danger"
              >
                Clear key
              </Button>
            </div>
            <details className="rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] px-3 py-2 text-xs text-[var(--muted)]">
              <summary className="cursor-pointer font-medium text-[var(--foreground-soft)]">
                Connection details
              </summary>
              <div className="mt-2 grid gap-1.5 font-mono text-[11px]">
                <span>{agentSettings.providerName}</span>
                <span>{agentSettings.baseURL || "No base URL set"}</span>
              </div>
            </details>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Local storage and backups" eyebrow="Data" />
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--foreground-soft)]">Browser workspace</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Records are saved to localStorage under <span className="font-mono">{storageKey}</span>.
              Status: {storageReady ? storageStatus.message : "loading saved records"}.
            </p>
            {importStatus ? (
              <p className="mt-2 text-xs font-medium text-[var(--muted)]">{importStatus}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport}>
              <Download size={15} />
              Export backup
            </Button>
            <label
              className={cn(
                "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 text-sm font-medium text-[var(--foreground-soft)] shadow-sm transition hover:border-[var(--muted-soft)] hover:bg-[var(--paper-subtle)]",
                focusVisibleRing,
              )}
            >
              <Upload size={15} />
              Import backup
              <input
                accept="application/json"
                className="sr-only"
                onChange={handleImport}
                type="file"
              />
            </label>
            <Button onClick={handleClearDemoData}>
              <Trash2 size={15} />
              Clear demo data
            </Button>
            <Button variant="danger" onClick={handleReset}>
              <RefreshCcw size={15} />
              Reset sample data
            </Button>
          </div>
        </div>
      </Card>
    </SectionStack>
  );
}

function InvestmentTable({
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  items: FinanceData["investments"];
  onAdd: () => void;
  onEdit: (item: FinanceData["investments"][number]) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <DataTable
      title="Manual investments"
      eyebrow="Accounts and funds"
      emptyTitle="No investments"
      emptyDescription="Add retirement, brokerage, HSA, or other investment accounts."
      items={items}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      columns={[
        { header: "Name", cell: (item) => <PrimaryCell title={item.name} detail={item.type} /> },
        { header: "Invested", cell: (item) => formatCurrency(item.amountInvested) },
        { header: "Current value", cell: (item) => formatCurrency(item.currentValue) },
        {
          header: "Gain/loss",
          cell: (item) => {
            const gain = item.currentValue - item.amountInvested;
            return <GainBadge value={gain} basis={item.amountInvested} />;
          },
        },
        { header: "Dividends", cell: (item) => formatCurrency(item.dividendIncome) },
        { header: "Notes", cell: (item) => <NoteCell value={item.notes} /> },
      ]}
    />
  );
}

type Column<T extends { id: string }> = {
  header: string;
  cell: (item: T) => ReactNode;
};

function getRecordLabel(item: { id: string }) {
  const record = item as Record<string, unknown>;
  const labelKeys = [
    "name",
    "ticker",
    "coin",
    "cardName",
    "company",
    "issuer",
    "symbol",
    "employerName",
    "payDate",
  ];
  const label = labelKeys
    .map((key) => record[key])
    .find((value) => typeof value === "string" && value.trim().length > 0);

  return typeof label === "string" ? label : "record";
}

function recordMatchesQuery(item: unknown, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (JSON.stringify(item) ?? "").toLowerCase().includes(normalized);
}

function TableSearchControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-8 w-40 min-w-0 items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-2.5 text-xs text-[var(--muted)] sm:w-56">
      <Search size={14} />
      <span className="sr-only">{label}</span>
      <input
        className="min-w-0 flex-1 bg-transparent text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted-soft)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search table"
        value={value}
      />
      {value ? (
        <button
          aria-label="Clear table search"
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded-md text-[var(--muted)] transition hover:bg-[var(--paper-muted)] hover:text-[var(--foreground)]",
            controlFocusVisibleRing,
          )}
          onClick={() => onChange("")}
          type="button"
        >
          <X size={12} />
        </button>
      ) : null}
    </label>
  );
}

function DataTable<T extends { id: string }>({
  title,
  eyebrow,
  items,
  columns,
  emptyTitle,
  emptyDescription,
  extraAction,
  onAdd,
  onEdit,
  onDelete,
  hideAdd = false,
}: {
  title: string;
  eyebrow?: string;
  items: T[];
  columns: Column<T>[];
  emptyTitle: string;
  emptyDescription: string;
  extraAction?: ReactNode;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  hideAdd?: boolean;
}) {
  const tableId = useId();
  const [tableQuery, setTableQuery] = useState("");
  const visibleItems = useMemo(
    () => items.filter((item) => recordMatchesQuery(item, tableQuery)),
    [items, tableQuery],
  );

  const confirmDelete = (item: T) => {
    const label = getRecordLabel(item);
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      onDelete(item.id);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={title}
        eyebrow={eyebrow}
        action={
          <div className="flex items-center gap-2">
            {items.length > 0 ? (
              <TableSearchControl
                label={`Search ${title}`}
                onChange={setTableQuery}
                value={tableQuery}
              />
            ) : null}
            {extraAction}
            {!hideAdd ? (
              <Button size="sm" onClick={onAdd}>
                <Plus size={14} />
                Add
              </Button>
            ) : null}
          </div>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={18} />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            !hideAdd ? (
              <Button variant="primary" onClick={onAdd}>
                <Plus size={15} />
                Add record
              </Button>
            ) : undefined
          }
        />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={<Search size={18} />}
          title="No matching rows"
          description="No records match the current table search."
          action={
            <Button onClick={() => setTableQuery("")}>
              <X size={15} />
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table
            aria-describedby={tableId}
            className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm"
          >
            <caption className="sr-only" id={tableId}>
              {title}
            </caption>
            <thead>
              <tr className="bg-[var(--paper-subtle)] text-xs font-medium text-[var(--muted)]">
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className="border-b border-[var(--line)] px-4 py-2.5"
                    scope="col"
                  >
                    {column.header}
                  </th>
                ))}
                <th
                  className="sticky right-0 z-10 w-24 border-b border-l border-[var(--line)] bg-[var(--paper-subtle)] px-4 py-2.5 text-right shadow-[-8px_0_14px_-14px_rgba(36,35,33,0.8)]"
                  scope="col"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id} className="group transition hover:bg-[var(--paper-subtle)]">
                  {columns.map((column, index) => {
                    const cellClassName =
                      "border-b border-[var(--line)] px-4 py-3 align-middle text-[var(--foreground-soft)]";
                    const cellContent = column.cell(item);

                    return index === 0 ? (
                      <th
                        key={`${item.id}-${column.header}`}
                        className={cn(cellClassName, "font-normal")}
                        scope="row"
                      >
                        {cellContent}
                      </th>
                    ) : (
                      <td
                        key={`${item.id}-${column.header}`}
                        className={cellClassName}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 border-b border-l border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-right shadow-[-8px_0_14px_-14px_rgba(36,35,33,0.8)] transition-colors group-hover:bg-[var(--paper-subtle)]">
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`Edit ${getRecordLabel(item)}`}
                        size="icon"
                        title="Edit"
                        variant="ghost"
                        onClick={() => onEdit(item)}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        aria-label={`Delete ${getRecordLabel(item)}`}
                        size="icon"
                        title="Delete"
                        variant="ghost"
                        onClick={() => confirmDelete(item)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

type FormValue = string | number | boolean;
type FormErrors = Partial<Record<string, string>>;

function createFormDefaults(collection: CollectionKey) {
  const defaults = { ...formConfigs[collection].defaults };

  if (collection === "creditCards") {
    defaults.balance = defaults.interestBalance;
  }

  if (collection === "incomeSources") {
    defaults.nextPaymentDate = getDefaultDateInput({ days: 7 });
  }

  if (collection === "taxAssetSales") {
    defaults.acquiredDate = getDefaultDateInput({ months: -14 });
    defaults.soldDate = getDefaultDateInput();
  }

  if (collection === "savingsGoals") {
    defaults.estimatedCompletionDate = getDefaultDateInput({ months: 6 });
  }

  if (collection === "debts") {
    defaults.loanDate = getDefaultDateInput();
    defaults.dueDate = getDefaultDateInput({ days: 30 });
    defaults.autopayDate = defaults.dueDate;
  }

  if (collection === "creditCards") {
    defaults.statementClosingDate = getDefaultDateInput({ days: -14 });
    defaults.dueDate = getDefaultDateInput({ days: 14 });
    defaults.autopayDate = defaults.dueDate;
  }

  if (collection === "recurringPayments") {
    defaults.nextChargeDate = getDefaultDateInput({ days: 7 });
  }

  return defaults;
}

function validateEditorForm(
  config: FormConfig,
  form: Record<string, FormValue>,
  fields = config.fields,
) {
  const errors: FormErrors = {};
  const values: Record<string, FormValue> = {};

  fields.forEach((field) => {
    const rawValue = form[field.name];

    if (field.type === "checkbox") {
      values[field.name] = Boolean(rawValue);
      return;
    }

    if (field.type === "number") {
      const rawText = String(rawValue ?? "").trim();

      if (rawText.length === 0) {
        if (!field.required) {
          values[field.name] = 0;
          return;
        }
        errors[field.name] = "Enter a number, or enter 0.";
        return;
      }

      const parsedValue = parseFiniteNumber(rawText);

      if (parsedValue === null) {
        errors[field.name] = "Enter a finite number.";
        return;
      }

      if (field.min !== undefined && parsedValue < field.min) {
        errors[field.name] = `Must be at least ${field.min}.`;
        return;
      }

      if (field.max !== undefined && parsedValue > field.max) {
        errors[field.name] = `Must be no more than ${field.max}.`;
        return;
      }

      values[field.name] = parsedValue;
      return;
    }

    const textValue = String(
      normalizeEditorFieldValue(
        config.collection,
        field.name,
        String(rawValue ?? "").trim(),
      ),
    );

    if (field.required && textValue.length === 0) {
      errors[field.name] = "Required.";
      return;
    }

    if (field.type === "select" && field.options && !field.options.includes(textValue)) {
      errors[field.name] = "Choose an available option.";
      return;
    }

    values[field.name] = textValue;
  });

  if (config.collection === "debts" && values.status === "paid") {
    values.currentBalance = 0;
  }

  if (
    (config.collection === "creditCards" || config.collection === "debts") &&
    values.autopay === true &&
    !values.autopayDate
  ) {
    values.autopayDate = values.dueDate ?? "";
  }

  validateNumericRelationships(config.collection, values, errors);

  if (config.collection === "creditCards") {
    values.balance = values.interestBalance ?? 0;
    values.minimumPayment = calculateCreditCardMinimumPayment(
      typeof values.statementBalance === "number" ? values.statementBalance : 0,
      typeof values.minimumPaymentRate === "number" ? values.minimumPaymentRate : 0,
    );
  }

  return { values, errors };
}

function normalizeEditorFieldValue(
  collection: CollectionKey,
  name: string,
  value: FormValue,
) {
  if (
    typeof value === "string" &&
    ((collection === "stocks" && name === "ticker") ||
      (collection === "crypto" && name === "symbol") ||
      (collection === "taxAssetSales" && name === "symbol"))
  ) {
    return value.toUpperCase();
  }

  return value;
}

function validateNumericRelationships(
  collection: CollectionKey,
  values: Record<string, FormValue>,
  errors: FormErrors,
) {
  const numberValue = (name: string) =>
    typeof values[name] === "number" ? values[name] : undefined;

  if (collection === "savingsGoals") {
    const currentSaved = numberValue("currentSaved");
    const targetAmount = numberValue("targetAmount");

    if (
      currentSaved !== undefined &&
      targetAmount !== undefined &&
      currentSaved > targetAmount
    ) {
      errors.currentSaved = "Current saved cannot exceed the target amount.";
    }
  }

  if (collection === "creditCards") {
    const limit = numberValue("limit");
    const currentBalance = numberValue("currentBalance");
    const interestBalance = numberValue("interestBalance");
    const statementBalance = numberValue("statementBalance");
    const statementPaid = numberValue("statementPaid");
    const dueDate = String(values.dueDate ?? "");
    const statementClosingDate = String(values.statementClosingDate ?? "");
    const autopayDate = String(values.autopayDate ?? "");

    if (
      limit !== undefined &&
      currentBalance !== undefined &&
      currentBalance > limit
    ) {
      errors.currentBalance = "Current balance cannot exceed the credit limit.";
    }

    if (
      currentBalance !== undefined &&
      interestBalance !== undefined &&
      interestBalance > currentBalance
    ) {
      errors.interestBalance = "Interest balance cannot exceed the current balance.";
    }

    if (
      statementBalance !== undefined &&
      statementPaid !== undefined &&
      statementPaid > statementBalance
    ) {
      errors.statementPaid = "Paid amount cannot exceed the last statement balance.";
    }

    if (statementClosingDate && !parseDateInput(statementClosingDate)) {
      errors.statementClosingDate = "Use a valid date.";
    }

    if (dueDate && !parseDateInput(dueDate)) {
      errors.dueDate = "Use a valid date.";
    }

    if (autopayDate && !parseDateInput(autopayDate)) {
      errors.autopayDate = "Use a valid date.";
    }
  }

  if (collection === "debts") {
    const currentBalance = numberValue("currentBalance");
    const originalBalance = numberValue("originalBalance");
    const status = String(values.status ?? "");
    const loanDate = String(values.loanDate ?? "");
    const dueDate = String(values.dueDate ?? "");
    const autopayDate = String(values.autopayDate ?? "");
    const payoffDate = String(values.payoffDate ?? "");
    const disputeDeadline = String(values.disputeDeadline ?? "");

    if (
      currentBalance !== undefined &&
      originalBalance !== undefined &&
      originalBalance > 0 &&
      currentBalance > originalBalance
    ) {
      errors.currentBalance = "Current balance cannot exceed the original balance.";
    }

    if (status === "paid" && currentBalance !== undefined && currentBalance > 0) {
      errors.currentBalance = "Paid off debts must have a current balance of 0.";
    }

    if (loanDate && !parseDateInput(loanDate)) {
      errors.loanDate = "Use a valid date.";
    }

    if (dueDate && !parseDateInput(dueDate)) {
      errors.dueDate = "Use a valid date.";
    }

    if (autopayDate && !parseDateInput(autopayDate)) {
      errors.autopayDate = "Use a valid date.";
    }

    if (payoffDate && !parseDateInput(payoffDate)) {
      errors.payoffDate = "Use a valid date.";
    }

    if (disputeDeadline && !parseDateInput(disputeDeadline)) {
      errors.disputeDeadline = "Use a valid date.";
    }
  }

  if (collection === "taxAssetSales") {
    const acquiredDate = String(values.acquiredDate ?? "");
    const soldDate = String(values.soldDate ?? "");
    const acquired = parseDateInput(acquiredDate);
    const sold = parseDateInput(soldDate);

    if (acquiredDate && !acquired) {
      errors.acquiredDate = "Use a valid date.";
    }

    if (soldDate && !sold) {
      errors.soldDate = "Use a valid date.";
    }

    if (acquired && sold && sold.getTime() < acquired.getTime()) {
      errors.soldDate = "Sold date must be on or after acquired date.";
    }
  }

  if (collection === "stocks") {
    const acquiredDate = String(values.acquiredDate ?? "");
    if (acquiredDate && !parseDateInput(acquiredDate)) {
      errors.acquiredDate = "Use a valid date.";
    }
  }
}

function StockTradeSheet({
  modal,
  onClose,
  onSave,
}: {
  modal: NonNullable<StockTradeModalState>;
  onClose: () => void;
  onSave: (trade: StockTradeDraft) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState({
    acquiredDate: getDefaultDateInput(),
    addTaxRecord: true,
    broker: "",
    dateIsEstimate: false,
    fees: "0",
    notes: "",
    price: String(modal.stock.currentPrice || ""),
    shares: "",
    tradeDate: getDefaultDateInput(),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const isSell = modal.kind === "sell";
  const actionLabel = isSell ? "Sell" : "Buy more";
  const tradeVerb = isSell ? "Sold" : "Bought";

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      trapTabFocus(event, sheetRef.current);
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  const updateField = (name: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateStockTradeForm(form, modal);
    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors);
      return;
    }

    onSave({
      acquiredDate: form.acquiredDate,
      addTaxRecord: Boolean(form.addTaxRecord),
      broker: form.broker.trim(),
      dateIsEstimate: Boolean(form.dateIsEstimate),
      fees: validation.fees,
      kind: modal.kind,
      notes: form.notes.trim(),
      price: validation.price,
      shares: validation.shares,
      tradeDate: form.tradeDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close stock trade"
        className="absolute inset-0 bg-[#242321]/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--background-raised)] shadow-2xl"
        ref={sheetRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p
              className="text-xs font-medium uppercase text-[var(--muted-soft)]"
              id={descriptionId}
            >
              {modal.stock.ticker} trade
            </p>
            <h2 className="truncate text-lg font-semibold text-[var(--foreground)]" id={titleId}>
              {actionLabel} {modal.stock.company || modal.stock.ticker}
            </h2>
          </div>
          <Button
            aria-label="Close stock trade"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <MiniStat label="Current shares" value={modal.stock.shares.toLocaleString()} />
            <MiniStat label="Average cost" value={formatCurrency(modal.stock.averageCost)} />
            <TradeInput
              error={errors.shares}
              label="Shares"
              name="shares"
              onChange={(value) => updateField("shares", value)}
              step="0.0001"
              value={form.shares}
            />
            <TradeInput
              error={errors.price}
              label="Price per share"
              name="price"
              onChange={(value) => updateField("price", value)}
              step="0.01"
              value={form.price}
            />
            <TradeInput
              error={errors.fees}
              label="Fees"
              name="fees"
              onChange={(value) => updateField("fees", value)}
              step="0.01"
              value={form.fees}
            />
            <TradeInput
              error={errors.tradeDate}
              label="Trade date"
              name="tradeDate"
              onChange={(value) => updateField("tradeDate", value)}
              type="date"
              value={form.tradeDate}
            />
            {!isSell ? (
              <>
                <TradeInput
                  error={errors.acquiredDate}
                  label="Acquired date"
                  name="acquiredDate"
                  onChange={(value) => updateField("acquiredDate", value)}
                  type="date"
                  value={form.acquiredDate}
                />
                <TradeInput
                  error={errors.broker}
                  label="Broker / account"
                  name="broker"
                  onChange={(value) => updateField("broker", value)}
                  type="text"
                  value={form.broker}
                />
                <label className="flex h-9 items-center gap-2 self-end rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-medium text-[var(--foreground-soft)]">
                  <input
                    checked={Boolean(form.dateIsEstimate)}
                    className="h-4 w-4 accent-[#5f8f6c]"
                    onChange={(event) => updateField("dateIsEstimate", event.target.checked)}
                    type="checkbox"
                  />
                  Date is estimate
                </label>
              </>
            ) : (
              <>
                <label className="flex h-9 items-center gap-2 self-end rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-medium text-[var(--foreground-soft)]">
                  <input
                    checked={Boolean(form.addTaxRecord)}
                    className="h-4 w-4 accent-[#5f8f6c]"
                    onChange={(event) => updateField("addTaxRecord", event.target.checked)}
                    type="checkbox"
                  />
                  Add to tax sales
                </label>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                <span>Notes</span>
                <textarea
                  className={cn(
                    "resize-none rounded-lg border px-3 py-2 text-sm transition",
                    "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                    controlFocusVisibleRing,
                  )}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={3}
                  value={form.notes}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <NoticeCard
                tone={isSell ? "amber" : "blue"}
                title={isSell ? "Sale estimate" : "Average cost update"}
                text={
                  isSell
                    ? "Selling uses FIFO purchases by default and can create one tax sale row per consumed purchase."
                    : "Buying creates a new purchase and updates the holding summary from open purchases."
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant={isSell ? "danger" : "primary"}>
              {tradeVerb} shares
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function TradeInput({
  error,
  label,
  name,
  onChange,
  step,
  type = "number",
  value,
}: {
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  step?: string;
  type?: "date" | "number" | "text";
  value: string;
}) {
  const errorId = error ? `${name}-trade-error` : undefined;

  return (
    <div>
      <Field
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        label={label}
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
        step={step ?? (type === "number" ? "1" : undefined)}
        type={type}
        value={value}
      />
      {error ? <FieldError id={errorId!}>{error}</FieldError> : null}
    </div>
  );
}

function validateStockTradeForm(
  form: {
    acquiredDate: string;
    fees: string;
    price: string;
    shares: string;
    tradeDate: string;
  },
  modal: NonNullable<StockTradeModalState>,
) {
  const errors: FormErrors = {};
  const shares = parseFiniteNumber(form.shares);
  const price = parseFiniteNumber(form.price);
  const fees = parseFiniteNumber(form.fees);
  const tradeDate = parseDateInput(form.tradeDate);
  const acquiredDate = parseDateInput(form.acquiredDate);

  if (shares === null || shares <= 0) {
    errors.shares = "Enter shares greater than 0.";
  } else if (modal.kind === "sell" && shares > modal.stock.shares) {
    errors.shares = "Cannot sell more shares than you hold.";
  }

  if (price === null || price <= 0) {
    errors.price = "Enter a price greater than 0.";
  }

  if (fees === null || fees < 0) {
    errors.fees = "Enter fees of 0 or more.";
  }

  if (!tradeDate) {
    errors.tradeDate = "Use a valid trade date.";
  }

  if (modal.kind === "buy") {
    if (!acquiredDate) {
      errors.acquiredDate = "Use a valid acquired date.";
    }

    if (acquiredDate && tradeDate && tradeDate.getTime() < acquiredDate.getTime()) {
      errors.tradeDate = "Trade date must be on or after acquired date.";
    }
  }

  return {
    errors,
    fees: fees ?? 0,
    price: price ?? 0,
    shares: shares ?? 0,
  };
}

function StockLotSheet({
  data,
  modal,
  onClose,
  onSave,
}: {
  data: FinanceData;
  modal: NonNullable<StockLotModalState>;
  onClose: () => void;
  onSave: (lot: FinanceData["stockLots"][number]) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const stock = data.stocks.find((item) => item.id === modal.item.stockId);
  const [form, setForm] = useState({
    acquiredDate: modal.item.acquiredDate,
    broker: modal.item.broker,
    dateIsEstimate: modal.item.dateIsEstimate,
    fees: String(modal.item.fees),
    notes: modal.item.notes,
    pricePerShare: String(modal.item.pricePerShare),
    remainingShares: String(modal.item.remainingShares),
    shares: String(modal.item.shares),
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      trapTabFocus(event, sheetRef.current);
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  const updateField = (name: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateStockLotForm(form);
    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors);
      return;
    }

    onSave({
      ...modal.item,
      acquiredDate: form.acquiredDate,
      broker: form.broker.trim(),
      dateIsEstimate: Boolean(form.dateIsEstimate),
      fees: validation.fees,
      notes: form.notes.trim(),
      pricePerShare: validation.pricePerShare,
      remainingShares: validation.remainingShares,
      shares: validation.shares,
      ticker: stock?.ticker ?? modal.item.ticker,
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close purchase editor"
        className="absolute inset-0 bg-[#242321]/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--background-raised)] shadow-2xl"
        ref={sheetRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-[var(--muted-soft)]" id={descriptionId}>
              {modal.item.ticker} purchase
            </p>
            <h2 className="truncate text-lg font-semibold text-[var(--foreground)]" id={titleId}>
              Edit purchase
            </h2>
          </div>
          <Button aria-label="Close purchase editor" size="icon" variant="ghost" onClick={onClose}>
            <X size={17} />
          </Button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <TradeInput
              error={errors.acquiredDate}
              label="Acquired date"
              name="acquiredDate"
              onChange={(value) => updateField("acquiredDate", value)}
              type="date"
              value={form.acquiredDate}
            />
            <TradeInput
              error={errors.shares}
              label="Original shares"
              name="shares"
              onChange={(value) => updateField("shares", value)}
              step="0.0001"
              value={form.shares}
            />
            <TradeInput
              error={errors.remainingShares}
              label="Remaining shares"
              name="remainingShares"
              onChange={(value) => updateField("remainingShares", value)}
              step="0.0001"
              value={form.remainingShares}
            />
            <TradeInput
              error={errors.pricePerShare}
              label="Price per share"
              name="pricePerShare"
              onChange={(value) => updateField("pricePerShare", value)}
              step="0.01"
              value={form.pricePerShare}
            />
            <TradeInput
              error={errors.fees}
              label="Fees"
              name="fees"
              onChange={(value) => updateField("fees", value)}
              step="0.01"
              value={form.fees}
            />
            <TradeInput
              error={errors.broker}
              label="Broker / account"
              name="broker"
              onChange={(value) => updateField("broker", value)}
              type="text"
              value={form.broker}
            />
            <label className="flex h-9 items-center gap-2 self-end rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-medium text-[var(--foreground-soft)]">
              <input
                checked={Boolean(form.dateIsEstimate)}
                className="h-4 w-4 accent-[#5f8f6c]"
                onChange={(event) => updateField("dateIsEstimate", event.target.checked)}
                type="checkbox"
              />
              Date is estimate
            </label>
            <div className="sm:col-span-2">
              <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                <span>Notes</span>
                <textarea
                  className={cn(
                    "resize-none rounded-lg border px-3 py-2 text-sm transition",
                    "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                    controlFocusVisibleRing,
                  )}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={3}
                  value={form.notes}
                />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save purchase
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function validateStockLotForm(form: {
  acquiredDate: string;
  fees: string;
  pricePerShare: string;
  remainingShares: string;
  shares: string;
}) {
  const errors: FormErrors = {};
  const shares = parseFiniteNumber(form.shares);
  const remainingShares = parseFiniteNumber(form.remainingShares);
  const pricePerShare = parseFiniteNumber(form.pricePerShare);
  const fees = parseFiniteNumber(form.fees);

  if (!parseDateInput(form.acquiredDate)) {
    errors.acquiredDate = "Use a valid acquired date.";
  }
  if (shares === null || shares <= 0) {
    errors.shares = "Enter shares greater than 0.";
  }
  if (remainingShares === null || remainingShares < 0) {
    errors.remainingShares = "Enter remaining shares of 0 or more.";
  } else if (shares !== null && remainingShares > shares) {
    errors.remainingShares = "Remaining shares cannot exceed original shares.";
  }
  if (pricePerShare === null || pricePerShare <= 0) {
    errors.pricePerShare = "Enter a price greater than 0.";
  }
  if (fees === null || fees < 0) {
    errors.fees = "Enter fees of 0 or more.";
  }

  return {
    errors,
    fees: fees ?? 0,
    pricePerShare: pricePerShare ?? 0,
    remainingShares: remainingShares ?? 0,
    shares: shares ?? 0,
  };
}

function PaycheckSheet({
  data,
  modal,
  onClose,
  onSave,
}: {
  data: FinanceData;
  modal: NonNullable<PaycheckModalState>;
  onClose: () => void;
  onSave: (payload: PaycheckSavePayload) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const linkedSource = data.incomeSources.find(
    (source) => source.id === modal.item?.incomeSourceId,
  );
  const [form, setForm] = useState(() => ({
    additionalMedicareTaxWithheld: modal.item
      ? String(modal.item.additionalMedicareTaxWithheld)
      : "",
    employerName: modal.item?.employerName ?? linkedSource?.name ?? "",
    federalIncomeTaxWithheld: modal.item
      ? String(modal.item.federalIncomeTaxWithheld)
      : "",
    grossPay: modal.item ? String(modal.item.grossPay) : "",
    incomeSourceId: modal.item?.incomeSourceId ?? data.incomeSources[0]?.id ?? "",
    localIncomeTaxWithheld: modal.item ? String(modal.item.localIncomeTaxWithheld) : "",
    medicareTaxWithheld: modal.item ? String(modal.item.medicareTaxWithheld) : "",
    netPay: modal.item ? String(modal.item.netPay) : "",
    newSourceCategory: "Employment",
    newSourceFrequency: "Biweekly",
    newSourceName: "",
    newSourceNextPaymentDate: getDefaultDateInput({ days: 14 }),
    notes: modal.item?.notes ?? "",
    otherDeductions: modal.item ? String(modal.item.otherDeductions) : "",
    otherGovernmentWithholding: modal.item
      ? String(modal.item.otherGovernmentWithholding)
      : "",
    payDate: modal.item?.payDate ?? getDefaultDateInput(),
    periodEndDate: modal.item?.periodEndDate ?? getDefaultDateInput(),
    periodStartDate: modal.item?.periodStartDate ?? getDefaultDateInput({ days: -13 }),
    socialSecurityTaxWithheld: modal.item
      ? String(modal.item.socialSecurityTaxWithheld)
      : "",
    sourceMode: modal.item ? "existing" : data.incomeSources.length > 0 ? "existing" : "new",
    stateIncomeTaxWithheld: modal.item ? String(modal.item.stateIncomeTaxWithheld) : "",
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const isEditing = Boolean(modal.item);

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      sheetRef.current
        ?.querySelector<HTMLElement>("input, select, textarea, button")
        ?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      trapTabFocus(event, sheetRef.current);
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  const updateField = (name: keyof typeof form, value: string) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "incomeSourceId") {
        const source = data.incomeSources.find((item) => item.id === value);
        if (!next.employerName.trim() && source) {
          next.employerName = source.name;
        }
      }
      if (name === "newSourceName" && !next.employerName.trim()) {
        next.employerName = value;
      }
      return next;
    });
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validatePaycheckForm(form, data, isEditing);
    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors);
      return;
    }

    const sourceId =
      form.sourceMode === "new" ? createId("inc") : validation.incomeSourceId;
    const incomeSource =
      form.sourceMode === "new"
        ? {
            active: true,
            amount: validation.grossPay,
            category: form.newSourceCategory.trim() || "Employment",
            frequency: form.newSourceFrequency as FinanceData["incomeSources"][number]["frequency"],
            id: sourceId,
            name: form.newSourceName.trim(),
            nextPaymentDate: form.newSourceNextPaymentDate || form.payDate,
            notes: "Created from paycheck.",
          }
        : undefined;

    onSave({
      incomeSource,
      paycheck: {
        additionalMedicareTaxWithheld: validation.additionalMedicareTaxWithheld,
        employerName:
          form.employerName.trim() ||
          incomeSource?.name ||
          incomeSourceName(data, sourceId),
        federalIncomeTaxWithheld: validation.federalIncomeTaxWithheld,
        grossPay: validation.grossPay,
        id: modal.item?.id ?? createId("pay"),
        incomeSourceId: sourceId,
        localIncomeTaxWithheld: validation.localIncomeTaxWithheld,
        medicareTaxWithheld: validation.medicareTaxWithheld,
        netPay: validation.netPay,
        notes: form.notes.trim(),
        otherDeductions: validation.otherDeductions,
        otherGovernmentWithholding: validation.otherGovernmentWithholding,
        payDate: form.payDate,
        periodEndDate: form.periodEndDate,
        periodStartDate: form.periodStartDate,
        socialSecurityTaxWithheld: validation.socialSecurityTaxWithheld,
        stateIncomeTaxWithheld: validation.stateIncomeTaxWithheld,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close paycheck editor"
        className="absolute inset-0 bg-[#242321]/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-[var(--line)] bg-[var(--background-raised)] shadow-2xl"
        ref={sheetRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-[var(--muted-soft)]" id={descriptionId}>
              Paycheck log
            </p>
            <h2 className="truncate text-lg font-semibold text-[var(--foreground)]" id={titleId}>
              {isEditing ? "Edit paycheck" : "Add paycheck"}
            </h2>
          </div>
          <Button aria-label="Close paycheck editor" size="icon" variant="ghost" onClick={onClose}>
            <X size={17} />
          </Button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                <span>Income source</span>
                <select
                  className={cn(
                    "h-9 rounded-lg border px-3 text-sm transition",
                    "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                    controlFocusVisibleRing,
                  )}
                  disabled={isEditing}
                  onChange={(event) => updateField("sourceMode", event.target.value)}
                  value={form.sourceMode}
                >
                  {data.incomeSources.length > 0 ? (
                    <option value="existing">Existing income source</option>
                  ) : null}
                  {!isEditing ? <option value="new">New income source</option> : null}
                </select>
              </label>
            </div>
            {form.sourceMode === "existing" ? (
              <PaycheckSelect
                disabled={isEditing}
                error={errors.incomeSourceId}
                label="Linked source"
                name="incomeSourceId"
                onChange={(value) => updateField("incomeSourceId", value)}
                options={data.incomeSources.map((source) => ({
                  label: source.name,
                  value: source.id,
                }))}
                value={form.incomeSourceId}
              />
            ) : (
              <>
                <PaycheckInput
                  error={errors.newSourceName}
                  label="New source name"
                  name="newSourceName"
                  onChange={(value) => updateField("newSourceName", value)}
                  value={form.newSourceName}
                />
                <PaycheckSelect
                  error={errors.newSourceFrequency}
                  label="Frequency"
                  name="newSourceFrequency"
                  onChange={(value) => updateField("newSourceFrequency", value)}
                  options={frequencies.map((frequency) => ({
                    label: frequency,
                    value: frequency,
                  }))}
                  value={form.newSourceFrequency}
                />
                <PaycheckInput
                  error={errors.newSourceCategory}
                  label="Category"
                  name="newSourceCategory"
                  onChange={(value) => updateField("newSourceCategory", value)}
                  value={form.newSourceCategory}
                />
                <PaycheckInput
                  error={errors.newSourceNextPaymentDate}
                  label="Next payment date"
                  name="newSourceNextPaymentDate"
                  onChange={(value) => updateField("newSourceNextPaymentDate", value)}
                  type="date"
                  value={form.newSourceNextPaymentDate}
                />
              </>
            )}
            <PaycheckInput
              error={errors.employerName}
              label="Employer name"
              name="employerName"
              onChange={(value) => updateField("employerName", value)}
              value={form.employerName}
            />
            <PaycheckInput
              error={errors.payDate}
              label="Pay date"
              name="payDate"
              onChange={(value) => updateField("payDate", value)}
              type="date"
              value={form.payDate}
            />
            <PaycheckInput
              error={errors.periodStartDate}
              label="Period start"
              name="periodStartDate"
              onChange={(value) => updateField("periodStartDate", value)}
              type="date"
              value={form.periodStartDate}
            />
            <PaycheckInput
              error={errors.periodEndDate}
              label="Period end"
              name="periodEndDate"
              onChange={(value) => updateField("periodEndDate", value)}
              type="date"
              value={form.periodEndDate}
            />
            <PaycheckInput
              error={errors.grossPay}
              label="Gross pay"
              name="grossPay"
              onChange={(value) => updateField("grossPay", value)}
              step="0.01"
              type="number"
              value={form.grossPay}
            />
            <PaycheckInput
              error={errors.netPay}
              label="Net pay"
              name="netPay"
              onChange={(value) => updateField("netPay", value)}
              step="0.01"
              type="number"
              value={form.netPay}
            />
            <PaycheckInput
              error={errors.federalIncomeTaxWithheld}
              label="Federal income tax"
              name="federalIncomeTaxWithheld"
              onChange={(value) => updateField("federalIncomeTaxWithheld", value)}
              step="0.01"
              type="number"
              value={form.federalIncomeTaxWithheld}
            />
            <PaycheckInput
              error={errors.socialSecurityTaxWithheld}
              label="Social Security"
              name="socialSecurityTaxWithheld"
              onChange={(value) => updateField("socialSecurityTaxWithheld", value)}
              step="0.01"
              type="number"
              value={form.socialSecurityTaxWithheld}
            />
            <PaycheckInput
              error={errors.medicareTaxWithheld}
              label="Medicare"
              name="medicareTaxWithheld"
              onChange={(value) => updateField("medicareTaxWithheld", value)}
              step="0.01"
              type="number"
              value={form.medicareTaxWithheld}
            />
            <PaycheckInput
              error={errors.additionalMedicareTaxWithheld}
              label="Additional Medicare"
              name="additionalMedicareTaxWithheld"
              onChange={(value) => updateField("additionalMedicareTaxWithheld", value)}
              step="0.01"
              type="number"
              value={form.additionalMedicareTaxWithheld}
            />
            <PaycheckInput
              error={errors.stateIncomeTaxWithheld}
              label="State income tax"
              name="stateIncomeTaxWithheld"
              onChange={(value) => updateField("stateIncomeTaxWithheld", value)}
              step="0.01"
              type="number"
              value={form.stateIncomeTaxWithheld}
            />
            <PaycheckInput
              error={errors.localIncomeTaxWithheld}
              label="Local income tax"
              name="localIncomeTaxWithheld"
              onChange={(value) => updateField("localIncomeTaxWithheld", value)}
              step="0.01"
              type="number"
              value={form.localIncomeTaxWithheld}
            />
            <PaycheckInput
              error={errors.otherGovernmentWithholding}
              label="Other gov withholding"
              name="otherGovernmentWithholding"
              onChange={(value) => updateField("otherGovernmentWithholding", value)}
              step="0.01"
              type="number"
              value={form.otherGovernmentWithholding}
            />
            <PaycheckInput
              error={errors.otherDeductions}
              label="Other deductions"
              name="otherDeductions"
              onChange={(value) => updateField("otherDeductions", value)}
              step="0.01"
              type="number"
              value={form.otherDeductions}
            />
            <div className="sm:col-span-2">
              <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                <span>Notes</span>
                <textarea
                  className={cn(
                    "resize-none rounded-lg border px-3 py-2 text-sm transition",
                    "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                    controlFocusVisibleRing,
                  )}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={3}
                  value={form.notes}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <NoticeCard
                tone="blue"
                title="Payroll tax tracking"
                text="Federal income tax withholding feeds the federal refund estimate. Social Security, Medicare, state, local, and other government withholdings are tracked separately."
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save paycheck
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function PaycheckInput({
  error,
  label,
  name,
  onChange,
  step,
  type = "text",
  value,
}: {
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  step?: string;
  type?: "date" | "number" | "text";
  value: string;
}) {
  const errorId = error ? `${name}-paycheck-error` : undefined;
  return (
    <div>
      <Field
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        label={label}
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
        step={step ?? (type === "number" ? "0.01" : undefined)}
        type={type}
        value={value}
      />
      {error ? <FieldError id={errorId!}>{error}</FieldError> : null}
    </div>
  );
}

function PaycheckSelect({
  disabled = false,
  error,
  label,
  name,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  const errorId = error ? `${name}-paycheck-error` : undefined;
  return (
    <div>
      <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
        <span>{label}</span>
        <select
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-9 rounded-lg border px-3 text-sm transition disabled:opacity-60",
            "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
            controlFocusVisibleRing,
          )}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {error ? <FieldError id={errorId!}>{error}</FieldError> : null}
    </div>
  );
}

function validatePaycheckForm(
  form: Record<string, string>,
  data: FinanceData,
  isEditing: boolean,
): PaycheckValidationResult {
  const errors: FormErrors = {};
  const numberFields = [
    "additionalMedicareTaxWithheld",
    "federalIncomeTaxWithheld",
    "grossPay",
    "localIncomeTaxWithheld",
    "medicareTaxWithheld",
    "netPay",
    "otherDeductions",
    "otherGovernmentWithholding",
    "socialSecurityTaxWithheld",
    "stateIncomeTaxWithheld",
  ];
  const values: Omit<PaycheckValidationResult, "errors" | "incomeSourceId"> = {
    additionalMedicareTaxWithheld: 0,
    federalIncomeTaxWithheld: 0,
    grossPay: 0,
    localIncomeTaxWithheld: 0,
    medicareTaxWithheld: 0,
    netPay: 0,
    otherDeductions: 0,
    otherGovernmentWithholding: 0,
    socialSecurityTaxWithheld: 0,
    stateIncomeTaxWithheld: 0,
  };

  numberFields.forEach((field) => {
      const rawValue = form[field]?.trim() ?? "";
      const parsed = rawValue === "" ? 0 : parseFiniteNumber(rawValue);
      if (parsed === null || parsed < 0) {
        errors[field] = "Enter 0 or more.";
        return;
      }
      values[field as keyof typeof values] = parsed;
    });

  if (values.grossPay <= 0) {
    errors.grossPay = "Enter gross pay greater than 0.";
  }

  if (values.netPay > values.grossPay) {
    errors.netPay = "Net pay cannot exceed gross pay.";
  }

  if (!form.employerName.trim()) {
    errors.employerName = "Required.";
  }

  if (form.sourceMode === "new" && !isEditing) {
    if (!form.newSourceName.trim()) {
      errors.newSourceName = "Required.";
    }
    if (!parseDateInput(form.newSourceNextPaymentDate)) {
      errors.newSourceNextPaymentDate = "Use a valid date.";
    }
  } else if (
    !form.incomeSourceId ||
    !data.incomeSources.some((source) => source.id === form.incomeSourceId)
  ) {
    errors.incomeSourceId = "Choose an income source.";
  }

  const payDate = parseDateInput(form.payDate);
  const periodStart = parseDateInput(form.periodStartDate);
  const periodEnd = parseDateInput(form.periodEndDate);
  if (!payDate) {
    errors.payDate = "Use a valid date.";
  }
  if (!periodStart) {
    errors.periodStartDate = "Use a valid date.";
  }
  if (!periodEnd) {
    errors.periodEndDate = "Use a valid date.";
  }
  if (periodStart && periodEnd && periodEnd.getTime() < periodStart.getTime()) {
    errors.periodEndDate = "Period end must be on or after start.";
  }

  return {
    ...values,
    errors,
    incomeSourceId: form.incomeSourceId,
  };
}

type PaycheckValidationResult = {
  additionalMedicareTaxWithheld: number;
  errors: FormErrors;
  federalIncomeTaxWithheld: number;
  grossPay: number;
  incomeSourceId: string;
  localIncomeTaxWithheld: number;
  medicareTaxWithheld: number;
  netPay: number;
  otherDeductions: number;
  otherGovernmentWithholding: number;
  socialSecurityTaxWithheld: number;
  stateIncomeTaxWithheld: number;
};

function getEditorFields(config: FormConfig, modal: NonNullable<ModalState>) {
  if (config.collection !== "stocks" || !modal.item) {
    return config.fields;
  }

  const stockEditFields = new Set(["ticker", "company", "currentPrice", "notes"]);
  return config.fields.filter((field) => stockEditFields.has(field.name));
}

function StockPurchasesEditorTable({
  purchases,
  onDelete,
  onEdit,
}: {
  purchases: FinanceData["stockLots"];
  onDelete: (id: string) => void;
  onEdit: (item: FinanceData["stockLots"][number]) => void;
}) {
  const confirmDeletePurchase = (purchase: FinanceData["stockLots"][number]) => {
    if (
      window.confirm(
        `Delete ${purchase.ticker} purchase from ${purchase.acquiredDate}? This cannot be undone.`,
      )
    ) {
      onDelete(purchase.id);
    }
  };

  return (
    <div className="sm:col-span-2 rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground-soft)]">
            Purchases
          </p>
          <p className="text-xs text-[var(--muted)]">
            {purchases.length} saved purchase{purchases.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      {purchases.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <caption className="sr-only">Stock purchase history</caption>
            <thead className="text-[var(--muted-soft)]">
              <tr className="border-b border-[var(--line)]">
                <th className="px-3 py-2 font-medium" scope="col">Acquired</th>
                <th className="px-3 py-2 font-medium" scope="col">Shares</th>
                <th className="px-3 py-2 font-medium" scope="col">Remaining</th>
                <th className="px-3 py-2 font-medium" scope="col">Price/share</th>
                <th className="px-3 py-2 font-medium" scope="col">Fees</th>
                <th className="px-3 py-2 font-medium" scope="col">Broker</th>
                <th className="px-3 py-2 font-medium" scope="col">Notes</th>
                <th className="px-3 py-2 text-right font-medium" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr
                  className="border-b border-[var(--line)] last:border-b-0"
                  key={purchase.id}
                >
                  <th className="px-3 py-2 text-left font-mono font-normal text-[var(--foreground-soft)]" scope="row">
                    {purchase.acquiredDate}
                  </th>
                  <td className="px-3 py-2 font-mono text-[var(--foreground-soft)]">
                    {purchase.shares.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--foreground-soft)]">
                    {purchase.remainingShares.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--foreground-soft)]">
                    {formatCurrency(purchase.pricePerShare)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--foreground-soft)]">
                    {formatCurrency(purchase.fees)}
                  </td>
                  <td className="max-w-28 truncate px-3 py-2 text-[var(--muted)]">
                    {purchase.broker || "None"}
                  </td>
                  <td className="max-w-40 truncate px-3 py-2 text-[var(--muted)]">
                    {purchase.notes || "None"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`Edit ${purchase.ticker} purchase from ${purchase.acquiredDate}`}
                        className="h-7 w-7 rounded-md"
                        size="icon"
                        title="Edit purchase"
                        variant="ghost"
                        onClick={() => onEdit(purchase)}
                      >
                        <Edit3 size={13} />
                      </Button>
                      <Button
                        aria-label={`Delete ${purchase.ticker} purchase from ${purchase.acquiredDate}`}
                        className="h-7 w-7 rounded-md"
                        size="icon"
                        title="Delete purchase"
                        variant="ghost"
                        onClick={() => confirmDeletePurchase(purchase)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-3 py-4 text-sm text-[var(--muted)]">
          No purchases recorded for this stock.
        </p>
      )}
    </div>
  );
}

function EditorSheet({
  data,
  modal,
  onClose,
  onDeleteStockPurchase,
  onEditStockPurchase,
  onSave,
}: {
  data: FinanceData;
  modal: NonNullable<ModalState>;
  onClose: () => void;
  onDeleteStockPurchase: (id: string) => void;
  onEditStockPurchase: (item: FinanceData["stockLots"][number]) => void;
  onSave: (collection: CollectionKey, item: EditableItem) => void;
}) {
  const config = formConfigs[modal.collection];
  const fields = getEditorFields(config, modal);
  const editorTitle =
    config.collection === "stocks" && modal.item ? "Stock Holding" : config.title;
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState<Record<string, FormValue>>(() => ({
    ...createFormDefaults(config.collection),
    ...(modal.item ?? {}),
  }));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      sheetRef.current
        ?.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        ?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !sheetRef.current) {
        return;
      }

      const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  const updateField = (name: string, value: FormValue) => {
    setForm((current) => ({
      ...current,
      [name]: normalizeEditorFieldValue(config.collection, name, value),
      ...(name === "autopay" && value === true && !current.autopayDate
        ? { autopayDate: current.dueDate ?? "" }
        : {}),
      ...(name === "dueDate" && current.autopay === true && !current.autopayDate
        ? { autopayDate: value }
        : {}),
    }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateEditorForm(config, form, fields);

    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors);
      return;
    }

    const item = {
      ...(modal.item ?? { id: createId(config.prefix) }),
      ...validation.values,
    } as EditableItem;
    onSave(config.collection, item);
  };

  const statementPaidValue =
    config.collection === "creditCards"
      ? parseFiniteNumber(String(form.statementPaid ?? "")) ?? 0
      : 0;
  const canReverseStatementPaid =
    config.collection === "creditCards" &&
    Boolean(modal.item) &&
    statementPaidValue > 0;
  const stockPurchases =
    config.collection === "stocks" && modal.item
      ? data.stockLots
          .filter((purchase) => purchase.stockId === modal.item?.id)
          .slice()
          .sort(
            (a, b) =>
              a.acquiredDate.localeCompare(b.acquiredDate) ||
              a.id.localeCompare(b.id),
          )
      : [];

  const reverseStatementPaid = () => {
    updateField("statementPaid", 0);
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close editor"
        className="absolute inset-0 bg-[#242321]/25"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-[var(--line)] bg-[var(--background-raised)] shadow-2xl"
        ref={sheetRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            <p
              className="text-xs font-medium uppercase text-[var(--muted-soft)]"
              id={descriptionId}
            >
              {modal.item ? "Edit" : "New"} {collectionLabels[config.collection]}
            </p>
            <h2 className="text-lg font-semibold text-[var(--foreground)]" id={titleId}>
              {editorTitle}
            </h2>
          </div>
          <Button
            aria-label="Close editor"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            {config.collection === "stocks" ? (
              <div className="sm:col-span-2">
                <NoticeCard
                  tone="blue"
                  title="Stock purchases"
                  text="Add different stock purchases one at a time for tax purposes."
                />
              </div>
            ) : null}
            {fields.map((field) => {
              const value = form[field.name];
              const error = errors[field.name];
              const errorId = `${titleId}-${field.name}-error`;
              if (field.type === "textarea") {
                return (
                  <div key={field.name} className="sm:col-span-2">
                    <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                      <span>{field.label}</span>
                      <textarea
                        aria-describedby={error ? errorId : undefined}
                        aria-invalid={Boolean(error)}
                        className={cn(
                          "resize-none rounded-lg border px-3 py-2 text-sm transition",
                          "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                          controlFocusVisibleRing,
                        )}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        required={field.required}
                        rows={3}
                        value={String(value ?? "")}
                      />
                    </label>
                    {error ? <FieldError id={errorId}>{error}</FieldError> : null}
                  </div>
                );
              }
              if (field.type === "select") {
                return (
                  <div key={field.name}>
                    <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
                      <span>{field.label}</span>
                      <select
                        aria-describedby={error ? errorId : undefined}
                        aria-invalid={Boolean(error)}
                        className={cn(
                          "h-9 rounded-lg border px-3 text-sm transition",
                          "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)]",
                          controlFocusVisibleRing,
                        )}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        required={field.required}
                        value={String(value ?? field.options?.[0] ?? "")}
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    {error ? <FieldError id={errorId}>{error}</FieldError> : null}
                  </div>
                );
              }
              if (field.type === "checkbox") {
                return (
                  <label
                    key={field.name}
                    className="flex h-9 items-center gap-2 self-end rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-medium text-[var(--foreground-soft)]"
                  >
                    <input
                      checked={Boolean(value)}
                      className="h-4 w-4 accent-[#5f8f6c]"
                      onChange={(event) => updateField(field.name, event.target.checked)}
                      type="checkbox"
                    />
                    {field.label}
                  </label>
                );
              }

              return (
                <div key={field.name}>
                  <Field
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={Boolean(error)}
                    label={field.label}
                    max={
                      field.type === "number" && field.max !== undefined
                        ? field.max
                        : undefined
                    }
                    min={
                      field.type === "number" && field.min !== undefined
                        ? field.min
                        : undefined
                    }
                    onChange={(event) => updateField(field.name, event.target.value)}
                    required={field.required}
                    step={field.step ?? (field.type === "number" ? "1" : undefined)}
                    type={field.type}
                    value={String(value ?? "")}
                  />
                  {error ? <FieldError id={errorId}>{error}</FieldError> : null}
                </div>
              );
            })}
            {canReverseStatementPaid ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] px-3 py-2 sm:col-span-2">
                <Badge tone="amber">Statement payment recorded</Badge>
                <Button size="sm" variant="secondary" onClick={reverseStatementPaid}>
                  <RefreshCcw size={14} />
                  Reverse statement paid
                </Button>
              </div>
            ) : null}
            {config.collection === "stocks" && modal.item ? (
              <StockPurchasesEditorTable
                purchases={stockPurchases}
                onDelete={onDeleteStockPurchase}
                onEdit={onEditStockPurchase}
              />
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function FieldError({ children, id }: { children: ReactNode; id: string }) {
  return (
    <p className="mt-1 text-xs font-medium text-[var(--danger)]" id={id}>
      {children}
    </p>
  );
}

function createNoticeId(title: string, text: string) {
  const slug = `${title}-${text}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);

  return `notice-${slug || "alert"}`;
}

function NoticeCenterPopover({
  notices,
  onClose,
  onRestore,
  onRestoreAll,
}: {
  notices: NoticeRecord[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onRestoreAll: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-labelledby={titleId}
      className="absolute right-4 top-[calc(100%+0.5rem)] z-50 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)] shadow-2xl md:right-6 lg:right-8"
      id="notice-center"
      role="dialog"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]" id={titleId}>
            Alerts
          </p>
          <p className="text-xs text-[var(--muted)]">
            {notices.length} hidden
          </p>
        </div>
        <Button aria-label="Close alerts" className="h-7 w-7 rounded-md" size="icon" variant="ghost" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>
      <div className="max-h-96 overflow-y-auto p-2">
        {notices.length > 0 ? (
          <div className="grid gap-2">
            {notices.map((notice) => (
              <div
                className="rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3"
                key={notice.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground-soft)]">
                      {notice.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {notice.text}
                    </p>
                  </div>
                  <Button
                    className="h-7 px-2"
                    size="sm"
                    variant="secondary"
                    onClick={() => onRestore(notice.id)}
                  >
                    Show
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-2 py-6 text-center text-sm text-[var(--muted)]">
            No hidden alerts
          </p>
        )}
      </div>
      {notices.length > 1 ? (
        <div className="flex justify-end border-t border-[var(--line)] px-3 py-2">
          <Button size="sm" variant="secondary" onClick={onRestoreAll}>
            Show all
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function NoticeCard({
  id,
  dismissible = true,
  text,
  title,
  tone = "blue",
}: {
  id?: string;
  dismissible?: boolean;
  text: string;
  title: string;
  tone?: NoticeTone;
}) {
  const noticeCenter = useContext(NoticeCenterContext);
  const noticeId = id ?? createNoticeId(title, text);
  const notice = useMemo(
    () => ({
      id: noticeId,
      text,
      title,
      tone,
    }),
    [noticeId, text, title, tone],
  );
  const tones = {
    amber:
      "border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] text-[var(--tone-amber-fg)]",
    blue:
      "border-[var(--tone-blue-border)] bg-[var(--tone-blue-bg)] text-[var(--tone-blue-fg)]",
  };
  const isDismissed = dismissible && Boolean(noticeCenter?.dismissedIds.has(noticeId));

  useEffect(() => {
    noticeCenter?.registerNotice(notice);
  }, [notice, noticeCenter]);

  if (isDismissed) {
    return null;
  }

  return (
    <section
      className={cn("flex items-start gap-3 rounded-lg border p-4", tones[tone])}
      role="note"
    >
      <AlertTriangle className="mt-0.5 shrink-0" size={16} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6">{text}</p>
      </div>
      {dismissible && noticeCenter ? (
        <Button
          aria-label={`Dismiss ${title}`}
          className="ml-auto h-7 w-7 rounded-md border-current/20 bg-transparent hover:bg-black/5"
          size="icon"
          variant="ghost"
          onClick={() => noticeCenter.dismissNotice(notice)}
        >
          <X size={14} />
        </Button>
      ) : null}
    </section>
  );
}

function MetricCard({
  chartPalette,
  icon,
  label,
  value,
  trend,
  trendTone = "neutral",
  sparkline,
}: {
  chartPalette?: ChartPalette;
  icon: ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendTone?: "neutral" | "green" | "red" | "amber" | "blue";
  sparkline?: number[];
}) {
  return (
    <Card>
      <div className="flex min-h-28 items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="mb-3 grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)]">
            {icon}
          </div>
          <p className="truncate text-xs font-medium text-[var(--muted)]">{label}</p>
          <p className="mt-1 truncate font-mono text-xl font-semibold text-[var(--foreground)]">
            {value}
          </p>
          {trend ? (
            <div className="mt-2">
              <Badge tone={trendTone}>{trend}</Badge>
            </div>
          ) : null}
        </div>
        {sparkline ? (
          <Sparkline
            negativeColor={chartPalette?.expenses}
            positive={trendTone !== "red"}
            positiveColor={chartPalette?.primary}
            values={sparkline}
          />
        ) : null}
      </div>
    </Card>
  );
}

function BalanceSummaryMetric({
  icon,
  label,
  value,
  trend,
  trendTone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  trend: string;
  trendTone: "neutral" | "green" | "red" | "amber" | "blue";
}) {
  return (
    <div className="min-w-0">
      <div className="mb-3 grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)]">
        {icon}
      </div>
      <p className="truncate text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate font-mono text-xl font-semibold text-[var(--foreground)]">
        {value}
      </p>
      <div className="mt-2">
        <Badge tone={trendTone}>{trend}</Badge>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] px-3 py-2",
        compact && "px-2 py-1.5",
      )}
    >
      <p className="truncate text-[11px] font-medium uppercase text-[var(--muted-soft)]">{label}</p>
      <p
        className={cn(
          "mt-1 truncate font-mono font-semibold text-[var(--foreground)]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PrimaryCell({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-[var(--foreground-soft)]">{title}</p>
      {detail ? <p className="truncate text-xs text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

function NoteCell({ value }: { value: string }) {
  return <span className="block max-w-52 truncate text-[var(--muted)]">{value || "No notes"}</span>;
}

function GainBadge({ value, basis }: { value: number; basis: number }) {
  const percent = basis > 0 ? (value / basis) * 100 : 0;
  const positive = value >= 0;
  return (
    <div className="flex flex-col gap-1">
      <span className={cn("font-mono text-sm", positive ? "text-[var(--tone-green-fg)]" : "text-[var(--tone-red-fg)]")}>
        {formatCurrency(value)}
      </span>
      <Badge tone={positive ? "green" : "red"}>{formatPercent(percent)}</Badge>
    </div>
  );
}

function DueBadge({ date }: { date: string }) {
  const status = getDueDateStatus(date);
  return <Badge tone={status.tone}>{status.label}</Badge>;
}

function SectionStack({ children }: { children: ReactNode }) {
  return <div className="grid gap-5">{children}</div>;
}

function portfolioAllocation(summary: ReturnType<typeof calculateSummary>, chartPalette: ChartPalette) {
  return [
    { label: "Manual investment accounts", value: summary.manualInvestmentValue, color: chartPalette.primary },
    { label: "Stock holdings", value: summary.stockPortfolioValue, color: chartPalette.secondary },
    { label: "Crypto holdings", value: summary.cryptoPortfolioValue, color: chartPalette.tertiary },
  ].filter((item) => item.value > 0);
}

function emergencyProgress(summary: ReturnType<typeof calculateSummary>) {
  return savingsGoalProgressPercent(summary.emergencyFund);
}

function daysUntilDate(dateString: string) {
  return getDaysUntilDate(dateString) ?? Number.POSITIVE_INFINITY;
}

function matchesDateWindow(dateString: string, window: DateWindow) {
  const days = getDaysUntilDate(dateString);
  switch (window) {
    case "overdue":
      return days !== null && days < 0;
    case "next7":
      return days !== null && days >= 0 && days <= 7;
    case "next30":
      return days !== null && days >= 0 && days <= 30;
    default:
      return true;
  }
}

function dateWindowLabel(window: DateWindow) {
  switch (window) {
    case "overdue":
      return "Overdue";
    case "next7":
      return "Next 7 days";
    case "next30":
      return "Next 30 days";
    default:
      return "All dates";
  }
}

function sortCreditScoreHistoryAscending(
  entries: FinanceData["creditScoreHistory"],
) {
  return entries.slice().sort((a, b) => a.date.localeCompare(b.date));
}

function sortCreditScoreHistoryDescending(
  entries: FinanceData["creditScoreHistory"],
) {
  return entries.slice().sort((a, b) => b.date.localeCompare(a.date));
}

function nextOlderCreditScoreEntry(
  entries: FinanceData["creditScoreHistory"],
  entry: FinanceData["creditScoreHistory"][number],
) {
  const index = entries.findIndex((item) => item.id === entry.id);
  return index >= 0 ? entries[index + 1] : undefined;
}

function formatDateLabel(value: string) {
  const date = parseDateInput(value);
  if (!date) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDateLabel(value: string) {
  const date = parseDateInput(value);
  if (!date) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function creditScoreBand(score: number) {
  if (score >= 800) {
    return "Excellent";
  }

  if (score >= 740) {
    return "Very good";
  }

  if (score >= 670) {
    return "Good";
  }

  if (score >= 580) {
    return "Fair";
  }

  return "Needs work";
}

function creditScoreBadgeTone(score: number): "green" | "amber" | "red" {
  if (score >= 670) {
    return "green";
  }

  return score >= 580 ? "amber" : "red";
}

function creditScoreRangeLabel(entries: FinanceData["creditScoreHistory"]) {
  const scores = entries.map((entry) => entry.score);
  return `${Math.min(...scores)}-${Math.max(...scores)}`;
}

function removeDemoNetWorthHistory(history: FinanceData["netWorthHistory"]) {
  return historyMatches(history, mockFinanceData.netWorthHistory) ? [] : history;
}

function removeDemoIncomeExpenseHistory(
  history: FinanceData["incomeExpenseHistory"],
) {
  return historyMatches(history, mockFinanceData.incomeExpenseHistory) ? [] : history;
}

function historyMatches<T>(history: T[], demoHistory: T[]) {
  return JSON.stringify(history) === JSON.stringify(demoHistory);
}

function withCurrentValue(
  history: Array<{ label: string; value: number }>,
  currentValue: number,
) {
  if (history.length === 0) {
    return [{ label: "Now", value: currentValue }];
  }

  const lastPoint = history.at(-1);
  if (lastPoint?.label === "Now") {
    return history.map((point, index) =>
      index === history.length - 1 ? { ...point, value: currentValue } : point,
    );
  }

  return [...history, { label: "Now", value: currentValue }];
}

function trendFromSeries(series: Array<{ value: number }>) {
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  if (first === 0) {
    return 0;
  }
  return ((last - first) / Math.abs(first)) * 100;
}

function nextInterestEstimate(balance: number, apr: number) {
  return balance * Math.max(apr, 0) / 100 / 12;
}

function payoffEstimate(card: FinanceData["creditCards"][number]) {
  const { apr, minimumPayment } = card;
  const balance = creditInterestBalance(card);
  if (balance <= 0) {
    return { label: "Paid off", interest: 0, warning: false };
  }

  const monthlyRate = Math.max(apr, 0) / 100 / 12;
  const payment = Math.max(minimumPayment, 0);
  if (payment <= 0 || payment <= balance * monthlyRate) {
    return { label: "Payment too low", interest: nextInterestEstimate(balance, apr), warning: true };
  }

  let remaining = balance;
  let interest = 0;
  let months = 0;
  while (remaining > 0 && months < 600) {
    const monthlyInterest = remaining * monthlyRate;
    interest += monthlyInterest;
    remaining = remaining + monthlyInterest - payment;
    months += 1;
  }

  return {
    label: months >= 600 ? "50+ years" : `${months} mo`,
    interest,
    warning: months >= 600,
  };
}

type DebtProjectionItem = {
  apr: number;
  currentBalance: number;
  id: string;
  monthlyPayment: number;
  originalBalance: number;
};

function getDebtProjectionItems(data: FinanceData): DebtProjectionItem[] {
  return data.debts
    .filter((debt) => debt.status !== "paid" && debt.currentBalance > 0)
    .map((debt) => ({
      apr: debt.apr,
      currentBalance: debt.currentBalance,
      id: debt.id,
      monthlyPayment: getMonthlyDebtPaymentAmount(debt),
      originalBalance: Math.max(debt.originalBalance, debt.currentBalance),
    }));
}

function totalMonthlyDebtPayment(data: FinanceData) {
  return getMonthlyDebtPaymentTotal(data);
}

function getMonthlyDebtPaymentTotal(data: FinanceData) {
  return data.debts
    .filter((debt) => debt.status !== "paid" && debt.currentBalance > 0)
    .reduce((total, debt) => total + getMonthlyDebtPaymentAmount(debt), 0);
}

function getMonthlyDebtPaymentAmount(debt: FinanceData["debts"][number]) {
  const scheduledPayment = Math.min(
    Math.max(debt.minimumPayment, 0),
    Math.max(debt.currentBalance, 0),
  );

  return monthlyAmount(scheduledPayment, debt.paymentFrequency);
}

function projectDebtBalance(item: DebtProjectionItem, months: number) {
  let remaining = Math.max(item.currentBalance, 0);
  const monthlyRate = Math.max(item.apr, 0) / 100 / 12;
  const payment = Math.max(item.monthlyPayment, 0);

  for (let month = 0; month < months && remaining > 0; month += 1) {
    const interest = remaining * monthlyRate;
    remaining = payment > 0
      ? Math.max(remaining + interest - payment, 0)
      : remaining + interest;
  }

  return remaining;
}

function getDebtPaydownSeries(data: FinanceData) {
  const items = getDebtProjectionItems(data);
  const marks = [
    { label: "Now", months: 0 },
    { label: "3 mo", months: 3 },
    { label: "6 mo", months: 6 },
    { label: "12 mo", months: 12 },
    { label: "24 mo", months: 24 },
  ];

  return marks.map((mark) => ({
    label: mark.label,
    value: items.reduce(
      (total, item) => total + projectDebtBalance(item, mark.months),
      0,
    ),
  }));
}

function getDebtPastSeries(
  data: FinanceData,
  currentTotalDebt: number,
  range: DebtHistoryRange,
) {
  const allPayments = data.debtPayments
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const payments = allPayments.filter((payment) =>
    debtPaymentInHistoryRange(payment.date, range),
  );
  const dailyPayments = groupDebtPaymentsByDate(payments);
  const enteredTotalDebt = Math.max(
    getTotalEnteredDebt(data, currentTotalDebt),
    allPayments[0]?.totalDebtBefore ?? 0,
    currentTotalDebt,
  );
  const historyStartDate = getDebtHistoryStartDate(data);
  const historyStartLabel =
    range === "all" && historyStartDate ? formatShortDateLabel(historyStartDate) : "Entered";

  if (dailyPayments.length === 0) {
    if (
      range === "all" &&
      (historyStartDate || Math.abs(enteredTotalDebt - currentTotalDebt) > 0.01)
    ) {
      return [
        { label: historyStartLabel, value: enteredTotalDebt },
        { label: "Now", value: currentTotalDebt },
      ];
    }

    return [{ label: "Now", value: currentTotalDebt }];
  }

  const recentPayments = range === "all" ? dailyPayments : dailyPayments.slice(-6);
  const points = [
    {
      label: range === "all" ? historyStartLabel : "Start",
      value: range === "all" ? enteredTotalDebt : recentPayments[0].totalDebtBefore,
    },
    ...recentPayments.map((payment) => ({
      label: formatShortDateLabel(payment.date),
      value: payment.totalDebtAfter,
    })),
  ];
  const lastPoint = points.at(-1);

  if (!lastPoint || Math.abs(lastPoint.value - currentTotalDebt) > 0.01) {
    points.push({ label: "Now", value: currentTotalDebt });
  }

  return points;
}

function getDebtHistoryStartDate(data: FinanceData) {
  const dates = data.debts
    .map((debt) => debt.loanDate)
    .filter((date) => Boolean(date) && Boolean(parseDateInput(date)))
    .sort((a, b) => a.localeCompare(b));

  return dates[0] ?? "";
}

function groupDebtPaymentsByDate(payments: FinanceData["debtPayments"]) {
  return payments.reduce<FinanceData["debtPayments"]>((groups, payment) => {
    const existingIndex = groups.findIndex((item) => item.date === payment.date);
    if (existingIndex === -1) {
      groups.push({ ...payment });
      return groups;
    }

    const existing = groups[existingIndex];
    groups[existingIndex] = {
      ...existing,
      amount: existing.amount + payment.amount,
      balanceAfter: payment.balanceAfter,
      debtId: existing.debtId === payment.debtId ? existing.debtId : "multiple",
      debtName: existing.debtName === payment.debtName ? existing.debtName : "Multiple debts",
      totalDebtAfter: payment.totalDebtAfter,
      totalDebtBefore: existing.totalDebtBefore,
    };
    return groups;
  }, []);
}

function debtPaymentInHistoryRange(dateString: string, range: DebtHistoryRange) {
  if (range === "all") {
    return true;
  }

  const date = parseDateInput(dateString);
  if (!date) {
    return false;
  }

  const cutoff = new Date();
  if (range === "1m") {
    cutoff.setMonth(cutoff.getMonth() - 1);
  } else {
    cutoff.setFullYear(cutoff.getFullYear() - 1);
  }
  cutoff.setHours(0, 0, 0, 0);

  return date >= cutoff;
}

function getTotalEnteredDebt(data: FinanceData, currentTotalDebt: number) {
  const enteredDebtAccounts = data.debts.reduce(
    (total, debt) => total + Math.max(debt.originalBalance, debt.currentBalance),
    0,
  );
  const creditCardDebt = data.creditCards.reduce(
    (total, card) => total + creditCurrentBalance(card),
    0,
  );

  return Math.max(enteredDebtAccounts + creditCardDebt, currentTotalDebt);
}

function debtPayoffEstimate(debt: FinanceData["debts"][number]) {
  const balance = Math.max(debt.currentBalance, 0);
  if (balance <= 0 || debt.status === "paid") {
    return { label: "Paid off", interest: 0, warning: false };
  }

  const monthlyRate = Math.max(debt.apr, 0) / 100 / 12;
  const payment = getMonthlyDebtPaymentAmount(debt);
  if (payment <= 0 || payment <= balance * monthlyRate) {
    return { label: "Payment too low", interest: nextInterestEstimate(balance, debt.apr), warning: true };
  }

  let remaining = balance;
  let interest = 0;
  let months = 0;
  while (remaining > 0 && months < 600) {
    const monthlyInterest = remaining * monthlyRate;
    interest += monthlyInterest;
    remaining = remaining + monthlyInterest - payment;
    months += 1;
  }

  return {
    label: months >= 600 ? "50+ years" : `${months} mo`,
    interest,
    warning: months >= 600,
  };
}

function debtStatusLabel(status: FinanceData["debts"][number]["status"]) {
  switch (status) {
    case "current":
      return "Current";
    case "paid":
      return "Paid";
  }
}

function debtStatusTone(
  status: FinanceData["debts"][number]["status"],
): "neutral" | "green" | "red" | "amber" | "blue" {
  switch (status) {
    case "current":
      return "green";
    case "paid":
      return "neutral";
  }
}

function DateFilterBar({
  value,
  onChange,
}: {
  value: DateWindow;
  onChange: (value: DateWindow) => void;
}) {
  const options: DateWindow[] = ["all", "overdue", "next7", "next30"];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          aria-pressed={value === option}
          key={option}
          className={cn(
            "h-8 rounded-lg border px-3 text-xs font-medium transition",
            focusVisibleRing,
            value === option
              ? "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--foreground)] shadow-sm"
              : "border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--muted)] hover:bg-[var(--paper-muted)]",
          )}
          onClick={() => onChange(option)}
          type="button"
        >
          {dateWindowLabel(option)}
        </button>
      ))}
    </div>
  );
}
