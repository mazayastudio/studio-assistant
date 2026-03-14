import OpenAI from "openai";
import {
  LLMConfigError,
  LLMRateLimitError,
  LLMApiError,
} from "./errors";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

// ────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────

const MODEL_NAME = "gpt-4o-mini";

const SYSTEM_PROMPT =
  "You are Studio Assistant, a helpful and creative AI companion for professionals. " +
  "Respond concisely and helpfully. Use markdown formatting when appropriate.";

// ────────────────────────────────────────────
// Service
// ────────────────────────────────────────────

/**
 * Send a chat message history to OpenAI and return the assistant response.
 *
 * - Reads `OPENAI_API_KEY` from `process.env` at **call time** (never cached).
 * - Throws typed errors so the route handler can map them to HTTP statuses.
 */
export async function sendChatMessage(
  messages: ChatMessageInput[],
  systemPromptOverride?: string
): Promise<string> {
  // 1. Guard: API key must be present
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_openai_api_key_here") {
    throw new LLMConfigError(
      "LLM service is not configured. OPENAI_API_KEY is missing."
    );
  }

  // 2. Build the OpenAI client (fresh per-request to always pick up env changes)
  const openai = new OpenAI({ apiKey });

  // 3. Convert messages to OpenAI format
  const activeSystemPrompt = systemPromptOverride ?? SYSTEM_PROMPT;

  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: activeSystemPrompt },
    ...messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
  ];

  try {
    // 4. Call OpenAI Chat Completions API
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content;

    if (!text || text.trim() === "") {
      throw new LLMApiError(
        "The language model returned an empty response. This may be due to content safety filters."
      );
    }

    return text;
  } catch (error: unknown) {
    // Re-throw our own typed errors as-is
    if (
      error instanceof LLMConfigError ||
      error instanceof LLMRateLimitError ||
      error instanceof LLMApiError
    ) {
      throw error;
    }

    // Handle OpenAI SDK errors
    if (error instanceof OpenAI.APIError) {
      const status = error.status;

      if (status === 429) {
        throw new LLMRateLimitError(
          "OpenAI rate limit reached. Please wait a moment and try again."
        );
      }

      if (status === 401 || status === 403) {
        throw new LLMConfigError(
          "OpenAI API key is invalid or does not have the required permissions."
        );
      }

      throw new LLMApiError(
        `OpenAI API error (${status}): ${error.message.slice(0, 200)}`
      );
    }

    if (error instanceof Error) {
      throw new LLMApiError(
        `OpenAI error: ${error.message.slice(0, 200)}`
      );
    }

    throw new LLMApiError("An unexpected error occurred while contacting the language model.");
  }
}
