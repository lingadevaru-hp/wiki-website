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

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  if (articleCache.has(slug)) {
    return articleCache.get(slug)!;
  }
  const res = await fetch(`${base}/data/articles/${slug}.json`);
  if (!res.ok) throw new Error(`Article not found: ${slug}`);
  const raw: unknown = await res.json();
  const data = parseOrThrow(
    `Article "${slug}"`,
    articleSchema.safeParse(raw),
  ) as Article;
  articleCache.set(slug, data);
  return data;
}

export async function loadArticlesIndex(): Promise<ArticleIndex> {
  if (indexCache) return indexCache;
  const res = await fetch(`${base}/data/articles-index.json`);
  if (!res.ok) throw new Error("Failed to load articles index");
  const raw: unknown = await res.json();
  indexCache = parseOrThrow(
    "Articles index",
    articleIndexSchema.safeParse(raw),
  );
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
