"use client";

import {
  Bot,
  Check,
  CircleAlert,
  LoaderCircle,
  MessageSquarePlus,
  Send,
  X,
} from "lucide-react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useChat } from "@ai-sdk/react";
import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FinanceAgentProposal,
  FinanceAgentSettings,
  financeAgentPanelStorageKey,
  financeAgentToolName,
} from "@/lib/finance-agent";
import { FinanceData, formatCurrency } from "@/lib/finance-data";
import { Badge, Button, cn } from "./ui-kit";
import { controlFocusVisibleRing, focusVisibleRing } from "@/lib/theme";

type FinanceAgentPanelProps = {
  activeSectionLabel: string;
  data: FinanceData;
  onPromptAssistantText?: (request: FinanceAgentPromptRequest, text: string) => void;
  onPromptStatusChange?: (request: FinanceAgentPromptRequest, status: string) => void;
  onApplyProposal: (
    proposal: FinanceAgentProposal,
    prompt: string,
  ) => { message: string; ok: boolean };
  onCancelProposal: (proposal: FinanceAgentProposal, prompt: string) => void;
  onClose: () => void;
  onOpenSettings: () => void;
  open: boolean;
  promptRequest?: FinanceAgentPromptRequest | null;
  settings: FinanceAgentSettings;
};

export type FinanceAgentPromptRequest = {
  assistantText?: string;
  id: string;
  prompt: string;
  source: "weeklyReport";
};

type AgentPanelFrame = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type FinanceProposalToolPart = Extract<
  UIMessage["parts"][number],
  { type: `tool-${string}` }
> & {
  errorText?: string;
  input?: FinanceAgentProposal;
  output?: { message?: string; status?: string };
  type: `tool-${typeof financeAgentToolName}`;
};

const defaultPrompts = [
  {
    emoji: "🧾",
    label: "Review tax estimate",
    prompt: "Review my tax planner and tell me what is driving my estimate.",
  },
  {
    emoji: "📅",
    label: "Next 30 days",
    prompt: "Look across my bills and income for the next 30 days.",
  },
  {
    emoji: "📈",
    label: "Check investments",
    prompt: "Check my investments and stocks for anything that needs attention.",
  },
  {
    emoji: "🧹",
    label: "Clean up data",
    prompt:
      "Audit my finance workspace for duplicate, missing, or inconsistent data. Propose fixes only as review cards.",
  },
];

