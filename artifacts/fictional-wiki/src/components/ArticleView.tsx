import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Printer,
  Quote,
  ArrowUp,
  Clock,
  Tag,
  Github,
} from 'lucide-react';
import type { Article, ArticleIndexEntry } from '../types/article';
import Infobox from './Infobox';
import TableOfContents from './TableOfContents';
import Section from './Section';
import References from './References';
import RevisionHistory from './RevisionHistory';
import { loadArticlesIndex } from '../lib/articleLoader';
import { useTheme } from '../contexts/ThemeContext';
import { useBookmarks } from '../hooks/useBookmarks';

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

interface ArticleViewProps {
  article: Article;
}

function parseWikiLink(inner: string): { slug: string; text: string } {
  const parts = inner.split('|');
  const rawSlug = parts[0].trim();
  const slug = rawSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const text = parts[1]?.trim() || parts[0].trim();
  return { slug, text };
}

function parseLeadText(text: string) {
  const paras = text.split(/\n\n+/);
  return paras.map((p, i) => {
    const parsed = p
      .replace(/\[\[(.*?)\]\]/g, (_m, inner) => {
        const { slug, text: display } = parseWikiLink(inner);
        return `<a href="/wiki/${slug}" class="text-accent hover:underline">${display}</a>`;
      })
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (_m, label, url) => {
        return `<a href="${url}" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    return <p key={i} className="mb-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed }} />;
  });
}

function calculateReadingTime(article: Article): number {
  let text = article.lead || '';
  article.sections.forEach((sec) => {
    text += ' ' + sec.title;
    sec.content.forEach((b) => {
      if (b.content) text += ' ' + b.content;
      if (b.caption) text += ' ' + b.caption;
    });
  });
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ArticleView({ article }: ArticleViewProps) {
  const { theme, setTheme } = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [activeSection, setActiveSection] = useState('');
  const [fontSize, setFontSize] = useState<'small' | 'standard' | 'large'>('large');
  const [contentWidth, setContentWidth] = useState<'standard' | 'wide'>('wide');
  const [allArticles, setAllArticles] = useState<ArticleIndexEntry[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  const bookmarked = isBookmarked(article.metadata.slug);
  const readingTime = calculateReadingTime(article);

  useEffect(() => {
    loadArticlesIndex().then((idx) => setAllArticles(idx.articles));
  }, []);

  // Intersection observer for section tracking & scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    const sections = document.querySelectorAll('.wiki-section[id]');
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [article]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCitation = () => {
    const citation = `Thoshan's Wiki contributors. "${article.metadata.title}." Thoshan's Wiki, Fictional Encyclopedia, ${new Date(article.metadata.lastEdited).getFullYear()}, ${window.location.href}.`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';
  const maxWidthClass = contentWidth === 'wide' ? 'max-w-none' : 'max-w-[680px]';

  return (
    <div className="flex gap-6 flex-1 relative">
      {/* Scroll Progress Indicator Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-accent/20 z-[60] pointer-events-none">
        <div
          className="h-full bg-accent transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className={`flex-1 min-w-0 ${fontSizeClass}`} ref={articleRef}>
        <div className={`${maxWidthClass}`}>
          {/* Article Header & Metadata */}
          <h1
            className="text-[1.95em] font-normal font-serif mb-1 text-foreground"
            data-testid="article-title"
          >
            {article.metadata.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {readingTime} min read
            </span>
            <span>·</span>
            <span>Last edited {new Date(article.metadata.lastEdited).toLocaleDateString()}</span>
            <span>·</span>
            <span className="font-semibold" style={{ color: categoryColors[article.metadata.category] || '#3366CC' }}>
              {article.metadata.category}
            </span>
          </div>

          {/* Action Bar (Bookmark, Share, Copy Citation, Print) */}
          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-card border border-border text-xs rounded-sm print:hidden">
            <button
              type="button"
              onClick={() =>
                toggleBookmark({
                  slug: article.metadata.slug,
                  title: article.metadata.title,
                  category: article.metadata.category,
                })
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 border transition-colors ${
                bookmarked
                  ? 'border-accent bg-accent/15 text-accent font-semibold'
                  : 'border-border hover:bg-border/30 text-foreground'
              }`}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark this article'}
              data-testid="button-bookmark"
            >
              {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {bookmarked ? 'Saved to Bookmarks' : 'Bookmark'}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border hover:bg-border/30 text-foreground transition-colors"
              title="Copy link to this article"
              data-testid="button-copy-link"
            >
              {copiedLink ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
              {copiedLink ? 'Link Copied!' : 'Copy Link'}
            </button>

            <button
              type="button"
              onClick={handleCopyCitation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border hover:bg-border/30 text-foreground transition-colors"
              title="Copy a formatted citation for this article"
              data-testid="button-cite"
            >
              {copiedCitation ? <Check size={14} className="text-accent" /> : <Quote size={14} />}
              {copiedCitation ? 'Citation Copied!' : 'Cite Article'}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border hover:bg-border/30 text-foreground transition-colors ml-auto"
              title="Print this article"
              data-testid="button-print"
            >
              <Printer size={14} />
              Print
            </button>
          </div>

          {article.infobox && <Infobox data={article.infobox} />}

          {article.githubButton && (
            <div className="mb-4">
              <a
                href={article.githubButton.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-border/30 text-foreground transition-colors rounded-sm text-sm font-medium"
                title={article.githubButton.title}
                data-testid="github-button"
              >
                <Github size={16} />
                {article.githubButton.text}
              </a>
            </div>
          )}

          {article.subArticles && article.subArticles.length > 0 && (
            <div className="mb-6 border border-border rounded-sm overflow-hidden" data-testid="sub-articles-section">
              <div className="bg-card px-4 py-3 border-b border-border">
                <h2 className="text-lg font-bold">📚 Sub-Articles</h2>
                <p className="text-xs text-muted-foreground mt-1">Detailed documentation and resources for this project</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {article.subArticles.map((subArticle) => (
                    <Link
                      key={subArticle.slug}
                      href={`/wiki/${subArticle.slug}`}
                      className="block p-3 border border-border hover:bg-card/50 rounded-sm transition-colors"
                      data-testid={`sub-article-${subArticle.slug}`}
                    >
                      <h3 className="text-sm font-semibold text-foreground mb-1">{subArticle.title}</h3>
                      <p className="text-xs text-muted-foreground">{subArticle.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="lead mb-2">{parseLeadText(article.lead)}</div>

          <TableOfContents sections={article.sections} activeId={activeSection} />

          <div className="clearfix">
            {article.sections.map((section) => (
              <Section key={section.id} section={section} />
            ))}
          </div>

          {article.perspectives && article.perspectives.length > 0 && (
            <section className="mt-6 border-t border-border pt-4">
              <h2 className="text-[1.4em] font-bold border-b border-border pb-1 mb-3 font-serif">
                Different Perspectives
              </h2>
              <div className="space-y-3">
                {article.perspectives.map((p, i) => (
                  <div key={i} className="border border-border p-3 bg-card">
                    <h3 className="font-bold text-sm mb-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <References references={article.references} />

          <div className="mt-4 pt-3 border-t border-border text-sm flex items-center gap-2">
            <Tag size={14} className="text-muted-foreground" />
            <span className="font-bold">Categories: </span>
            <div className="flex flex-wrap items-center gap-1">
              {article.categories.map((cat, i) => (
                <span key={cat}>
                  {i > 0 && ' · '}
                  <Link href={`/wiki/search?q=${encodeURIComponent(cat)}`} className="text-accent hover:underline">
                    {cat}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar panel */}
      <aside className="hidden lg:block w-[210px] shrink-0 print:hidden">
        <div className="sticky top-[56px] space-y-3">
          {/* Appearance panel */}
          <div className="border border-border bg-card overflow-hidden" data-testid="appearance-panel">
            <div className="px-3 py-2 border-b border-border bg-card/60">
              <p className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Appearance</p>
            </div>

            <div className="px-3 py-2.5 space-y-3">
              {/* Text size */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Text size</p>
                <div className="flex gap-1">
                  {(['small', 'standard', 'large'] as const).map((s) => (
                    <button
                      key={s}
                      data-testid={`font-size-${s}`}
                      onClick={() => setFontSize(s)}
                      className={`flex-1 py-1 text-xs border transition-colors ${
                        fontSize === s
                          ? 'border-accent bg-accent/15 text-accent font-semibold'
                          : 'border-border hover:border-border/80 hover:bg-card/60'
                      }`}
                    >
                      {s === 'small' ? 'S' : s === 'large' ? 'L' : 'M'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Width */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Width</p>
                <div className="flex gap-1">
                  {(['standard', 'wide'] as const).map((w) => (
                    <button
                      key={w}
                      data-testid={`width-${w}`}
                      onClick={() => setContentWidth(w)}
                      className={`flex-1 py-1 text-xs border transition-colors ${
                        contentWidth === w
                          ? 'border-accent bg-accent/15 text-accent font-semibold'
                          : 'border-border hover:border-border/80 hover:bg-card/60'
                      }`}
                    >
                      {w === 'standard' ? 'Standard' : 'Wide'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Theme */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Theme</p>
                <div className="flex gap-1">
                  {(['light', 'dark'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex-1 py-1 text-xs border transition-colors ${
                        theme === t
                          ? 'border-accent bg-accent/15 text-accent font-semibold'
                          : 'border-border hover:border-border/80 hover:bg-card/60'
                      }`}
                    >
                      {t === 'light' ? '☀ Light' : '☾ Dark'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Read next */}
          {article.relatedArticles.length > 0 && (
            <div data-testid="related-articles">
              <p className="font-bold text-[11px] uppercase tracking-widest mb-2 text-muted-foreground px-1">
                Read next
              </p>
              <div className="space-y-2">
                {article.relatedArticles.map((slug) => {
                  const entry = allArticles.find((a) => a.slug === slug);
                  const title = entry?.title ?? slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  const category = entry?.category ?? '';
                  const color = categoryColors[category] || '#3366CC';
                  return (
                    <Link key={slug} href={`/wiki/${slug}`} className="block group">
                      <div className="border border-border bg-card hover:border-accent/60 transition-colors overflow-hidden">
                        {entry?.thumbnail && (
                          <div className="w-full h-[72px] overflow-hidden bg-card/50">
                            <img
                              src={entry.thumbnail}
                              alt={title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-2">
                          {category && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color }}
                            >
                              {category}
                            </span>
                          )}
                          <p className="text-xs font-semibold text-accent group-hover:underline leading-tight mt-0.5 mb-1">
                            {title}
                          </p>
                          {entry?.excerpt && (
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                              {entry.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit history */}
          <div className="border border-border bg-card" data-testid="edit-history-sidebar">
            <RevisionHistory history={article.editHistory} />
          </div>
        </div>
      </aside>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-40 p-2.5 bg-accent text-accent-foreground rounded-full shadow-lg border border-accent/30 hover:opacity-90 transition-all transform hover:scale-105 print:hidden"
          aria-label="Back to top"
          data-testid="button-back-to-top"
        >
          <ArrowUp size={18} />
        </button>
      )}

    </div>
  );
}
