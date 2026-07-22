export const API_ERROR_CODES = [
  "URL_REQUIRED",
  "URL_INVALID",
  "URL_PROTOCOL_INVALID",
  "ARTICLE_FETCH_FAILED",
  "ARTICLE_EMPTY",
  "AI_FAILED",
  "AI_CONFIG",
  "OPENROUTER_CONFIG",
  "HUGGINGFACE_CONFIG",
  "SERVER_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, status = 500) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === "string" &&
    (API_ERROR_CODES as readonly string[]).includes(value)
  );
}

export function toApiErrorResponse(error: unknown): {
  code: ApiErrorCode;
  status: number;
} {
  if (error instanceof ApiError) {
    return { code: error.code, status: error.status };
  }

  return { code: "SERVER_ERROR", status: 500 };
}