export function FinanceAgentPanel({
  activeSectionLabel,
  data,
  onPromptAssistantText,
  onPromptStatusChange,
  onApplyProposal,
  onCancelProposal,
  onClose,
  onOpenSettings,
  open,
  promptRequest,
  settings,
}: FinanceAgentPanelProps) {
  const [input, setInput] = useState("");
  const [frame, setFrame] = useState<AgentPanelFrame>({
    height: 620,
    left: 880,
    top: 28,
    width: 390,
  });
  const [activePromptRequest, setActivePromptRequest] =
    useState<FinanceAgentPromptRequest | null>(null);
  const dragState = useRef<{
    left: number;
    pointerId: number;
    startX: number;
    startY: number;
    top: number;
  } | null>(null);
  const activePromptRequestRef = useRef<FinanceAgentPromptRequest | null>(null);
  const consumedPromptRequestIdRef = useRef("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = window.localStorage.getItem(financeAgentPanelStorageKey);
      const nextFrame = stored ? parsePanelFrame(stored) : null;
      setFrame(clampPanelFrame(nextFrame ?? getDefaultPanelFrame()));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(financeAgentPanelStorageKey, JSON.stringify(frame));
  }, [frame]);

  useEffect(() => {
    const handleResize = () => setFrame((current) => clampPanelFrame(current));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/finance-agent",
        prepareSendMessagesRequest({ id, messages }) {
          return {
            body: {
              activeSection: activeSectionLabel,
              financeData: data,
              id,
              messages,
              settings,
            },
          };
        },
      }),
    [activeSectionLabel, data, settings],
  );

  const {
    addToolOutput,
    clearError,
    error,
    messages,
    regenerate,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport,
  });

  const busy = status === "submitted" || status === "streaming";
  const hasApiKey = settings.apiKey.trim().length > 0;
  const lastPrompt = getLastUserPrompt(messages);
  const lastAssistantText = useMemo(() => getLastAssistantText(messages), [messages]);
  const clearChatError = () => {
    activePromptRequestRef.current = null;
    setActivePromptRequest(null);
    clearError();
    setMessages([]);
  };
  const startNewChat = () => {
    activePromptRequestRef.current = null;
    setActivePromptRequest(null);
    stop();
    clearError();
    setInput("");
    setMessages([]);
  };

  const sendPrompt = useCallback(
    async (prompt: string, request: FinanceAgentPromptRequest | null = null) => {
      const trimmed = prompt.trim();
      if (!trimmed || busy || !hasApiKey) {
        return;
      }

      activePromptRequestRef.current = request;
      setActivePromptRequest(request);
      await sendMessage({ text: trimmed });
    },
    [busy, hasApiKey, sendMessage],
  );

  useEffect(() => {
    clearError();
  }, [
    clearError,
    settings.apiKey,
    settings.baseURL,
    settings.model,
    settings.providerName,
  ]);

  useEffect(() => {
    if (!onPromptAssistantText || !lastAssistantText.trim()) {
      return;
    }

    const activeRequest = activePromptRequestRef.current;
    if (activeRequest?.source === "weeklyReport") {
      onPromptAssistantText(activeRequest, lastAssistantText);
    }
  }, [lastAssistantText, onPromptAssistantText]);

  useEffect(() => {
    const activeRequest = activePromptRequestRef.current;
    if (activeRequest?.source === "weeklyReport") {
      onPromptStatusChange?.(activeRequest, status);
    }
  }, [onPromptStatusChange, status]);

  useEffect(() => {
    if (!promptRequest || consumedPromptRequestIdRef.current === promptRequest.id) {
      return;
    }

    if (busy || (!promptRequest.assistantText && !hasApiKey)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      consumedPromptRequestIdRef.current = promptRequest.id;
      activePromptRequestRef.current = promptRequest;
      setActivePromptRequest(promptRequest);
      stop();
      clearError();
      setInput("");

      if (promptRequest.assistantText?.trim()) {
        setMessages(createPromptRequestMessages(promptRequest));
        return;
      }

      setMessages([]);
      void sendPrompt(promptRequest.prompt, promptRequest);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [busy, clearError, hasApiKey, promptRequest, sendPrompt, setMessages, stop]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt) {
      return;
    }

    setInput("");
    await sendPrompt(prompt);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (isPanelControl(event.target)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      left: frame.left,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      top: frame.top,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    setFrame((current) =>
      clampPanelFrame({
        ...current,
        left: drag.left + event.clientX - drag.startX,
        top: drag.top + event.clientY - drag.startY,
      }),
    );
  };

  const stopDragging = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
    }
  };

  return (
    <aside
      aria-label="AI agent"
      className="fixed z-[60] flex max-h-[calc(100vh-16px)] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--background-raised)] shadow-2xl"
      style={{
        height: frame.height,
        left: frame.left,
        top: frame.top,
        width: frame.width,
      }}
    >
      <header
        className="flex cursor-grab touch-none items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 active:cursor-grabbing"
        onPointerCancel={stopDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--line)] bg-[var(--paper-subtle)] shadow-sm">
            <Bot size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              AI agent
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            aria-label="Start new chat"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper-subtle)] text-[var(--foreground-soft)] transition hover:border-[var(--line-strong)] hover:bg-[var(--paper-muted)]",
              focusVisibleRing,
            )}
            data-agent-no-drag="true"
            onClick={startNewChat}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <MessageSquarePlus size={14} />
          </button>
          <span
            className={cn(
              "inline-flex h-7 items-center whitespace-nowrap rounded-full border px-2.5 text-[11px] font-medium",
              hasApiKey
                ? "border-[var(--tone-green-border)] bg-[var(--tone-green-bg)] text-[var(--tone-green-fg)]"
                : "border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)] text-[var(--tone-amber-fg)]",
            )}
          >
            {hasApiKey ? "Key saved" : "No key"}
          </span>
          <button
            aria-label="Close AI agent"
            data-agent-no-drag="true"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--paper-muted)] hover:text-[var(--foreground)]",
              focusVisibleRing,
            )}
            onClick={onClose}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3.5">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--paper-subtle)] shadow-sm">
                  <Bot size={17} />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="rounded-[22px] rounded-tl-md border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm leading-6 text-[var(--foreground-soft)] shadow-sm">
                    Need a second set of eyes on your money today?
                  </div>
                  <div className="rounded-[22px] rounded-tl-md border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm leading-6 text-[var(--muted)] shadow-sm">
                    Pick a starting point below and I’ll keep any changes in review cards.
                  </div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {defaultPrompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    className={cn(
                      "flex min-h-12 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground-soft)] shadow-sm transition",
                      "hover:border-[var(--line-strong)] hover:bg-[var(--paper-subtle)] disabled:opacity-55",
                      focusVisibleRing,
                    )}
                    disabled={!hasApiKey}
                    onClick={() => sendPrompt(prompt.prompt)}
                    type="button"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper-subtle)] text-base">
                      {prompt.emoji}
                    </span>
                    <span className="min-w-0 truncate">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {visibleAgentMessages(messages, activePromptRequest).map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl border px-3 py-2 text-sm leading-6",
                  message.role === "user"
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-[var(--line)] bg-[var(--paper)] text-[var(--foreground-soft)]",
                )}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <FormattedAgentText
                        key={`${message.id}-text-${index}`}
                        text={part.text}
                      />
                    );
                  }

                  if (isFinanceProposalPart(part)) {
                    return (
                      <ProposalReviewCard
                        key={part.toolCallId}
                        data={data}
                        lastPrompt={lastPrompt}
                        part={part}
                        onApply={(proposal, prompt) => {
                          const result = onApplyProposal(proposal, prompt);
                          if (result.ok) {
                            addToolOutput({
                              output: { message: result.message, status: "applied" },
                              tool: financeAgentToolName,
                              toolCallId: part.toolCallId,
                            });
                          } else {
                            addToolOutput({
                              errorText: result.message,
                              state: "output-error",
                              tool: financeAgentToolName,
                              toolCallId: part.toolCallId,
                            });
                          }
                        }}
                        onCancel={(proposal, prompt) => {
                          onCancelProposal(proposal, prompt);
                          addToolOutput({
                            output: { message: "The user canceled this proposal.", status: "canceled" },
                            tool: financeAgentToolName,
                            toolCallId: part.toolCallId,
                          });
                        }}
                      />
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ))}

          {busy ? (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <LoaderCircle className="animate-spin" size={14} />
              Agent is working
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-[var(--danger-line)] bg-[var(--danger-surface)] px-3 py-2 text-xs leading-5 text-[var(--danger)]">
              {getAgentErrorMessage(error)}
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => regenerate()}>
                  Retry
                </Button>
                <Button size="sm" variant="ghost" onClick={clearChatError}>
                  Clear
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {!hasApiKey ? (
          <div className="border-t border-[var(--line)] bg-[var(--paper-subtle)] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-xs leading-5 text-[var(--muted)]">
                Add an API key in Settings before chatting.
              </div>
              <Button size="sm" onClick={onOpenSettings}>
                Settings
              </Button>
            </div>
          </div>
        ) : null}

        <form className="border-t border-[var(--line)] bg-[var(--paper)] p-3" onSubmit={handleSubmit}>
          <div className="flex items-end gap-2">
            <textarea
              className={cn(
                "min-h-12 flex-1 resize-none rounded-2xl border px-3 py-2.5 text-sm leading-5 transition",
                "border-[var(--line-strong)] bg-[var(--background-raised)] text-[var(--foreground)] placeholder:text-[var(--muted-soft)]",
                controlFocusVisibleRing,
              )}
              disabled={!hasApiKey || busy}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={hasApiKey ? "Ask about your finances..." : "API key required"}
              rows={2}
              value={input}
            />
            {busy ? (
              <Button aria-label="Stop response" className="rounded-full" size="icon" onClick={stop}>
                <X size={15} />
              </Button>
            ) : (
              <Button
                aria-label="Send message"
                className="rounded-full"
                disabled={!hasApiKey || !input.trim()}
                size="icon"
                type="submit"
                variant="primary"
              >
                <Send size={15} />
              </Button>
            )}
          </div>
        </form>
      </div>
    </aside>
  );
}

