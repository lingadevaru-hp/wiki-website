import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import WikiHeader from "../components/WikiHeader";
import WikiSidebar from "../components/WikiSidebar";
import WikiFooter from "../components/WikiFooter";
import SEO from "../components/SEO";
import CategoryPills from "../components/CategoryPills";
import { loadArticlesIndex } from "../lib/articleLoader";
import { categoryColors, categoryGlyph } from "../lib/categories";
import type { ArticleIndexEntry } from "../types/article";

type SortKey = "featured" | "az" | "za" | "category";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured order",
  az: "Title A–Z",
  za: "Title Z–A",
  category: "Category",
};

function readStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function estimateReadTime(excerpt: string): string {
  const words = excerpt.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round((words * 15) / 200));
  return `${mins} min read`;
}

export default function ArticlesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(() =>
    readStored("wiki-articles-category", "All"),
  );
  const [sort, setSort] = useState<SortKey>(() => {
    const stored = readStored("wiki-articles-sort", "featured");
    return (["featured", "az", "za", "category"] as SortKey[]).includes(
      stored as SortKey,
    )
      ? (stored as SortKey)
      : "featured";
  });

  useEffect(() => {
    loadArticlesIndex()
      .then((index) => setArticles(index.articles))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wiki-articles-category", activeCategory);
    } catch {
      /* private mode */
    }
  }, [activeCategory]);

  useEffect(() => {
    try {
      localStorage.setItem("wiki-articles-sort", sort);
    } catch {
      /* private mode */
    }
  }, [sort]);

  const total = useMemo(
    () => articles.filter((a) => !a.hiddenFromSearch).length,
    [articles],
  );

  const visible = useMemo(() => {
    const filtered = articles.filter((a) => {
      if (a.hiddenFromSearch) return false;
      if (activeCategory !== "All" && a.category !== activeCategory)
        return false;
      return true;
    });
    const sorted = [...filtered];
    if (sort === "az")
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "za")
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    else if (sort === "category")
      sorted.sort(
        (a, b) =>
          a.category.localeCompare(b.category) ||
          a.title.localeCompare(b.title),
      );
    return sorted;
  }, [articles, activeCategory, sort]);

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
            title="All Articles — Lingadevaru HP's Wiki"
            description="Browse every article in Lingadevaru HP's Wiki: blockchain, AI, infrastructure, security, web development, and more."
            path="/wiki/articles"
            keywords={[
              "articles",
              "Lingadevaru HP",
              "Thoshan",
              "wiki",
              "blockchain",
              "AI",
              "infrastructure",
              "open source",
            ]}
            schema={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "All articles — Thoshan's Wiki",
              itemListElement: articles
                .filter((a) => !a.hiddenFromSearch)
                .map((a, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  url: `https://lingadevaru.in/wiki/${a.slug}`,
                  name: a.title,
                })),
            }}
          />

          <div className="articles-page-header">
            <div className="articles-page-title">
              <p className="section-eyebrow">
                <BookOpen size={13} /> All articles
              </p>
              <h1>
                Everything written
                {!loading && (
                  <span className="count-badge">{visible.length}</span>
                )}
              </h1>
              <p className="articles-subtitle">
                Projects, systems, experiments, and lessons — documented in one
                quiet place.
              </p>
            </div>
          </div>

          <CategoryPills
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
            ariaLabel="Filter by category"
          />

          <div className="articles-tools">
            <label className="articles-sort">
              <span>Sort</span>
              <select
                aria-label="Sort articles"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!loading && (
            <p className="articles-count" role="status">
              Showing {visible.length} of {total} article
              {total !== 1 ? "s" : ""}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </p>
          )}

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
                Try a different category, or{" "}
                <button
                  className="text-link"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setActiveCategory("All");
                  }}
                >
                  show all
                </button>
                .
              </p>
            </div>
          ) : (
            <div className="articles-grid">
              {visible.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/wiki/${article.slug}`}
                  className="article-card"
                  style={{ animationDelay: `${index * 60}ms` }}
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
                        color: categoryColors[article.category] ?? "#58a6ff",
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
