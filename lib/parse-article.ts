import * as cheerio from "cheerio";
import { ApiError } from "@/lib/api-errors";

export type ParsedArticle = {
  date: string | null;
  title: string | null;
  content: string | null;
};

const CONTENT_SELECTORS = [
  "article",
  '[role="article"]',
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".story-body",
  ".post-body",
  ".post",
  ".content",
  "main",
];

const DATE_META_SELECTORS = [
  'meta[property="article:published_time"]',
  'meta[name="article:published_time"]',
  'meta[property="og:published_time"]',
  'meta[name="publish-date"]',
  'meta[name="date"]',
  'meta[itemprop="datePublished"]',
];

const REMOVABLE_SELECTORS =
  "script, style, noscript, iframe, svg, nav, footer, header, aside, form, .sidebar, .comments, .comment, .advertisement, .ad, [aria-hidden='true']";

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle($: cheerio.CheerioAPI): string | null {
  const candidates = [
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="twitter:title"]').attr("content"),
    $("title").first().text(),
    $("article h1").first().text(),
    $("main h1").first().text(),
    $("h1").first().text(),
  ];

  for (const candidate of candidates) {
    const value = normalizeText(candidate ?? "");
    if (value) return value;
  }

  return null;
}

function extractDate($: cheerio.CheerioAPI): string | null {
  for (const selector of DATE_META_SELECTORS) {
    const value = normalizeText($(selector).attr("content") ?? "");
    if (value) return value;
  }

  const timeCandidates = [
    $("article time[datetime]").first().attr("datetime"),
    $("time[datetime]").first().attr("datetime"),
    $("time").first().attr("datetime"),
    $("time").first().text(),
    $('[class*="publish"]').first().text(),
    $('[class*="date"]').first().text(),
    $(".posted-on").first().text(),
    $(".entry-date").first().text(),
  ];

  for (const candidate of timeCandidates) {
    const value = normalizeText(candidate ?? "");
    if (value) return value;
  }

  return null;
}

function extractTextContent(
  $: cheerio.CheerioAPI,
  element: ReturnType<cheerio.CheerioAPI>
): string {
  const clone = element.clone();
  clone.find(REMOVABLE_SELECTORS).remove();

  const blocks: string[] = [];

  clone.find("p, h2, h3, h4, li, blockquote").each((_, node) => {
    const text = normalizeText($(node).text());
    if (text.length > 20) {
      blocks.push(text);
    }
  });

  if (blocks.length > 0) {
    return blocks.join("\n\n");
  }

  return normalizeText(clone.text());
}

function extractContent($: cheerio.CheerioAPI): string | null {
  for (const selector of CONTENT_SELECTORS) {
    const element = $(selector).first();
    if (element.length === 0) continue;

    const text = extractTextContent($, element);
    if (text.length > 100) {
      return text;
    }
  }

  const bodyText = extractTextContent($, $("body"));
  return bodyText.length > 0 ? bodyText : null;
}

export function parseArticleHtml(html: string): ParsedArticle {
  const $ = cheerio.load(html);

  return {
    date: extractDate($),
    title: extractTitle($),
    content: extractContent($),
  };
}

const FETCH_TIMEOUT_MS = 15000;

export async function fetchAndParseArticle(url: string): Promise<ParsedArticle> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new ApiError("ARTICLE_FETCH_FAILED", 502);
    }

    const html = await response.text();
    return parseArticleHtml(html);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("ARTICLE_FETCH_FAILED", 502);
  }
}
