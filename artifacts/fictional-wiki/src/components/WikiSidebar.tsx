import { Link } from 'wouter';
import { X, Bookmark, Trash2 } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';

interface WikiSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { label: '⌂ Home', href: '/' },
  { label: 'Main Page', href: '/wiki/main-page' },
  { label: 'About Thoshan', href: '/wiki/about' },
];

const articleLinks = [
  { label: 'About', href: '/wiki/about', category: 'Profile' },
  { label: 'FOSS Coin', href: '/wiki/foss-coin', category: 'Blockchain' },
  { label: 'Thoshan Flash', href: '/wiki/thoshan-flash', category: 'AI / ML' },
  { label: 'Insurance DApp', href: '/wiki/insurance-dapp', category: 'Blockchain' },
  { label: 'Libre Cloud — Homelab', href: '/wiki/homelab', category: 'Infrastructure' },
  { label: 'Privacy Stack', href: '/wiki/privacy-stack', category: 'Security' },
  { label: 'Linux Setup', href: '/wiki/linux-setup', category: 'Systems' },
  { label: 'Fraud Detection System', href: '/wiki/fraud-detection', category: 'AI / ML' },
  { label: 'LocalPulse', href: '/wiki/local-pulse', category: 'Web' },
  { label: 'Learning Roadmap', href: '/wiki/learning-roadmap', category: 'Learning' },
];

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

function NavContent({ onClose }: { onClose: () => void }) {
  const { bookmarks, removeBookmark } = useBookmarks();

  return (
    <nav className="p-3 text-sm space-y-4">
      <ul className="space-y-0.5">
        {navLinks.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              onClick={onClose}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
              className="block px-2 py-1 hover:bg-background hover:text-accent text-foreground rounded-sm transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Bookmarks Section */}
      {bookmarks.length > 0 && (
        <div className="pt-2 border-t border-border" data-testid="sidebar-bookmarks">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
              <Bookmark size={12} className="text-accent" /> Saved ({bookmarks.length})
            </span>
          </div>
          <ul className="space-y-1 mt-1">
            {bookmarks.map((b) => (
              <li key={b.slug} className="group flex items-center justify-between gap-1">
                <Link
                  href={`/wiki/${b.slug}`}
                  onClick={onClose}
                  className="block flex-1 min-w-0 px-2 py-1 hover:bg-background hover:text-accent text-foreground rounded-sm transition-colors"
                >
                  <span className="block text-xs font-medium truncate">{b.title}</span>
                  <span className="text-[10px]" style={{ color: categoryColors[b.category] ?? '#A8A8A8' }}>
                    {b.category}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeBookmark(b.slug)}
                  title="Remove bookmark"
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Articles Section */}
      <div className="pt-2 border-t border-border">
        <p className="px-2 py-1 text-xs font-bold uppercase text-muted-foreground tracking-wider">Articles</p>
        <ul className="space-y-0.5 mt-1">
          {articleLinks.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                onClick={onClose}
                data-testid={`article-link-${l.href.split('/').pop()}`}
                className="block px-2 py-1 hover:bg-background hover:text-accent text-foreground rounded-sm transition-colors"
              >
                <span className="block text-xs leading-tight">{l.label}</span>
                <span className="text-[10px]" style={{ color: categoryColors[l.category] ?? '#A8A8A8' }}>
                  {l.category}
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
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="font-serif font-bold">Navigation</span>
          <button onClick={onClose} className="p-1 text-foreground" data-testid="button-close-sidebar">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-56px)]">
          <NavContent onClose={onClose} />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <div
        className={`
          hidden md:block shrink-0 overflow-hidden
          transition-all duration-200 ease-in-out
          ${open ? 'w-[180px] lg:w-[200px]' : 'w-0'}
        `}
      >
        <aside className="w-[180px] lg:w-[200px] sticky top-[49px] max-h-[calc(100vh-49px)] overflow-y-auto border-r border-border">
          <NavContent onClose={onClose} />
        </aside>
      </div>
    </>
  );
}
