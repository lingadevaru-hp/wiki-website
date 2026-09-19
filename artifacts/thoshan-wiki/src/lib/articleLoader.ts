import type {
  Article,
  ArticleIndex,
  ArticleIndexEntry,
} from "../types/article";
import { findParentArticle } from "./articleRelations";
import { articleIndexSchema, articleSchema } from "./articleSchema";
import { extractSearchHaystack, scoreSearchMatch } from "./articleText";
import { titleToSlug } from "./wikiMarkup";

const articleCache = new Map<string, Article>();
let indexCache: ArticleIndex | null = null;
let indexLocale = "";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Active locale for content: hostname subdomain, ?lang= override, or saved choice. */
export function contentLocale(): string {
  try {
    const param = new URLSearchParams(window.location.search).get("lang");
    if (param === "kn" || param === "hi" || param === "en") return param;
  } catch {
    /* ignore */
  }
  const host = window.location.hostname;
  if (host === "kn.lingadevaru.in" || host.startsWith("kn.")) return "kn";
  if (host === "hi.lingadevaru.in" || host.startsWith("hi.")) return "hi";
  try {
    const saved = localStorage.getItem("thoshan-wiki-locale");
    if (saved === "kn" || saved === "hi") return saved;
  } catch {
    /* ignore */
  }
  return "en";
}

async function fetchJson(urls: string[]): Promise<unknown> {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return (await res.json()) as unknown;
    } catch {
      /* try next fallback */
    }
  }
  throw new Error(`Not found: ${urls[0]}`);
}

function parseOrThrow<T>(
  label: string,
  result: { success: boolean; data?: T; error?: { message: string } },
): T {
  if (!result.success || result.data === undefined) {
    throw new Error(`${label}: ${result.error?.message ?? "invalid JSON"}`);
  }
  return result.data;
}

export async function loadArticle(slug: string): Promise<Article> {
  const locale = contentLocale();
  const key = `${locale}:${slug}`;
  if (articleCache.has(key)) {
    return articleCache.get(key)!;
  }
  // Per-locale article (slug.kn.json) with silent English fallback.
  const urls =
    locale === "en"
      ? [`${base}/data/articles/${slug}.json`]
      : [
          `${base}/data/articles/${slug}.${locale}.json`,
          `${base}/data/articles/${slug}.json`,
        ];
  const raw: unknown = await fetchJson(urls).catch(() => {
    throw new Error(`Article not found: ${slug}`);
  });
  const data = parseOrThrow(
    `Article "${slug}"`,
    articleSchema.safeParse(raw),
  ) as Article;
  articleCache.set(key, data);
  return data;
}

export async function loadArticlesIndex(): Promise<ArticleIndex> {
  const locale = contentLocale();
  if (indexCache && indexLocale === locale) return indexCache;
  // Translated index (titles/excerpts) with silent English fallback.
  const urls =
    locale === "en"
      ? [`${base}/data/articles-index.json`]
      : [
          `${base}/data/articles-index.${locale}.json`,
          `${base}/data/articles-index.json`,
        ];
  const raw: unknown = await fetchJson(urls).catch(() => {
    throw new Error("Failed to load articles index");
  });
  indexCache = parseOrThrow(
    "Articles index",
    articleIndexSchema.safeParse(raw),
  );
  indexLocale = locale;
  return indexCache;
}

export async function searchArticles(
  query: string,
): Promise<ArticleIndexEntry[]> {
  const index = await loadArticlesIndex();
  const searchableArticles = index.articles.filter(
    (article) => !article.hiddenFromSearch,
  );

  if (!query.trim()) return searchableArticles;

  const scored = await Promise.all(
    searchableArticles.map(async (entry) => {
      const fullArticle =
        articleCache.get(entry.slug) ||
        (await loadArticle(entry.slug).catch(() => null));
      const bodyHaystack = fullArticle
        ? extractSearchHaystack(fullArticle)
        : undefined;
      return { entry, score: scoreSearchMatch(entry, query, bodyHaystack) };
    }),
  );

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}

export { findParentArticle, titleToSlug };
