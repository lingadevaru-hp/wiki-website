import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Github,
  Printer,
  Share2,
  Volume2,
  VolumeX,
  Tag,
} from "lucide-react";
import type { Article, ArticleIndexEntry } from "../types/article";
import Infobox from "./Infobox";
import TableOfContents from "./TableOfContents";
import Section from "./Section";
import References from "./References";
import ArticleAudioReader from "./ArticleAudioReader";
import VerificationMap from "./VerificationMap";
import MediaViewer from "./MediaViewer";

// Phantom token page for FOSS Coin (Solana). Buy flow opens in Phantom app/web.
const FOSS_COIN_BUY_URL =
  "https://phantom.com/tokens/solana/64AcKtFgExrtJWPJVr6U4iQrJ1VpiUvDHvRtdMHAcoin";
// Cloudflare Stream embed URL goes here once uploaded.
const FOSS_COIN_STREAM_URL = "";
const FOSS_COIN_VIDEO_SRC = FOSS_COIN_STREAM_URL || "/assets/foss-coin-loop.mp4";

import { findParentArticle, loadArticlesIndex } from "../lib/articleLoader";
import { categoryColor } from "../lib/categories";
import { estimateReadingMinutes, extractArticleText } from "../lib/articleText";
import { useTheme } from "../contexts/ThemeContext";
import { useBookmarks } from "../hooks/useBookmarks";
import { renderWikiInline } from "./WikiText";
import { useLocale } from "../contexts/LocaleContext";

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

interface NewsHeroProps {
  article: Article;
  videoRef: { current: HTMLVideoElement | null };
  videoOk: boolean;
  setVideoOk: (ok: boolean) => void;
  unmuted: boolean;
  toggleSound: () => void;
}

/** Swipeable news banner: slide 0 is the video, slides 1..n are photos.
 *  Auto-loops: video plays once (muted until the reader taps for sound),
 *  each photo holds 10s silent, then back to the video — looping.
 *  Arrows + dots + touch swipe reset the timer. */
const PHOTO_HOLD_MS = 10_000;
// Match-video fallback kept for reference: hold each photo for exactly the
// video's duration instead of the fixed 10s above.
// const PHOTO_HOLD_MODE = "match-video" as const;

