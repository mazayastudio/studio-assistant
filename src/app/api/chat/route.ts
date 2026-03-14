import { NextRequest, NextResponse } from "next/server";
import { sendChatMessageStream, ChatMessageInput } from "@/lib/llm";
import { AppError, ValidationError } from "@/lib/errors";
import { parseCommand } from "@/lib/commands";

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 50;

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

interface ApiSuccess {
  success: true;
  data: { role: "assistant"; content: string };
}

interface ApiError {
  success: false;
  error: { code: string; message: string };
}

type ApiResponse = ApiSuccess | ApiError;

function errorResponse(code: string, message: string, status: number): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// ────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────

interface ValidatedChatBody {
  messages: ChatMessageInput[];
  temperature: number;
  maxTokens: number;
}

function validateRequestBody(body: unknown): ValidatedChatBody {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a JSON object.");
  }

  const { messages, temperature, maxTokens } = body as Record<string, unknown>;

  if (!messages) {
    throw new ValidationError("The 'messages' field is required.");
  }

  if (!Array.isArray(messages)) {
    throw new ValidationError("The 'messages' field must be an array.");
  }

  // Validate parameters if present
  let validTemp = 0.7;
  let validTokens = 1024;

  if (temperature !== undefined) {
    if (typeof temperature !== "number" || temperature < 0 || temperature > 2) {
      throw new ValidationError("Temperature must be a number between 0 and 2.");
    }
    validTemp = temperature;
  }

  if (maxTokens !== undefined) {
    if (typeof maxTokens !== "number" || maxTokens < 1 || maxTokens > 4096) {
      throw new ValidationError("maxTokens must be a number between 1 and 4096.");
    }
    validTokens = maxTokens;
  }

  if (messages.length === 0) {
    throw new ValidationError("At least one message is required.");
  }

  if (messages.length > MAX_MESSAGES) {
    throw new ValidationError(
      `Too many messages. Maximum is ${MAX_MESSAGES}.`,
      "INVALID_REQUEST"
    );
  }

  // Validate each message
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (!msg || typeof msg !== "object") {
      throw new ValidationError(
        `Message at index ${i} must be an object.`,
        "INVALID_MESSAGE_FORMAT"
      );
    }

    const { role, content } = msg as Record<string, unknown>;

    if (!role || (role !== "user" && role !== "assistant")) {
      throw new ValidationError(
        `Message at index ${i} has an invalid role. Must be "user" or "assistant".`,
        "INVALID_MESSAGE_FORMAT"
      );
    }

    if (typeof content !== "string" || content.trim() === "") {
      throw new ValidationError(
        `Message at index ${i} must have a non-empty string 'content'.`,
        "INVALID_MESSAGE_FORMAT"
      );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ValidationError(
        `Message at index ${i} exceeds the maximum length of ${MAX_MESSAGE_LENGTH} characters.`,
        "MESSAGE_TOO_LONG"
      );
    }
  }

  // The last message must be from the user
  const lastMessage = messages[messages.length - 1] as { role: string };
  if (lastMessage.role !== "user") {
    throw new ValidationError(
      "The last message in the conversation must be from the user.",
      "INVALID_MESSAGE_FORMAT"
    );
  }

  return { messages: messages as ChatMessageInput[], temperature: validTemp, maxTokens: validTokens };
}

// ────────────────────────────────────────────
// Route Handler
// ────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Request body must be valid JSON.", 400);
    }

    // 2. Validate
    const validated = validateRequestBody(body);
    const messages = validated.messages;
    const { temperature, maxTokens } = validated;

    // 3. Detect slash commands in the last user message
    const lastMessage = messages[messages.length - 1];
    const parsed = parseCommand(lastMessage.content);

    let finalMessages = messages;
    let systemPromptOverride: string | undefined;

    if (parsed) {
      finalMessages = [
        ...messages.slice(0, -1),
        { ...lastMessage, content: parsed.userContent },
      ];
      systemPromptOverride = parsed.systemPrompt;
    }

    // 4. Call LLM to get a ReadableStream
    const stream = await sendChatMessageStream(
      finalMessages,
      temperature,
      maxTokens,
      systemPromptOverride
    );

    // 5. Return the stream directly with standard text/event-stream content type
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    }) as any; // Cast because our generic NextResponse type expects ApiResponse wrapper for errors
  } catch (error: unknown) {
    // Handle our typed errors
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.statusCode);
    }

    // Unexpected errors
    console.error("[/api/chat] Unexpected error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "An unexpected internal error occurred. Please try again later.",
      500
    );
  }
}
