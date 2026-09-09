import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { X, Bookmark, Trash2 } from "lucide-react";
import { useBookmarks } from "../hooks/useBookmarks";
import { loadArticlesIndex } from "../lib/articleLoader";
import { categoryColor } from "../lib/categories";
import { visibleIndexArticles } from "../lib/articleRelations";
import type { ArticleIndexEntry } from "../types/article";

interface WikiSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { label: "Wiki Home", href: "/wiki/home" },
  { label: "Landing", href: "/" },
  { label: "Search articles", href: "/wiki/search" },
  { label: "About Thoshan", href: "/wiki/about" },
];

function NavContent({ onClose }: { onClose: () => void }) {
  const { bookmarks, removeBookmark } = useBookmarks();
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [location] = useLocation();

  useEffect(() => {
    loadArticlesIndex().then((index) => {
      setArticles(visibleIndexArticles(index.articles));
    });
  }, []);

  return (
    <nav className="p-3 text-sm space-y-4">
      <ul className="space-y-0.5">
        {navLinks.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              onClick={onClose}
              aria-current={location === l.href ? "page" : undefined}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="block px-3 py-2 hover:bg-background hover:text-accent text-foreground rounded-lg transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      {bookmarks.length > 0 && (
        <div
          className="pt-2 border-t border-border"
          data-testid="sidebar-bookmarks"
        >
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <Bookmark size={12} className="text-accent" /> Saved (
              {bookmarks.length})
            </span>
          </div>
          <ul className="space-y-1 mt-1">
            {bookmarks.map((b) => (
              <li
                key={b.slug}
                className="group flex items-center justify-between gap-1"
              >
                <Link
                  href={`/wiki/${b.slug}`}
                  onClick={onClose}
                  className="block flex-1 min-w-0 space-y-0.5 px-3 py-2 hover:bg-background hover:text-accent text-foreground rounded-lg transition-colors"
                >
                  <span className="block text-xs font-medium truncate">
                    {b.title}
                  </span>
                  <span
                    className="block text-[10px] leading-tight"
                    style={{ color: categoryColor(b.category) }}
                  >
                    {b.category}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeBookmark(b.slug)}
                  title="Remove bookmark"
                  aria-label={`Remove ${b.title} bookmark`}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <p className="px-3 py-1 text-xs font-bold uppercase text-muted-foreground tracking-wider">
          Articles
        </p>
        <ul className="space-y-0.5 mt-1">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/wiki/${article.slug}`}
                onClick={onClose}
                aria-current={
                  location === `/wiki/${article.slug}` ? "page" : undefined
                }
                data-testid={`article-link-${article.slug}`}
                className="block space-y-0.5 px-3 py-2 hover:bg-background hover:text-accent text-foreground rounded-lg transition-colors"
              >
                <span className="block text-xs leading-tight">
                  {article.title}
                </span>
                <span
                  className="block text-[10px] leading-tight"
                  style={{ color: categoryColor(article.category) }}
                >
                  {article.category}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default function WikiSidebar({ open, onClose }: WikiSidebarProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-all duration-300 ${
          open
            ? "opacity-100 pointer-events-auto backdrop-blur-sm"
            : "opacity-0 pointer-events-none backdrop-blur-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed top-0 left-0 h-dvh z-50 w-72 bg-card border-r border-border
          transform transition-transform duration-300 ease-[var(--ease-spring)]
          md:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="font-serif font-bold">Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 text-foreground hover:bg-background rounded transition-colors"
            data-testid="button-close-sidebar"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-56px)] pb-[env(safe-area-inset-bottom)]">
          <NavContent onClose={onClose} />
        </div>
      </aside>

      <div
        className={`
          hidden md:block shrink-0 overflow-hidden
          transition-all duration-200 ease-[var(--ease-in-out)]
          ${open ? "w-[180px] lg:w-[200px]" : "w-0"}
        `}
      >
        <aside className="w-[180px] lg:w-[200px] sticky top-[49px] max-h-[calc(100vh-49px)] overflow-y-auto border-r border-border">
          <NavContent onClose={onClose} />
        </aside>
      </div>
    </>
  );
}