function NewsHero({
  article,
  videoRef,
  videoOk,
  setVideoOk,
  unmuted,
  toggleSound,
}: NewsHeroProps) {
  const { t } = useLocale();
  // Photo queue: heroImages when present, else legacy single heroImage.
  const photoSlides = useMemo(
    () =>
      article.heroImages?.length
        ? article.heroImages
        : article.heroImage
          ? [article.heroImage]
          : [],
    [article.heroImages, article.heroImage],
  );
  const hasPhoto = photoSlides.length > 0;
  const slideCount = 1 + photoSlides.length;
  const [slide, setSlide] = useState(0);
  const touchX = useRef<number | null>(null);
  const go = (dir: 1 | -1) =>
    setSlide((s) => (s + dir + slideCount) % slideCount);

  // Pause the video while a photo is showing so audio never bleeds
  // onto the silent slides; restart from the top when back on video.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (slide === 0 && videoOk) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [slide, videoOk, videoRef]);

  // Auto-advance photo slides after the hold; the last photo wraps back
  // to the video. (Video → first photo is driven by onEnded below.
  // If the video file fails, the poster slide advances on the same timer.)
  // Skipped for reduced-motion readers; any manual nav resets the timer
  // via effect cleanup since it depends on `slide`.
  useEffect(() => {
    if (!hasPhoto) return;
    if (slide === 0 && videoOk) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = window.setTimeout(() => {
      if (document.hidden) return;
      setSlide((s) => (s + 1) % slideCount);
    }, PHOTO_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [slide, hasPhoto, videoOk, slideCount]);

  // Pause background playback when the tab is hidden.
  useEffect(() => {
    const onVis = () => {
      const v = videoRef.current;
      if (document.hidden) v?.pause();
      else if (slide === 0 && videoOk) v?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [slide, videoOk, videoRef]);

  return (
    <div
      className="news-hero"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40 && hasPhoto) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className={`news-slide${slide === 0 ? " is-active" : ""}`}>
        {videoOk ? (
          <video
            ref={videoRef}
            src={article.heroVideo}
            poster={article.heroPoster}
            autoPlay
            muted
            playsInline
            preload="auto"
            onError={() => setVideoOk(false)}
            onEnded={() => {
              // Loop: after the video finishes (with sound if unmuted),
              // step through the silent photo slides (see timer above).
              if (hasPhoto) setSlide(1);
              else videoRef.current?.play().catch(() => {});
            }}
            aria-label={article.metadata.title}
          />
        ) : (
          article.heroPoster && (
            <img src={article.heroPoster} alt="" aria-hidden="true" />
          )
        )}
      </div>
      {photoSlides.map((src, i) => (
        <div
          key={src}
          className={`news-slide${slide === i + 1 ? " is-active" : ""}`}
        >
          <img
            src={src}
            alt={article.metadata.title}
            // Cropped portrait slide: faces sit high in the frame, so bias
            // the cover crop upward to keep them visible at wide aspects.
            style={
              src.includes("ceo-router-hero")
                ? { objectPosition: "center 35%" }
                : undefined
            }
          />
        </div>
      ))}
      <div className="news-hero-caption">
        <p className="section-eyebrow">{t("type.newsTitle")}</p>
        <h1>{article.metadata.title}</h1>
        <p>{getArticleDek(article)}</p>
      </div>
      <button
        type="button"
        className="news-sound"
        onClick={toggleSound}
        aria-pressed={unmuted}
        aria-label={unmuted ? t("article.soundOff") : t("article.soundOn")}
        title={unmuted ? t("article.soundOff") : t("article.soundOn")}
      >
        {unmuted ? <Volume2 size={17} /> : <VolumeX size={17} />}
      </button>
      {hasPhoto && (
        <div className="news-hero-nav">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t("article.prevSlide")}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="news-dots" aria-hidden="true">
            {Array.from({ length: slideCount }, (_, i) => (
              <i key={i} className={slide === i ? "is-active" : ""} />
            ))}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t("article.nextSlide")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ArticleView({ article }: { article: Article }) {
  const { t } = useLocale();
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
  const [gifViewerOpen, setGifViewerOpen] = useState(false);
  const [fossMuted, setFossMuted] = useState(true);
  const fossVideoRef = useRef<HTMLVideoElement | null>(null);
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false);

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

  /** News articles are pure reading: no settings panel, fixed
   *  large/standard layout plus the distinct news reader style. */
  const isNews =
    article.metadata.category === "News" ||
    article.metadata.category === "Events" ||
    (article.categories ?? []).some((c) =>
      ["news", "events"].includes(c.toLowerCase()),
    );
  const hasVideoHero = isNews && !!article.heroVideo;
  const [videoOk, setVideoOk] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [unmuted, setUnmuted] = useState(false);
  const toggleSound = useCallback(() => {
    const v = videoRef.current;
    setUnmuted((was) => {
      const next = !was;
      if (v) {
        v.muted = !next;
        if (next) {
          v.volume = 1;
          v.play().catch(() => {});
        }
      }
      return next;
    });
  }, []);
  /** More news for the left rail (same category, not this article). */
  const moreNews = useMemo(
    () =>
      allArticles
        .filter(
          (a) =>
            !a.hiddenFromSearch &&
            a.slug !== article.metadata.slug &&
            (a.category === "News" || a.category === "Events"),
        )
        .slice(0, 5),
    [allArticles, article.metadata.slug],
  );

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
    copy(window.location.href, t('article.linkCopied'));
  };

  const resumeReading = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: total * resumeProgress, behavior: "smooth" });
    setResumeProgress(0);
  };

  const fontClass = isNews
    ? "article-size-large"
    : fontSize === "small"
      ? "article-size-small"
      : fontSize === "large"
        ? "article-size-large"
        : "";
  const widthClass =
    isNews || contentWidth !== "wide"
      ? "article-content-standard"
      : "article-content-wide";

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

      {hasVideoHero && (
        <NewsHero
          article={article}
          videoRef={videoRef}
          videoOk={videoOk}
          setVideoOk={setVideoOk}
          unmuted={unmuted}
          toggleSound={toggleSound}
        />
      )}

      <div
        className={`article-layout ${article.metadata.slug === "foss-coin" ? "article-layout-foss" : ""}`}
      >
      {isNews && moreNews.length > 0 && (
        <aside className="news-rail print:hidden" aria-label={t("type.newsTitle")}>
          <p className="section-eyebrow">{t("type.newsTitle")}</p>
          <ul className="news-rail-list">
            {moreNews.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/wiki/${item.slug}`}
                  className="news-rail-card"
                >
                  <strong>{item.title}</strong>
                  {item.excerpt && <small>{item.excerpt}</small>}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
      <article
        ref={articleRef}
        className={`article-reader-content ${fontClass} ${widthClass}${isNews ? " article--news" : ""}`}
      >
        <div className="article-kicker">
          <span style={{ color: categoryColor(article.metadata.category) }}>
            {article.metadata.category}
          </span>
          <span>{readingTime} {t('article.minRead')}</span>
          <span>{t('article.updated')} {formatDate(article.metadata.lastEdited)}</span>
        </div>
        <header className="article-heading">
          {!hasVideoHero && (
            <>
              <h1 data-testid="article-title">{article.metadata.title}</h1>
              <p className="article-dek">{getArticleDek(article)}</p>
            </>
          )}
        </header>

        {article.metadata.slug === "foss-coin" && (
          <div className="foss-buy-banner" data-testid="foss-buy-banner">
            <div>
              <strong>{t("article.buyFossTitle")}</strong>
              <span>{t("article.buyFossSubtitle")}</span>
            </div>
            <a
              href={FOSS_COIN_BUY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="foss-buy-button"
              data-testid="foss-buy-button"
              aria-label={t("article.buyFossTitle")}
            >
              {t("article.buyFossNow")}
            </a>
          </div>
        )}

        {resumeProgress > 0 && (
          <div className="resume-reading" role="status">
            <div>
              <strong>{t('article.continueReading')}</strong>
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
            <button
              type="button"
              className="foss-project-capture-button"
              aria-label={t('article.openCapture')}
              aria-haspopup="dialog"
              onClick={() => {
                fossVideoRef.current?.pause();
                setGifViewerOpen(true);
              }}
            >
              <video
                ref={fossVideoRef}
                src={FOSS_COIN_VIDEO_SRC}
                poster="/assets/foss-coin-poster.jpg"
                autoPlay
                loop
                muted={fossMuted}
                playsInline
                preload="auto"
                aria-label="FOSS Coin project capture showing the token trading workflow"
                className="h-auto w-full"
              />
              <span className="foss-capture-overlay" aria-hidden="true">
                Open full screen
              </span>
            </button>
            <button
              type="button"
              className="foss-sound-toggle"
              aria-label={fossMuted ? 'Unmute FOSS Coin video sound' : 'Mute FOSS Coin video sound'}
              aria-pressed={!fossMuted}
              onClick={(e) => {
                e.stopPropagation();
                const v = fossVideoRef.current;
                if (v) { v.muted = !fossMuted; void v.play().catch(() => {}); }
                setFossMuted(!fossMuted);
              }}
            >
              {fossMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{fossMuted ? 'Tap for sound' : 'Mute'}</span>
            </button>
            <figcaption>
              Project capture · FOSS Coin trading workflow
            </figcaption>
            {gifViewerOpen && (
              <MediaViewer
                item={{
                  src: FOSS_COIN_VIDEO_SRC,
                  alt: "FOSS Coin project capture showing the token trading workflow",
                  caption: "FOSS Coin trading workflow",
                  type: "video",
                  muted: fossMuted,
                }}
                onClose={() => {
                  setGifViewerOpen(false);
                  const v = fossVideoRef.current;
                  if (v) void v.play().catch(() => {});
                }}
              />
            )}
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
                <p className="section-eyebrow">{t('article.continueProject')}</p>
                <h2>{t('article.related')}</h2>
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
            <h2>{t('article.perspectives')}</h2>
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
          <strong>{t('article.topics')}</strong>
          {article.categories.map((category) => (
            <Link
              key={category}
              href={`/wiki/search?q=${encodeURIComponent(category)}`}
            >
              {category}
            </Link>
          ))}
        </div>

        {/* News articles are pure reading: no bottom action bar. */}
        {!isNews && (
        <div className="article-actions article-actions-end print:hidden">
          <ArticleAudioReader
            title={article.metadata.title}
            text={extractArticleText(article)}
            onPlayerOpenChange={setAudioPlayerOpen}
          />
          {article.githubButton && (
            <a
              href={article.githubButton.url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button article-top-link print:hidden"
              aria-label={t('article.openRepo')}
            >
              <Github size={16} />
              <span className="hidden sm:inline">{t('article.github')}</span>
            </a>
          )}
          {article.deployedUrl && (
            <a
              href={article.deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button article-top-link print:hidden"
              aria-label={t('article.visitDeployed')}
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">{t('article.visitProject')}</span>
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
                bookmarked ? t('article.removedSaved') : t('article.savedLater'),
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
              {bookmarked ? t('article.saved') : t('article.save')}
            </span>
          </button>
          <button
            type="button"
            className="action-button"
            onClick={() => copy(window.location.href, t('article.linkCopied'))}
            aria-label={t('article.copyArticleLink')}
            data-testid="button-copy-link"
          >
            <Copy size={16} />
            <span className="hidden sm:inline">{t('article.copyLink')}</span>
          </button>
          <button
            type="button"
            className="action-button"
            onClick={shareArticle}
            aria-label={t('article.shareArticle')}
            data-testid="button-share"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">{t('article.share')}</span>
          </button>
          <button
            type="button"
            className="action-button article-print-button sm:ml-auto"
            onClick={() => window.print()}
            aria-label={t('article.printArticle')}
            data-testid="button-print"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">{t('article.print')}</span>
          </button>
        </div>
        )}

        {!isNews && (articleNeighbors.previous || articleNeighbors.next) && (
          <nav
            className="article-neighbors print:hidden"
            aria-label="Article navigation"
          >
            <div>
              {articleNeighbors.previous && (
                <Link href={`/wiki/${articleNeighbors.previous.slug}`}>
                  <span>{t('article.prev')}</span>
                  <strong>← {articleNeighbors.previous.title}</strong>
                </Link>
              )}
            </div>
            <div>
              {articleNeighbors.next && (
                <Link href={`/wiki/${articleNeighbors.next.slug}`}>
                  <span>{t('article.next')}</span>
                  <strong>{articleNeighbors.next.title} →</strong>
                </Link>
              )}
            </div>
          </nav>
        )}

        {!isNews && related.length > 0 && (
          <section className="read-next print:hidden">
            <div className="section-eyebrow">{t('article.keepReading')}</div>
            <h2>{t('article.recommended')}</h2>
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

      {!isNews && (
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
                <span className="section-eyebrow">{t('article.continueProject')}</span>
                <strong>{t('article.related')}</strong>
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
                <span className="section-eyebrow">{t('article.keepReading')}</span>
                <strong>{t('article.suggested')}</strong>
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
      )}

      {!isNews && (
        <aside className="article-settings print:hidden">
          <div className="settings-panel">
            <p className="section-eyebrow">{t('article.settings')}</p>
            <div className="settings-group">
              <span>{t('article.textSize')}</span>
              <div className="settings-options">
                {["small", "standard", "large"].map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      setFontSize(size as "small" | "standard" | "large")
                    }
                    className={fontSize === size ? "selected" : ""}
                  >
                    {size === "small" ? "S" : size === "standard" ? "M" : "L"}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-group">
              <span>{t('article.width')}</span>
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
              <span>{t('article.theme')}</span>
              <div className="settings-options">
                <button
                  onClick={() => setTheme("light")}
                  className={theme === "white" ? "selected" : ""}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={theme === "tokyo-night" ? "selected" : ""}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
      </div>

      {article.metadata.slug === "foss-coin" && (
        <a
          href={FOSS_COIN_BUY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="foss-buy-sticky print:hidden"
          data-testid="foss-buy-sticky"
          aria-label={t("article.buyFossTitle")}
        >
          {t("article.buyFossNow")}
        </a>
      )}

      {showScrollTop && !audioPlayerOpen && (
        <button
          type="button"
          className="back-to-top print:hidden"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t('article.backToTop')}
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
