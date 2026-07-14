"use client";

import { useState } from "react";

type Action = "summary" | "theses" | "telegram";

const ACTIONS: { id: Action; label: string; description: string }[] = [
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
  summary: "О чем статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
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
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAction(action: Action) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Введите URL статьи");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setError("Укажите корректный URL (http:// или https://)");
      return;
    }

    setError("");
    setActiveAction(action);
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = (await response.json()) as {
        date?: string | null;
        title?: string | null;
        content?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось распарсить статью");
      }

      const parsed = {
        date: data.date ?? null,
        title: data.title ?? null,
        content: data.content ?? null,
      };

      setResult(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось выполнить действие. Попробуйте ещё раз."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-sky-400">
          Referent
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Анализ англоязычных статей
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Вставьте ссылку на статью и выберите, что нужно сгенерировать с помощью
          AI.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur sm:p-8">
        <label htmlFor="article-url" className="mb-2 block text-sm font-medium text-slate-300">
          URL англоязычной статьи
        </label>
        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) setError("");
          }}
          placeholder="https://example.com/article"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
        />

        {error ? (
          <p className="mt-3 text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={loading}
              onClick={() => handleAction(action.id)}
              className={`group rounded-xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                activeAction === action.id && !loading
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-slate-700 bg-slate-950 hover:border-slate-500 hover:bg-slate-900"
              }`}
            >
              <span className="block text-sm font-semibold text-white">
                {action.label}
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                {action.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 flex min-h-64 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-white">Результат</h2>
          {activeAction ? (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {ACTION_TITLES[activeAction]}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 items-start">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-400">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
              <span>Генерация ответа…</span>
            </div>
          ) : result ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-200">
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
