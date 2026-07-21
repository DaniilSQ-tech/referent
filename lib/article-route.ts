import { NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api-errors";
import {
  fetchAndParseArticle,
  type ParsedArticle,
} from "@/lib/parse-article";
import { validateArticleUrl } from "@/lib/validate-article-url";

export async function runArticleRoute(
  request: Request,
  handler: (
    article: ParsedArticle,
    url: string
  ) => Promise<Record<string, string>>
) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = validateArticleUrl(body.url);
    const article = await fetchAndParseArticle(url);
    const payload = await handler(article, url);

    return NextResponse.json({
      ...payload,
      title: article.title ?? "",
    });
  } catch (error) {
    const { code, status } = toApiErrorResponse(error);

    return NextResponse.json({ code }, { status });
  }
}
