import { type ApiErrorCode, isApiErrorCode } from "@/lib/api-errors";

export type Action =
  | "summary"
  | "theses"
  | "telegram"
  | "translate"
  | "illustration";

export type ClientErrorCode = ApiErrorCode | "NETWORK_ERROR";

const ACTION_ERRORS: Record<Action, string> = {
  translate: "Не удалось перевести статью. Попробуйте ещё раз.",
  summary: "Не удалось проанализировать статью. Попробуйте ещё раз.",
  theses: "Не удалось сформировать тезисы. Попробуйте ещё раз.",
  telegram: "Не удалось создать пост. Попробуйте ещё раз.",
  illustration: "Не удалось создать иллюстрацию. Попробуйте ещё раз.",
};

const CLIENT_ERROR_MESSAGES: Record<Exclude<ClientErrorCode, "AI_FAILED">, string> = {
  URL_REQUIRED: "Введите URL статьи",
  URL_INVALID: "Укажите корректный URL (http:// или https://)",
  URL_PROTOCOL_INVALID: "Укажите корректный URL (http:// или https://)",
  ARTICLE_FETCH_FAILED: "Не удалось загрузить статью по этой ссылке.",
  ARTICLE_EMPTY:
    "Не удалось извлечь текст статьи. Попробуйте другую ссылку.",
  AI_CONFIG: "Сервис временно недоступен. Попробуйте позже.",
  OPENROUTER_CONFIG:
    "Не настроен OpenRouter. Добавьте OPENROUTER_API_KEY в .env.local и перезапустите сервер.",
  HUGGINGFACE_CONFIG:
    "Не настроен Hugging Face. Добавьте HUGGINGFACE_API_KEY (или HF_TOKEN) в .env.local и перезапустите сервер.",
  SERVER_ERROR: "Не удалось выполнить действие. Попробуйте ещё раз.",
  NETWORK_ERROR:
    "Не удалось связаться с сервером. Проверьте подключение к интернету.",
};

export function getClientErrorMessage(
  code: ClientErrorCode,
  action?: Action | null
): string {
  if (code === "AI_FAILED") {
    return action ? ACTION_ERRORS[action] : ACTION_ERRORS.summary;
  }

  return CLIENT_ERROR_MESSAGES[code];
}

export function resolveApiErrorCode(value: unknown): ApiErrorCode {
  return isApiErrorCode(value) ? value : "SERVER_ERROR";
}
