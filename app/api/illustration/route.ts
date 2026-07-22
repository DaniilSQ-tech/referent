import { generateImage } from "@/lib/huggingface";
import { generateIllustrationPrompt } from "@/lib/openrouter";
import { runArticleRoute } from "@/lib/article-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return runArticleRoute(request, async (article) => {
    const imagePrompt = await generateIllustrationPrompt(
      article.title,
      article.content
    );
    const image = await generateImage(imagePrompt);

    return {
      result: image,
      imagePrompt,
    };
  });
}
