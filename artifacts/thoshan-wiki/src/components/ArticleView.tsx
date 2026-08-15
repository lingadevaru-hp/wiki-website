import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Github,
  Printer,
  Quote,
  Share2,
  Tag,
} from 'lucide-react';
import type { Article, ArticleIndexEntry } from '../types/article';
import Infobox from './Infobox';
import TableOfContents from './TableOfContents';
import Section from './Section';
import References from './References';
import ArticleAudioReader from './ArticleAudioReader';
import VerificationMap from './VerificationMap';
import MediaViewer from './MediaViewer';
import { loadArticlesIndex } from '../lib/articleLoader';
import { useTheme } from '../contexts/ThemeContext';
import { useBookmarks } from '../hooks/useBookmarks';

const categoryColors: Record<string, string> = {
  Profile: '#3366CC', Blockchain: '#E67E22', 'AI / ML': '#8E44AD',
  Infrastructure: '#27AE60', Security: '#C0392B', Systems: '#2980B9',
  Web: '#16A085', Learning: '#F39C12',
};

function parseWikiLink(inner: string) {
  const parts = inner.split('|');
  const rawSlug = parts[0].trim();
  return {
    slug: rawSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    text: parts[1]?.trim() || rawSlug,
  };
}

function parseLeadText(text: string) {
  return text.split(/\n\n+/).map((paragraph, index) => {
    const parsed = paragraph
      .replace(/\[\[(.*?)\]\]/g, (_match, inner) => {
        const link = parseWikiLink(inner);
        return `<a href="/wiki/${link.slug}" class="text-accent hover:underline">${link.text}</a>`;
      })
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    return <p key={index} className="mb-5 text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed }} />;
  });
}

function calculateReadingTime(article: Article) {
  const text = [article.lead, ...article.sections.flatMap((section) => [section.title, ...section.content.map((block) => `${block.content || ''} ${block.caption || ''}`)])].join(' ');
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}

