import { Link, useLocation } from "wouter";
import { ArrowLeft, Linkedin, Menu, Search } from "lucide-react";
import { useSearch } from "../contexts/SearchContext";
import { GithubIcon, PaletteIcon } from "./icons";
import { OPEN_PICKER_EVENT } from "../lib/theme";

interface WikiHeaderProps {
  onMenuClick: () => void;
  showBackButton?: boolean;
}

export default function WikiHeader({
  onMenuClick,
  showBackButton = false,
}: WikiHeaderProps) {
  const { openSearch } = useSearch();
  const [location, setLocation] = useLocation();
  const openPicker = () =>
    window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT));
  const isArticle =
    location.startsWith("/wiki/") &&
    location !== "/wiki/home" &&
    location !== "/wiki/search";

  return (
    <header className="wiki-header">
      <div className="wiki-header-inner">
        <button
          className="header-icon-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          data-testid="button-hamburger"
        >
          <Menu size={19} />
        </button>
        {(showBackButton || isArticle) && (
          <button
            className="header-back-button"
            onClick={() => setLocation("/wiki/home")}
            aria-label="Back to Wiki Home"
            data-testid="button-back"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <Link href="/" className="wiki-wordmark" data-testid="link-wordmark">
          <span className="wordmark-mark">T</span>
          <span>Thoshan&apos;s Wiki</span>
        </Link>
        <button
          className="header-search-button"
          onClick={openSearch}
          aria-label="Search articles"
          data-testid="button-open-search"
        >
          <Search size={16} />
          <span>Search articles</span>
          <kbd>⌘ K</kbd>
        </button>
        <nav className="header-nav" aria-label="Primary navigation">
          <Link href="/wiki/home">Wiki Home</Link>
          <Link href="/wiki/about">About</Link>
          <a
            href="https://github.com/lingadevaru-hp"
            target="_blank"
            rel="me noopener noreferrer"
            aria-label="GitHub"
            className="header-icon-link"
          >
            <GithubIcon className="size-[17px]" />
          </a>
          <a
            href="https://linkedin.com/in/lingadevaruhp"
            target="_blank"
            rel="me noopener noreferrer"
            aria-label="LinkedIn"
            className="header-icon-link"
          >
            <Linkedin size={17} />
          </a>
          <a
            href="https://chat.lingadevaru.in"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat with me
          </a>
        </nav>
        <button
          className="header-icon-button theme-toggle"
          onClick={openPicker}
          aria-label="Change theme (T)"
          title="Change theme (T)"
          data-testid="button-theme-toggle"
        >
          <PaletteIcon className="size-[17px]" />
        </button>
      </div>
    </header>
  );
}
