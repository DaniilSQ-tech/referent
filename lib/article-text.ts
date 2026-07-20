export const MAX_ARTICLE_CONTENT_LENGTH = 12000;

export type PreparedArticleText = {
  title: string | null;
  content: string;
  text: string;
  truncated: boolean;
};

export function prepareArticleText(
  title: string | null,
  content: string | null,
  maxContentLength = MAX_ARTICLE_CONTENT_LENGTH
): PreparedArticleText {
  if (!content) {
    throw new Error("Не удалось извлечь текст статьи");
  }

  const truncated = content.length > maxContentLength;
  const preparedContent = truncated
    ? `${content.slice(0, maxContentLength)}\n\n[Текст обрезан из-за ограничения длины]`
    : content;

  const text = [
    title ? `Title: ${title}` : null,
    `Content:\n${preparedContent}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title,
    content: preparedContent,
    text,
    truncated,
  };
}
