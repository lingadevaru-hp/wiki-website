/** Shared wiki-link and slug helpers. Keep this module free of React. */

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function parseWikiLink(inner: string): { slug: string; text: string } {
  const parts = inner.split("|");
  const rawSlug = parts[0]?.trim() ?? "";
  return {
    slug: titleToSlug(rawSlug),
    text: parts[1]?.trim() || rawSlug,
  };
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}
