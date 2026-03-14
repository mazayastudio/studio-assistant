/**
 * Custom error classes for typed error handling across the API layer.
 * Each error carries a `code` string used in JSON responses and an HTTP `statusCode`.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** Thrown when the LLM API key is missing or empty. */
export class LLMConfigError extends AppError {
  constructor(message = "LLM service is not configured. API key is missing.") {
    super(message, "SERVICE_UNAVAILABLE", 503);
    this.name = "LLMConfigError";
  }
}

/** Thrown when the LLM provider returns a rate-limit (429) response. */
export class LLMRateLimitError extends AppError {
  constructor(
    message = "Rate limit exceeded. Please wait a moment and try again."
  ) {
    super(message, "RATE_LIMITED", 429);
    this.name = "LLMRateLimitError";
  }
}

/** Thrown when the LLM provider returns a non-rate-limit error. */
export class LLMApiError extends AppError {
  constructor(message = "The language model returned an error.") {
    super(message, "LLM_ERROR", 502);
    this.name = "LLMApiError";
  }
}

/** Thrown when the client sends an invalid request body. */
export class ValidationError extends AppError {
  constructor(message: string, code = "INVALID_REQUEST") {
    super(message, code, 400);
    this.name = "ValidationError";
  }
}
