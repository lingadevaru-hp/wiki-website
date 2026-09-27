import { useCallback, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Ellipsis,
  Hammer,
  House,
  Linkedin,
  Menu,
  MessageCircle,
  Newspaper,
  Search,
  Trophy,
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
import { MusicNavbarToggle } from "./MusicControl";
import { OPEN_PICKER_EVENT } from "../lib/theme";
import { OPEN_PALETTE_EVENT } from "../lib/command-menu";
import { toggleChatPanel } from "../lib/chat-panel";

const CHAT_SEEN_KEY = "wiki-chat-seen";

function useChatPulse(): [boolean, () => void] {
  const [pulse, setPulse] = useState(() => {
    try {
      return localStorage.getItem(CHAT_SEEN_KEY) !== "1";
    } catch {
      return false;
    }
  });
  const markSeen = useCallback(() => {
    setPulse(false);
    try {
      localStorage.setItem(CHAT_SEEN_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  }, []);
  return [pulse, markSeen];
}

interface WikiHeaderProps {
  showBackButton?: boolean;
  /** Hierarchical back target (news → wiki home, wiki home → landing).
   *  Defaults to /wiki/home; providing it forces the arrow visible. */
  backHref?: string;
}

export default function WikiHeader({
  showBackButton = false,
  backHref,
}: WikiHeaderProps) {
  const { openSearch } = useSearch();
  const { t } = useLocale();
  const [location, setLocation] = useLocation();
  const [chatPulse, markChatSeen] = useChatPulse();
  const openPicker = () =>
    window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT));
  const isArticle =
    location.startsWith("/wiki/") &&
    location !== "/wiki/home" &&
    location !== "/wiki/search";
  const backTarget = backHref ?? "/wiki/home";
  const showBack = showBackButton || isArticle || backHref !== undefined;

  return (
    <header className="wiki-header">
      <div className="wiki-header-inner">
        <button
          className="header-icon-button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))
          }
          aria-label={t("nav.open")}
          data-testid="button-hamburger"
        >
          <Menu size={19} />
        </button>
        {(showBack) && (
          <button
            className="header-back-button"
            onClick={() => setLocation(backTarget)}
            aria-label={backTarget === "/wiki/home" ? t("nav.backWikiHome") : t("nav.goBack")}
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
          onClick={() => openSearch()}
          aria-label={t("nav.searchArticles")}
          data-testid="button-open-search"
        >
          <Search size={16} />
          <span>{t("nav.searchArticles")}</span>
          <kbd>⌘ K</kbd>
        </button>
        {/* Chat trigger lives outside header-nav so it stays visible on
            mobile (<900px hides header-nav) like search/language/theme. */}
        <button
          type="button"
          className={`header-icon-link${chatPulse ? " chat-pulse-once" : ""}`}
          onClick={() => {
            markChatSeen();
            toggleChatPanel();
          }}
          aria-label={t("nav.chat")}
          title={t("nav.chat")}
          data-testid="button-chat-panel"
        >
          <MessageCircle size={18} />
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
          {/* Overflow popup menu, copied from the omarchy-site mobile sheet
              pattern (icon + label rows for the secondary links). */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className="header-icon-button"
              aria-label={t("nav.moreLinks")}
              data-testid="button-more-links"
            >
              <Ellipsis size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="bottom"
              sideOffset={10}
              collisionPadding={12}
              avoidCollisions
              sticky="always"
              hideWhenDetached={false}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="w-56 wiki-more-menu"
            >
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
                <Link
                  href="/projects"
                  className="flex items-center gap-3"
                >
                  <Hammer size={16} aria-hidden="true" />
                  <span>{t("type.projects")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/achievements"
                  className="flex items-center gap-3"
                >
                  <Trophy size={16} aria-hidden="true" />
                  <span>{t("type.achievements")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/news"
                  className="flex items-center gap-3"
                >
                  <Newspaper size={16} aria-hidden="true" />
                  <span>{t("type.news")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  toggleChatPanel();
                }}
              >
                <span className="flex items-center gap-3">
                  <MessageCircle size={16} aria-hidden="true" />
                  <span>{t("nav.chat")}</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <LanguageSwitcher />
        {/* Global pause/unpause: the landing float card unmounts off-home,
            so this icon is the stop button on every other page. Appears
            once the sound has been touched. */}
        <MusicNavbarToggle />
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
