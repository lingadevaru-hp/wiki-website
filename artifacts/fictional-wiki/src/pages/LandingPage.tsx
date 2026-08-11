import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Search, Github, ExternalLink, BookOpen } from 'lucide-react';
import { loadArticlesIndex } from '../lib/articleLoader';
import type { ArticleIndexEntry } from '../types/article';
import { useSearch } from '../contexts/SearchContext';

const categoryColors: Record<string, string> = {
  'Profile':        '#3366CC',
  'Blockchain':     '#E67E22',
  'AI / ML':        '#8E44AD',
  'Infrastructure': '#27AE60',
  'Security':       '#C0392B',
  'Systems':        '#2980B9',
  'Web':            '#16A085',
  'Learning':       '#F39C12',
};

const GIF_URL = '/assets/foss-Thumbnail.gif';
const LOGO_URL = 'https://raw.githubusercontent.com/lingadevaru-hp/Foss-Token/refs/heads/main/foss-logo.png';

const highlights = [
  { label: '10 public repos', icon: '📁' },
  { label: 'Solana SPL token live on Orca DEX', icon: '🪙' },
  { label: 'Gemma-2-9B fine-tune · 26+ HF downloads', icon: '🤖' },
  { label: 'Builder of deployed projects', icon: '🚀' },
];

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [, setLocation] = useLocation();
  const { openSearch } = useSearch();
  const belowFoldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadArticlesIndex().then((idx) => setArticles(idx.articles));
    // Eagerly pre-fetch the GIF so it's in the browser cache by the time user scrolls
    const img = new Image();
    img.src = GIF_URL;
    const logo = new Image();
    logo.src = LOGO_URL;
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/wiki/search?q=${encodeURIComponent(query)}`);
    } else {
      setLocation('/wiki/main-page');
    }
  }

  function scrollDown() {
    belowFoldRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const fossCoin = articles.find((a) => a.slug === 'foss-coin');
  const otherArticles = articles.filter((a) => a.slug !== 'foss-coin');

  return (
    <div className="min-h-screen bg-[#101418] text-[#E8E8E8] flex flex-col">

      {/* ── HERO (full viewport) ─────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative select-none">
        {/* Globe */}
        <div className="mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="#505868" strokeWidth="2" fill="none" />
            <ellipse cx="40" cy="40" rx="18" ry="38" stroke="#505868" strokeWidth="1.5" fill="none" />
            <ellipse cx="40" cy="40" rx="38" ry="12" stroke="#505868" strokeWidth="1.5" fill="none" />
            <line x1="2" y1="40" x2="78" y2="40" stroke="#505868" strokeWidth="1.5" />
            <path d="M10 22 Q40 30 70 22" stroke="#505868" strokeWidth="1" fill="none" />
            <path d="M10 58 Q40 50 70 58" stroke="#505868" strokeWidth="1" fill="none" />
            <text x="40" y="46" textAnchor="middle" fill="#C8D0DC" fontSize="22" fontFamily="Georgia, serif" fontWeight="bold">T</text>
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-widest text-[#E8E8E8] uppercase mb-3 text-center">
          Thoshan's Wiki
        </h1>
        <p className="text-sm text-[#7A8494] tracking-wide mb-10">A personal knowledge base</p>

        {/* Search — clicking opens the global search modal */}
        <form onSubmit={handleSearch} className="flex w-full max-w-md mb-3 gap-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#505868]" />
            <input
              data-testid="input-landing-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={openSearch}
              placeholder="Search articles…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-[#2A3040] bg-[#161C24] text-[#E8E8E8] focus:outline-none focus:border-[#3366CC] placeholder:text-[#505868] cursor-pointer"
              readOnly
            />
          </div>
          <button
            data-testid="button-landing-search"
            type="button"
            onClick={openSearch}
            className="px-4 py-2 bg-[#3366CC] text-white text-sm hover:bg-[#2255bb] flex items-center gap-1.5 transition-colors"
          >
            <Search size={13} />
            Search
          </button>
          <button
            data-testid="button-browse-all-landing"
            type="button"
            onClick={() => setLocation('/wiki/main-page')}
            className="px-4 py-2 bg-[#2A3040] text-[#E8E8E8] text-sm hover:bg-[#3366CC] transition-colors"
          >
            Browse all
          </button>
        </form>

        {/* Shortcut hint */}
        <div className="flex items-center gap-2 mb-8 text-[11px] text-[#505868]">
          <kbd style={{ fontFamily: 'monospace', background: '#1E2530', border: '1px solid #2A3040', borderRadius: '4px', padding: '1px 6px', color: '#8090A8' }}>Win</kbd>
          <span>+</span>
          <kbd style={{ fontFamily: 'monospace', background: '#1E2530', border: '1px solid #2A3040', borderRadius: '4px', padding: '1px 6px', color: '#8090A8' }}>K</kbd>
          <span>or</span>
          <kbd style={{ fontFamily: 'monospace', background: '#1E2530', border: '1px solid #2A3040', borderRadius: '4px', padding: '1px 6px', color: '#8090A8' }}>Ctrl</kbd>
          <span>+</span>
          <kbd style={{ fontFamily: 'monospace', background: '#1E2530', border: '1px solid #2A3040', borderRadius: '4px', padding: '1px 6px', color: '#8090A8' }}>K</kbd>
          <span>to open full search</span>
        </div>

        {/* ── Scroll prompt — visible on both mobile & desktop ── */}
        <button
          onClick={scrollDown}
          aria-label="Scroll to explore"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group"
          style={{ animation: 'scrollPulse 2.5s ease-in-out infinite' }}
        >
          <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#8090A8] group-hover:text-[#A0AABC] transition-colors">
            Explore
          </span>
          <div className="w-9 h-9 rounded-full border-2 border-[#2E3A4A] bg-[#161C24]/70 flex items-center justify-center group-hover:border-[#3366CC] group-hover:bg-[#1E2A3A] transition-all duration-200">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 5.5L8 10.5L13 5.5" stroke="#6B7C96" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#5590E8] transition-colors" />
            </svg>
          </div>
        </button>

        <style>{`
          @keyframes scrollPulse {
            0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.8; }
            50% { transform: translateX(-50%) translateY(8px); opacity: 1; }
          }
        `}</style>
      </section>

      {/* ── BELOW FOLD ───────────────────────────────────────────── */}
      <div ref={belowFoldRef} className="flex flex-col items-center px-4 pb-16">

        {/* Profile card */}
        <div className="w-full max-w-3xl mb-10 pt-8">
          <div className="border border-[#2A3040] bg-[#161C24] p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#3366CC] mb-1">About the author</p>
                <h2 className="text-xl font-serif font-bold text-[#E8E8E8] mb-2">Lingadevaru H P</h2>
                <p className="text-sm text-[#A0AABC] leading-relaxed mb-4">
                  Builder of deployed projects across blockchain, AI/ML, and cloud infrastructure.
                  Career focus: computer networking, cloud computing, and cybersecurity — operational roles.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {highlights.map((h) => (
                    <div key={h.label} className="flex items-center gap-2 text-xs text-[#8090A8]">
                      <span>{h.icon}</span>
                      <span>{h.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="https://github.com/lingadevaru-hp" target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#3366CC] hover:underline border border-[#2A3040] px-3 py-1.5 hover:border-[#3366CC] transition-colors">
                    <Github size={12} /> GitHub
                  </a>
                  <a href="https://linkedin.com/in/lingadevaruhp" target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#0A66C2] hover:underline border border-[#2A3040] px-3 py-1.5 hover:border-[#0A66C2] transition-colors">
                    <ExternalLink size={12} /> LinkedIn
                  </a>
                  <a href="https://huggingface.co/lingadevaruhp" target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#E67E22] hover:underline border border-[#2A3040] px-3 py-1.5 hover:border-[#E67E22] transition-colors">
                    🤗 HuggingFace
                  </a>
                  <button onClick={() => setLocation('/wiki/about')}
                    className="flex items-center gap-1.5 text-xs text-[#A0AABC] hover:text-[#E8E8E8] border border-[#2A3040] px-3 py-1.5 hover:border-[#505868] transition-colors">
                    <BookOpen size={12} /> Full profile
                  </button>
                </div>
              </div>
              <div className="shrink-0 flex flex-row md:flex-col gap-3 flex-wrap md:flex-nowrap">
                {[
                  { label: 'Articles', value: String(articles.length || 10), color: '#3366CC' },
                  { label: 'Live projects', value: '5+', color: '#27AE60' },
                  { label: 'HF downloads', value: '26+', color: '#8E44AD' },
                  { label: 'GitHub stars', value: '7⭐', color: '#E67E22' },
                ].map((s) => (
                  <div key={s.label} className="text-center border border-[#2A3040] px-4 py-2 min-w-[72px]">
                    <p className="text-lg font-bold font-serif" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] text-[#7A8494] uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FOSS COIN FEATURED ───────────────────────────────── */}
        {fossCoin && (
          <div className="w-full max-w-3xl mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#2A3040]" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#505868]">Featured project</h2>
              <div className="flex-1 h-px bg-[#2A3040]" />
            </div>
            <button
              onClick={() => setLocation('/wiki/foss-coin')}
              className="w-full text-left border border-[#2A3040] bg-[#161C24] hover:bg-[#1E2530] hover:border-[#E67E22] transition-all group overflow-hidden"
              data-testid="foss-coin-featured"
            >
              {/* GIF with eager loading — already pre-fetched on mount */}
              <div className="w-full overflow-hidden bg-[#0D1117]" style={{ maxHeight: '320px' }}>
                <img
                  src={GIF_URL}
                  alt="FOSS Coin live trading on Orca DEX"
                  className="w-full object-cover"
                  style={{ maxHeight: '320px', display: 'block' }}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 mb-2 inline-block"
                  style={{ color: '#E67E22', background: '#E67E221A', borderLeft: '2px solid #E67E22' }}>
                  Blockchain
                </span>
                <h3 className="text-xl font-serif font-bold text-[#E67E22] group-hover:underline mb-2">
                  FOSS Coin ($FOSS)
                </h3>
                <p className="text-sm text-[#8090A8] leading-relaxed">
                  A Solana SPL token deployed live on the Orca Whirlpool DEX — 1 billion fixed supply, mint authority permanently revoked.
                  Built to explore Solana at the instruction level: atomic transactions, Metaplex metadata, IPFS pinning, and concentrated liquidity AMMs.
                </p>
                <div className="mt-4 flex gap-4 text-xs text-[#505868]">
                  <span>🪙 Solana Mainnet</span>
                  <span>📈 Orca Whirlpool</span>
                  <span>⭐ 7 stars · 4 forks</span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── ALL OTHER ARTICLES ───────────────────────────────── */}
        {otherArticles.length > 0 && (
          <div className="w-full max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#2A3040]" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#505868]">All articles</h2>
              <div className="flex-1 h-px bg-[#2A3040]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {otherArticles.map((article) => (
                <button
                  key={article.id}
                  data-testid={`article-card-${article.id}`}
                  onClick={() => setLocation(`/wiki/${article.slug}`)}
                  className="text-left border border-[#2A3040] bg-[#161C24] hover:bg-[#1E2530] hover:border-[#3366CC] transition-all duration-150 p-3 group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                      style={{
                        color: categoryColors[article.category] || '#7A8494',
                        background: `${categoryColors[article.category] || '#7A8494'}1A`,
                        borderLeft: `2px solid ${categoryColors[article.category] || '#7A8494'}`,
                      }}>
                      {article.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#3B7CDB] group-hover:text-[#5590E8] group-hover:underline leading-tight mb-1.5">
                    {article.title}
                  </p>
                  <p className="text-xs leading-snug line-clamp-2" style={{ color: '#60708A' }}>
                    {article.excerpt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-[#1E2530] py-4 px-4 text-xs text-[#505868] text-center">
        <p>
          Thoshan's personal wiki · Wikipedia-style knowledge base
          <span className="mx-2">·</span>
          <a href="https://github.com/lingadevaru-hp" className="text-[#3366CC] hover:underline" target="_blank" rel="noreferrer">
            github.com/lingadevaru-hp
          </a>
        </p>
      </footer>
    </div>
  );
}
