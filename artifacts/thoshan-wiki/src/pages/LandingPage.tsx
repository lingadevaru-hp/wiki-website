import { useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { useSearch } from '../contexts/SearchContext';
import MediaViewer from '../components/MediaViewer';
import SpaceField from '../components/SpaceField';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { openSearch } = useSearch();
  const exploreRef = useRef<HTMLElement>(null);
  const [captureOpen, setCaptureOpen] = useState(false);

  return (
    <div className="landing-page">
      <header className="landing-header"><span className="landing-mark">T</span><span>Thoshan&apos;s Wiki</span><button type="button" onClick={() => setLocation('/wiki/home')}>Wiki Home <ArrowRight size={14} /></button></header>
      <main className="landing-main"><SpaceField variant="landing" />
        <section className="landing-hero"><div className="landing-orbit" aria-hidden="true"><span>T</span></div><p className="section-eyebrow">A personal knowledge base</p><h1>Thoshan&apos;s<br /><em>Wiki</em></h1><p className="landing-subtitle">Projects, systems, and lessons worth keeping.</p><div className="landing-actions"><button className="landing-primary" onClick={() => setLocation('/wiki/home')}>Start reading <ArrowRight size={17} /></button><button className="landing-secondary" onClick={openSearch}><Search size={16} /> Search articles</button></div><button className="landing-scroll" onClick={() => exploreRef.current?.scrollIntoView({ behavior: 'smooth' })} aria-label="Explore the wiki"><span>Explore the archive</span><ArrowDown size={16} /></button></section>
        <section className="landing-project-capture"><div><p className="section-eyebrow">A project in motion</p><h2>FOSS Coin, captured in the wild.</h2><p>A self-created crypto project, documented openly as it evolves. This is a small glimpse into the archive. Tap the capture to view it at full size.</p></div><button type="button" className="landing-capture-button" onClick={() => setCaptureOpen(true)} aria-label="Open FOSS Coin project capture fullscreen"><img src="/assets/foss-Thumbnail.gif" alt="FOSS Coin project capture showing the token trading workflow" loading="lazy" decoding="async" /><span className="foss-capture-overlay">Open full screen</span></button></section>
        <section ref={exploreRef} className="landing-explore"><div><p className="section-eyebrow">Inside the archive</p><h2>A living record of building, learning, and figuring things out.</h2></div><div className="landing-explore-grid"><div><strong>Projects</strong><span>Blockchain, AI, web, and infrastructure work documented from the inside.</span></div><div><strong>Systems</strong><span>Practical notes on tools, security, networks, and self-hosting.</span></div><div><strong>Learning</strong><span>Roadmaps and lessons that stay useful after the project ships.</span></div></div></section>
        {captureOpen && <MediaViewer item={{ src: '/assets/foss-Thumbnail.gif', alt: 'FOSS Coin project capture showing the token trading workflow', caption: 'FOSS Coin trading workflow', type: 'image' }} onClose={() => setCaptureOpen(false)} />}
      </main>
    </div>
  );
}
