import { NextResponse } from "next/server";
import { translateArticle } from "@/lib/openrouter";
import { fetchAndParseArticle } from "@/lib/parse-article";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL не указан" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Некорректный URL" }, { status: 400 });
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "Поддерживаются только http:// и https://" },
        { status: 400 }
      );
    }

    const article = await fetchAndParseArticle(parsedUrl.toString());
    const translation = await translateArticle(article.title, article.content);

    return NextResponse.json({ translation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка при переводе статьи";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
