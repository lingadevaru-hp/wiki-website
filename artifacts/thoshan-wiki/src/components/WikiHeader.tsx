import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Ellipsis,
  House,
  Linkedin,
  Menu,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react";
import { useSearch } from "../contexts/SearchContext";
import { useLocale } from "../contexts/LocaleContext";
import { GithubIcon, PaletteIcon } from "./icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OPEN_PICKER_EVENT } from "../lib/theme";
import { OPEN_PALETTE_EVENT } from "../lib/command-menu";

interface WikiHeaderProps {
  onMenuClick: () => void;
  showBackButton?: boolean;
}

export default function WikiHeader({
  onMenuClick,
  showBackButton = false,
}: WikiHeaderProps) {
  const { openSearch } = useSearch();
  const { t } = useLocale();
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
          aria-label={t("nav.open")}
          data-testid="button-hamburger"
        >
          <Menu size={19} />
        </button>
        {(showBackButton || isArticle) && (
          <button
            className="header-back-button"
            onClick={() => setLocation("/wiki/home")}
            aria-label={t("nav.backWikiHome")}
            data-testid="button-back"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <Link
          href="/"
          className="wiki-wordmark"
          data-testid="link-wordmark"
          aria-label={t("nav.menu")}
          onClick={(event) => {
            // Plain click opens the command menu (omarchy-site glyph pattern);
            // modified clicks still navigate home.
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
          }}
        >
          <span className="wordmark-mark">T</span>
          <span>{t("nav.wordmark")}</span>
        </Link>
        <button
          className="header-search-button"
          onClick={openSearch}
          aria-label={t("nav.searchArticles")}
          data-testid="button-open-search"
        >
          <Search size={16} />
          <span>{t("nav.searchArticles")}</span>
          <kbd>⌘ K</kbd>
        </button>
        <nav className="header-nav" aria-label={t("nav.primary")}>
          <Link
            href="/wiki/home"
            aria-label={t("nav.wikiHome")}
            title={t("nav.wikiHome")}
            className="header-icon-link"
          >
            <House size={18} />
          </Link>
          <Link
            href="/wiki/about"
            aria-label={t("nav.about")}
            title={t("nav.about")}
            className="header-icon-link"
          >
            <UserRound size={18} />
          </Link>
          <a
            href="https://github.com/lingadevaru-hp"
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={t("nav.github")}
            title={t("nav.github")}
            className="header-icon-link"
          >
            <GithubIcon className="size-[18px]" />
          </a>
          <a
            href="https://chat.lingadevaru.in"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("nav.chat")}
            title={t("nav.chat")}
            className="header-icon-link"
          >
            <MessageCircle size={18} />
          </a>
          {/* Overflow popup menu, copied from the omarchy-site mobile sheet
              pattern (icon + label rows for the secondary links). */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="header-icon-button"
              aria-label={t("nav.moreLinks")}
              data-testid="button-more-links"
            >
              <Ellipsis size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-56">
              <DropdownMenuItem asChild>
                <a
                  href="https://linkedin.com/in/lingadevaruhp"
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="flex items-center gap-3"
                >
                  <Linkedin size={16} aria-hidden="true" />
                  <span>{t("nav.linkedin")}</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://chat.lingadevaru.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  <span>{t("nav.chat")}</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <LanguageSwitcher />
        <button
          className="header-icon-button theme-toggle"
          onClick={openPicker}
          aria-label={t("nav.theme")}
          title={t("nav.theme")}
          data-testid="button-theme-toggle"
        >
          <PaletteIcon className="size-[17px]" />
        </button>
      </div>
    </header>
  );
}
