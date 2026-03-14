import { NextRequest, NextResponse } from "next/server";
import { sendChatMessage, ChatMessageInput } from "@/lib/llm";
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

function successResponse(content: string, status = 200): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: true, data: { role: "assistant" as const, content } },
    { status }
  );
}

function errorResponse(code: string, message: string, status: number): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// ────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────

function validateRequestBody(body: unknown): ChatMessageInput[] {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a JSON object.");
  }

  const { messages } = body as Record<string, unknown>;

  if (!messages) {
    throw new ValidationError("The 'messages' field is required.");
  }

  if (!Array.isArray(messages)) {
    throw new ValidationError("The 'messages' field must be an array.");
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

  return messages as ChatMessageInput[];
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
    const messages = validateRequestBody(body);

    // 3. Detect slash commands in the last user message
    const lastMessage = messages[messages.length - 1];
    const parsed = parseCommand(lastMessage.content);

    let finalMessages = messages;
    let systemPromptOverride: string | undefined;

    if (parsed) {
      // Replace the last user message content with the parsed version
      finalMessages = [
        ...messages.slice(0, -1),
        { ...lastMessage, content: parsed.userContent },
      ];
      systemPromptOverride = parsed.systemPrompt;
    }

    // 4. Call LLM (with optional command-specific system prompt)
    const assistantContent = await sendChatMessage(finalMessages, systemPromptOverride);

    // 5. Return success
    return successResponse(assistantContent);
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
