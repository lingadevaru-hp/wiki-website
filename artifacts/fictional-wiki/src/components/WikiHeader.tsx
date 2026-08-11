import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSearch } from '../contexts/SearchContext';
import { searchArticles } from '../lib/articleLoader';
import type { ArticleIndexEntry } from '../types/article';
import { useDebounce } from '../hooks/useDebounce';

interface WikiHeaderProps {
  onMenuClick: () => void;
}

export default function WikiHeader({ onMenuClick }: WikiHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { openSearch } = useSearch();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 150);
  const [suggestions, setSuggestions] = useState<ArticleIndexEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: / focuses inline search; Win/Ctrl/Cmd+K opens global modal
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // / alone → focus inline header search (only when not typing)
      if (e.key === '/' && !inInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      // Win+K / Ctrl+K / Cmd+K → open global modal (handled in App.tsx too, belt+suspenders)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey || e.getModifierState?.('OS'))) {
        e.preventDefault();
        openSearch();
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [openSearch]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    searchArticles(debouncedQuery).then((results) => {
      if (!cancelled) {
        setSuggestions(results.slice(0, 6));
        setShowSuggestions(true);
        setActiveIdx(-1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        navigate(suggestions[activeIdx].slug);
      } else if (query.trim()) {
        e.preventDefault();
        setLocation(`/wiki/search?q=${encodeURIComponent(query)}`);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }

  function navigate(slug: string) {
    setLocation(`/wiki/${slug}`);
    setQuery('');
    setShowSuggestions(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/wiki/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-2 px-3 py-2 max-w-[1400px] mx-auto">
        <button
          data-testid="button-hamburger"
          onClick={onMenuClick}
          className="p-1.5 hover:bg-card rounded text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <Link href="/" data-testid="link-wordmark" className="flex items-center gap-1.5 shrink-0 group">
          <span className="font-serif font-bold text-lg tracking-wide text-foreground group-hover:text-accent transition-colors">
            Thoshan&apos;s Wiki
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest bg-accent/15 text-accent rounded-sm border border-accent/20">
            Fictional
          </span>
        </Link>

        <div ref={searchRef} className="flex-1 relative mx-2 max-w-xl">
          <form onSubmit={handleSubmit} className="flex">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                ref={inputRef}
                data-testid="input-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                placeholder="Search Thoshan's Wiki..."
                role="combobox"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                className="w-full pl-8 pr-12 py-1.5 text-sm border border-border bg-background/80 text-foreground focus:outline-none focus:border-accent rounded-l transition-colors"
              />
              <kbd
                className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none items-center gap-0.5 rounded border border-border bg-card px-1.5 text-[10px] font-medium text-muted-foreground cursor-pointer"
                onClick={openSearch}
                title="Open full search (Win+K)"
              >
                ⊞K
              </kbd>
            </div>
            <button
              data-testid="button-search-submit"
              type="submit"
              className="px-3 py-1.5 text-sm font-medium border border-l-0 border-border bg-card hover:bg-border/30 text-foreground rounded-r transition-colors"
            >
              Search
            </button>
          </form>
          <button
            data-testid="button-browse-all"
            onClick={() => setLocation('/wiki/main-page')}
            className="ml-2 px-3 py-1.5 text-sm font-medium border border-border bg-card hover:bg-border/30 text-foreground rounded transition-colors"
          >
            Browse all
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 bg-background/95 border border-border shadow-xl z-50 mt-1 rounded-sm overflow-hidden"
              role="listbox"
            >
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  data-testid={`suggestion-item-${s.id}`}
                  onClick={() => navigate(s.slug)}
                  role="option"
                  aria-selected={i === activeIdx}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2.5 border-b border-border/40 last:border-0 hover:bg-card/90 transition-colors ${
                    i === activeIdx ? 'bg-card text-accent font-semibold' : 'text-foreground'
                  }`}
                >
                  {s.thumbnail ? (
                    <img
                      src={s.thumbnail}
                      alt=""
                      className="w-7 h-7 object-cover rounded-sm border border-border shrink-0"
                    />
                  ) : (
                    <Search size={14} className="text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight truncate">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.excerpt}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-card border border-border rounded-xs shrink-0">
                    {s.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-1.5 text-xs text-foreground shrink-0">
          <a
            href="https://github.com/lingadevaru-hp"
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent px-2 py-1 hover:bg-card rounded transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/lingadevaruhp"
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent px-2 py-1 hover:bg-card rounded transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="https://huggingface.co/lingadevaruhp"
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent px-2 py-1 hover:bg-card rounded transition-colors"
          >
            🤗 HF
          </a>
        </nav>

        <button
          data-testid="button-theme-toggle"
          onClick={toggleTheme}
          className="p-1.5 hover:bg-card rounded ml-1 text-foreground transition-colors shrink-0"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
