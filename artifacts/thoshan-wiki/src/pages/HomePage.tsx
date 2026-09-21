import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { BookOpen, Bot, Boxes, Globe, LayoutGrid, Lock, Server, Terminal, User, type LucideIcon } from "lucide-react";
import WikiLayout from "../components/WikiLayout";
import { loadArticlesIndex } from "../lib/articleLoader";
import { categoryColor } from "../lib/categories";
import { visibleIndexArticles } from "../lib/articleRelations";
import type { ArticleIndexEntry } from "../types/article";
import { useSearch } from "../contexts/SearchContext";
import SEO from "../components/SEO";
import "./HomeRedesign.css";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  All: LayoutGrid, Profile: User, Blockchain: Boxes, "AI / ML": Bot,
  Infrastructure: Server, Security: Lock, Systems: Terminal, Web: Globe, Learning: BookOpen,
};

function HeroSky() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!; let raf = 0;
    let stars = [] as { x: number; y: number; r: number; p: number; s: number }[];
    const resize = () => {
      const rect = c.parentElement!.getBoundingClientRect();
      c.width = rect.width * devicePixelRatio; c.height = rect.height * devicePixelRatio;
      stars = Array.from({ length: 130 }, () => ({ x: Math.random(), y: Math.random() * 0.65, r: Math.random() * 1.1 + 0.2, p: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 1.4 }));
    };
    resize(); window.addEventListener("resize", resize);
    const t0 = performance.now();
    const draw = (t: number) => {
      const w = c.width, h = c.height; ctx.clearRect(0, 0, w, h);
      const el = (t - t0) / 1000;
      for (const st of stars) {
        const tw = 0.32 + 0.68 * Math.abs(Math.sin(el * st.s + st.p));
        ctx.globalAlpha = tw; ctx.fillStyle = "#e6eeff";
        ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <div className="nh-sky" aria-hidden="true">
      <canvas ref={ref} className="nh-stars" />
      <div className="nh-moon"><div className="nh-moon-body" /><div className="nh-moon-shadow" /></div>
      <svg className="nh-mountains" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,255 L110,175 L205,228 L315,148 L425,230 L540,168 L650,238 L755,178 L875,238 L985,158 L1100,233 L1215,188 L1325,238 L1440,198 L1440,320 L0,320 Z" fill="#0b1020" opacity=".98" />
        <path d="M0,288 L135,218 L255,268 L395,208 L535,278 L695,218 L845,278 L995,223 L1145,278 L1285,233 L1440,273 L1440,320 L0,320 Z" fill="#050a18" />
      </svg>
      <div className="nh-trees" />
      <div className="nh-fade" />
    </div>
  );
}

