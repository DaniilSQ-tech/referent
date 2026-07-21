import { ApiError } from "@/lib/api-errors";

export function validateArticleUrl(url: string | undefined): string {
  const trimmed = url?.trim();

  if (!trimmed) {
    throw new ApiError("URL_REQUIRED", 400);
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new ApiError("URL_INVALID", 400);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ApiError("URL_PROTOCOL_INVALID", 400);
  }

  return trimmed;
}
