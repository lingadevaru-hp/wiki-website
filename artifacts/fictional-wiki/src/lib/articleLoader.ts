import type { Article, ArticleIndex, ArticleIndexEntry } from '../types/article';

const articleCache = new Map<string, Article>();
let indexCache: ArticleIndex | null = null;
let preloadStarted = false;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export async function loadArticle(slug: string): Promise<Article> {
  if (articleCache.has(slug)) {
    return articleCache.get(slug)!;
  }
  const res = await fetch(`${base}/data/articles/${slug}.json`);
  if (!res.ok) throw new Error(`Article not found: ${slug}`);
  const data: Article = await res.json();
  articleCache.set(slug, data);
  return data;
}

export async function loadArticlesIndex(): Promise<ArticleIndex> {
  if (indexCache) return indexCache;
  const res = await fetch(`${base}/data/articles-index.json`);
  if (!res.ok) throw new Error('Failed to load articles index');
  indexCache = await res.json();

  // Eagerly preload all articles in the background so search is instant
  if (!preloadStarted) {
    preloadStarted = true;
    setTimeout(() => {
      indexCache!.articles.forEach((a) => {
        loadArticle(a.slug).catch(() => null);
      });
    }, 200);
  }

  return indexCache!;
}

function extractArticleText(article: Article): string {
  const parts: string[] = [article.metadata.title, article.lead];
  for (const section of article.sections) {
    parts.push(section.title);
    for (const block of section.content) {
      if (block.type === 'text' && block.content) parts.push(block.content);
      if (block.type === 'callout' && block.content) parts.push(`${block.title || ''} ${block.content}`);
      if (block.type === 'quote' && block.content) parts.push(block.content);
      if (block.type === 'table' && block.rows) {
        for (const row of block.rows) {
          parts.push(Object.values(row).join(' '));
        }
      }
    }
  }
  return parts.join(' ').toLowerCase();
}

export async function searchArticles(query: string): Promise<ArticleIndexEntry[]> {
  const index = await loadArticlesIndex();
  
  // Filter out hidden sub-articles from search results
  const searchableArticles = index.articles.filter(article => !article.hiddenFromSearch);
  
  if (!query.trim()) return searchableArticles;

  const q = query.toLowerCase().trim();

  const scored = await Promise.all(
    searchableArticles.map(async (entry) => {
      let score = 0;

      // High-weight: title match
      if (entry.title.toLowerCase().includes(q)) score += 100;
      // Medium-weight: category, excerpt
      if (entry.category.toLowerCase().includes(q)) score += 40;
      if (entry.excerpt.toLowerCase().includes(q)) score += 20;

      // Full content search if article is already cached
      const cached = articleCache.get(entry.slug);
      if (cached) {
        const text = extractArticleText(cached);
        if (text.includes(q)) score += 10;
      }

      return { entry, score };
    })
  );

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}

export function titleToSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
