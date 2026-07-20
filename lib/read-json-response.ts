export async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const preview = text.replace(/\s+/g, " ").slice(0, 120);

    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      throw new Error(
        "Сервер вернул HTML вместо JSON. Перезапустите `pnpm dev` и откройте адрес из терминала (например, http://localhost:3000)."
      );
    }

    throw new Error(preview || `Неожиданный ответ сервера: HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}
