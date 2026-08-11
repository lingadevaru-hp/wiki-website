import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Search, X, ArrowRight, Clock, Sparkles, Hash } from 'lucide-react';
import { searchArticles, loadArticlesIndex } from '../lib/articleLoader';
import type { ArticleIndexEntry } from '../types/article';
import { useSearch } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';

const categoryColors: Record<string, string> = {
  Profile: '#3366CC',
  Blockchain: '#E67E22',
  'AI / ML': '#8E44AD',
  Infrastructure: '#27AE60',
  Security: '#C0392B',
  Systems: '#2980B9',
  Web: '#16A085',
  Learning: '#F39C12',
};

const RECENT_KEY = 'wiki_recent_searches';
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
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
  const { isOpen, closeSearch } = useSearch();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 120);
  const [results, setResults] = useState<ArticleIndexEntry[]>([]);
  const [featured, setFeatured] = useState<ArticleIndexEntry[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load featured articles (show when query is empty)
  useEffect(() => {
    loadArticlesIndex().then((idx) => {
      setFeatured(idx.articles.slice(0, 6));
    });
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveIdx(-1);
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Search
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    let cancelled = false;
    searchArticles(debouncedQuery).then((r) => {
      if (!cancelled) {
        setResults(r.slice(0, 8));
        setActiveIdx(-1);
        setIsSearching(false);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeSearch();
  }, [closeSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query.trim().length >= 2 ? results : featured;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && items[activeIdx]) {
        navigate(items[activeIdx].slug, items[activeIdx].title);
      } else if (query.trim()) {
        navigateSearch(query);
      }
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  }, [query, results, featured, activeIdx, closeSearch]);

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
    el?.scrollIntoView({ block: 'nearest' });
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
      aria-label="Search"
      data-testid="global-search-modal"
    >
      <div className="global-search-modal" ref={modalRef}>
        {/* Search input row */}
        <div className="global-search-input-row">
          {isSearching ? (
            <div className="global-search-spinner" aria-hidden="true" />
          ) : (
            <Search size={18} className="global-search-icon" aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search articles, topics, projects…"
            className="global-search-input"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={displayItems.length > 0}
            aria-autocomplete="list"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="global-search-clear"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="global-search-esc" onClick={closeSearch}>ESC</kbd>
        </div>

        {/* Divider */}
        <div className="global-search-divider" />

        {/* Results / Featured / Empty */}
        <div className="global-search-body" ref={listRef}>

          {/* Section label */}
          {!isEmpty && (
            <div className="global-search-section-label">
              {showResults
                ? <><Hash size={11} /> {results.length} result{results.length !== 1 ? 's' : ''}</>
                : <><Sparkles size={11} /> Featured articles</>}
            </div>
          )}

          {/* Items */}
          {displayItems.map((item, i) => (
            <button
              key={item.id}
              data-idx={i}
              onClick={() => navigate(item.slug, item.title)}
              className={`global-search-result${activeIdx === i ? ' active' : ''}`}
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
                  <span className="global-search-result-excerpt">{item.excerpt}</span>
                )}
              </div>
              <span
                className="global-search-cat"
                style={{ color: categoryColors[item.category] || '#7A8494' }}
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
              <p>No articles found for <strong>"{query}"</strong></p>
              <button
                className="global-search-full-search"
                onClick={() => navigateSearch(query)}
              >
                Search all pages for "{query}"
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
                    onClick={() => { setQuery(r); inputRef.current?.focus(); }}
                  >
                    <Clock size={12} /> {r}
                  </button>
                  <button
                    className="global-search-recent-remove"
                    onClick={() => { removeRecent(r); setRecent(getRecent()); }}
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
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
          <span className="ml-auto"><kbd>Win</kbd>+<kbd>K</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> to open anytime</span>
        </div>
      </div>
    </div>
  );
}