function getArticleText(article: Article) {
  return [article.metadata.title, article.lead, ...article.sections.flatMap((section) => [section.title, ...section.content.map((block) => block.content || '')])].join(' ');
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

export default function ArticleView({ article }: { article: Article }) {
  const { theme, setTheme } = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [fontSize, setFontSize] = useState<'small' | 'standard' | 'large'>(() => (localStorage.getItem('wiki-font-size') as 'small' | 'standard' | 'large') || 'large');
  const [contentWidth, setContentWidth] = useState<'standard' | 'wide'>(() => (localStorage.getItem('wiki-content-width') as 'standard' | 'wide') || 'standard');
  const [allArticles, setAllArticles] = useState<ArticleIndexEntry[]>([]);
  const [activeSection, setActiveSection] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [resumeProgress, setResumeProgress] = useState(0);
  const [captureOpen, setCaptureOpen] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const bookmarked = isBookmarked(article.metadata.slug);
  const readingTime = calculateReadingTime(article);

  useEffect(() => { loadArticlesIndex().then((index) => setAllArticles(index.articles)); }, []);

  useEffect(() => { localStorage.setItem('wiki-font-size', fontSize); }, [fontSize]);
  useEffect(() => { localStorage.setItem('wiki-content-width', contentWidth); }, [contentWidth]);

  useEffect(() => {
    const key = `wiki-reading-progress:${article.metadata.slug}`;
    const saved = Number(localStorage.getItem(key) || 0);
    if (saved > 0.08 && saved < 0.95) setResumeProgress(saved);
    const saveProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) localStorage.setItem(key, String(Math.min(1, Math.max(0, window.scrollY / total))));
    };
    window.addEventListener('pagehide', saveProgress);
    return () => window.removeEventListener('pagehide', saveProgress);
  }, [article.metadata.slug]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? Math.min(100, Math.max(0, window.scrollY / total * 100)) : 0);
      setShowScrollTop(window.scrollY > 420);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && setActiveSection(entry.target.id));
    }, { rootMargin: '-18% 0px -70% 0px' });
    articleRef.current?.querySelectorAll('.wiki-section[id]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [article]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches('input, textarea, select, button, [contenteditable="true"]')) return;
      if (event.key === 'Home') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (event.key === 'End') {
        event.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const related = useMemo(() => article.relatedArticles.map((slug) => {
    const entry = allArticles.find((item) => item.slug === slug);
    return { slug, title: entry?.title || slug.replace(/-/g, ' '), excerpt: entry?.excerpt, category: entry?.category };
  }), [article.relatedArticles, allArticles]);

  const parentArticle = useMemo(() => {
    const explicit = article.parentArticle && allArticles.find((entry) => entry.slug === article.parentArticle);
    if (explicit) return explicit;
    return allArticles
      .filter((entry) => entry.slug !== article.metadata.slug && article.metadata.slug.startsWith(`${entry.slug}-`))
      .sort((a, b) => b.slug.length - a.slug.length)[0];
  }, [allArticles, article.metadata.slug, article.parentArticle]);

  const articleNeighbors = useMemo(() => {
    const readable = allArticles.filter((entry) => !entry.hiddenFromSearch && !entry.isSubArticle);
    const index = readable.findIndex((entry) => entry.slug === article.metadata.slug);
    return { previous: index > 0 ? readable[index - 1] : undefined, next: index >= 0 ? readable[index + 1] : undefined };
  }, [allArticles, article.metadata.slug]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2200);
  };

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showFeedback(message);
    } catch {
      showFeedback('Copy is unavailable in this browser');
    }
  };

  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.metadata.title, url: window.location.href });
        return;
      } catch { return; }
    }
    copy(window.location.href, 'Link copied');
  };

  const resumeReading = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: total * resumeProgress, behavior: 'smooth' });
    setResumeProgress(0);
  };

  const fontClass = fontSize === 'small' ? 'article-size-small' : fontSize === 'large' ? 'article-size-large' : '';
  const widthClass = contentWidth === 'wide' ? 'article-content-wide' : 'article-content-standard';

  return (
    <div className="article-layout">
      <div className="reading-progress" aria-label={`Article reading progress: ${Math.round(scrollProgress)} percent`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(scrollProgress)}><span style={{ width: `${scrollProgress}%` }} /><b className={scrollProgress > 4 ? 'is-visible' : ''}>{Math.round(scrollProgress)}%</b></div>
      <article ref={articleRef} className={`article-reader-content ${fontClass} ${widthClass}`}>
        <nav className="article-context-nav" aria-label="Article location"><Link href={parentArticle ? `/wiki/${parentArticle.slug}` : '/wiki/home'}>← {parentArticle ? `Back to ${parentArticle.title}` : 'Back to Wiki Home'}</Link><Link href="/wiki/search">Browse articles →</Link></nav>
        <div className="article-kicker"><span style={{ color: categoryColors[article.metadata.category] || '#3366CC' }}>{article.metadata.category}</span><span>{readingTime} min read</span><span>Updated {formatDate(article.metadata.lastEdited)}</span></div>
        <header className="article-heading">
          <h1 data-testid="article-title">{article.metadata.title}</h1>
          <p className="article-dek">A focused guide to the ideas, systems, and work behind this page.</p>
          <div className="article-actions print:hidden">
            <ArticleAudioReader title={article.metadata.title} text={getArticleText(article)} />
            <button type="button" className={`action-button ${bookmarked ? 'is-active' : ''}`} onClick={() => { toggleBookmark({ slug: article.metadata.slug, title: article.metadata.title, category: article.metadata.category }); showFeedback(bookmarked ? 'Removed from saved' : 'Saved for later'); }} aria-label={bookmarked ? 'Remove bookmark' : 'Save article'} data-testid="button-bookmark">
              {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}<span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
            </button>
            <button type="button" className="action-button" onClick={() => copy(window.location.href, 'Link copied')} aria-label="Copy article link" data-testid="button-copy-link"><Copy size={16} /><span className="hidden sm:inline">Copy link</span></button>
            <button type="button" className="action-button" onClick={() => copy(`Thoshan's Wiki — ${article.metadata.title} — ${window.location.href}`, 'Citation copied')} aria-label="Copy citation" data-testid="button-cite"><Quote size={16} /><span className="hidden sm:inline">Cite</span></button>
            <button type="button" className="action-button" onClick={shareArticle} aria-label="Share article" data-testid="button-share"><Share2 size={16} /><span className="hidden sm:inline">Share</span></button>
            <button type="button" className="action-button ml-auto" onClick={() => window.print()} aria-label="Print article" data-testid="button-print"><Printer size={16} /><span className="hidden sm:inline">Print</span></button>
          </div>
        </header>

        {resumeProgress > 0 && <div className="resume-reading" role="status"><div><strong>Continue reading?</strong><span>You were about {Math.round(resumeProgress * 100)}% through this article.</span></div><div><button type="button" onClick={resumeReading}>Continue</button><button type="button" onClick={() => { localStorage.removeItem(`wiki-reading-progress:${article.metadata.slug}`); setResumeProgress(0); }}>Dismiss</button></div></div>}

        {(article.metadata.slug.includes('verification') || article.metadata.slug.includes('evidence')) && <VerificationMap title={article.metadata.title} />}

        {article.metadata.slug === 'foss-coin' && <figure className="foss-project-capture"><button type="button" className="foss-project-capture-button" onClick={() => setCaptureOpen(true)} aria-label="Open FOSS Coin project capture fullscreen"><img src="/assets/foss-Thumbnail.gif" alt="FOSS Coin project capture showing the token trading workflow" loading="lazy" decoding="async" /><span className="foss-capture-overlay">Open full screen</span></button><figcaption>Project capture · FOSS Coin trading workflow</figcaption></figure>}
        {captureOpen && <MediaViewer item={{ src: '/assets/foss-Thumbnail.gif', alt: 'FOSS Coin project capture showing the token trading workflow', caption: 'FOSS Coin trading workflow', type: 'image' }} onClose={() => setCaptureOpen(false)} />}

        {article.infobox && <Infobox data={article.infobox} />}
        {article.githubButton && <a href={article.githubButton.url} target="_blank" rel="noopener noreferrer" className="article-external-link print:hidden"><Github size={16} />{article.githubButton.text}</a>}

        <div className="article-lead">{parseLeadText(article.lead)}</div>

        {article.subArticles && article.subArticles.length > 0 && (
          <section className="sub-articles" data-testid="sub-articles-section">
            <div><p className="section-eyebrow">Continue within this project</p><h2>Related pages</h2></div>
            <div className="sub-article-list">{article.subArticles.map((sub) => <Link key={sub.slug} href={`/wiki/${sub.slug}`} className="sub-article-link" data-testid={`sub-article-${sub.slug}`}><span><strong>{sub.title}</strong><small>{sub.excerpt}</small></span><span aria-hidden="true">↗</span></Link>)}</div>
          </section>
        )}

        <TableOfContents sections={article.sections} activeId={activeSection} />
        <div className="article-sections">{article.sections.map((section) => <Section key={section.id} section={section} />)}</div>

        {article.perspectives && article.perspectives.length > 0 && <section className="article-extra-section"><h2>Different perspectives</h2><div className="space-y-3">{article.perspectives.map((perspective) => <div key={perspective.title} className="border border-border bg-card p-4"><h3 className="font-bold mb-1">{perspective.title}</h3><p className="text-muted-foreground">{perspective.content}</p></div>)}</div></section>}
        <References references={article.references} />
        <div className="article-categories"><Tag size={15} /><strong>Topics</strong>{article.categories.map((category) => <Link key={category} href={`/wiki/search?q=${encodeURIComponent(category)}`}>{category}</Link>)}</div>

        {(articleNeighbors.previous || articleNeighbors.next) && <nav className="article-neighbors print:hidden" aria-label="Article navigation"><div>{articleNeighbors.previous && <Link href={`/wiki/${articleNeighbors.previous.slug}`}><span>Previous article</span><strong>← {articleNeighbors.previous.title}</strong></Link>}</div><div>{articleNeighbors.next && <Link href={`/wiki/${articleNeighbors.next.slug}`}><span>Next article</span><strong>{articleNeighbors.next.title} →</strong></Link>}</div></nav>}

        {related.length > 0 && <details className="read-next read-next-mobile print:hidden"><summary><span><span className="section-eyebrow">Keep reading</span><strong>Related articles</strong></span><span className="read-next-summary-icon" aria-hidden="true">＋</span></summary><div className="read-next-grid">{related.map((item) => <Link key={item.slug} href={`/wiki/${item.slug}`} className="read-next-card"><span className="text-xs uppercase tracking-wider text-muted-foreground">{item.category || 'Article'}</span><strong>{item.title}</strong>{item.excerpt && <small>{item.excerpt}</small>}</Link>)}</div></details>}
      </article>

      {related.length > 0 && <aside className="related-rail print:hidden" aria-label="Related articles"><div className="section-eyebrow">Keep reading</div><h2>Related articles</h2><div className="related-rail-list">{related.map((item) => <Link key={item.slug} href={`/wiki/${item.slug}`} className="related-rail-card"><span>{item.category || 'Article'}</span><strong>{item.title}</strong>{item.excerpt && <small>{item.excerpt}</small>}</Link>)}</div></aside>}

      <aside className="article-settings print:hidden">
        <div className="settings-panel"><p className="section-eyebrow">Reading settings</p><div className="settings-group"><span>Text size</span><div className="settings-options">{(['small', 'standard', 'large'] as const).map((size) => <button key={size} onClick={() => setFontSize(size)} className={fontSize === size ? 'selected' : ''}>{size === 'small' ? 'S' : size === 'standard' ? 'M' : 'L'}</button>)}</div></div><div className="settings-group"><span>Width</span><div className="settings-options">{(['standard', 'wide'] as const).map((width) => <button key={width} onClick={() => setContentWidth(width)} className={contentWidth === width ? 'selected' : ''}>{width === 'standard' ? 'Reading' : 'Wide'}</button>)}</div></div><div className="settings-group"><span>Theme</span><div className="settings-options"><button onClick={() => setTheme('light')} className={theme === 'light' ? 'selected' : ''}>Light</button><button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'selected' : ''}>Dark</button></div></div></div>
      </aside>

      {showScrollTop && <button type="button" className="back-to-top print:hidden" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">↑</button>}
      {feedback && <div className="reader-toast" role="status"> <Check size={15} /> {feedback}</div>}
    </div>
  );
}
