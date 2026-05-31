import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { z } from "zod";
import { normalizeFinanceAgentSettings } from "@/lib/finance-agent";

export const runtime = "nodejs";

const requestSchema = z.object({
  settings: z.unknown(),
});

export async function POST(request: Request) {
  try {
    const parsedRequest = requestSchema.safeParse(await request.json());
    if (!parsedRequest.success) {
      return Response.json({ error: "Invalid test request." }, { status: 400 });
    }

    const settings = normalizeFinanceAgentSettings(parsedRequest.data.settings);
    if (!settings.apiKey) {
      return Response.json({ error: "Add an API key first." }, { status: 400 });
    }

    const provider = createOpenAICompatible({
      apiKey: settings.apiKey,
      baseURL: settings.baseURL,
      includeUsage: true,
      name: settings.providerName,
    });

    await generateText({
      model: provider.chatModel(settings.model),
      prompt: "Reply with exactly: connected",
    });

    return Response.json({ message: `Connected to ${settings.providerName} / ${settings.model}.`, ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The provider test failed." },
      { status: 500 },
    );
  }
}
