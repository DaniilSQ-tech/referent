import { NextResponse } from "next/server";
import { extractTheses } from "@/lib/openrouter";
import { fetchAndParseArticle } from "@/lib/parse-article";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const result = await extractTheses(article.title, article.content);

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка при формировании тезисов";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
