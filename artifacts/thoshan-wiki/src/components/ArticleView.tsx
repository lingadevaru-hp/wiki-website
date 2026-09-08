import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  ExternalLink,
  Github,
  Printer,
  Share2,
  Tag,
} from "lucide-react";
import type { Article, ArticleIndexEntry } from "../types/article";
import Infobox from "./Infobox";
import TableOfContents from "./TableOfContents";
import Section from "./Section";
import References from "./References";
import ArticleAudioReader from "./ArticleAudioReader";
import VerificationMap from "./VerificationMap";

import { findParentArticle, loadArticlesIndex } from "../lib/articleLoader";
import { categoryColor } from "../lib/categories";
import { estimateReadingMinutes, extractArticleText } from "../lib/articleText";
import { useTheme } from "../contexts/ThemeContext";
import { useBookmarks } from "../hooks/useBookmarks";
import { renderWikiInline } from "./WikiText";
import { requestThemePicker } from "./ThemePicker";

function parseLeadText(text: string) {
  return text.split(/\n\n+/).map((paragraph, index) => (
    <p key={index} className="mb-5 text-base leading-relaxed">
      {renderWikiInline(paragraph)}
    </p>
  ));
}

function getArticleDek(article: Article) {
  if (article.metadata.slug === "foss-coin")
    return "A transparent guide to the crypto project I created, its systems, and the work behind it.";
  return "A focused guide to the ideas, systems, and work behind this page.";
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function ArticleView({ article }: { article: Article }) {
  const { theme, setTheme } = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [fontSize, setFontSize] = useState<"small" | "standard" | "large">(
    () =>
      (localStorage.getItem("wiki-font-size") as
        | "small"
        | "standard"
        | "large") || "large",
  );
  const [contentWidth, setContentWidth] = useState<"standard" | "wide">(
    () =>
      (localStorage.getItem("wiki-content-width") as "standard" | "wide") ||
      "standard",
  );
  const [allArticles, setAllArticles] = useState<ArticleIndexEntry[]>([]);
  const [activeSection, setActiveSection] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [resumeProgress, setResumeProgress] = useState(0);

  const articleRef = useRef<HTMLDivElement>(null);
  const bookmarked = isBookmarked(article.metadata.slug);
  const readingTime = estimateReadingMinutes(article);

  useEffect(() => {
    loadArticlesIndex().then((index) => setAllArticles(index.articles));
  }, []);

  useEffect(() => {
    localStorage.setItem("wiki-font-size", fontSize);
  }, [fontSize]);
  useEffect(() => {
    localStorage.setItem("wiki-content-width", contentWidth);
  }, [contentWidth]);

  useEffect(() => {
    const key = `wiki-reading-progress:${article.metadata.slug}`;
    const saved = Number(localStorage.getItem(key) || 0);
    if (saved > 0.08 && saved < 0.95) setResumeProgress(saved);
    const saveProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0)
        localStorage.setItem(
          key,
          String(Math.min(1, Math.max(0, window.scrollY / total))),
        );
    };
    window.addEventListener("pagehide", saveProgress);
    return () => window.removeEventListener("pagehide", saveProgress);
  }, [article.metadata.slug]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(
        total > 0
          ? Math.min(100, Math.max(0, (window.scrollY / total) * 100))
          : 0,
      );
      setShowScrollTop(window.scrollY > 420);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => entry.isIntersecting && setActiveSection(entry.target.id),
        );
      },
      { rootMargin: "-18% 0px -70% 0px" },
    );
    articleRef.current
      ?.querySelectorAll(".wiki-section[id]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [article]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.matches(
          'input, textarea, select, button, [contenteditable="true"]',
        )
      )
        return;
      if (event.key === "Home") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (event.key === "End") {
        event.preventDefault();
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const related = useMemo(
    () =>
      article.relatedArticles.map((slug) => {
        const entry = allArticles.find((item) => item.slug === slug);
        return {
          slug,
          title: entry?.title || slug.replace(/-/g, " "),
          excerpt: entry?.excerpt,
          category: entry?.category,
        };
      }),
    [article.relatedArticles, allArticles],
  );

  const parentArticle = useMemo(
    () =>
      findParentArticle(
        article.metadata.slug,
        allArticles,
        article.parentArticle,
      ),
    [allArticles, article.metadata.slug, article.parentArticle],
  );

  const projectPages = useMemo(() => {
    const pageSlugs =
      article.subArticles?.map((item) => item.slug) ||
      allArticles
        .filter(
          (entry) =>
            entry.parentArticle ===
              (article.parentArticle || parentArticle?.slug) &&
            entry.slug !== article.metadata.slug,
        )
        .map((entry) => entry.slug);
    return pageSlugs.map((slug) => {
      const entry = allArticles.find((item) => item.slug === slug);
      const fallback = article.subArticles?.find((item) => item.slug === slug);
      return {
        slug,
        title: entry?.title || fallback?.title || slug.replace(/-/g, " "),
        excerpt: entry?.excerpt || fallback?.excerpt,
        category: entry?.category || article.metadata.category,
      };
    });
  }, [
    allArticles,
    article.metadata.category,
    article.metadata.slug,
    article.parentArticle,
    article.subArticles,
    parentArticle?.slug,
  ]);
  const [openRail, setOpenRail] = useState<"pages" | "suggested" | null>(null);
  useEffect(() => {
    setOpenRail(
      article.metadata.slug === "foss-coin" && projectPages.length > 0
        ? "pages"
        : "suggested",
    );
  }, [article.metadata.slug, projectPages.length]);

  const articleNeighbors = useMemo(() => {
    const readable = allArticles.filter(
      (entry) => !entry.hiddenFromSearch && !entry.isSubArticle,
    );
    const index = readable.findIndex(
      (entry) => entry.slug === article.metadata.slug,
    );
    return {
      previous: index > 0 ? readable[index - 1] : undefined,
      next: index >= 0 ? readable[index + 1] : undefined,
    };
  }, [allArticles, article.metadata.slug]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  };

  const copy = async (value: string, message: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showFeedback(message);
    } catch {
      showFeedback("Copy is unavailable in this browser");
    }
  };

  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.metadata.title,
          url: window.location.href,
        });
        return;
      } catch {
        return;
      }
    }
    copy(window.location.href, "Link copied");
  };

  const resumeReading = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: total * resumeProgress, behavior: "smooth" });
    setResumeProgress(0);
  };

  const fontClass =
    fontSize === "small"
      ? "article-size-small"
      : fontSize === "large"
        ? "article-size-large"
        : "";
  const widthClass =
    contentWidth === "wide"
      ? "article-content-wide"
      : "article-content-standard";

  return (
    <>
      <div
        className="reading-progress"
        aria-label={`Article reading progress: ${Math.round(scrollProgress)} percent`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollProgress)}
      >
        <span style={{ width: `${scrollProgress}%` }} />
        <b className={scrollProgress > 4 ? "is-visible" : ""}>
          {Math.round(scrollProgress)}%
        </b>
      </div>

      <div
        className={`article-layout ${article.metadata.slug === "foss-coin" ? "article-layout-foss" : ""}`}
      >
      <article
        ref={articleRef}
        className={`article-reader-content ${fontClass} ${widthClass}`}
      >
        <nav className="article-context-nav" aria-label="Article location">
          <Link
            href={parentArticle ? `/wiki/${parentArticle.slug}` : "/wiki/home"}
          >
            ←{" "}
            {parentArticle
              ? `Back to ${parentArticle.title}`
              : "Back to Wiki Home"}
          </Link>
          <Link href="/wiki/search">Browse articles →</Link>
        </nav>
        <div className="article-kicker">
          <span style={{ color: categoryColor(article.metadata.category) }}>
            {article.metadata.category}
          </span>
          <span>{readingTime} min read</span>
          <span>Updated {formatDate(article.metadata.lastEdited)}</span>
        </div>
        <header className="article-heading">
          <h1 data-testid="article-title">{article.metadata.title}</h1>
          <p className="article-dek">{getArticleDek(article)}</p>
          <div className="article-actions print:hidden">
            <ArticleAudioReader
              title={article.metadata.title}
              text={extractArticleText(article)}
            />
            {article.githubButton && (
              <a
                href={article.githubButton.url}
                target="_blank"
                rel="noopener noreferrer"
                className="action-button article-top-link print:hidden"
                aria-label="Open GitHub repository"
              >
                <Github size={16} />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            )}
            {article.deployedUrl && (
              <a
                href={article.deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="action-button article-top-link print:hidden"
                aria-label="Visit deployed project"
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">Visit project</span>
              </a>
            )}
            <button
              type="button"
              className={`action-button ${bookmarked ? "is-active" : ""}`}
              onClick={() => {
                toggleBookmark({
                  slug: article.metadata.slug,
                  title: article.metadata.title,
                  category: article.metadata.category,
                });
                showFeedback(
                  bookmarked ? "Removed from saved" : "Saved for later",
                );
              }}
              aria-label={bookmarked ? "Remove bookmark" : "Save article"}
              data-testid="button-bookmark"
            >
              {bookmarked ? (
                <BookmarkCheck size={16} />
              ) : (
                <Bookmark size={16} />
              )}
              <span className="hidden sm:inline">
                {bookmarked ? "Saved" : "Save"}
              </span>
            </button>
            <button
              type="button"
              className="action-button"
              onClick={() => copy(window.location.href, "Link copied")}
              aria-label="Copy article link"
              data-testid="button-copy-link"
            >
              <Copy size={16} />
              <span className="hidden sm:inline">Copy link</span>
            </button>
            <button
              type="button"
              className="action-button"
              onClick={shareArticle}
              aria-label="Share article"
              data-testid="button-share"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              className="action-button ml-auto"
              onClick={() => window.print()}
              aria-label="Print article"
              data-testid="button-print"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </header>

        {resumeProgress > 0 && (
          <div className="resume-reading" role="status">
            <div>
              <strong>Continue reading?</strong>
              <span>
                You were about {Math.round(resumeProgress * 100)}% through this
                article.
              </span>
            </div>
            <div>
              <button type="button" onClick={resumeReading}>
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(
                    `wiki-reading-progress:${article.metadata.slug}`,
                  );
                  setResumeProgress(0);
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {(article.metadata.slug.includes("verification") ||
          article.metadata.slug.includes("evidence")) && (
          <VerificationMap title={article.metadata.title} />
        )}

        {article.metadata.slug === "foss-coin" && (
          <figure className="foss-project-capture">
            <a
              href="/assets/foss-Thumbnail.gif"
              target="_blank"
              rel="noopener noreferrer"
              className="foss-project-capture-button"
              aria-label="Open FOSS Coin project capture in new tab"
            >
              <img
                src="/assets/foss-Thumbnail.gif"
                alt="FOSS Coin project capture showing the token trading workflow"
                loading="lazy"
                decoding="async"
              />
              <span className="foss-capture-overlay">Open full screen</span>
            </a>
            <figcaption>
              Project capture · FOSS Coin trading workflow
            </figcaption>
          </figure>
        )}

        {article.infobox && <Infobox data={article.infobox} />}

        <div className="article-lead">{parseLeadText(article.lead)}</div>

        {projectPages.length > 0 && (
          <details
            className="project-pages-mobile sub-articles print:hidden"
            data-testid="sub-articles-section"
          >
            <summary>
              <span>
                <p className="section-eyebrow">Continue within this project</p>
                <h2>Related pages</h2>
              </span>
              <span className="read-next-summary-icon" aria-hidden="true">
                ＋
              </span>
            </summary>
            <div className="sub-article-list">
              {projectPages.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/wiki/${sub.slug}`}
                  className="sub-article-link"
                  data-testid={`sub-article-${sub.slug}`}
                >
                  <span>
                    <strong>{sub.title}</strong>
                    <small>{sub.excerpt}</small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </details>
        )}

        <TableOfContents sections={article.sections} activeId={activeSection} />
        <div className="article-sections">
          {article.sections.map((section) => (
            <Section key={section.id} section={section} />
          ))}
        </div>

        {article.perspectives && article.perspectives.length > 0 && (
          <section className="article-extra-section">
            <h2>Different perspectives</h2>
            <div className="space-y-3">
              {article.perspectives.map((perspective) => (
                <div
                  key={perspective.title}
                  className="border border-border bg-card p-4"
                >
                  <h3 className="font-bold mb-1">{perspective.title}</h3>
                  <p className="text-muted-foreground">{perspective.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        <References references={article.references} />
        <div className="article-categories">
          <Tag size={15} />
          <strong>Topics</strong>
          {article.categories.map((category) => (
            <Link
              key={category}
              href={`/wiki/search?q=${encodeURIComponent(category)}`}
            >
              {category}
            </Link>
          ))}
        </div>

        {(articleNeighbors.previous || articleNeighbors.next) && (
          <nav
            className="article-neighbors print:hidden"
            aria-label="Article navigation"
          >
            <div>
              {articleNeighbors.previous && (
                <Link href={`/wiki/${articleNeighbors.previous.slug}`}>
                  <span>Previous article</span>
                  <strong>← {articleNeighbors.previous.title}</strong>
                </Link>
              )}
            </div>
            <div>
              {articleNeighbors.next && (
                <Link href={`/wiki/${articleNeighbors.next.slug}`}>
                  <span>Next article</span>
                  <strong>{articleNeighbors.next.title} →</strong>
                </Link>
              )}
            </div>
          </nav>
        )}

        {related.length > 0 && (
          <section className="read-next print:hidden">
            <div className="section-eyebrow">Keep reading</div>
            <h2>Recommended articles</h2>
            <div className="read-next-grid">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/wiki/${item.slug}`}
                  className="read-next-card"
                >
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {item.category || "Article"}
                  </span>
                  <strong>{item.title}</strong>
                  {item.excerpt && <small>{item.excerpt}</small>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <aside
        className="related-rail print:hidden"
        aria-label="Article navigation"
      >
        {projectPages.length > 0 && (
          <section className="rail-panel">
            <button
              type="button"
              className="rail-toggle"
              aria-expanded={openRail === "pages"}
              onClick={() => setOpenRail(openRail === "pages" ? null : "pages")}
            >
              <span>
                <span className="section-eyebrow">
                  Continue within this project
                </span>
                <strong>Related pages</strong>
              </span>
              <span className="read-next-summary-icon" aria-hidden="true">
                {openRail === "pages" ? "−" : "+"}
              </span>
            </button>
            {openRail === "pages" && (
              <div className="related-rail-list">
                {projectPages.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/wiki/${item.slug}`}
                    className="related-rail-card"
                  >
                    <span>{item.category}</span>
                    <strong>{item.title}</strong>
                    {item.excerpt && <small>{item.excerpt}</small>}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
        {related.length > 0 && (
          <section className="rail-panel">
            <button
              type="button"
              className="rail-toggle"
              aria-expanded={openRail === "suggested"}
              onClick={() =>
                setOpenRail(openRail === "suggested" ? null : "suggested")
              }
            >
              <span>
                <span className="section-eyebrow">Keep reading</span>
                <strong>Suggested articles</strong>
              </span>
              <span className="read-next-summary-icon" aria-hidden="true">
                {openRail === "suggested" ? "−" : "+"}
              </span>
            </button>
            {openRail === "suggested" && (
              <div className="related-rail-list">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/wiki/${item.slug}`}
                    className="related-rail-card"
                  >
                    <span>{item.category || "Article"}</span>
                    <strong>{item.title}</strong>
                    {item.excerpt && <small>{item.excerpt}</small>}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </aside>

      <aside className="article-settings print:hidden">
        <div className="settings-panel">
          <p className="section-eyebrow">Reading settings</p>
          <div className="settings-group">
            <span>Text size</span>
            <div className="settings-options">
              {(["small", "standard", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={fontSize === size ? "selected" : ""}
                >
                  {size === "small" ? "S" : size === "standard" ? "M" : "L"}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-group">
            <span>Width</span>
            <div className="settings-options">
              {(["standard", "wide"] as const).map((width) => (
                <button
                  key={width}
                  onClick={() => setContentWidth(width)}
                  className={contentWidth === width ? "selected" : ""}
                >
                  {width === "standard" ? "Reading" : "Wide"}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-group">
            <span>Theme</span>
            <div className="settings-options">
              <button onClick={requestThemePicker}>Choose theme</button>
            </div>
          </div>
        </div>
      </aside>
      </div>

      {showScrollTop && (
        <button
          type="button"
          className="back-to-top print:hidden"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
      {feedback && (
        <div className="reader-toast" role="status">
          {" "}
          <Check size={15} /> {feedback}
        </div>
      )}
    </>
  );
}
