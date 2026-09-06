import { useEffect, useRef, useState } from "react";

/* ── Layer 1: Distant Stars ── */
const distantStars = Array.from({ length: 80 }, (_, i) => {
  const angle = (i * 137.508) % 360;
  const distance = 28 + (i % 19) * 7.5;
  const x = 50 + distance * Math.cos((angle * Math.PI) / 180);
  const y = 50 + distance * Math.sin((angle * Math.PI) / 180);
  const size = i % 14 === 0 ? 2 : i % 7 === 0 ? 1.5 : 1;
  const colorType =
    i % 22 === 0 ? "warm" : i % 13 === 0 ? "cool-blue" : "white";
  return {
    id: `s${i}`,
    left: `${x}%`,
    top: `${y}%`,
    size,
    colorType,
    delay: `${(i % 19) * -0.4}s`,
    duration: `${3 + (i % 11) * 0.45}s`,
  };
});

export default function SpaceField({
  variant = "home",
}: {
  variant?: "home" | "landing";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsTouch(window.matchMedia("(hover:none) and (pointer:coarse)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isTouch || variant !== "landing") return;
    let raf = 0;
    let scrollTimeout = 0;
    let isScrolling = false;
    const onMove = (e: MouseEvent) => {
      if (isScrolling || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const c = containerRef.current;
        if (!c) return;
        const r = c.getBoundingClientRect();
        setPointer({
          x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
          y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
        });
      });
    };
    const onScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        isScrolling = false;
      }, 150);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(scrollTimeout);
    };
  }, [isTouch, variant]);

  const px = (layer: number) => {
    if (isTouch || variant !== "landing") return 0;
    const speeds: Record<number, number> = {
      1: 0.012, 2: 0.022, 3: 0.035, 3.5: 0.03, 4: 0.018, 5: 0.04,
    };
    return (pointer.x - 0.5) * (speeds[layer] || 0.02) * 100;
  };
  const py = (layer: number) => {
    if (isTouch || variant !== "landing") return 0;
    const speeds: Record<number, number> = {
      1: 0.008, 2: 0.016, 3: 0.026, 3.5: 0.022, 4: 0.013, 5: 0.03,
    };
    return (pointer.y - 0.5) * (speeds[layer] || 0.015) * 100;
  };

  const glowX = pointer.x * 100;
  const glowY = pointer.y * 100;

  /* ── Home variant (original) ── */
  const homeStars = Array.from({ length: 28 }, (_, i) => ({
    id: `h${i}`,
    left: `${(i * 37) % 100}%`,
    top: `${(i * 61) % 100}%`,
    delay: `${(i % 7) * -0.7}s`,
    size: i % 5 === 0 ? 2 : 1,
  }));
  const homeFalling = Array.from({ length: 12 }, (_, i) => ({
    id: `hf${i}`,
    left: `${5 + ((i * 23) % 90)}%`,
    delay: `${i * 1.35 - 10}s`,
    dur: `${6.5 + (i % 4) * 0.8}s`,
  }));

  return (
    <div
      ref={containerRef}
      className={`space-field space-field--${variant}`}
      aria-hidden="true"
      data-px={isTouch ? 0.5 : pointer.x}
      data-py={isTouch ? 0.5 : pointer.y}
    >
      {/* ── Home variant ── */}
      {variant === "home" && (
        <>
          {homeStars.map((s) => (
            <i
              key={s.id}
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
              }}
            />
          ))}
          {homeFalling.map((s) => (
            <span
              key={s.id}
              className="space-falling-star"
              style={{
                left: s.left,
                animationDelay: s.delay,
                animationDuration: s.dur,
              }}
            />
          ))}
          <span className="space-satellite-float space-satellite-one">
            <b />
          </span>
          <span className="space-satellite-float space-satellite-two">
            <b />
          </span>
          <span className="space-moon" />
        </>
      )}

      {/* ── Landing variant ── */}
      {variant === "landing" && (
        <>
          {/* Layer 1: Distant Stars */}
          {distantStars.map((s) => (
            <i
              key={s.id}
              className="space-star space-star--distant"
              data-layer={1}
              data-color={s.colorType}
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
                animationDuration: s.duration,
                transform: `translate(${px(1).toFixed(2)}%, ${py(1).toFixed(2)}%)`,
              }}
            />
          ))}

          {/* One satellite and one comet keep the scene cinematic without clutter. */}
          <span className="space-hero-satellite">
            <svg
              className="space-satellite-art"
              viewBox="0 0 180 72"
              role="img"
              aria-label="Satellite drifting through space"
            >
              <defs>
                <linearGradient id="satellite-body" x1="0" x2="1">
                  <stop offset="0" stopColor="#26384d" />
                  <stop offset="1" stopColor="#101923" />
                </linearGradient>
                <linearGradient id="satellite-panel" x1="0" x2="1">
                  <stop offset="0" stopColor="#6f9fb8" stopOpacity="0.32" />
                  <stop offset="1" stopColor="#d5f0f6" stopOpacity="0.72" />
                </linearGradient>
              </defs>
              <path d="M10 24H55L63 48H10Z" fill="url(#satellite-panel)" stroke="#aacbd7" strokeOpacity="0.7" />
              <path d="M125 24H170V48H117Z" fill="url(#satellite-panel)" stroke="#aacbd7" strokeOpacity="0.7" />
              <path d="M61 20H119L128 52H52Z" fill="url(#satellite-body)" stroke="#d8edf2" strokeOpacity="0.8" />
              <path d="M84 20V52M99 20V52" stroke="#8fb5c4" strokeOpacity="0.45" />
              <path d="M90 20V7" stroke="#d8edf2" strokeOpacity="0.8" />
              <circle cx="90" cy="6" r="4" fill="#d8edf2" fillOpacity="0.8" />
              <path d="M128 36H157" stroke="#d8edf2" strokeOpacity="0.45" />
              <path d="M52 36H34" stroke="#d8edf2" strokeOpacity="0.45" />
              <path d="M126 32L145 36L126 40Z" fill="#f5c46b" fillOpacity="0.85" />
            </svg>
          </span>
          <span className="space-comet">
            <i className="space-comet-head" />
            <i className="space-comet-tail" />
          </span>

          {/* Cursor glow */}
          <span
            className="space-cursor-glow"
            style={{ left: `${glowX}%`, top: `${glowY}%` }}
          />

          {/* Background star field */}
          <span className="space-star-field" />
        </>
      )}
    </div>
  );
}
