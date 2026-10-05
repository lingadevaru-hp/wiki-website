import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import WikiHeader from "../components/WikiHeader";
import SEO from "../components/SEO";
import { loadArticlesIndex } from "../lib/articleLoader";
import { ARTICLE_TYPES, indexTypesOf } from "../lib/articleTypes";
import { categoryColors, categoryGlyph } from "../lib/categories";
import type { ArticleIndexEntry } from "../types/article";
import { useLocale } from "../contexts/LocaleContext";

type SortKey = "featured" | "az" | "za" | "category";

const SORT_KEYS: SortKey[] = ["featured", "az", "za", "category"];

const SORT_LABEL_KEYS: Record<SortKey, string> = {
  featured: "articles.sortFeatured",
  az: "articles.sortAz",
  za: "articles.sortZa",
  category: "articles.sortCategory",
};

function readStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function estimateReadTime(excerpt: string, minRead: string): string {
  const words = excerpt.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round((words * 15) / 200));
  return `${mins} ${minRead}`;
}

export default function ArticlesPage() {
  const { t } = useLocale();
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [articles, sort]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      projects: 0,
      achievements: 0,
      news: 0,
    };
    for (const a of articles) {
      if (a.hiddenFromSearch) continue;
      for (const type of indexTypesOf(a)) counts[type] += 1;
    }
    return counts;
  }, [articles]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <WikiHeader backHref="/wiki/home" />

      <div className="wiki-shell flex-1">
        <main className="wiki-main articles-main">
          <SEO
            title={t("articles.seoTitle")}
            description={t("articles.seoDescription")}
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
                <BookOpen size={13} /> {t("articles.eyebrow")}
              </p>
              <h1>
                {t("articles.title")}
                {!loading && (
                  <span className="count-badge">{visible.length}</span>
                )}
              </h1>
              <p className="articles-subtitle">
                {t("articles.sub")}
              </p>
            </div>
          </div>

          <div className="type-jump">
            <p className="type-jump-label">{t("type.jump")}</p>
            <div className="type-jump-row">
              {ARTICLE_TYPES.map(({ id, route }) => (
                <Link key={id} href={route} className="type-jump-link">
                  {t(`type.${id}`)}
                  <span className="type-jump-count">{typeCounts[id]}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="articles-tools">
            <label className="articles-sort">
              <span>{t('search.sort')}</span>
              <select
                aria-label={t('search.sortArticles')}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                {(SORT_KEYS).map((key) => (
                  <option key={key} value={key}>
                    {t(SORT_LABEL_KEYS[key])}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!loading && (
            <p className="articles-count" role="status">
              {t("articles.showing")} {visible.length} {t("articles.of")} {total}{" "}
              {total === 1 ? t("type.oneArticle") : t("type.manyArticles")}
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
              <p className="section-eyebrow">{t('search.noResultsShort')}</p>
              <h1>{t('search.nothingFound')}</h1>
              <p>{t("articles.empty")}</p>
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
                        color: categoryColors[article.category] ?? "hsl(var(--accent))",
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
                        {estimateReadTime(article.excerpt, t("article.minRead"))}
                      </span>
                      <span className="article-card-cta">
                        {t("articles.read")} <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
