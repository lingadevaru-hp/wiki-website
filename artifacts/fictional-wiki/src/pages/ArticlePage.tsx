import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import WikiHeader from '../components/WikiHeader';
import WikiSidebar from '../components/WikiSidebar';
import WikiFooter from '../components/WikiFooter';
import ArticleView from '../components/ArticleView';
import { loadArticle } from '../lib/articleLoader';
import type { Article } from '../types/article';

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [, setLocation] = useLocation();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    setVisible(false);
    loadArticle(slug)
      .then((a) => {
        setArticle(a);
        setLoading(false);
        document.title = `${a.metadata.title} — Thoshan's Wiki`;
        // Small delay lets the DOM paint before fade-in starts
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setVisible(true));
        });
      })
      .catch(() => {
        setError(true);
        setLoading(false);
        setVisible(true);
      });
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <WikiHeader onMenuClick={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-4 min-w-0">
          {loading && (
            <div className="py-8" data-testid="loading-indicator">
              {/* Skeleton loader */}
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-border/40 rounded w-2/3" />
                <div className="h-3 bg-border/30 rounded w-1/3" />
                <div className="h-px bg-border" />
                <div className="space-y-2 mt-4">
                  <div className="h-3 bg-border/30 rounded w-full" />
                  <div className="h-3 bg-border/30 rounded w-5/6" />
                  <div className="h-3 bg-border/30 rounded w-4/6" />
                </div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div>
              <h1 className="text-[1.95em] font-serif font-normal mb-3">Article not found</h1>
              <hr className="border-border mb-3" />
              <p className="text-sm mb-2">
                There is no article titled <strong>&ldquo;{slug}&rdquo;</strong> in Thoshan's Wiki.
              </p>
              <p className="text-sm">
                <button onClick={() => setLocation('/wiki/main-page')} className="text-accent hover:underline">
                  Return to the main page
                </button>
              </p>
            </div>
          )}

          {article && !loading && (
            <div
              className="transition-opacity duration-300 ease-in"
              style={{ opacity: visible ? 1 : 0 }}
            >
              <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                <button onClick={() => setLocation('/')} className="text-accent hover:underline">Home</button>
                <span>·</span>
                <button onClick={() => setLocation('/wiki/main-page')} className="text-accent hover:underline">Main Page</button>
                <span>·</span>
                <span className="text-foreground font-medium">{article.metadata.title}</span>
              </div>
              <ArticleView article={article} />
            </div>
          )}
        </main>
      </div>
      <WikiFooter />
    </div>
  );
}