function ProposalReviewCard({
  data,
  lastPrompt,
  part,
  onApply,
  onCancel,
}: {
  data: FinanceData;
  lastPrompt: string;
  onApply: (proposal: FinanceAgentProposal, prompt: string) => void;
  onCancel: (proposal: FinanceAgentProposal, prompt: string) => void;
  part: FinanceProposalToolPart;
}) {
  const proposal = part.input;

  if (part.state === "input-streaming" || !proposal) {
    return (
      <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3 text-xs text-[var(--muted)]">
        Preparing review card...
      </div>
    );
  }

  if (part.state === "output-available") {
    return (
      <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--paper-subtle)] p-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Check size={14} />
          {part.output?.status === "applied" ? "Applied" : "Canceled"}
        </div>
        {part.output?.message ? (
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{part.output.message}</p>
        ) : null}
      </div>
    );
  }

  if (part.state === "output-error") {
    return (
      <div className="mt-2 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-surface)] p-3 text-xs leading-5 text-[var(--danger)]">
        {part.errorText ?? "This proposal could not be applied."}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-[var(--line-strong)] bg-[var(--background-raised)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)]">{proposal.title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{proposal.rationale}</p>
        </div>
        <Badge tone={proposal.risk === "high" ? "red" : proposal.risk === "medium" ? "amber" : "green"}>
          {proposal.risk}
        </Badge>
      </div>

      <div className="mt-3 space-y-2">
        {proposal.actions.map((action, index) => (
          <div
            key={`${action.type}-${index}`}
            className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-2.5 py-2"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-soft)]">
              <CircleAlert size={13} />
              <span>{getActionTitle(action)}</span>
            </div>
            {action.summary ? (
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{action.summary}</p>
            ) : null}
            <p className="mt-1 text-[11px] leading-5 text-[var(--muted-soft)]">
              {getActionPreview(action, data)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onCancel(proposal, lastPrompt)}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={() => onApply(proposal, lastPrompt)}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function isFinanceProposalPart(part: UIMessage["parts"][number]): part is FinanceProposalToolPart {
  return part.type === `tool-${financeAgentToolName}`;
}

export function FormattedAgentText({ text }: { text: string }) {
  const blocks = parseAgentMarkdown(text);

  return (
    <div className="space-y-2 break-words">
      {blocks.map((block) => {
        if (block.type === "heading") {
          return (
            <p
              className="pt-1 text-sm font-semibold leading-6 text-[var(--foreground)]"
              key={block.id}
            >
              {renderInlineMarkdown(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul className="space-y-1 pl-1" key={block.id}>
              {block.items.map((item) => (
                <li
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)] gap-2 leading-6",
                    item.depth > 0 && "ml-4 text-[var(--muted)]",
                  )}
                  key={item.id}
                >
                  <span className="pt-[0.55em] text-[7px] leading-none text-[var(--muted-soft)]">
                    •
                  </span>
                  <span>{renderInlineMarkdown(item.text)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p className="leading-6" key={block.id}>
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}

type AgentMarkdownBlock =
  | { id: string; text: string; type: "heading" | "paragraph" }
  | { id: string; items: AgentMarkdownListItem[]; type: "list" };

type AgentMarkdownListItem = {
  depth: number;
  id: string;
  text: string;
};

function parseAgentMarkdown(text: string): AgentMarkdownBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: AgentMarkdownBlock[] = [];
  let listItems: AgentMarkdownListItem[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      id: `list-${blocks.length}`,
      items: listItems,
      type: "list",
    });
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushList();
      blocks.push({
        id: `heading-${index}`,
        text: heading[2],
        type: "heading",
      });
      return;
    }

    const bullet = /^(\s*)[-*•]\s+(.+)$/.exec(line);
    const numbered = /^(\s*)\d+[.)]\s+(.+)$/.exec(line);
    const listMatch = bullet ?? numbered;
    if (listMatch) {
      listItems.push({
        depth: Math.min(Math.floor(listMatch[1].length / 2), 2),
        id: `item-${index}`,
        text: listMatch[2],
      });
      return;
    }

    flushList();
    blocks.push({
      id: `paragraph-${index}`,
      text: trimmed,
      type: "paragraph",
    });
  });

  flushList();
  return blocks.length > 0 ? blocks : [{ id: "empty", text: "", type: "paragraph" }];
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong className="font-semibold text-[var(--foreground)]" key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          className="rounded border border-[var(--line)] bg-[var(--paper-subtle)] px-1 py-0.5 font-mono text-[0.92em]"
          key={`${part}-${index}`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

function isPanelControl(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("[data-agent-no-drag]"));
}

function getAgentErrorMessage(error: Error) {
  const message = error.message || "The agent request failed.";

  try {
    const parsed = JSON.parse(message) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    return message;
  }

  return message;
}

function getLastUserPrompt(messages: UIMessage[]) {
  const message = [...messages].reverse().find((item) => item.role === "user");
  if (!message) {
    return "";
  }

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getLastAssistantText(messages: UIMessage[]) {
  const message = [...messages].reverse().find((item) => item.role === "assistant");
  if (!message) {
    return "";
  }

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function createPromptRequestMessages(request: FinanceAgentPromptRequest): UIMessage[] {
  return [
    {
      id: `${request.id}-report`,
      parts: [{ text: request.assistantText ?? "", type: "text" }],
      role: "assistant",
    },
  ];
}

function visibleAgentMessages(
  messages: UIMessage[],
  activeRequest: FinanceAgentPromptRequest | null,
) {
  if (activeRequest?.source !== "weeklyReport") {
    return messages;
  }

  return messages.filter((message) => message.role !== "user");
}

function getActionTitle(action: FinanceAgentProposal["actions"][number]) {
  if (action.type === "upsertItem") {
    return `Save ${action.collection}`;
  }
  if (action.type === "deleteItem") {
    return `Delete ${action.collection}`;
  }
  if (action.type === "updateTaxProfile") {
    return "Update tax profile";
  }
  if (action.type === "recordCreditCardPayment") {
    return "Record card payment";
  }
  return "Save credit score";
}

function getActionPreview(action: FinanceAgentProposal["actions"][number], data: FinanceData) {
  if (action.type === "upsertItem") {
    const id = typeof action.item.id === "string" ? action.item.id : "";
    const existing = id ? data[action.collection].find((item) => item.id === id) : null;
    return existing ? `Updates existing record ${id}.` : "Creates a new record.";
  }
  if (action.type === "deleteItem") {
    const existing = data[action.collection].find((item) => item.id === action.id);
    return existing ? `Deletes ${getRecordLabel(existing)}.` : `Deletes record ${action.id}.`;
  }
  if (action.type === "updateTaxProfile") {
    return `${Object.keys(action.updates).length} tax fields proposed.`;
  }
  if (action.type === "recordCreditCardPayment") {
    return `Payment total ${formatCurrency(
      action.payment.statementPayment + action.payment.interestPayment,
    )}.`;
  }
  return "Creates or updates one dated credit score entry.";
}

function getRecordLabel(item: { id: string }) {
  const record = item as Record<string, unknown>;
  const value =
    record.name ??
    record.cardName ??
    record.ticker ??
    record.symbol ??
    record.coin ??
    record.company ??
    item.id;
  return String(value);
}

function parsePanelFrame(value: string): AgentPanelFrame | null {
  try {
    const parsed = JSON.parse(value) as Partial<AgentPanelFrame>;
    if (
      typeof parsed.height === "number" &&
      typeof parsed.left === "number" &&
      typeof parsed.top === "number" &&
      typeof parsed.width === "number"
    ) {
      return parsed as AgentPanelFrame;
    }
  } catch {
    return null;
  }

  return null;
}

function getDefaultPanelFrame(): AgentPanelFrame {
  const width = Math.min(410, Math.max(320, window.innerWidth - 24));
  const height = Math.min(680, Math.max(500, window.innerHeight - 56));
  return {
    height,
    left: Math.max(8, window.innerWidth - width - 24),
    top: 24,
    width,
  };
}

function clampPanelFrame(frame: AgentPanelFrame): AgentPanelFrame {
  const width = Math.min(Math.max(frame.width, 320), Math.max(320, window.innerWidth - 16));
  const height = Math.min(Math.max(frame.height, 460), Math.max(460, window.innerHeight - 16));
  return {
    height,
    left: Math.min(Math.max(frame.left, 8), Math.max(8, window.innerWidth - width - 8)),
    top: Math.min(Math.max(frame.top, 8), Math.max(8, window.innerHeight - height - 8)),
    width,
  };
}
