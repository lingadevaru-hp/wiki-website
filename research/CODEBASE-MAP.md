# CODEBASE-MAP — portfolio (`artifacts/thoshan-wiki`)

> Short map for agents. Stack: React + Vite + Tailwind v4 + wouter + Radix + TanStack Query + posthog. Single CSS monolith `src/index.css` (~9.6k lines) holds nearly all styling + motion tokens (`:root` ~L175). i18n: `src/i18n/`, dicts `public/locales/{8}.json`, host-detected subdomains.

- `src/pages/`: LandingPage, HomePage (+HomeRedesign.css), ArticlesPage, Collections, ArticlePage, SearchPage, NotFoundPage
- `src/components/`: WikiHeader, WikiLayout, CommandMenu, GlobalSearch, SearchResults, ShortcutsModal, LanguageSwitcher, ThemePicker (+EtchPicker), MediaViewer, TableOfContents, ArticleView, ArticleAudioReader, ContentBlock, Infobox, TextSelectionCopy, Newsletter, ChatPanel (+`lib/chat-panel.ts` iframe shell), Brand, MusicControl, SEO, Breadcrumbs, CategoryPills, CollectionHero, References, Section, WikiText, VerificationMap, HeroShader/HeroPixelField/SpaceField, icons/, ui/ (shadcn Radix set)
- `src/contexts/`: ThemeContext (SITE_THEMES 22), LocaleContext, SearchContext (+ChatPanelContext?)
- `src/lib/`: theme.ts (paintChrome per-theme theme-color), command-menu.ts, articleLoader.ts, categories, posthog, music
- `src/hooks/`: use-toast, useDebounce, use-focus-restore (v10.10 new)
- Build: `vite build` → dist (~31MB w/ media); chunks split: vendor-react/radix/query/posthog + app + route (v10.10)
- Tests: none in repo. Typecheck: `tsc --noEmit`. No lint config found (tsc + build are the gates).
