"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Image,
  Languages,
  ListChecks,
  RotateCcw,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getClientErrorMessage,
  resolveApiErrorCode,
  type Action,
  type ClientErrorCode,
} from "@/lib/client-errors";
import { readJsonResponse } from "@/lib/read-json-response";
import {
  addArticleHistoryItem,
  loadArticleHistory,
  type ArticleHistoryItem,
} from "@/lib/article-history";

const ACTION_ICONS: Record<Action, LucideIcon> = {
  translate: Languages,
  summary: FileText,
  theses: ListChecks,
  telegram: Send,
  illustration: Image,
};

const ACTIONS: {
  id: Action;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "translate",
    label: "Перевод",
    description: "Полный перевод статьи на русский",
    icon: ACTION_ICONS.translate,
  },
  {
    id: "summary",
    label: "О чем статья?",
    description: "Краткое описание содержания статьи",
    icon: ACTION_ICONS.summary,
  },
  {
    id: "theses",
    label: "Тезисы",
    description: "Ключевые тезисы и выводы",
    icon: ACTION_ICONS.theses,
  },
  {
    id: "telegram",
    label: "Пост для Telegram",
    description: "Готовый пост для публикации",
    icon: ACTION_ICONS.telegram,
  },
  {
    id: "illustration",
    label: "Иллюстрация",
    description: "Изображение по теме статьи",
    icon: ACTION_ICONS.illustration,
  },
];

const ACTION_TITLES: Record<Action, string> = {
  translate: "Перевод",
  summary: "О чем статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
  illustration: "Иллюстрация",
};

const LOADING_LABELS: Record<Action, string> = {
  translate: "Перевод статьи…",
  summary: "Анализ статьи…",
  theses: "Формирование тезисов…",
  telegram: "Создание поста…",
  illustration: "Создание промпта и иллюстрации…",
};

const ACTION_ENDPOINTS: Record<Action, string> = {
  translate: "/api/translate",
  summary: "/api/summary",
  theses: "/api/theses",
  telegram: "/api/telegram",
  illustration: "/api/illustration",
};

