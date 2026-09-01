import type { Article, ContentBlock, Section } from "../types/article";

function blockText(block: ContentBlock): string {
  const parts: string[] = [];
  if (block.title) parts.push(block.title);
  if (block.content) parts.push(block.content);
  if (block.caption) parts.push(block.caption);
  if (block.author) parts.push(block.author);
  if (block.rows) {
    for (const row of block.rows) {
      parts.push(Object.values(row).join(" "));
    }
  }
  if (block.items) {
    for (const item of block.items) {
      parts.push(item.alt, item.caption ?? "");
    }
  }
  return parts.join(" ");
}

function sectionText(section: Section): string {
  const parts = [section.title];
  for (const block of section.content) {
    parts.push(blockText(block));
  }
  for (const subsection of section.subsections ?? []) {
    parts.push(sectionText(subsection));
  }
  return parts.join(" ");
}

export function extractArticleText(article: Article): string {
  return [
    article.metadata.title,
    article.lead,
    ...article.sections.map(sectionText),
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSearchHaystack(article: Article): string {
  return extractArticleText(article).toLowerCase();
}

export function estimateReadingMinutes(article: Article): number {
  const words = extractArticleText(article).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export interface SearchableIndexEntry {
  title: string;
  category: string;
  excerpt: string;
}

export function scoreSearchMatch(
  entry: SearchableIndexEntry,
  query: string,
  bodyHaystack?: string,
): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  let score = 0;
  if (entry.title.toLowerCase() === q) score += 140;
  else if (entry.title.toLowerCase().startsWith(q)) score += 120;
  else if (entry.title.toLowerCase().includes(q)) score += 100;

  if (entry.category.toLowerCase().includes(q)) score += 40;
  if (entry.excerpt.toLowerCase().includes(q)) score += 20;
  if (bodyHaystack?.includes(q)) score += 10;
  return score;
}
