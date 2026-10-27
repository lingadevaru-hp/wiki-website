import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Menu, MessageCircle, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useSearch } from "../contexts/SearchContext";
import { useLocale } from "../contexts/LocaleContext";
import SEO from "../components/SEO";
import { HeroShader } from "../components/HeroShader";
import { ThoshanMark, ThoshanWordmark, WORDMARK_BANDS } from "../components/Brand";
import { MusicControl } from "../components/MusicControl";
import NewsletterSection from "../components/Newsletter";
import { EtchPicker } from "../components/EtchPicker";
import { GithubIcon, PaletteIcon, SearchIcon } from "../components/icons";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { OPEN_PICKER_EVENT } from "../lib/theme";
import { OPEN_PALETTE_EVENT } from "../lib/command-menu";
import { toggleChatPanel } from "../lib/chat-panel";

export default function LandingPage() {
  const [, setLocation] = useLocation(); const { openSearch } = useSearch(); const { t } = useLocale(); const archive = useRef<HTMLElement>(null);
  const [painted, setPainted] = useState(false);
  // The featured-project loop is ~8.8 MB. Attaching its source only after
  // window load keeps it off the critical path: the poster paints immediately
  // (it is the LCP image) and the video streams once the page is interactive.
  // `preload="none"` alone is not enough — React sets src on mount, which
  // starts the download, so the source itself has to be deferred.
  const captureVideo = useRef<HTMLVideoElement>(null);
  const [captureSrc, setCaptureSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const attach = () => { if (!cancelled) setCaptureSrc("/assets/foss-coin-loop.mp4"); };
    if (document.readyState === "complete") {
      const timer = window.setTimeout(attach, 0);
      return () => { cancelled = true; window.clearTimeout(timer); };
    }
    window.addEventListener("load", attach, { once: true });
    return () => { cancelled = true; window.removeEventListener("load", attach); };
  }, []);
  useEffect(() => {
    const video = captureVideo.current;
    if (!captureSrc || !video) return;
    video.load();
    // Autoplay may be refused (battery saver, data saver); the poster remains.
    void video.play().catch(() => {});
  }, [captureSrc]);
  const etchAsked = new URLSearchParams(window.location.search).get("etch");
  const openPicker = () => window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT));
  return <div className="omarchy-landing">
    <SEO title="Lingadevaru HP (Thoshan) — Personal knowledge wiki" description="Personal knowledge wiki of Lingadevaru HP (Thoshan) — notes, projects and learnings, kept in public." path="/" keywords={["Thoshan", "Lingadevaru HP", "lingadevaruhp", "personal wiki", "personal knowledge wiki", "knowledge base", "FOSS Coin"]} />
     <header className="omarchy-header"><button className="omarchy-home" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT)); }} aria-label={t("nav.menu")} title={t("nav.menu")}><ThoshanMark className="size-[22px] text-brand" /></button><nav><button onClick={() => setLocation("/wiki/home")}>{t("landing.navWiki")}</button><button onClick={() => setLocation("/projects")}>{t("landing.navProjects")}</button><button onClick={() => setLocation("/news")}>{t("type.news")}</button></nav><div className="omarchy-icons"><button className="omarchy-icon-button omarchy-menu-button" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))} aria-label={t("landing.openMenu")} title={t("nav.menu")}><Menu size={19} /></button><button className="omarchy-icon-button" onClick={() => openSearch()} aria-label={t("menu.search")} title={t("menu.search")}><SearchIcon className="size-5" /></button><button className="omarchy-icon-button" onClick={toggleChatPanel} aria-label={t("nav.chat")} title={t("nav.chat")}><MessageCircle size={19} /></button><button className="omarchy-icon-button" onClick={openPicker} aria-label={t("theme.changeTheme")} title={t("theme.changeTheme")}><PaletteIcon className="size-5" /></button><LanguageSwitcher triggerClassName="omarchy-icon-button" /><a className="omarchy-icon-button" href="https://github.com/lingadevaru-hp" target="_blank" rel="me noopener noreferrer" aria-label={t("menu.github")} title={t("menu.github")}><GithubIcon className="size-5" /></a></div><div><button onClick={() => setLocation("/wiki/home")} className="omarchy-install">{t("landing.enterArchive")}</button></div></header>
    <main>
      <section className="omarchy-hero">
        <HeroShader onPainted={() => setPainted(true)} />
        {etchAsked ? <EtchPicker /> : null}
        <div aria-hidden="true" className="omarchy-hero-top" />
        <p data-hero-quiet className="omarchy-status omarchy-status--top">{t("landing.status")}</p>
        <div><button type="button" onClick={() => setLocation("/wiki/omarchy-meetup")} className="omarchy-news-pill"><span>{t("landing.newsPill")}</span>{t("landing.newsPillText")} <ArrowRight size={13} /></button></div>
        <div className="relative flex w-full flex-col items-center px-6">
          <ThoshanWordmark
            data-hero-wordmark
            label="THOSHAN"
            background={WORDMARK_BANDS}
            className={
              "w-[88%] max-w-4xl text-[color:var(--t-field-lit)]" +
              (painted ? " invisible" : "")
            }
          />
        </div>
        <div className="omarchy-hero-copy relative"><h1 className="sr-only">Lingadevaru HP (Thoshan) — lingadevaruhp — Personal knowledge wiki</h1><p className="omarchy-tagline">{t("landing.tagline1")}<br />{t("landing.tagline2")}</p><p className="omarchy-description">{t("landing.description")}</p><div className="omarchy-actions"><button onClick={() => setLocation("/wiki/home")} className="omarchy-primary">{t("landing.explore")} <ArrowRight size={16} /></button><button onClick={() => openSearch()} className="omarchy-secondary"><Search size={15} /> {t("landing.searchArchive")}</button></div></div><button className="omarchy-scroll" onClick={() => archive.current?.scrollIntoView({ behavior: "smooth" })}>{t("landing.scroll")} <ArrowDown size={16} /></button><div aria-hidden="true" className="omarchy-hero-bottom" /></section>
      <section ref={archive} className="omarchy-archive"><p>{t("landing.archive")}</p><h2>{t("landing.builtInPublic")}<br />{t("landing.remembered")}</h2><figure className="landing-project-capture in-view"><button type="button" className="landing-capture-button" onClick={() => setLocation('/wiki/foss-coin')} aria-label={t("landing.featuredOpen")}><video ref={captureVideo} src={captureSrc ?? undefined} disablePictureInPicture poster="/assets/foss-coin-poster.jpg" autoPlay loop muted playsInline preload="none" aria-label={t("landing.featuredOpen")} /><span className="foss-capture-overlay" aria-hidden="true">{t("landing.featuredOpen")}</span></button><figcaption><p className="section-eyebrow">{t("landing.featured")}</p><p><strong>{t("landing.fossTitle")}</strong><span className="foss-tagline">{t("landing.fossTagline")}</span></p></figcaption></figure><div className="omarchy-cards"><button onClick={() => setLocation("/wiki/foss-coin")}><span>01</span><strong>{t("landing.fossTitle")}</strong><em>{t("landing.fossDesc")}</em></button><button onClick={() => setLocation("/wiki/thoshan-flash")}><span>02</span><strong>{t("landing.flashTitle")}</strong><em>{t("landing.flashDesc")}</em></button><button onClick={() => setLocation("/wiki/home")}><span>03</span><strong>{t("landing.allNotes")}</strong><em>{t("landing.allNotesDesc")}</em></button></div></section>
      <NewsletterSection autoOpenAfterMs={15_000} />
    </main><MusicControl path="/" />
  </div>;
}
