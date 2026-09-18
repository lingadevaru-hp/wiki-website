/**
 * Command-palette menu tree, copied from the omarchy-site palette pattern
 * (omarchy-site/src/lib/menu.ts): a flat list with dotted ids, rows that
 * either navigate or open a submenu. Adapted to this site's routes.
 */

export type CommandIcon =
  | 'home'
  | 'wiki'
  | 'articles'
  | 'search'
  | 'themes'
  | 'language'
  | 'github'
  | 'linkedin'
  | 'chat'
  | 'about'

export type CommandItem = {
  id: string
  label: string
  icon: CommandIcon
  /** In-site destination (wouter path). */
  to?: string
  /** External destination. */
  href?: string
  /** Special action handled by the palette. */
  action?: 'search' | 'themes'
  /** A locale to switch to. */
  locale?: string
  /** A text glyph drawn in place of the icon: a locale's flag. */
  glyph?: string
  /** Header shown while the submenu is open; defaults to the label. */
  title?: string
}

export const OPEN_PALETTE_EVENT = 'thoshan:open-palette'
export const LOCALE_EVENT = 'thoshan:locale'

const ITEMS: Array<CommandItem> = [
  // Root — mirrors the omarchy palette root order
  { id: 'home', label: 'Home', icon: 'home', to: '/' },
  { id: 'wiki', label: 'Wiki Home', icon: 'wiki', to: '/wiki/home' },
  { id: 'articles', label: 'Articles', icon: 'articles', to: '/wiki/articles' },
  { id: 'search', label: 'Search articles', icon: 'search', action: 'search' },
  { id: 'themes', label: 'Themes', icon: 'themes', action: 'themes' },
  { id: 'language', label: 'Language', icon: 'language' },
  {
    id: 'github',
    label: 'GitHub',
    icon: 'github',
    href: 'https://github.com/lingadevaru-hp',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'linkedin',
    href: 'https://linkedin.com/in/lingadevaruhp',
  },
  {
    id: 'chat',
    label: 'Chat with me',
    icon: 'chat',
    href: 'https://chat.lingadevaru.in',
  },
  { id: 'about', label: 'About', icon: 'about', to: '/wiki/about' },

  // Language submenu — English default, Kannada + Hindi options
  { id: 'language.en', label: 'English', icon: 'language', glyph: '🇬🇧', locale: 'en' },
  { id: 'language.kn', label: 'ಕನ್ನಡ', icon: 'language', glyph: '🇮🇳', locale: 'kn' },
  { id: 'language.hi', label: 'हिन्दी', icon: 'language', glyph: '🇮🇳', locale: 'hi' },
]

const parentOf = (id: string) =>
  id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : 'root'

/** Rows shown for a menu id, in the order they are declared. */
export function childrenOf(menu: string): Array<CommandItem> {
  return ITEMS.filter((item) => parentOf(item.id) === menu)
}

export const commandItem = (id: string) =>
  ITEMS.find((item) => item.id === id)

/** Every row a query typed at the root can reach, root first. */
export function everyRow(): Array<CommandItem> {
  return ITEMS.filter((item) => parentOf(item.id) === 'root')
}

/** A row opens a submenu when it has children of its own. */
export const opensMenu = (item: CommandItem) =>
  childrenOf(item.id).length > 0

export const menuTitle = (menu: string) => {
  const item = commandItem(menu)
  return item?.title ?? item?.label ?? 'Go'
}

/** Substring match on the label, the way the desktop menu filters a submenu. */
export function filterRows(rows: Array<CommandItem>, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return rows
  return rows.filter((row) => {
    const label = row.label.toLowerCase()
    return terms.every((term) => label.includes(term))
  })
}
