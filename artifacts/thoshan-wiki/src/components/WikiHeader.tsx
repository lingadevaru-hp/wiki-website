import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Search, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSearch } from '../contexts/SearchContext';

interface WikiHeaderProps {
  onMenuClick: () => void;
  showBackButton?: boolean;
}

export default function WikiHeader({ onMenuClick, showBackButton = false }: WikiHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { openSearch } = useSearch();
  const [location, setLocation] = useLocation();
  const isNotHome = location !== '/' && location !== '/wiki/home';

  // Keyboard shortcut: Win+K / Ctrl+K / Cmd+K or / opens global modal
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      // Win+K / Ctrl+K / Cmd+K → open global modal
      if (e.key === 'k' && (e.metaKey || e.ctrlKey || e.getModifierState?.('OS'))) {
        e.preventDefault();
        openSearch();
      }
      // / alone → open global search (only when not in input)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
        if (!inInput) {
          e.preventDefault();
          openSearch();
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [openSearch]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-2 px-3 py-2 max-w-[1400px] mx-auto">
        {(showBackButton || isNotHome) && (
          <button
            data-testid="button-back"
            onClick={() => setLocation('/wiki/home')}
            className="p-1.5 hover:bg-card rounded text-foreground transition-colors sm:hidden"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        
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
            Wiki
          </span>
        </Link>

        {/* Search button - triggers global modal */}
        <div className="flex-1 mx-2 max-w-xl">
          <button
            onClick={openSearch}
            data-testid="button-open-search"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm border border-border bg-background/80 text-foreground hover:bg-border/30 focus:outline-none focus:border-accent rounded-lg transition-colors"
            aria-label="Open search (Win+K or Ctrl+K)"
          >
            <Search size={16} className="text-muted-foreground" />
            <span className="hidden sm:inline">Search Thoshan's Wiki...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-card px-1.5 text-[10px] font-medium text-muted-foreground ml-auto">
              ⊞K
            </kbd>
          </button>
        </div>
        
        {/* Browse all button - only show on desktop and not on home page */}
        {location !== '/wiki/home' && location !== '/' && (
          <button
            data-testid="button-browse-all"
            onClick={() => setLocation('/wiki/home')}
            className="px-3 py-1.5 text-sm font-medium border border-border bg-card hover:bg-border/30 text-foreground rounded-lg transition-colors hidden md:inline-block"
          >
            Browse all
          </button>
        )}

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
