const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEEPSEEK_MODEL = "deepseek/deepseek-chat";

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
    throw new Error("OPENROUTER_API_KEY не задан в .env.local");
  }

  const baseUrl = process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Referent",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
    }),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenRouter вернул ошибку: HTTP ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter не вернул текст перевода");
  }

  return content;
}

export async function translateArticle(title: string | null, content: string | null): Promise<string> {
  if (!content) {
    throw new Error("Не удалось извлечь текст статьи для перевода");
  }

  const maxContentLength = 12000;
  const truncatedContent =
    content.length > maxContentLength
      ? `${content.slice(0, maxContentLength)}\n\n[Текст обрезан из-за ограничения длины]`
      : content;

  const articleText = [
    title ? `Title: ${title}` : null,
    `Content:\n${truncatedContent}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return chatCompletion([
    {
      role: "system",
      content:
        "Ты профессиональный переводчик. Переводи англоязычные статьи на русский язык точно и естественно. Сохраняй структуру: сначала переведённый заголовок, затем переведённый текст статьи. Не добавляй комментариев и пояснений.",
    },
    {
      role: "user",
      content: `Переведи эту статью на русский:\n\n${articleText}`,
    },
  ]);
}
