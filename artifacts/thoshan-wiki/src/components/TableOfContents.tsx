import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Section } from "../types/article";

interface TableOfContentsProps {
  sections: Section[];
  activeId?: string;
}

function flattenSections(
  sections: Section[],
  prefix = "",
): { id: string; title: string; level: number; num: string }[] {
  const result: { id: string; title: string; level: number; num: string }[] =
    [];
  sections.forEach((s, i) => {
    const num = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
    result.push({ id: s.id, title: s.title, level: s.level, num });
    if (s.subsections?.length) {
      result.push(...flattenSections(s.subsections, num));
    }
  });
  return result;
}

export default function TableOfContents({
  sections,
  activeId,
}: TableOfContentsProps) {
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches,
  );
  const flat = flattenSections(sections);

  if (flat.length < 3) return null;

  return (
    <div
      data-testid="table-of-contents"
      className="border border-border bg-card text-sm mb-5 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/80">
        <span className="font-bold text-foreground text-sm">Contents</span>
        <button
          data-testid="button-toc-toggle"
          onClick={() => setCollapsed((c) => !c)}
          className="toc-toggle text-accent text-xs hover:underline ml-auto"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand contents" : "Collapse contents"}
        >
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </div>
      {!collapsed && (
        <ol className="px-4 py-3 space-y-1.5">
          {flat.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 20}px` }}
              className="flex items-start gap-1.5"
            >
              <span className="text-muted-foreground text-xs mt-0.5 shrink-0 w-5 text-right">
                {item.num}
              </span>
              <a
                href={`#${item.id}`}
                data-testid={`toc-link-${item.id}`}
                className={`hover:underline leading-snug ${
                  activeId === item.id
                    ? "font-semibold text-foreground"
                    : "text-accent"
                }`}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
