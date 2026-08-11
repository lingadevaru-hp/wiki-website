import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import WikiHeader from '../components/WikiHeader';
import WikiSidebar from '../components/WikiSidebar';
import WikiFooter from '../components/WikiFooter';
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

export default function MainPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);

  useEffect(() => {
    loadArticlesIndex().then((idx) => setArticles(idx.articles));
  }, []);

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-4">
            <div className="border border-border p-3">
              <h2 className="font-bold border-b border-border pb-1 mb-2 text-sm">Featured article</h2>
              <div className="flex gap-3">
                <img
                  src="https://picsum.photos/seed/about-featured/120/90"
                  alt="About Thoshan"
                  className="w-28 h-20 object-cover border border-border shrink-0"
                />
                <div>
                  <p className="text-sm">
                    <Link href="/wiki/about" className="font-bold text-accent hover:underline">Lingadevaru H P</Link>{' '}
                    (also known as <em>Thoshan</em>) is a builder of deployed blockchain, AI, and web projects — 
                    with a career focus on networking, cloud, and cybersecurity. All skills are demonstrated 
                    through real deployed work: a{' '}
                    <Link href="/wiki/foss-coin" className="text-accent hover:underline">Solana SPL token</Link>,
                    a <Link href="/wiki/thoshan-flash" className="text-accent hover:underline">fine-tuned LLM</Link>,
                    and a <Link href="/wiki/homelab" className="text-accent hover:underline">self-hosted cloud homelab</Link>.
                  </p>
                  <p className="text-right mt-1">
                    <Link href="/wiki/about" className="text-accent text-xs hover:underline">Full article...</Link>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Other articles:{' '}
                <Link href="/wiki/foss-coin" className="text-accent hover:underline">FOSS Coin</Link>
                {' · '}
                <Link href="/wiki/thoshan-flash" className="text-accent hover:underline">Thoshan Flash</Link>
                {' · '}
                <Link href="/wiki/privacy-stack" className="text-accent hover:underline">Privacy Stack</Link>
              </p>
            </div>

            <div className="border border-border border-l-0 p-3 bg-[#1A3A1A] dark:bg-[#1A3A1A]">
              <h2 className="font-bold border-b border-[#555] pb-1 mb-2 text-sm">Project highlights</h2>
              <ul className="text-sm space-y-1.5 list-disc list-inside">
                <li><Link href="/wiki/foss-coin" className="text-accent font-bold hover:underline">FOSS Coin ($FOSS)</Link> — live Solana SPL token on Orca Whirlpool DEX. Fixed 1B supply, mint authority permanently revoked. 7 ⭐ on GitHub.</li>
                <li><Link href="/wiki/thoshan-flash" className="text-accent font-bold hover:underline">Thoshan Flash</Link> — QLoRA fine-tune of Gemma-2-9B published on Hugging Face with 26+ downloads and live Gradio inference.</li>
                <li><Link href="/wiki/insurance-dapp" className="text-accent font-bold hover:underline">Insurance DApp</Link> — Ethereum smart contract insurance system using Solidity, Truffle, Web3.js, and MetaMask.</li>
                <li><Link href="/wiki/local-pulse" className="text-accent font-bold hover:underline">LocalPulse</Link> — Next.js 15 event discovery PWA with Clerk auth, Firebase, PDF ticketing, and offline support.</li>
                <li><Link href="/wiki/fraud-detection" className="text-accent font-bold hover:underline">Fraud Detection System</Link> — MCA final year project. 4-algorithm ML ensemble (LR + KNN + SVM + CNN) in ASP.NET.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-4">
            <div className="border border-border border-t-0 p-3 bg-[#1A2A3A] dark:bg-[#1A2A3A]">
              <h2 className="font-bold border-b border-[#555] pb-1 mb-2 text-sm">Did you know...</h2>
              <ul className="text-sm space-y-1.5 list-disc list-inside">
                <li>...that <Link href="/wiki/foss-coin" className="text-accent font-bold hover:underline">FOSS Coin</Link> was deployed in a single atomic transaction containing 7 instructions — all-or-nothing, with no partial state?</li>
                <li>...that <Link href="/wiki/thoshan-flash" className="text-accent font-bold hover:underline">QLoRA fine-tuning</Link> reduces GPU memory requirements from ~36 GB to ~12 GB by training only ~1–3% of model parameters?</li>
                <li>...that the <Link href="/wiki/homelab" className="text-accent font-bold hover:underline">Libre Cloud homelab</Link> uses a zero-trust architecture where no service is directly reachable without passing through Cloudflare?</li>
                <li>...that the <Link href="/wiki/privacy-stack" className="text-accent hover:underline">privacy stack</Link> runs DNS filtering at three independent layers — router, cloud DNS, and device-level — simultaneously?</li>
                <li>...that the <Link href="/wiki/linux-setup" className="text-accent hover:underline">Omarchy</Link> distro was created by DHH (of Ruby on Rails fame) and has ~22,000 GitHub stars?</li>
              </ul>
            </div>

            <div className="border border-border border-l-0 border-t-0 p-3">
              <h2 className="font-bold border-b border-border pb-1 mb-2 text-sm">Technical areas</h2>
              <p className="text-xs text-muted-foreground mb-2">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <ul className="text-sm space-y-1.5 list-disc list-inside">
                <li><strong>Blockchain</strong> — <Link href="/wiki/foss-coin" className="text-accent hover:underline">Solana SPL tokens</Link>, <Link href="/wiki/insurance-dapp" className="text-accent hover:underline">Ethereum smart contracts</Link></li>
                <li><strong>AI / ML</strong> — <Link href="/wiki/thoshan-flash" className="text-accent hover:underline">LLM fine-tuning</Link>, <Link href="/wiki/fraud-detection" className="text-accent hover:underline">ML ensemble systems</Link></li>
                <li><strong>Infrastructure</strong> — <Link href="/wiki/homelab" className="text-accent hover:underline">Oracle Cloud free tier</Link>, Docker, Coolify, Cloudflare</li>
                <li><strong>Security</strong> — <Link href="/wiki/privacy-stack" className="text-accent hover:underline">layered DNS filtering</Link>, WireGuard VPN, UFW</li>
                <li><strong>Systems</strong> — <Link href="/wiki/linux-setup" className="text-accent hover:underline">Arch Linux / Omarchy</Link>, Hyprland, Neovim</li>
              </ul>
            </div>
          </div>

          <div className="border border-border border-t-0 p-3 mb-4">
            <h2 className="font-bold border-b border-border pb-1 mb-3 text-sm">All articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {articles.filter(article => !article.hiddenFromSearch).map((article) => (
                <Link
                  key={article.id}
                  href={`/wiki/${article.slug}`}
                  className="flex gap-2 border border-border p-2 hover:bg-card transition-colors"
                  data-testid={`article-card-${article.id}`}
                >
                  {article.thumbnail && (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-16 h-12 object-cover border border-border shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-accent text-sm font-medium block truncate">
                      {article.title}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: categoryColors[article.category] || '#A8A8A8' }}>
                      {article.category}
                    </span>
                    <p className="text-xs text-muted-foreground truncate">{article.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
      <WikiFooter />
    </div>
  );
}
