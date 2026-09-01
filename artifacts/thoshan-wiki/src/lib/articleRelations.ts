export interface ParentLookupEntry {
  slug: string;
}

/** Longest matching parent slug, or an explicit parent when present. */
export function findParentArticle<T extends ParentLookupEntry>(
  slug: string,
  articles: T[],
  explicitParentSlug?: string,
): T | undefined {
  if (explicitParentSlug) {
    const explicit = articles.find(
      (entry) => entry.slug === explicitParentSlug,
    );
    if (explicit) return explicit;
  }

  if (!slug.includes("-")) return undefined;

  return articles
    .filter((entry) => entry.slug !== slug && slug.startsWith(`${entry.slug}-`))
    .sort((a, b) => b.slug.length - a.slug.length)[0];
}

export function visibleIndexArticles<T extends { hiddenFromSearch?: boolean }>(
  articles: T[],
): T[] {
  return articles.filter((article) => !article.hiddenFromSearch);
}
