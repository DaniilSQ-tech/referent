import { prepareArticleText } from "@/lib/article-text";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openrouter/free";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY не задан. Локально добавьте его в .env.local, на Vercel — в Settings → Environment Variables."
    );
  }

  const baseUrl = process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Referent",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  const raw = await response.text();

  let data: ChatCompletionResponse & { message?: string };
  try {
    data = JSON.parse(raw) as ChatCompletionResponse & { message?: string };
  } catch {
    throw new Error(
      response.ok
        ? "OpenRouter вернул некорректный ответ"
        : `OpenRouter вернул ошибку: HTTP ${response.status}`
    );
  }

  if (!response.ok) {
    const apiMessage = data.error?.message ?? data.message;

    if (response.status === 403) {
      throw new Error(
        apiMessage ??
          "OpenRouter отклонил запрос (403). Проверьте API-ключ, настройки приватности на openrouter.ai/settings/privacy и модель OPENROUTER_MODEL."
      );
    }

    throw new Error(apiMessage ?? `OpenRouter вернул ошибку: HTTP ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter не вернул текст ответа");
  }

  return content;
}

export async function translateArticle(title: string | null, content: string | null): Promise<string> {
  const article = prepareArticleText(title, content);

  return chatCompletion([
    {
      role: "system",
      content:
        "Ты профессиональный переводчик. Переводи англоязычные статьи на русский язык точно и естественно. Сохраняй структуру: сначала переведённый заголовок, затем переведённый текст статьи. Не добавляй комментариев и пояснений.",
    },
    {
      role: "user",
      content: `Переведи эту статью на русский:\n\n${article.text}`,
    },
  ]);
}

export async function summarizeArticle(title: string | null, content: string | null): Promise<string> {
  const article = prepareArticleText(title, content);

  return chatCompletion([
    {
      role: "system",
      content:
        "Ты редактор и аналитик. Кратко и понятно объясняй на русском языке, о чём англоязычная статья. Пиши 2–4 абзаца, без воды и без вводных фраз вроде «В этой статье».",
    },
    {
      role: "user",
      content: `Кратко опиши, о чём эта статья:\n\n${article.text}`,
    },
  ]);
}

export async function extractTheses(title: string | null, content: string | null): Promise<string> {
  const article = prepareArticleText(title, content);

  return chatCompletion([
    {
      role: "system",
      content:
        "Ты редактор. Выделяй ключевые тезисы англоязычных статей на русском языке. Верни 5–10 пунктов в виде маркированного списка. Каждый тезис — одна ёмкая мысль, без повторов и без комментариев.",
    },
    {
      role: "user",
      content: `Выдели ключевые тезисы этой статьи:\n\n${article.text}`,
    },
  ]);
}

export async function generateTelegramPost(
  title: string | null,
  content: string | null,
  sourceUrl: string
): Promise<string> {
  const article = prepareArticleText(title, content);

  const post = await chatCompletion([
    {
      role: "system",
      content:
        "Ты SMM-редактор. Пиши посты для Telegram на русском языке по англоязычным статьям. Структура: цепляющий заголовок, краткая суть, призыв к прочтению или обсуждению. Длина до 1500 символов. Не используй markdown-таблицы и сложное форматирование. Не добавляй блок «Источник» — он будет добавлен автоматически.",
    },
    {
      role: "user",
      content: `Напиши пост для Telegram на основе этой статьи:\n\n${article.text}`,
    },
  ]);

  return `${post.trim()}\n\nИсточник: *${sourceUrl}*`;
}