function isImageResult(value: string): boolean {
  return value.startsWith("data:image/");
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ReferentApp() {
  const resultsRef = useRef<HTMLElement>(null);
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [result, setResult] = useState("");
  const [resultPrompt, setResultPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<ClientErrorCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ArticleHistoryItem[]>([]);

  const errorMessage = errorCode
    ? getClientErrorMessage(errorCode, activeAction)
    : null;

  useEffect(() => {
    setHistory(loadArticleHistory());
  }, []);

  function resetState() {
    setUrl("");
    setActiveAction(null);
    setResult("");
    setResultPrompt("");
    setLoading(false);
    setErrorCode(null);
    setCopied(false);
  }

  useEffect(() => {
    if (result && !loading) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result, loading]);

  async function handleCopy() {
    if (!result || isImageResult(result)) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorCode("SERVER_ERROR");
    }
  }

  async function handleAction(action: Action) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setErrorCode("URL_REQUIRED");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setErrorCode("URL_INVALID");
      return;
    }

    setErrorCode(null);
    setActiveAction(action);
    setLoading(true);
    setResult("");
    setResultPrompt("");
    setCopied(false);

    try {
      const response = await fetch(ACTION_ENDPOINTS[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await readJsonResponse<{
        result?: string;
        translation?: string;
        title?: string;
        imagePrompt?: string;
        code?: string;
      }>(response);

      if (!response.ok) {
        setErrorCode(resolveApiErrorCode(data.code));
        return;
      }

      const nextResult =
        action === "translate" ? (data.translation ?? "") : (data.result ?? "");

      setResult(nextResult);
      setResultPrompt(action === "illustration" ? (data.imagePrompt ?? "") : "");
      setHistory(
        addArticleHistoryItem(trimmedUrl, data.title ?? null, action)
      );
    } catch (err) {
      setErrorCode(err instanceof TypeError ? "NETWORK_ERROR" : "SERVER_ERROR");
    } finally {
      setLoading(false);
    }
  }

  function handleHistorySelect(item: ArticleHistoryItem) {
    setUrl(item.url);
    setErrorCode(null);
  }

  const hasState =
    url.trim().length > 0 ||
    result.length > 0 ||
    resultPrompt.length > 0 ||
    errorCode !== null ||
    activeAction !== null;

  return (
    <div className="relative mx-auto flex min-h-screen w-full min-w-0 max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(10,132,255,0.18),transparent_65%)]"
      />

      <header className="relative mb-8 sm:mb-10">
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0A84FF]">
          Referent
        </p>
        <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.5rem] lg:text-[2.75rem]">
          Анализ англоязычных статей
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[rgba(235,235,245,0.6)] sm:text-[17px] sm:leading-7">
          Вставьте ссылку на статью и выберите, что нужно сгенерировать с помощью
          AI.
        </p>
      </header>

      <section className="relative min-w-0">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-[rgba(235,235,245,0.45)]">
            Ссылка на статью
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Сбросить URL, результат, ошибки и состояние"
            disabled={loading || !hasState}
            onClick={resetState}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="size-3.5 shrink-0" />
            Очистить
          </Button>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] bg-[#1C1C1E] shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
          <div className="border-b border-white/8 p-4 sm:p-5">
            <label htmlFor="article-url" className="sr-only">
              URL англоязычной статьи
            </label>
            <input
              id="article-url"
              type="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (errorCode) setErrorCode(null);
              }}
              placeholder="Введите URL статьи, например: https://example.com/article"
              className="w-full min-w-0 rounded-xl bg-[#2C2C2E] px-4 py-3.5 text-base text-white placeholder:text-[15px] placeholder:text-[rgba(235,235,245,0.35)] outline-none transition focus:bg-[#3A3A3C] focus:ring-2 focus:ring-[#0A84FF]/35 sm:text-[15px]"
            />
            <p className="mt-2.5 px-1 text-[13px] text-[rgba(235,235,245,0.45)]">
              Укажите ссылку на англоязычную статью
            </p>
          </div>

          <div className="divide-y divide-white/8">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isActive = activeAction === action.id && !loading;

              return (
                <button
                  key={action.id}
                  type="button"
                  title={action.description}
                  disabled={loading}
                  onClick={() => handleAction(action.id)}
                  className={`group flex w-full min-w-0 items-center gap-3 px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 ${
                    isActive
                      ? "bg-[#0A84FF]/12"
                      : "hover:bg-white/4 active:bg-white/6"
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      isActive
                        ? "bg-[#0A84FF]/20 text-[#0A84FF]"
                        : "bg-white/6 text-[rgba(235,235,245,0.7)]"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-white">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block break-words text-[13px] leading-5 text-[rgba(235,235,245,0.45)]">
                      {action.description}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[rgba(235,235,245,0.25)] transition group-hover:translate-x-0.5 group-hover:text-[rgba(235,235,245,0.45)]" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <Alert variant="destructive" className="relative mt-6 min-w-0">
          <AlertCircle className="size-4 shrink-0" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {loading && activeAction ? (
        <div
          className="relative mt-6 flex min-w-0 items-center gap-3 rounded-2xl bg-[#1C1C1E] px-4 py-3.5 text-[15px] text-[#0A84FF] ring-1 ring-[#0A84FF]/20"
          role="status"
          aria-live="polite"
        >
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#0A84FF]/20 border-t-[#0A84FF]" />
          <span className="min-w-0 break-words">{LOADING_LABELS[activeAction]}</span>
        </div>
      ) : null}

      <section
        ref={resultsRef}
        className="relative mt-6 min-w-0 scroll-mt-6"
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-[rgba(235,235,245,0.45)]">
            Результат
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {!loading && result && !isImageResult(result) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Скопировать результат в буфер обмена"
                onClick={handleCopy}
                className="w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 shrink-0" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 shrink-0" />
                    Копировать
                  </>
                )}
              </Button>
            ) : null}
            {activeAction && !loading ? (
              <span className="max-w-full truncate rounded-full bg-white/8 px-3 py-1 text-[12px] font-medium text-[rgba(235,235,245,0.75)]">
                {ACTION_TITLES[activeAction]}
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-h-64 overflow-hidden rounded-[1.25rem] bg-[#1C1C1E] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/10 sm:p-6">
          <div className="flex min-w-0 flex-col items-start overflow-hidden">
            {!loading && result ? (
              isImageResult(result) ? (
                <div className="w-full">
                  <img
                    src={result}
                    alt="Иллюстрация к статье"
                    className="max-w-full rounded-xl ring-1 ring-white/10"
                  />
                  {resultPrompt ? (
                    <p className="mt-4 text-[13px] leading-5 text-[rgba(235,235,245,0.45)]">
                      Промпт: {resultPrompt}
                    </p>
                  ) : null}
                </div>
              ) : (
                <pre className="max-w-full min-w-0 whitespace-pre-wrap break-words font-sans text-[15px] leading-7 text-[rgba(235,235,245,0.92)]">
                  {result}
                </pre>
              )
            ) : (
              <p className="text-[15px] leading-6 text-[rgba(235,235,245,0.35)]">
                Результат появится здесь после выбора действия.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="relative mt-8 min-w-0 pb-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-[rgba(235,235,245,0.45)]">
              История статей
            </h2>
            <p className="mt-1 text-[13px] text-[rgba(235,235,245,0.35)]">
              Заголовки и выполненные действия
            </p>
          </div>
          {history.length > 0 ? (
            <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[12px] font-medium text-[rgba(235,235,245,0.55)]">
              {history.length}
            </span>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[1.25rem] bg-[#1C1C1E] ring-1 ring-white/10">
          {history.length > 0 ? (
            <ul className="divide-y divide-white/8">
              {history.map((item) => {
                const HistoryIcon = ACTION_ICONS[item.action];

                return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleHistorySelect(item)}
                    title={item.url}
                    className="group flex w-full min-w-0 items-center gap-3 px-4 py-4 text-left transition hover:bg-white/4 active:bg-white/6 sm:px-5"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0A84FF]/12 text-[#0A84FF]">
                      <HistoryIcon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-white">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[13px] text-[rgba(235,235,245,0.45)]">
                        {ACTION_TITLES[item.action]}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-[rgba(235,235,245,0.25)] transition group-hover:translate-x-0.5 group-hover:text-[rgba(235,235,245,0.45)]" />
                  </button>
                </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center sm:px-5">
              <p className="text-[15px] text-[rgba(235,235,245,0.35)]">
                Пока нет статей в истории
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
