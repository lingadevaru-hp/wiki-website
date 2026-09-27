import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import WikiLayout from "../components/WikiLayout";
import Breadcrumbs from "../components/Breadcrumbs";
import ArticleView from "../components/ArticleView";
import NewsletterSection from "../components/Newsletter";
import {
  findParentArticle,
  loadArticle,
  loadArticlesIndex,
} from "../lib/articleLoader";
import type { Article, ArticleIndexEntry } from "../types/article";
import SEO from "../components/SEO";
import { useLocale } from "../contexts/LocaleContext";

function buildArticleSchema(article: Article) {
  const baseUrl = "https://lingadevaru.in";
  const articleUrl = `${baseUrl}/wiki/${article.metadata.slug}`;

  const baseSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.metadata.title,
    description: article.lead
      .replace(/\[\[.*?\|(.*?)\]\]|\*\*|\*/g, "$1")
      .slice(0, 300),
    url: articleUrl,
    author: {
      "@type": "Person",
      "@id": `${baseUrl}/#person`,
      name: "Lingadevaru H P",
      alternateName: ["Thoshan", "Thoshan HP", "thoshanhp", "lingadevaruhp"],
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Lingadevaru HP",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    inLanguage: "en-US",
  };

  if (article.metadata.lastEdited) {
    baseSchema.dateModified = new Date(
      article.metadata.lastEdited,
    ).toISOString();
  }

  // FOSS Coin specific: SoftwareSourceCode schema
  if (article.metadata.slug === "foss-coin") {
    return [
      baseSchema,
      {
        "@context": "https://schema.org",
        "@type": "SoftwareSourceCode",
        "@id": `${baseUrl}/wiki/foss-coin#software`,
        name: "FOSS Coin",
        alternateName: ["FOSS Token", "foss-token", "$FOSS"],
        description:
          "FOSS Coin is an open-source privacy-first SPL token on Solana blockchain created by Lingadevaru HP (Thoshan). A fixed supply of 1 billion tokens symbolising support for Free and Open Source Software.",
        codeRepository: "https://github.com/lingadevaru-hp/Foss-Token",
        programmingLanguage: "Rust",
        runtimePlatform: "Solana",
        license: "https://opensource.org/licenses/MIT",
        author: {
          "@type": "Person",
          "@id": `${baseUrl}/#person`,
          name: "Lingadevaru H P",
          alternateName: "Thoshan",
        },
        url: articleUrl,
        version: "1.0",
        applicationCategory: "BlockchainApplication",
      },
    ];
  }

  return baseSchema;
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { t } = useLocale();
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
        document.title = `${loadedArticle.metadata.title} — Lingadevaru HP (Thoshan)`;
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
          <p className="section-eyebrow">{t('article.nothingHere')}</p>
          <h1>{t('article.notFound')}</h1>
          <p>There is no article titled "{slug}" in this wiki.</p>
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
            title={`${article.metadata.title} — Lingadevaru HP (Thoshan)`}
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
              "thoshanhp",
              "Lingadevaru HP",
              "Lingadevaru H P",
              "lingadevaru",
              "lingadevaruhp",
              "Thoshan Flash",
              "Thoshan projects",
            ]}
            article={{
              dateModified: article.metadata.lastEdited,
            }}
            schema={buildArticleSchema(article)}
          />
          <Breadcrumbs
            items={[
              { label: "Wiki Home", href: "/wiki/home" },
              // News/Events articles live under /news: Wiki Home / News / Article.
              // (Sub-articles keep their parent in the trail instead.)
              ...((article.metadata.category === "News" ||
              article.metadata.category === "Events" ||
              (article.categories ?? []).some((c) =>
                ["news", "events"].includes(c.toLowerCase()),
              )) &&
              !parent
                ? [{ label: "News", href: "/news" }]
                : parent
                  ? [{ label: parent.title, href: `/wiki/${parent.slug}` }]
                  : []),
              { label: article.metadata.title },
            ]}
          />
          <ArticleView article={article} />
          <NewsletterSection autoOpenAfterMs={12_000} />
        </>
      )}
    </WikiLayout>
  );
}
