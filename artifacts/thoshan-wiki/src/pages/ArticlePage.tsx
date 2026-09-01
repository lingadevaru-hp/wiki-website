import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import WikiLayout from "../components/WikiLayout";
import Breadcrumbs from "../components/Breadcrumbs";
import ArticleView from "../components/ArticleView";
import {
  findParentArticle,
  loadArticle,
  loadArticlesIndex,
} from "../lib/articleLoader";
import type { Article, ArticleIndexEntry } from "../types/article";
import SEO from "../components/SEO";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [article, setArticle] = useState<Article | null>(null);
  const [allArticles, setAllArticles] = useState<ArticleIndexEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!slug) return;
    setStatus("loading");
    Promise.all([loadArticle(slug), loadArticlesIndex()])
      .then(([loadedArticle, index]) => {
        setArticle(loadedArticle);
        setAllArticles(index.articles);
        setStatus("ready");
        document.title = `${loadedArticle.metadata.title} — Thoshan's Wiki`;
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      })
      .catch(() => setStatus("error"));
  }, [slug]);

  const parent = slug ? findParentArticle(slug, allArticles) : undefined;

  return (
    <WikiLayout showBackButton>
      {status === "loading" && (
        <div className="article-skeleton" data-testid="loading-indicator">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
      {status === "error" && (
        <div className="empty-page">
          <p className="section-eyebrow">Nothing here</p>
          <h1>Article not found</h1>
          <p>There is no article titled “{slug}” in this wiki.</p>
          <button
            className="primary-button"
            onClick={() => setLocation("/wiki/home")}
          >
            Return to Wiki Home
          </button>
        </div>
      )}
      {status === "ready" && article && (
        <>
          <SEO
            title={`${article.metadata.title} — Thoshan's Wiki`}
            description={article.lead
              .replace(/\[\[.*?\|(.*?)\]\]|\*\*|\*/g, "$1")
              .slice(0, 160)}
            path={`/wiki/${article.metadata.slug}`}
            type="article"
            keywords={[
              article.metadata.title,
              article.metadata.category,
              ...(article.categories || []),
              "Thoshan",
              "Lingadevaru H P",
            ]}
          />
          <Breadcrumbs
            items={[
              { label: "Wiki Home", href: "/wiki/home" },
              ...(parent
                ? [{ label: parent.title, href: `/wiki/${parent.slug}` }]
                : []),
              { label: article.metadata.title },
            ]}
          />
          <ArticleView article={article} />
        </>
      )}
    </WikiLayout>
  );
}
