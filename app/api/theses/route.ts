import { extractTheses } from "@/lib/openrouter";
import { runArticleRoute } from "@/lib/article-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return runArticleRoute(request, async (article) => {
    const result = await extractTheses(article.title, article.content);

    return { result };
  });
}
