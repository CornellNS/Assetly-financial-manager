import { z } from "zod";
import {
  calculateSummary,
  calculateTaxSummary,
  collectionLabels,
  CollectionKey,
  FinanceData,
} from "@/lib/finance-data";

export const financeAgentSettingsStorageKey = "ledger-room-ai-agent-settings";
export const financeAgentAuditStorageKey = "ledger-room-ai-agent-audit";
export const financeAgentPanelStorageKey = "ledger-room-ai-agent-panel";
export const financeAgentToolName = "proposeFinanceChange";
export const financeAgentAuditMaxEntries = 50;
export const financeAgentAuditRetentionDays = 90;

export const agentCollectionKeys = [
  "investments",
  "stocks",
  "crypto",
  "incomeSources",
  "savingsGoals",
  "creditCards",
  "debts",
  "recurringPayments",
  "taxAssetSales",
] as const satisfies readonly CollectionKey[];

export type FinanceAgentProviderPreset =
  | "openai"
  | "openrouter"
  | "groq"
  | "together"
  | "lm-studio"
  | "custom";

export type FinanceAgentProviderPresetConfig = {
  baseURL: string;
  defaultModel: string;
  id: FinanceAgentProviderPreset;
  keyPlaceholder: string;
  label: string;
  providerName: string;
};

export const financeAgentProviderPresets: FinanceAgentProviderPresetConfig[] = [
  {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-5.4",
    id: "openai",
    keyPlaceholder: "sk-...",
    label: "OpenAI",
    providerName: "openai",
  },
  {
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-5.4",
    id: "openrouter",
    keyPlaceholder: "sk-or-...",
    label: "OpenRouter",
    providerName: "openrouter",
  },
  {
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    id: "groq",
    keyPlaceholder: "gsk_...",
    label: "Groq",
    providerName: "groq",
  },
  {
    baseURL: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    id: "together",
    keyPlaceholder: "...",
    label: "Together AI",
    providerName: "together",
  },
  {
    baseURL: "http://localhost:1234/v1",
    defaultModel: "local-model",
    id: "lm-studio",
    keyPlaceholder: "local",
    label: "LM Studio",
    providerName: "lmstudio",
  },
  {
    baseURL: "",
    defaultModel: "",
    id: "custom",
    keyPlaceholder: "provider key",
    label: "Custom endpoint",
    providerName: "custom",
  },
];

export type FinanceAgentSettings = {
  apiKey: string;
  baseURL: string;
  model: string;
  preset: FinanceAgentProviderPreset;
  provider: "openai-compatible";
  providerName: string;
};

export const defaultFinanceAgentPreset = financeAgentProviderPresets[0];

export const defaultFinanceAgentSettings: FinanceAgentSettings = {
  apiKey: "",
  baseURL: defaultFinanceAgentPreset.baseURL,
  model: defaultFinanceAgentPreset.defaultModel,
  preset: defaultFinanceAgentPreset.id,
  provider: "openai-compatible",
  providerName: defaultFinanceAgentPreset.providerName,
};

const unknownRecordSchema = z.record(z.string(), z.unknown());

export const financeAgentActionSchema = z.discriminatedUnion("type", [
  z.object({
    collection: z.enum(agentCollectionKeys),
    item: unknownRecordSchema,
    summary: z.string().optional(),
    type: z.literal("upsertItem"),
  }),
  z.object({
    collection: z.enum(agentCollectionKeys),
    id: z.string().min(1),
    summary: z.string().optional(),
    type: z.literal("deleteItem"),
  }),
  z.object({
    summary: z.string().optional(),
    type: z.literal("updateTaxProfile"),
    updates: unknownRecordSchema,
  }),
  z.object({
    cardId: z.string().min(1),
    payment: z.object({
      interestPayment: z.number().nonnegative().default(0),
      statementPayment: z.number().nonnegative().default(0),
    }),
    summary: z.string().optional(),
    type: z.literal("recordCreditCardPayment"),
  }),
  z.object({
    entry: unknownRecordSchema,
    summary: z.string().optional(),
    type: z.literal("upsertCreditScore"),
  }),
]);

export const financeAgentProposalSchema = z.object({
  actions: z.array(financeAgentActionSchema).min(1).max(6),
  rationale: z.string().min(1),
  risk: z.enum(["low", "medium", "high"]).default("medium"),
  title: z.string().min(1),
});

export type FinanceAgentAction = z.infer<typeof financeAgentActionSchema>;
export type FinanceAgentProposal = z.infer<typeof financeAgentProposalSchema>;

export type FinanceAgentAuditEntry = {
  actions: FinanceAgentAction[];
  createdAt: string;
  error?: string;
  id: string;
  prompt: string;
  proposalTitle: string;
  status: "applied" | "canceled" | "failed";
};

export type FinanceAgentStorageLike = Pick<Storage, "getItem" | "setItem">;

export function normalizeFinanceAgentSettings(value: unknown): FinanceAgentSettings {
  if (!isRecord(value)) {
    return { ...defaultFinanceAgentSettings };
  }

  const baseURL = readString(value.baseURL, defaultFinanceAgentSettings.baseURL);
  const providerName = normalizeProviderName(
    readString(value.providerName, defaultFinanceAgentSettings.providerName),
  );
  const preset = readProviderPreset(value.preset, baseURL, providerName);
  const presetConfig = getFinanceAgentProviderPreset(preset);

  return {
    apiKey: readString(value.apiKey, defaultFinanceAgentSettings.apiKey),
    baseURL: preset === "custom" ? baseURL : presetConfig.baseURL,
    model: readString(value.model, presetConfig.defaultModel || defaultFinanceAgentSettings.model),
    preset,
    provider: "openai-compatible",
    providerName: preset === "custom" ? providerName : presetConfig.providerName,
  };
}

