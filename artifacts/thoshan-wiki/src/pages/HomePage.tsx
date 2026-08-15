import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import WikiHeader from '../components/WikiHeader';
import WikiSidebar from '../components/WikiSidebar';
import { loadArticlesIndex } from '../lib/articleLoader';
import type { ArticleIndexEntry } from '../types/article';
import { useSearch } from '../contexts/SearchContext';
import SpaceField from '../components/SpaceField';
import SEO from '../components/SEO';

const categoryColors: Record<string, string> = {
  Profile: '#3366CC', Blockchain: '#E67E22', 'AI / ML': '#8E44AD',
  Infrastructure: '#27AE60', Security: '#C0392B', Systems: '#2980B9',
  Web: '#16A085', Learning: '#F39C12',
};

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [category, setCategory] = useState('All');
  const { openSearch } = useSearch();

  useEffect(() => { loadArticlesIndex().then((index) => setArticles(index.articles)); }, []);

  const visibleArticles = articles.filter((article) => !article.hiddenFromSearch && (category === 'All' || article.category === category));
  const categories = useMemo(() => ['All', ...Array.from(new Set(articles.filter((article) => !article.hiddenFromSearch).map((article) => article.category)))], [articles]);
  const featured = articles.find((article) => article.slug === 'foss-coin') || articles.find((article) => !article.hiddenFromSearch);
  const recent = [...articles].filter((article) => !article.hiddenFromSearch).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WikiHeader onMenuClick={() => setSidebarOpen((open) => !open)} />
      <div className="wiki-shell">
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="wiki-main wiki-home-main">
          <SEO title="Wiki Home — Thoshan's Wiki" description="Explore Thoshan's projects, systems, experiments, and technical articles across blockchain, AI, infrastructure, privacy, and web development." path="/wiki/home" keywords={["Thoshan", "Lingadevaru H P", "FOSS Coin", "Thoshan Flash", "projects", "technical portfolio"]} />
          <SpaceField />
          <section className="home-intro">
            <div><p className="section-eyebrow"><Sparkles size={13} /> Thoshan&apos;s Wiki</p><h1>Read the work behind the work.</h1><p>Projects, systems, experiments, and lessons documented in one quiet place.</p></div>
            <button className="home-search-button" onClick={openSearch}><Search size={17} /><span>Search all articles</span><kbd>⌘ K</kbd></button>
          </section>

          {featured && <section className="featured-article"><div><p className="section-eyebrow">Featured reading</p><h2><Link href={`/wiki/${featured.slug}`}>{featured.title}</Link></h2><p>{featured.excerpt}</p><Link href={`/wiki/${featured.slug}`} className="text-link">Open article <ArrowRight size={15} /></Link></div>{featured.thumbnail && <img src={featured.thumbnail} alt="" loading="lazy" />}</section>}

          <section className="home-section"><div className="section-heading"><div><p className="section-eyebrow">Start anywhere</p><h2>Recent articles</h2></div><Link href="/wiki/search" className="text-link">View all <ArrowRight size={15} /></Link></div><div className="recent-grid">{recent.map((article) => <Link key={article.id} href={`/wiki/${article.slug}`} className="recent-card"><span style={{ color: categoryColors[article.category] || '#3366CC' }}>{article.category}</span><strong>{article.title}</strong><small>{article.excerpt}</small></Link>)}</div></section>

          <section className="home-section"><div className="section-heading"><div><p className="section-eyebrow">Browse the index</p><h2>All articles <span className="count-badge">{visibleArticles.length}</span></h2></div></div><div className="category-row" role="tablist" aria-label="Filter articles by category">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={category === item ? 'selected' : ''}>{item}</button>)}</div><div className="article-index">{visibleArticles.map((article) => <Link key={article.id} href={`/wiki/${article.slug}`} className="index-row"><span className="index-category" style={{ color: categoryColors[article.category] || '#3366CC' }}>{article.category}</span><span className="index-copy"><strong>{article.title}</strong><small>{article.excerpt}</small></span><ArrowRight size={16} className="index-arrow" /></Link>)}</div></section>
        </main>
      </div>
    </div>
  );
}
