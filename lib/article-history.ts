import type { Action } from "@/lib/client-errors";

export type ArticleHistoryItem = {
  id: string;
  title: string;
  url: string;
  action: Action;
  createdAt: number;
};

const STORAGE_KEY = "referent-article-history";
const LEGACY_STORAGE_KEY = "referent-translation-history";
const MAX_ITEMS = 30;

const ACTIONS: Action[] = [
  "translate",
  "summary",
  "theses",
  "telegram",
  "illustration",
];

function isAction(value: unknown): value is Action {
  return typeof value === "string" && ACTIONS.includes(value as Action);
}

function isArticleHistoryItem(value: unknown): value is ArticleHistoryItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.url === "string" &&
    isAction(item.action) &&
    typeof item.createdAt === "number"
  );
}

function loadLegacyTranslationHistory(): ArticleHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object"
      )
      .map((item) => ({
        id:
          typeof item.id === "string"
            ? item.id
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title:
          typeof item.title === "string" && item.title.trim()
            ? item.title
            : "Без названия",
        url: typeof item.url === "string" ? item.url : "",
        action: "translate" as const,
        createdAt:
          typeof item.translatedAt === "number" ? item.translatedAt : Date.now(),
      }))
      .filter((item) => item.url.length > 0);
  } catch {
    return [];
  }
}

export function loadArticleHistory(): ArticleHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = loadLegacyTranslationHistory();
      if (legacy.length > 0) {
        saveArticleHistory(legacy);
      }
      return legacy;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isArticleHistoryItem);
  } catch {
    return [];
  }
}

export function saveArticleHistory(items: ArticleHistoryItem[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addArticleHistoryItem(
  url: string,
  title: string | null,
  action: Action
): ArticleHistoryItem[] {
  const normalizedTitle = title?.trim() || "Без названия";
  const now = Date.now();
  const existing = loadArticleHistory().filter(
    (item) => !(item.url === url && item.action === action)
  );
  const nextItem: ArticleHistoryItem = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: normalizedTitle,
    url,
    action,
    createdAt: now,
  };

  const next = [nextItem, ...existing].slice(0, MAX_ITEMS);
  saveArticleHistory(next);

  return next;
}
