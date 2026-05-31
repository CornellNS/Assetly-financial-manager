import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  safeValidateUIMessages,
  streamText,
  tool,
  type ToolSet,
  type UIMessage,
} from "ai";
import { z } from "zod";
import {
  buildFinanceAgentSystemPrompt,
  createAgentWorkspaceSnapshot,
  financeAgentProposalSchema,
  normalizeFinanceAgentSettings,
} from "@/lib/finance-agent";
import { normalizeFinanceData } from "@/lib/finance-validation";

export const runtime = "nodejs";

const requestSchema = z.object({
  activeSection: z.string().optional(),
  financeData: z.unknown(),
  messages: z.unknown(),
  settings: z.unknown(),
});

const financeAgentTools = {
  proposeFinanceChange: tool({
    description:
      "Propose finance data edits for the user to review. This tool does not apply changes; the app renders a confirmation card.",
    inputSchema: financeAgentProposalSchema,
  }),
};

export async function POST(request: Request) {
  try {
    const parsedRequest = requestSchema.safeParse(await request.json());
    if (!parsedRequest.success) {
      return Response.json({ error: "Invalid agent request." }, { status: 400 });
    }

    const settings = normalizeFinanceAgentSettings(parsedRequest.data.settings);
    if (!settings.apiKey) {
      return Response.json({ error: "Add an AI provider API key in Settings." }, { status: 400 });
    }

    if (!settings.model) {
      return Response.json({ error: "Add a model name in Settings." }, { status: 400 });
    }

    const normalizedData = normalizeFinanceData(parsedRequest.data.financeData);
    if (!normalizedData.ok) {
      return Response.json({ error: "The finance workspace data could not be read." }, { status: 400 });
    }

    const validatedMessages = await safeValidateUIMessages<UIMessage>({
      messages: parsedRequest.data.messages,
    });
    if (!validatedMessages.success) {
      return Response.json({ error: "The chat messages could not be read." }, { status: 400 });
    }

    const provider = createOpenAICompatible({
      apiKey: settings.apiKey,
      baseURL: settings.baseURL,
      includeUsage: true,
      name: settings.providerName,
    });
    const snapshot = createAgentWorkspaceSnapshot(normalizedData.data);

    const result = streamText({
      model: provider.chatModel(settings.model),
      messages: await convertToModelMessages(validatedMessages.data, {
        ignoreIncompleteToolCalls: true,
        tools: financeAgentTools as ToolSet,
      }),
      system: buildFinanceAgentSystemPrompt(snapshot, parsedRequest.data.activeSection),
      temperature: 0.2,
      tools: financeAgentTools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The agent request failed." },
      { status: 500 },
    );
  }
}
