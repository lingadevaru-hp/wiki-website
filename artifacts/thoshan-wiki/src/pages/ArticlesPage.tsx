import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import WikiHeader from "../components/WikiHeader";
import WikiSidebar from "../components/WikiSidebar";
import WikiFooter from "../components/WikiFooter";
import SEO from "../components/SEO";
import { loadArticlesIndex } from "../lib/articleLoader";
import type { ArticleIndexEntry } from "../types/article";

const categoryColors: Record<string, string> = {
  Profile: "#3366CC",
  Blockchain: "#E67E22",
  "AI / ML": "#8E44AD",
  Infrastructure: "#27AE60",
  Security: "#C0392B",
  Systems: "#2980B9",
  Web: "#16A085",
  Learning: "#F39C12",
};

const categoryGlyph: Record<string, string> = {
  Profile: "👤",
  Blockchain: "⛓️",
  "AI / ML": "🤖",
  Infrastructure: "🏗️",
  Security: "🔒",
  Systems: "🖥️",
  Web: "🌐",
  Learning: "📚",
};

function estimateReadTime(excerpt: string): string {
  const words = excerpt.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round((words * 15) / 200));
  return `${mins} min read`;
}

export default function ArticlesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    loadArticlesIndex()
      .then((index) => setArticles(index.articles))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    return articles.filter((a) => {
      if (a.hiddenFromSearch) return false;
      if (activeCategory !== "All" && a.category !== activeCategory)
        return false;
      return true;
    });
  }, [articles, activeCategory]);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          articles.filter((a) => !a.hiddenFromSearch).map((a) => a.category),
        ),
      ),
    ],
    [articles],
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <WikiHeader onMenuClick={() => setSidebarOpen((o) => !o)} />

      <div className="wiki-shell flex-1">
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="wiki-main articles-main">
          <SEO
            title="All Articles — Thoshan's Wiki"
            description="Browse every article in Thoshan's Wiki: blockchain, AI, infrastructure, security, web development, and more."
            path="/wiki/articles"
            keywords={[
              "articles",
              "Thoshan",
              "wiki",
              "blockchain",
              "AI",
              "infrastructure",
            ]}
          />

          <div className="articles-page-header">
            <div className="articles-page-title">
              <p className="section-eyebrow">
                <BookOpen size={13} /> All articles
              </p>
              <h1>
                Everything written
                {!loading && (
                  <span className="count-badge" style={{ marginLeft: 10 }}>
                    {visible.length}
                  </span>
                )}
              </h1>
              <p className="articles-subtitle">
                Projects, systems, experiments, and lessons — documented in one
                quiet place.
              </p>
            </div>
          </div>

          <div
            className="category-row"
            role="tablist"
            aria-label="Filter by category"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                className={activeCategory === cat ? "selected" : ""}
                style={
                  activeCategory === cat && cat !== "All"
                    ? {
                        background: categoryColors[cat],
                        borderColor: categoryColors[cat],
                      }
                    : undefined
                }
              >
                {cat !== "All" && categoryGlyph[cat]
                  ? `${categoryGlyph[cat]} `
                  : ""}
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="articles-skeleton">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="article-card-skeleton" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-page" style={{ marginTop: 40 }}>
              <p className="section-eyebrow">No results</p>
              <h1>Nothing found</h1>
              <p>
                Try a different category or{" "}
                <button
                  className="text-link"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveCategory("All")}
                >
                  show all
                </button>
                .
              </p>
            </div>
          ) : (
            <div className="articles-grid">
              {visible.map((article) => (
                <Link
                  key={article.id}
                  href={`/wiki/${article.slug}`}
                  className="article-card"
                >
                  {article.thumbnail && (
                    <div className="article-card-thumb">
                      <img src={article.thumbnail} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="article-card-body">
                    <span
                      className="article-card-category"
                      style={{
                        color: categoryColors[article.category] ?? "#3366CC",
                      }}
                    >
                      {categoryGlyph[article.category] ?? "📄"}&nbsp;
                      {article.category}
                    </span>
                    <strong className="article-card-title">
                      {article.title}
                    </strong>
                    <p className="article-card-excerpt">{article.excerpt}</p>
                    <div className="article-card-meta">
                      <span className="article-card-readtime">
                        <Clock size={11} />
                        {estimateReadTime(article.excerpt)}
                      </span>
                      <span className="article-card-cta">
                        Read <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      <WikiFooter />
    </div>
  );
}
