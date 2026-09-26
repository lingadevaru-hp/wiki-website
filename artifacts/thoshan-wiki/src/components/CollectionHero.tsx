import { ArrowDown, Boxes, Hammer, Search, Trophy } from "lucide-react";
import { HeroShader } from "./HeroShader";
import { Thunderbird } from "./Newsletter";
import type { FieldGlyph } from "./HeroPixelField";
import type { ArticleType } from "../lib/articleTypes";

export interface CollectionHeroConfig {
  type: ArticleType;
  glyph: FieldGlyph;
  eyebrow: string;
  tagline1: string;
  tagline2: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  onSecondary: () => void;
  scrollHint: string;
}

/** Landing-style full-bleed hero for the collection homepages: the same
 *  pixel field as `/`, resolving into the section word (NEWS / PROJECTS /
 *  ACHIEVEMENTS) instead of THOSHAN. No music — motion only. Each section
 *  gets its own background motif: thunderbirds for news, trophies for
 *  achievements, tools for projects. */
function Motif({ type }: { type: ArticleType }) {
  if (type === "news") {
    return (
      <div className="coll-motif coll-motif-news" aria-hidden="true">
        <span className="coll-bird coll-bird-a">
          <Thunderbird flying />
        </span>
        <span className="coll-bird coll-bird-b">
          <Thunderbird flying />
        </span>
      </div>
    );
  }
  if (type === "achievements") {
    return (
      <div className="coll-motif coll-motif-trophy" aria-hidden="true">
        <Trophy size={120} className="coll-float coll-float-a" />
        <Trophy size={64} className="coll-float coll-float-b" />
        <Trophy size={88} className="coll-float coll-float-c" />
      </div>
    );
  }
  return (
    <div className="coll-motif coll-motif-tools" aria-hidden="true">
      <Hammer size={110} className="coll-float coll-float-a" />
      <Boxes size={72} className="coll-float coll-float-b" />
      <Hammer size={56} className="coll-float coll-float-c" />
    </div>
  );
}

export default function CollectionHero({
  config,
  onPrimary,
}: {
  config: CollectionHeroConfig;
  onPrimary: () => void;
}) {
  return (
    <section className="omarchy-hero coll-hero-full">
      <HeroShader glyph={config.glyph} onGlyphPress={onPrimary} />
      <div aria-hidden="true" className="omarchy-hero-top" />
      <p data-hero-quiet className="omarchy-status omarchy-status--top">
        {config.eyebrow}
      </p>
      {/* Sizing slot the pixel field paints the section word into. */}
      <div
        data-hero-wordmark
        aria-hidden="true"
        className="coll-slot"
        style={{
          aspectRatio: `${config.glyph.width} / ${config.glyph.height}`,
        }}
      />
      <div className="omarchy-hero-copy relative">
        <p className="omarchy-tagline">
          {config.tagline1}
          <br />
          {config.tagline2}
        </p>
        <p className="omarchy-description">{config.description}</p>
        <div className="omarchy-actions">
          <button type="button" onClick={onPrimary} className="omarchy-primary">
            {config.primaryLabel} <ArrowDown size={16} />
          </button>
          <button
            type="button"
            onClick={config.onSecondary}
            className="omarchy-secondary"
          >
            <Search size={15} /> {config.secondaryLabel}
          </button>
        </div>
      </div>
      <Motif type={config.type} />
      <button
        type="button"
        className="omarchy-scroll"
        onClick={onPrimary}
        aria-label={config.scrollHint}
      >
        {config.scrollHint} <ArrowDown size={16} />
      </button>
      <div aria-hidden="true" className="omarchy-hero-bottom" />
    </section>
  );
}
