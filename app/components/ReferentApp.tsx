"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Copy, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getClientErrorMessage,
  resolveApiErrorCode,
  type Action,
  type ClientErrorCode,
} from "@/lib/client-errors";
import { readJsonResponse } from "@/lib/read-json-response";

const ACTIONS: { id: Action; label: string; description: string }[] = [
  {
    id: "translate",
    label: "Перевод",
    description: "Полный перевод статьи на русский",
  },
  {
    id: "summary",
    label: "О чем статья?",
    description: "Краткое описание содержания статьи",
  },
  {
    id: "theses",
    label: "Тезисы",
    description: "Ключевые тезисы и выводы",
  },
  {
    id: "telegram",
    label: "Пост для Telegram",
    description: "Готовый пост для публикации",
  },
];

const ACTION_TITLES: Record<Action, string> = {
  translate: "Перевод",
  summary: "О чем статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
};

const LOADING_LABELS: Record<Action, string> = {
  translate: "Перевод статьи…",
  summary: "Анализ статьи…",
  theses: "Формирование тезисов…",
  telegram: "Создание поста…",
};

const ACTION_ENDPOINTS: Record<Action, string> = {
  translate: "/api/translate",
  summary: "/api/summary",
  theses: "/api/theses",
  telegram: "/api/telegram",
};

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
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<ClientErrorCode | null>(null);
  const [copied, setCopied] = useState(false);

  const errorMessage = errorCode
    ? getClientErrorMessage(errorCode, activeAction)
    : null;

  function resetState() {
    setUrl("");
    setActiveAction(null);
    setResult("");
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
    if (!result) return;

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
        code?: string;
      }>(response);

      if (!response.ok) {
        setErrorCode(resolveApiErrorCode(data.code));
        return;
      }

      setResult(
        action === "translate" ? (data.translation ?? "") : (data.result ?? "")
      );
    } catch (err) {
      setErrorCode(err instanceof TypeError ? "NETWORK_ERROR" : "SERVER_ERROR");
    } finally {
      setLoading(false);
    }
  }

  const hasState =
    url.trim().length > 0 ||
    result.length > 0 ||
    errorCode !== null ||
    activeAction !== null;

  return (
    <div className="mx-auto flex min-h-screen w-full min-w-0 max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
      <header className="mb-8 sm:mb-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-sky-400">
          Referent
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
          Анализ англоязычных статей
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
          Вставьте ссылку на статью и выберите, что нужно сгенерировать с помощью
          AI.
        </p>
      </header>

      <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-6 lg:p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor="article-url"
            className="min-w-0 text-sm font-medium text-slate-300"
          >
            URL англоязычной статьи
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Сбросить URL, результат, ошибки и состояние"
            disabled={loading || !hasState}
            onClick={resetState}
            className="w-full shrink-0 sm:w-auto"
          >
            <RotateCcw className="size-3.5 shrink-0" />
            Очистить
          </Button>
        </div>
        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (errorCode) setErrorCode(null);
          }}
          placeholder="Введите URL статьи, например: https://example.com/article"
          className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 placeholder:text-sm placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 sm:text-sm"
        />
        <p className="mt-2 text-xs text-slate-500">
          Укажите ссылку на англоязычную статью
        </p>

        <div className="mt-6 flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.description}
              disabled={loading}
              onClick={() => handleAction(action.id)}
              className={`group w-full min-w-0 rounded-xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                activeAction === action.id && !loading
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-slate-700 bg-slate-950 hover:border-slate-500 hover:bg-slate-900"
              }`}
            >
              <span className="block text-sm font-semibold text-white">
                {action.label}
              </span>
              <span className="mt-1 block break-words text-xs text-slate-400">
                {action.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {errorMessage ? (
        <Alert variant="destructive" className="mt-6 min-w-0">
          <AlertCircle className="size-4 shrink-0" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {loading && activeAction ? (
        <div
          className="mt-6 flex min-w-0 items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200"
          role="status"
          aria-live="polite"
        >
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-400" />
          <span className="min-w-0 break-words">{LOADING_LABELS[activeAction]}</span>
        </div>
      ) : null}

      <section
        ref={resultsRef}
        className="mt-6 flex min-h-64 min-w-0 scroll-mt-6 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6 lg:p-8"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-lg font-medium text-white">Результат</h2>
          <div className="flex flex-wrap items-center gap-2">
            {!loading && result ? (
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
              <span className="max-w-full truncate rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {ACTION_TITLES[activeAction]}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-start overflow-hidden">
          {!loading && result ? (
            <pre className="max-w-full min-w-0 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-200">
              {result}
            </pre>
          ) : (
            <p className="text-sm text-slate-500">
              Результат появится здесь после выбора действия.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
