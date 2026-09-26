import type { ArticleIndexEntry } from "../types/article";
import { loadArticle } from "./articleLoader";

/** Dedicated listing-page types. Projects pull from the build-oriented
 *  index categories; Achievements and News match article tags (the
 *  `categories[]` array in the full article JSON), so tagging a new
 *  article automatically lists it — no code changes needed. */
export type ArticleType = "projects" | "achievements" | "news";

export const ARTICLE_TYPES: { id: ArticleType; route: string }[] = [
  { id: "projects", route: "/projects" },
  { id: "achievements", route: "/achievements" },
  { id: "news", route: "/news" },
];

/** Index categories that count as project work. Profile/Learning stay
 *  archive-only; News/Achievements are tag-driven (see below). */
const PROJECT_CATEGORIES = new Set([
  "Blockchain",
  "AI / ML",
  "Infrastructure",
  "Security",
  "Systems",
  "Web",
]);

function hasTag(categories: string[] | undefined, ...tags: string[]): boolean {
  const lower = (categories ?? []).map((c) => c.toLowerCase());
  return tags.some((t) => lower.includes(t));
}

/** Types for an index entry. Tag matches need the full article, so this
 *  is async — results are cached by the article loader. */
export async function articleTypesOf(
  entry: ArticleIndexEntry,
): Promise<ArticleType[]> {
  const types: ArticleType[] = [];
  if (PROJECT_CATEGORIES.has(entry.category)) types.push("projects");
  if (entry.category === "News" || entry.category === "Events") {
    types.push("news");
  } else if (entry.category === "Achievements") {
    types.push("achievements");
  } else {
    try {
      const full = await loadArticle(entry.slug);
      const tags = full?.categories;
      if (hasTag(tags, "news", "events")) types.push("news");
      if (hasTag(tags, "achievement", "achievements"))
        types.push("achievements");
    } catch {
      /* offline or missing article — index-only types still apply */
    }
  }
  return [...new Set(types)];
}

/** Synchronous index-only filter (no tag lookup): used for counts and
 *  first paint; the page upgrades to tag matches once loaded. */
export function indexTypesOf(entry: ArticleIndexEntry): ArticleType[] {
  const types: ArticleType[] = [];
  if (PROJECT_CATEGORIES.has(entry.category)) types.push("projects");
  if (entry.category === "News" || entry.category === "Events")
    types.push("news");
  if (entry.category === "Achievements") types.push("achievements");
  return types;
}