export function normalizeFinanceAgentSettingsJson(value: string | null) {
  if (!value) {
    return { ...defaultFinanceAgentSettings };
  }

  try {
    return normalizeFinanceAgentSettings(JSON.parse(value));
  } catch {
    return { ...defaultFinanceAgentSettings };
  }
}

export function getFinanceAgentProviderPreset(id: FinanceAgentProviderPreset) {
  return (
    financeAgentProviderPresets.find((preset) => preset.id === id) ??
    defaultFinanceAgentPreset
  );
}

export function createAgentWorkspaceSnapshot(data: FinanceData) {
  const summary = calculateSummary(data);
  const taxSummary = calculateTaxSummary(data);

  return {
    counts: {
      creditCards: data.creditCards.length,
      crypto: data.crypto.length,
      incomeSources: data.incomeSources.length,
      investments: data.investments.length,
      paychecks: data.paychecks.length,
      recurringPayments: data.recurringPayments.length,
      savingsGoals: data.savingsGoals.length,
      stockLots: data.stockLots.length,
      stocks: data.stocks.length,
      taxAssetSales: data.taxAssetSales.length,
      taxReports: data.taxReports.length,
    },
    currency: data.workspace.currency,
    schemaVersion: data.schemaVersion,
    summary,
    tables: {
      creditCards: data.creditCards,
      creditScoreHistory: data.creditScoreHistory,
      crypto: data.crypto,
      incomeExpenseHistory: data.incomeExpenseHistory,
      incomeSources: data.incomeSources,
      investments: data.investments,
      netWorthHistory: data.netWorthHistory,
      paychecks: data.paychecks,
      recurringPayments: data.recurringPayments,
      savingsGoals: data.savingsGoals,
      stockLots: data.stockLots,
      stocks: data.stocks,
      taxAssetSales: data.taxAssetSales,
      taxReports: data.taxReports,
    },
    taxProfile: data.taxProfile,
    taxSummary,
    workspace: {
      currency: data.workspace.currency,
      graphPrimaryColor: data.workspace.graphPrimaryColor,
      graphSecondaryColor: data.workspace.graphSecondaryColor,
      name: data.workspace.name,
    },
  };
}

export function buildFinanceAgentSystemPrompt(
  snapshot: ReturnType<typeof createAgentWorkspaceSnapshot>,
  activeSection?: string,
) {
  const collectionHelp = agentCollectionKeys
    .map((key) => `${key}: ${collectionLabels[key]}`)
    .join(", ");

  return [
    "You are the local Assetly Financial Manager finance agent.",
    "You can analyze the user's local finance workspace, including tax planning, income, bills, credit cards, investments, stocks, crypto, and data quality.",
    "You cannot alter source code, browse local files, run shell commands, or claim that you changed data directly.",
    "You may propose finance data edits only by calling the proposeFinanceChange tool. The app will show the user a review card and the user must explicitly apply it.",
    "Never ask the user to paste their API key. The key is configured outside the conversation.",
    "This is planning support, not legal, tax, or investment advice. Be clear about assumptions and uncertainty.",
    "Format normal answers in readable Markdown: short headings, bullets, bold labels for key numbers, and compact paragraphs. Emojis are allowed when they help scanning, but keep them sparing and professional.",
    `Editable collections are: ${collectionHelp}.`,
    "For income use incomeSources. For expenses/bills use recurringPayments. For realized taxable sales use taxAssetSales.",
    "Use updateTaxProfile for tax profile fields. Use recordCreditCardPayment only for credit card payments. Use upsertCreditScore for credit score entries.",
    "When proposing an edit, include a short rationale, risk level, and the smallest set of actions needed. Do not include source-code actions.",
    `Current active section: ${activeSection ?? "unknown"}.`,
    `Workspace snapshot JSON:\n${JSON.stringify(snapshot)}`,
  ].join("\n\n");
}

export function readFinanceAgentAuditLog(
  storage: FinanceAgentStorageLike | null | undefined,
): FinanceAgentAuditEntry[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(financeAgentAuditStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isAuditEntry).slice(0, financeAgentAuditMaxEntries);
  } catch {
    return [];
  }
}

export function writeFinanceAgentAuditEntry(
  entry: FinanceAgentAuditEntry,
  storage: FinanceAgentStorageLike | null | undefined,
) {
  if (!storage) {
    return;
  }

  const current = readFinanceAgentAuditLog(storage);
  storage.setItem(
    financeAgentAuditStorageKey,
    JSON.stringify([entry, ...current].slice(0, financeAgentAuditMaxEntries)),
  );
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeProviderName(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return normalized || defaultFinanceAgentSettings.providerName;
}

function readProviderPreset(
  value: unknown,
  baseURL: string,
  providerName: string,
): FinanceAgentProviderPreset {
  if (typeof value === "string" && isFinanceAgentProviderPreset(value)) {
    return value;
  }

  const matchingPreset = financeAgentProviderPresets.find(
    (preset) =>
      preset.id !== "custom" &&
      (preset.baseURL === baseURL || preset.providerName === providerName),
  );

  return matchingPreset?.id ?? "custom";
}

function isFinanceAgentProviderPreset(value: string): value is FinanceAgentProviderPreset {
  return financeAgentProviderPresets.some((preset) => preset.id === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAuditEntry(value: unknown): value is FinanceAgentAuditEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.prompt === "string" &&
    typeof value.proposalTitle === "string" &&
    (value.status === "applied" || value.status === "canceled" || value.status === "failed") &&
    Array.isArray(value.actions)
  );
}
