import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import WikiHeader from '../components/WikiHeader';
import WikiSidebar from '../components/WikiSidebar';
import WikiFooter from '../components/WikiFooter';
import SearchResults from '../components/SearchResults';
import { searchArticles } from '../lib/articleLoader';
import type { ArticleIndexEntry } from '../types/article';

export default function SearchPage() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [results, setResults] = useState<ArticleIndexEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    setQuery(q);
    if (q) {
      setLoading(true);
      searchArticles(q).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <WikiHeader onMenuClick={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-6 min-w-0">
          {loading ? (
            <div className="text-sm text-muted-foreground">Searching...</div>
          ) : (
            <SearchResults results={results} query={query} />
          )}
        </main>
      </div>
      <WikiFooter />
    </div>
  );
}
