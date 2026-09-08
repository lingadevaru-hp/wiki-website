import { useRef, useState } from "react";
import { ArrowDown, ArrowRight, Linkedin, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useSearch } from "../contexts/SearchContext";
import SEO from "../components/SEO";
import { HeroShader } from "../components/HeroShader";
import { ThoshanMark, ThoshanWordmark, WORDMARK_BANDS } from "../components/Brand";
import { MusicControl } from "../components/MusicControl";
import { EtchPicker } from "../components/EtchPicker";
import { GithubIcon, PaletteIcon, SearchIcon } from "../components/icons";
import { OPEN_PICKER_EVENT } from "../lib/theme";

export default function LandingPage() {
  const [, setLocation] = useLocation(); const { openSearch } = useSearch(); const archive = useRef<HTMLElement>(null);
  const [painted, setPainted] = useState(false);
  const etchAsked = new URLSearchParams(window.location.search).get("etch");
  const openPicker = () => window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT));
  return <div className="omarchy-landing">
    <SEO title="THOSHAN — systems, projects, and things worth keeping" description="The personal portfolio and knowledge base of Thoshan." path="/" keywords={["Thoshan", "portfolio", "FOSS Coin", "blockchain developer"]} />
    <header className="omarchy-header"><button className="omarchy-home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" title="Back to top"><ThoshanMark className="size-[22px] text-brand" /></button><nav><button onClick={() => setLocation("/wiki/home")}>Wiki</button><button onClick={() => setLocation("/wiki/articles")}>Projects</button></nav><div className="omarchy-icons"><button className="omarchy-icon-button" onClick={openSearch} aria-label="Search" title="Search"><SearchIcon className="size-5" /></button><button className="omarchy-icon-button" onClick={openPicker} aria-label="Change theme" title="Change theme (T)"><PaletteIcon className="size-5" /></button><a className="omarchy-icon-button" href="https://github.com/lingadevaru-hp" target="_blank" rel="me noopener noreferrer" aria-label="GitHub" title="GitHub"><GithubIcon className="size-5" /></a><a className="omarchy-icon-button" href="https://linkedin.com/in/lingadevaruhp" target="_blank" rel="me noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><Linkedin size={19} /></a></div><div><button onClick={() => setLocation("/wiki/home")} className="omarchy-install">Enter archive</button></div></header>
    <main>
      <section className="omarchy-hero">
        <HeroShader onPainted={() => setPainted(true)} />
        {etchAsked ? <EtchPicker /> : null}
        <div aria-hidden="true" className="omarchy-hero-top" />
        <p data-hero-quiet className="omarchy-status omarchy-status--top">THOSHAN'S WIKI / PERSONAL SYSTEM</p>
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
        <div className="omarchy-hero-copy relative"><h1 className="sr-only">THOSHAN</h1><p className="omarchy-tagline">Projects, systems &amp; lessons<br />worth keeping.</p><p className="omarchy-description">A living record of what I build, break, learn, and make useful.</p><div className="omarchy-actions"><button onClick={() => setLocation("/wiki/home")} className="omarchy-primary">Explore my work <ArrowRight size={16} /></button><button onClick={openSearch} className="omarchy-secondary"><Search size={15} /> Search the archive</button></div></div><button className="omarchy-scroll" onClick={() => archive.current?.scrollIntoView({ behavior: "smooth" })}>Scroll to explore <ArrowDown size={16} /></button><div aria-hidden="true" className="omarchy-hero-bottom" /></section>
      <section ref={archive} className="omarchy-archive"><p>THE ARCHIVE</p><h2>Built in public.<br />Remembered on purpose.</h2><div className="omarchy-cards"><button onClick={() => setLocation("/wiki/foss-coin")}><span>01</span><strong>FOSS Coin</strong><em>Open-source crypto project</em></button><button onClick={() => setLocation("/wiki/thoshan-flash")}><span>02</span><strong>Thoshan Flash</strong><em>Experiments in AI</em></button><button onClick={() => setLocation("/wiki/home")}><span>03</span><strong>All notes</strong><em>Tools, systems &amp; learning</em></button></div></section>
    </main><MusicControl path="/" />
  </div>;
}
