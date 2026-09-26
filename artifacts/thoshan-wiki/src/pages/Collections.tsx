import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Clock } from "lucide-react";
import WikiHeader from "../components/WikiHeader";
import WikiSidebar from "../components/WikiSidebar";
import SEO from "../components/SEO";
import CollectionHero from "../components/CollectionHero";
import {
  ACHIEVEMENTS_GLYPH,
  NEWS_GLYPH,
  PROJECTS_GLYPH,
} from "../data/collection-bitmaps";
import type { FieldGlyph } from "../components/HeroPixelField";
import { loadArticle, loadArticlesIndex } from "../lib/articleLoader";
import { categoryColors, categoryGlyph } from "../lib/categories";
import { visibleIndexArticles } from "../lib/articleRelations";
import { articleTypesOf, type ArticleType } from "../lib/articleTypes";
import type { ArticleIndexEntry } from "../types/article";
import { useLocale } from "../contexts/LocaleContext";

function estimateReadTime(excerpt: string): string {
  const words = excerpt.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round((words * 15) / 200));
  return `${mins} min read`;
}

interface CollectionConfig {
  type: ArticleType;
  titleKey: string;
  descKey: string;
  path: string;
  keywords: string[];
  glyph: FieldGlyph;
  eyebrowKey: string;
  tagline1Key: string;
  tagline2Key: string;
}

function CollectionPage({ config }: { config: CollectionConfig }) {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  /** Full-article tag sets (slug -> categories[]) for tag chips. */
  const [tags, setTags] = useState<Record<string, string[]>>({});
  /** News homepage filter. */
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadArticlesIndex()
      .then(async (index) => {
        const visible = visibleIndexArticles(index.articles);
        const matched: ArticleIndexEntry[] = [];
        const tagMap: Record<string, string[]> = {};
        for (const entry of visible) {
          const types = await articleTypesOf(entry);
          if (cancelled) return;
          if (types.includes(config.type)) {
            matched.push(entry);
            try {
              const full = await loadArticle(entry.slug);
              if (cancelled) return;
              tagMap[entry.slug] = full.categories ?? [];
            } catch {
              tagMap[entry.slug] = [];
            }
          }
        }
        if (cancelled) return;
        setArticles(matched);
        setTags(tagMap);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config.type]);

  const title = t(config.titleKey);
  const desc = t(config.descKey);
  const isNews = config.type === "news";

  const scrollToGrid = useCallback(() => {
    document
      .getElementById("coll-grid")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const heroConfig = useMemo(
    () => ({
      type: config.type,
      glyph: config.glyph,
      eyebrow: t(config.eyebrowKey),
      tagline1: t(config.tagline1Key),
      tagline2: t(config.tagline2Key),
      description: desc,
      primaryLabel: t("coll.browse"),
      secondaryLabel: isNews ? t("type.filterNews") : t("coll.viewAll"),
      onSecondary: isNews
        ? () => document.getElementById("news-filter")?.focus()
        : () => setLocation("/wiki/articles"),
      scrollHint: t("coll.scroll"),
    }),
    [config, desc, isNews, t, setLocation],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => {
      const hay = `${a.title} ${a.excerpt} ${(tags[a.slug] ?? []).join(" ")}`.toLowerCase();
      return q.split(/\s+/).every((term) => hay.includes(term));
    });
  }, [articles, query, tags]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <WikiHeader onMenuClick={() => setSidebarOpen((o) => !o)} />

      <CollectionHero config={heroConfig} onPrimary={scrollToGrid} />

      <div className="wiki-shell flex-1">
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="coll-grid" className="wiki-main articles-main">
          <SEO
            title={`${title} — Lingadevaru HP's Wiki`}
            description={desc}
            path={config.path}
            keywords={config.keywords}
            schema={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `${title} — Thoshan's Wiki`,
              itemListElement: articles.map((a, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `https://lingadevaru.in/wiki/${a.slug}`,
                name: a.title,
              })),
            }}
          />

          {isNews && (
            <label className="coll-filter coll-filter-grid">
              <span className="sr-only">{t("type.filterNews")}</span>
              <input
                id="news-filter"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("type.filterNews")}
              />
            </label>
          )}

          {loading ? (
            <div className="articles-skeleton">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="article-card-skeleton" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-page" style={{ marginTop: 40 }}>
              <p className="section-eyebrow">{title}</p>
              <h1>{t("type.emptyTitle")}</h1>
              <p>
                {t("type.emptyDesc")}{" "}
                <Link href="/wiki/articles" className="text-link">
                  {t("type.browseAll")}
                </Link>
                .
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-page" style={{ marginTop: 40 }}>
              <p className="section-eyebrow">{title}</p>
              <h1>{t("search.nothingFound")}</h1>
              <p>
                <button
                  type="button"
                  className="text-link"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                  onClick={() => setQuery("")}
                >
                  {t("search.clear")}
                </button>
                .
              </p>
            </div>
          ) : (
            <div className="articles-grid">
              {filtered.map((article, index) => (
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
                        color:
                          categoryColors[article.category] ??
                          "hsl(var(--accent))",
                      }}
                    >
                      {categoryGlyph[article.category] ?? "📄"}&nbsp;
                      {article.category}
                    </span>
                    <strong className="article-card-title">
                      {article.title}
                    </strong>
                    <p className="article-card-excerpt">{article.excerpt}</p>
                    {(tags[article.slug] ?? []).length > 0 && (
                      <div className="article-card-tags">
                        {(tags[article.slug] ?? [])
                          .slice(0, 4)
                          .map((tag) => (
                            <span key={tag} className="article-card-tag">
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
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
    </div>
  );
}

const PROJECTS_CONFIG: CollectionConfig = {
  type: "projects",
  titleKey: "type.projects",
  descKey: "type.projectsDesc",
  path: "/projects",
  keywords: ["projects", "Thoshan", "FOSS Coin", "blockchain", "AI", "portfolio"],
  glyph: PROJECTS_GLYPH,
  eyebrowKey: "hero.projectsEyebrow",
  tagline1Key: "hero.projectsL1",
  tagline2Key: "hero.projectsL2",
};

const ACHIEVEMENTS_CONFIG: CollectionConfig = {
  type: "achievements",
  titleKey: "type.achievements",
  descKey: "type.achievementsDesc",
  path: "/achievements",
  keywords: ["achievements", "Thoshan", "awards", "milestones"],
  glyph: ACHIEVEMENTS_GLYPH,
  eyebrowKey: "hero.achievementsEyebrow",
  tagline1Key: "hero.achievementsL1",
  tagline2Key: "hero.achievementsL2",
};

const NEWS_CONFIG: CollectionConfig = {
  type: "news",
  titleKey: "type.newsTitle",
  descKey: "type.newsDesc",
  path: "/news",
  keywords: ["news", "Thoshan", "meetup", "Omarchy", "FOSS"],
  glyph: NEWS_GLYPH,
  eyebrowKey: "hero.newsEyebrow",
  tagline1Key: "hero.newsL1",
  tagline2Key: "hero.newsL2",
};

export function ProjectsPage() {
  return <CollectionPage config={PROJECTS_CONFIG} />;
}

export function AchievementsPage() {
  return <CollectionPage config={ACHIEVEMENTS_CONFIG} />;
}

export function NewsPage() {
  return <CollectionPage config={NEWS_CONFIG} />;
}
