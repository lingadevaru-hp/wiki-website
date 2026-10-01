import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, X, ArrowRight, Clock, Sparkles, Hash } from "lucide-react";
import { searchArticles, loadArticlesIndex } from "../lib/articleLoader";
import { categoryColors } from "../lib/categories";
import { indexTypesOf } from "../lib/articleTypes";
import type { ArticleIndexEntry } from "../types/article";
import { useSearch } from "../contexts/SearchContext";
import { useLocale } from "../contexts/LocaleContext";
import { useDebounce } from "../hooks/useDebounce";
import { useFocusRestore } from "../hooks/use-focus-restore";
import { OPEN_PALETTE_EVENT } from "../lib/command-menu";

const RECENT_KEY = "wiki_recent_searches";
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const prev = getRecent().filter((r) => r !== q);
  const next = [q, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function removeRecent(q: string) {
  const next = getRecent().filter((r) => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export default function GlobalSearch() {
  const { isOpen, scope, closeSearch } = useSearch();
  const { t } = useLocale();
  const scoped = scope !== "all";
  // Collection-scoped popup (e.g. news): same modal, only that shelf's
  // articles — index-only type check keeps every keystroke instant.
  const inScope = useCallback(
    (entry: ArticleIndexEntry) =>
      !scoped || indexTypesOf(entry).includes(scope),
    [scoped, scope],
  );
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 120);
  const [results, setResults] = useState<ArticleIndexEntry[]>([]);
  const [featured, setFeatured] = useState<ArticleIndexEntry[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  // v10.10: spinner appears only past 300ms so fast keystrokes never flash.
  const [showSlow, setShowSlow] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  // v10.10: return focus to the opener on close (trap already below).
  useFocusRestore(isOpen);

  // Load featured articles (show when query is empty)
  useEffect(() => {
    loadArticlesIndex().then((idx) => {
      setFeatured(idx.articles.filter(inScope).slice(0, 6));
    });
  }, [inScope]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setActiveIdx(-1);
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // v10.10 fix: while the keyboard is open the sheet compacts so the input
  // + first results fit above it (like the command menu); on close the full
  // sheet height is restored. visualViewport is the primary signal because
  // Safari ignores interactive-widget (WebKit bug 259770).
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const modal = modalRef.current;
    const sync = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      modal?.classList.toggle("kb-open", kb > 40);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      modal?.classList.remove("kb-open");
    };
  }, [isOpen]);

  // Only one overlay at a time: the command palette replaces this modal.
  useEffect(() => {
    const onPalette = () => closeSearch();
    window.addEventListener(OPEN_PALETTE_EVENT, onPalette);
    return () => window.removeEventListener(OPEN_PALETTE_EVENT, onPalette);
  }, [closeSearch]);

  // Search
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      setShowSlow(false);
      return;
    }
    setIsSearching(true);
    let cancelled = false;
    const slow = window.setTimeout(() => {
      if (!cancelled) setShowSlow(true);
    }, 300);
    searchArticles(debouncedQuery).then((r) => {
      if (!cancelled) {
        setResults(r.filter(inScope).slice(0, 8));
        setActiveIdx(-1);
        setIsSearching(false);
        setShowSlow(false);
      }
    });
    return () => {
      cancelled = true;
      window.clearTimeout(slow);
    };
  }, [debouncedQuery, inScope]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) closeSearch();
    },
    [closeSearch],
  );

  // Focus trap and keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = query.trim().length >= 2 ? results : featured;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter") {
        if (activeIdx >= 0 && items[activeIdx]) {
          navigate(items[activeIdx].slug, items[activeIdx].title);
        } else if (query.trim()) {
          navigateSearch(query);
        }
      } else if (e.key === "Escape") {
        closeSearch();
      } else if (e.key === "Tab") {
        // Trap focus within modal
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [query, results, featured, activeIdx, closeSearch],
  );

  function navigate(slug: string, title: string) {
    saveRecent(title);
    setLocation(`/wiki/${slug}`);
    closeSearch();
  }

  function navigateSearch(q: string) {
    saveRecent(q);
    setLocation(`/wiki/search?q=${encodeURIComponent(q)}`);
    closeSearch();
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const showResults = query.trim().length >= 2;
  const displayItems = showResults ? results : featured;
  const isEmpty = showResults && !isSearching && results.length === 0;

  if (!isOpen) return null;

  return (
    <div
      className="global-search-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={scoped ? t("type.newsTitle") : t("menu.search")}
      data-testid="global-search-modal"
      data-scope={scope}
    >
      <div className="global-search-modal" ref={modalRef}>
        {/* Search input row */}
        <div className="global-search-input-row">
          {showSlow ? (
            <div className="global-search-spinner" aria-hidden="true" />
          ) : (
            <Search
              size={18}
              className="global-search-icon"
              aria-hidden="true"
            />
          )}
          {scoped && (
            <span className="global-search-scope">{t("type.news")}</span>
          )}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={scoped ? t("type.filterNews") : t("search.placeholder")}
            className="global-search-input"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            inputMode="search"
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={t("menu.search")}
            role="combobox"
            aria-expanded={displayItems.length > 0}
            aria-autocomplete="list"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="global-search-clear"
              aria-label={t("search.clear")}
            >
              <X size={14} />
            </button>
          )}
          <kbd className="global-search-esc" onClick={closeSearch}>
            ESC
          </kbd>
        </div>

        {/* Divider */}
        <div className="global-search-divider" />

        {/* Results / Featured / Empty */}
        <div className="global-search-body" ref={listRef}>
          {/* Section label */}
          {!isEmpty && (
            <div className="global-search-section-label">
              {showResults ? (
                <>
                  <Hash size={11} />{" "}
                  {results.length === 1
                    ? t("search.result1")
                    : `${results.length} ${t("search.resultsN")}`}
                </>
              ) : (
                <>
                  <Sparkles size={11} /> {t("search.featured")}
                </>
              )}
            </div>
          )}

          {/* Items */}
          {displayItems.map((item, i) => (
            <button
              key={item.id}
              data-idx={i}
              onClick={() => navigate(item.slug, item.title)}
              className={`global-search-result${activeIdx === i ? " active" : ""}`}
              role="option"
              aria-selected={activeIdx === i}
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="global-search-thumb"
                  loading="lazy"
                />
              ) : (
                <div className="global-search-thumb-placeholder">
                  <Search size={13} />
                </div>
              )}
              <div className="global-search-result-body">
                <span className="global-search-result-title">{item.title}</span>
                {item.excerpt && (
                  <span className="global-search-result-excerpt">
                    {item.excerpt}
                  </span>
                )}
              </div>
              <span
                className="global-search-cat"
                style={{ color: categoryColors[item.category] || "hsl(var(--accent))" }}
              >
                {item.category}
              </span>
              <ArrowRight size={13} className="global-search-arrow" />
            </button>
          ))}

          {/* Empty state */}
          {isEmpty && (
            <div className="global-search-empty">
              <Search size={32} className="global-search-empty-icon" />
              <p>
                {t("search.noFoundFor")} <strong>"{query}"</strong>
              </p>
              <button
                className="global-search-full-search"
                onClick={() => navigateSearch(query)}
              >
                {t("search.searching")} "{query}"
              </button>
            </div>
          )}

          {/* Recent searches */}
          {!showResults && recent.length > 0 && (
            <div className="global-search-recent">
              <div className="global-search-section-label">
                <Clock size={11} /> Recent
              </div>
              {recent.map((r) => (
                <div key={r} className="global-search-recent-item">
                  <button
                    className="global-search-recent-label"
                    onClick={() => {
                      setQuery(r);
                      inputRef.current?.focus();
                    }}
                  >
                    <Clock size={12} /> {r}
                  </button>
                  <button
                    className="global-search-recent-remove"
                    onClick={() => {
                      removeRecent(r);
                      setRecent(getRecent());
                    }}
                    aria-label={`Remove "${r}" from recent`}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="global-search-footer">
          <span>
            <kbd>↑↓</kbd> {t("search.navigate")}
          </span>
          <span>
            <kbd>↵</kbd> {t("search.open")}
          </span>
          <span>
            <kbd>Esc</kbd> {t("search.close")}
          </span>
          <span className="ml-auto">
            <kbd>Win</kbd>+<kbd>K</kbd> {t("search.or")} <kbd>Ctrl</kbd>+<kbd>K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