export default function HomePage() {
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const { openSearch } = useSearch();
  const [, setLocation] = useLocation();
  const featRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useEffect(() => { loadArticlesIndex().then((i) => setArticles(i.articles)).catch(() => {}); }, []);

  const searchable = useMemo(() => visibleIndexArticles(articles), [articles]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(searchable.map((a) => a.category)))], [searchable]);

  const featured: ArticleIndexEntry[] = useMemo(() => {
    const pin = ["foss-coin", "thoshan-flash", "homelab"];
    const pinned = pin.map((s) => searchable.find((a) => a.slug === s)).filter(Boolean) as ArticleIndexEntry[];
    const rest = searchable.filter((a) => !pinned.some((p) => p.slug === a.slug));
    return [...pinned, ...rest].slice(0, 8);
  }, [searchable]);

  const recent = useMemo(() => searchable.slice(0, 5), [searchable]);

  const updateArrows = () => {
    const el = featRef.current; if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    const el = featRef.current; if (!el) return;
    updateArrows(); el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => { el.removeEventListener("scroll", updateArrows); window.removeEventListener("resize", updateArrows); };
  }, [featured.length]);

  const scrollFeat = (dir: number) => {
    const el = featRef.current; if (!el) return;
    el.scrollBy({ left: dir * Math.min(380, el.clientWidth * 0.9), behavior: "smooth" });
  };

  return (
    <WikiLayout mainClassName="wiki-main wiki-home-main wiki-home-redesign" showBackTop>
      <SEO
        title="Wiki Home — Lingadevaru HP (Thoshan) — Blockchain & FOSS Developer"
        description="Projects. Experiments. Learnings. Detailed notes on technology, self-hosting, security, blockchain, AI/ML, and more — built while learning, building, and exploring."
        path="/wiki/home"
        keywords={["Lingadevaru HP","Thoshan","FOSS Coin","Thoshan Flash","blockchain","projects","open source","Solana","AI/ML"]}
      />

      <section className="nh-hero" aria-label="Intro">
        <HeroSky />
        <div className="nh-hero-inner">
          <div className="nh-hero-left">
            <p className="nh-eyebrow">A personal knowledge base</p>
            <h1>Projects. Experiments. Learnings.</h1>
            <p className="nh-sub">Detailed notes on technology, self-hosting, security, blockchain, AI/ML, and more — built while learning, building, and exploring.</p>
            <button type="button" className="nh-searchbar" onClick={openSearch} aria-label="Search articles">
              <Search size={17} aria-hidden="true" /><span>Search articles...</span><kbd>Ctrl K</kbd>
            </button>
            <p className="nh-hint">Find notes, guides, and projects across all topics.</p>
          </div>
          <aside className="nh-hero-right" aria-hidden="true">
            <div className="nh-side-rule"><span>Documenting<br />ideas<br />and progress</span></div>
            <p>A personal knowledge base<br />by Lingadevaru H P.</p>
          </aside>
        </div>
      </section>

      <div className="nh-body-inner">
        <section className="nh-section" aria-label="Featured articles">
          <div className="nh-sec-head">
            <div><h2>Featured articles</h2><p>Handpicked reads to get started.</p></div>
            <div className="nh-arrows">
              <button type="button" onClick={() => scrollFeat(-1)} disabled={!canPrev} aria-label="Previous"><ChevronLeft size={16} /></button>
              <button type="button" onClick={() => scrollFeat(1)} disabled={!canNext} aria-label="Next"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div ref={featRef} className="nh-feat-viewport">
            <div className="nh-feat-track">
              {featured.map((a) => (
                <button key={a.slug} type="button" className="nh-feat-card" onClick={() => setLocation(`/wiki/${a.slug}`)}>
                  <div className="nh-feat-img">{a.thumbnail ? <img src={a.thumbnail} alt="" loading="lazy" /> : <div className="nh-img-ph" />}</div>
                  <div className="nh-feat-txt">
                    <span className="nh-cat" style={{ color: categoryColor(a.category) }}>{a.category.toUpperCase()}</span>
                    <strong>{a.title}</strong>
                    <small>{a.excerpt}</small>
                    <em>Open article <ArrowRight size={12} aria-hidden="true" /></em>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="nh-section" aria-label="Browse by topic">
          <h2>Browse by topic</h2><p style={{ fontFamily: "system-ui,sans-serif", fontSize: 12, color: "#7f90b5", margin: "4px 0 0" }}>Explore articles by category.</p>
          <div className="nh-pills" role="tablist" aria-label="Browse by topic">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] ?? LayoutGrid;
              return (
                <button key={cat} type="button" role="tab" className="nh-pill" onClick={() => setLocation("/wiki/articles")}>
                  <Icon size={14} aria-hidden="true" />{cat === "All" ? "All articles" : cat}
                </button>
              );
            })}
          </div>
        </section>

        <section className="nh-section" aria-label="Recent articles">
          <div className="nh-sec-head">
            <div><h2>Recent articles</h2><p>Latest updates and notes.</p></div>
            <Link href="/wiki/articles" className="nh-viewall">View all articles <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          <div className="nh-recent-grid">
            {recent.map((a) => (
              <button key={a.id} type="button" className="nh-recent-card" onClick={() => setLocation(`/wiki/${a.slug}`)}>
                <div className="nh-recent-img">{a.thumbnail ? <img src={a.thumbnail} alt="" loading="lazy" /> : <div className="nh-img-ph" />}</div>
                <div className="nh-recent-body">
                  <span className="nh-cat" style={{ color: categoryColor(a.category) }}>● {a.category.toUpperCase()}</span>
                  <strong>{a.title}</strong>
                  <small>{a.excerpt}</small>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </WikiLayout>
  );
}
