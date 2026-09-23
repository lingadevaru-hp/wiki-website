import { useRef, useState } from "react";
import { ArrowDown, ArrowRight, Linkedin, Menu, MessageCircle, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useSearch } from "../contexts/SearchContext";
import { useLocale } from "../contexts/LocaleContext";
import SEO from "../components/SEO";
import { HeroShader } from "../components/HeroShader";
import { ThoshanMark, ThoshanWordmark, WORDMARK_BANDS } from "../components/Brand";
import { MusicControl } from "../components/MusicControl";
import { EtchPicker } from "../components/EtchPicker";
import { GithubIcon, PaletteIcon, SearchIcon } from "../components/icons";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { OPEN_PICKER_EVENT } from "../lib/theme";
import { OPEN_PALETTE_EVENT } from "../lib/command-menu";
import { toggleChatPanel } from "../lib/chat-panel";

export default function LandingPage() {
  const [, setLocation] = useLocation(); const { openSearch } = useSearch(); const { t } = useLocale(); const archive = useRef<HTMLElement>(null);
  const [painted, setPainted] = useState(false);
  const etchAsked = new URLSearchParams(window.location.search).get("etch");
  const openPicker = () => window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT));
  return <div className="omarchy-landing">
    <SEO title="THOSHAN — systems, projects, and things worth keeping" description="The personal portfolio and knowledge base of Thoshan." path="/" keywords={["Thoshan", "portfolio", "FOSS Coin", "blockchain developer"]} />
     <header className="omarchy-header"><button className="omarchy-home" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT)); }} aria-label={t("nav.menu")} title={t("nav.menu")}><ThoshanMark className="size-[22px] text-brand" /></button><nav><button onClick={() => setLocation("/wiki/home")}>{t("landing.navWiki")}</button><button onClick={() => setLocation("/wiki/articles")}>{t("landing.navProjects")}</button></nav><div className="omarchy-icons"><button className="omarchy-icon-button omarchy-menu-button" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))} aria-label={t("landing.openMenu")} title={t("nav.menu")}><Menu size={19} /></button><button className="omarchy-icon-button" onClick={openSearch} aria-label={t("menu.search")} title={t("menu.search")}><SearchIcon className="size-5" /></button><button className="omarchy-icon-button" onClick={toggleChatPanel} aria-label={t("nav.chat")} title={t("nav.chat")}><MessageCircle size={19} /></button><button className="omarchy-icon-button" onClick={openPicker} aria-label={t("theme.changeTheme")} title={t("theme.changeTheme")}><PaletteIcon className="size-5" /></button><LanguageSwitcher triggerClassName="omarchy-icon-button" /><a className="omarchy-icon-button" href="https://github.com/lingadevaru-hp" target="_blank" rel="me noopener noreferrer" aria-label={t("menu.github")} title={t("menu.github")}><GithubIcon className="size-5" /></a><a className="omarchy-icon-button" href="https://linkedin.com/in/lingadevaruhp" target="_blank" rel="me noopener noreferrer" aria-label={t("menu.linkedin")} title={t("menu.linkedin")}><Linkedin size={19} /></a></div><div><button onClick={() => setLocation("/wiki/home")} className="omarchy-install">{t("landing.enterArchive")}</button></div></header>
    <main>
      <section className="omarchy-hero">
        <HeroShader onPainted={() => setPainted(true)} />
        {etchAsked ? <EtchPicker /> : null}
        <div aria-hidden="true" className="omarchy-hero-top" />
        <p data-hero-quiet className="omarchy-status omarchy-status--top">{t("landing.status")}</p>
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
        <div className="omarchy-hero-copy relative"><h1 className="sr-only">THOSHAN</h1><p className="omarchy-tagline">{t("landing.tagline1")}<br />{t("landing.tagline2")}</p><p className="omarchy-description">{t("landing.description")}</p><div className="omarchy-actions"><button onClick={() => setLocation("/wiki/home")} className="omarchy-primary">{t("landing.explore")} <ArrowRight size={16} /></button><button onClick={openSearch} className="omarchy-secondary"><Search size={15} /> {t("landing.searchArchive")}</button></div></div><button className="omarchy-scroll" onClick={() => archive.current?.scrollIntoView({ behavior: "smooth" })}>{t("landing.scroll")} <ArrowDown size={16} /></button><div aria-hidden="true" className="omarchy-hero-bottom" /></section>
      <section ref={archive} className="omarchy-archive"><p>{t("landing.archive")}</p><h2>{t("landing.builtInPublic")}<br />{t("landing.remembered")}</h2><figure className="landing-project-capture in-view"><button type="button" className="landing-capture-button" onClick={() => setLocation('/wiki/foss-coin')} aria-label={t("landing.featuredOpen")}><video src="/assets/foss-coin-loop.mp4" disablePictureInPicture poster="/assets/foss-coin-poster.jpg" autoPlay loop muted playsInline preload="auto" aria-label={t("landing.featuredOpen")} /><span className="foss-capture-overlay" aria-hidden="true">{t("landing.featuredOpen")}</span></button><figcaption><p className="section-eyebrow">{t("landing.featured")}</p><p><strong>{t("landing.fossTitle")}</strong><span className="foss-tagline">{t("landing.fossTagline")}</span></p></figcaption></figure><div className="omarchy-cards"><button onClick={() => setLocation("/wiki/foss-coin")}><span>01</span><strong>{t("landing.fossTitle")}</strong><em>{t("landing.fossDesc")}</em></button><button onClick={() => setLocation("/wiki/thoshan-flash")}><span>02</span><strong>{t("landing.flashTitle")}</strong><em>{t("landing.flashDesc")}</em></button><button onClick={() => setLocation("/wiki/home")}><span>03</span><strong>{t("landing.allNotes")}</strong><em>{t("landing.allNotesDesc")}</em></button></div></section>
    </main><MusicControl path="/" />
  </div>;
}
