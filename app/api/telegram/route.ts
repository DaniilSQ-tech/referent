import { generateTelegramPost } from "@/lib/openrouter";
import { runArticleRoute } from "@/lib/article-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return runArticleRoute(request, async (article, url) => {
    const result = await generateTelegramPost(
      article.title,
      article.content,
      url
    );

    return { result };
  });
}
