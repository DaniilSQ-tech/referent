import { InferenceClient } from "@huggingface/inference";
import { ApiError } from "@/lib/api-errors";

const DEFAULT_MODEL = "black-forest-labs/FLUX.1-schnell";

function getHuggingFaceApiKey(): string {
  const apiKey =
    process.env.HUGGINGFACE_API_KEY?.trim() ||
    process.env.HF_TOKEN?.trim();

  if (!apiKey) {
    throw new ApiError("HUGGINGFACE_CONFIG", 503);
  }

  return apiKey;
}

export async function generateImage(prompt: string): Promise<string> {
  const apiKey = getHuggingFaceApiKey();
  const model = process.env.HUGGINGFACE_IMAGE_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const client = new InferenceClient(apiKey);
    const image = await client.textToImage({
      model,
      inputs: prompt,
      provider: "auto",
      parameters: {
        num_inference_steps: 4,
      },
    }, {
      outputType: "dataUrl",
    });

    return image;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("AI_FAILED", 502);
  }
}
