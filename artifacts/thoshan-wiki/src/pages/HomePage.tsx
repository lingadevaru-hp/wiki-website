import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import WikiHeader from '../components/WikiHeader';
import WikiSidebar from '../components/WikiSidebar';
import BottomNavBar from '../components/BottomNavBar';
import { loadArticlesIndex } from '../lib/articleLoader';
import type { ArticleIndexEntry } from '../types/article';

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

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadArticlesIndex().then((idx) => setArticles(idx.articles));
  }, []);

  const filteredArticles = selectedCategory
    ? articles.filter(article => article.category === selectedCategory && !article.hiddenFromSearch)
    : articles.filter(article => !article.hiddenFromSearch);

  const categories = [...new Set(articles.map(a => a.category))];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <WikiHeader onMenuClick={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-4 min-w-0">
          <div className="text-center mb-4 text-sm">
            <strong>Thoshan's personal knowledge base</strong>{' '}
            — a Wikipedia-style wiki about projects, systems, and learning.{' '}
            <Link href="/wiki/about" className="text-accent hover:underline">
              {articles.length || 10} articles
            </Link>{' '}
            in this wiki.
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-1 mb-4 justify-center sm:justify-start">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedCategory === null 
                  ? 'bg-accent text-accent-foreground border-accent' 
                  : 'bg-background text-foreground border-border hover:border-accent'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedCategory === category 
                    ? 'bg-accent text-accent-foreground border-accent' 
                    : 'bg-background text-foreground border-border hover:border-accent'
                }`}
                style={{ borderColor: selectedCategory === category ? categoryColors[category] : undefined }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Article */}
          <div className="border border-border p-4 mb-4 bg-card/50 rounded-lg">
            <h2 className="font-bold border-b border-border pb-1 mb-3 text-sm">
              Featured Article
            </h2>
            <div className="flex gap-4">
              <img
                src="https://picsum.photos/seed/about-featured/120/90"
                alt="About Thoshan"
                className="w-32 h-24 object-cover border border-border shrink-0 rounded hidden sm:block"
              />
              <div className="flex-1">
                <p className="text-sm leading-relaxed">
                  <Link href="/wiki/about" className="font-bold text-accent hover:underline text-base">
                    Lingadevaru H P
                  </Link>{' '}
                  (also known as <em>Thoshan</em>) is a builder of deployed blockchain, AI, and web projects — 
                  with a career focus on networking, cloud, and cybersecurity. All skills are demonstrated 
                  through real deployed work: a{' '}
                  <Link href="/wiki/foss-coin" className="text-accent hover:underline">Solana SPL token</Link>,
                  a <Link href="/wiki/thoshan-flash" className="text-accent hover:underline">fine-tuned LLM</Link>,
                  and a <Link href="/wiki/homelab" className="text-accent hover:underline">self-hosted cloud homelab</Link>.
                </p>
                <p className="text-right mt-2">
                  <Link href="/wiki/about" className="text-accent text-xs hover:underline">
                    Full article →
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Project Highlights */}
          <div className="border border-border p-4 mb-4 bg-[#1A3A1A] dark:bg-[#1A3A1A] rounded-lg">
            <h2 className="font-bold border-b border-border pb-1 mb-3 text-sm">
              Project Highlights
            </h2>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">●</span>
                <span>
                  <Link href="/wiki/foss-coin" className="text-accent font-bold hover:underline">FOSS Coin ($FOSS)</Link> — live Solana SPL token on Orca Whirlpool DEX. Fixed 1B supply, mint authority permanently revoked. 7 ⭐ on GitHub.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">●</span>
                <span>
                  <Link href="/wiki/thoshan-flash" className="text-accent font-bold hover:underline">Thoshan Flash</Link> — QLoRA fine-tune of Gemma-2-9B published on Hugging Face with 26+ downloads and live Gradio inference.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">●</span>
                <span>
                  <Link href="/wiki/insurance-dapp" className="text-accent font-bold hover:underline">Insurance DApp</Link> — Ethereum smart contract insurance system using Solidity, Truffle, Web3.js, and MetaMask.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">●</span>
                <span>
                  <Link href="/wiki/local-pulse" className="text-accent font-bold hover:underline">LocalPulse</Link> — Next.js 15 event discovery PWA with Clerk auth, Firebase, PDF ticketing, and offline support.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">●</span>
                <span>
                  <Link href="/wiki/fraud-detection" className="text-accent font-bold hover:underline">Fraud Detection System</Link> — MCA final year project. 4-algorithm ML ensemble (LR + KNN + SVM + CNN) in ASP.NET.
                </span>
              </li>
            </ul>
          </div>

          {/* All Articles Grid */}
          <div className="border border-border p-4 mb-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">
                All Articles {selectedCategory && `in ${selectedCategory}`}
              </h2>
              <span className="text-xs text-muted-foreground">
                {filteredArticles.length} articles
              </span>
            </div>
            
            {filteredArticles.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No articles found in this category.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/wiki/${article.slug}`}
                    className="flex gap-3 border border-border p-3 hover:bg-card hover:border-accent/30 transition-all rounded-lg group"
                    data-testid={`article-card-${article.id}`}
                  >
                    {article.thumbnail && (
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-16 h-12 object-cover border border-border shrink-0 rounded"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <span 
                        className="text-[10px] font-semibold uppercase tracking-wider block mb-1"
                        style={{ color: categoryColors[article.category] || '#A0AABC' }}
                      >
                        {article.category}
                      </span>
                      <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {article.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}
