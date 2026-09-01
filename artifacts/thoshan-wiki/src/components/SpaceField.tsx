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

/* ── Layer 2: Celestial Particles ── */
const particles = Array.from({ length: 14 }, (_, i) => {
  const angle = (i * 83.205) % 360;
  const distance = 42 + (i % 13) * 8;
  const x = 50 + distance * Math.cos((angle * Math.PI) / 180);
  const y = 50 + distance * Math.sin((angle * Math.PI) / 180);
  const shape = i % 5 === 0 ? "line" : i % 3 === 0 ? "oval" : "circle";
  const w = shape === "line" ? 1.5 : shape === "oval" ? 1.2 : 1;
  const h = shape === "line" ? 3.5 : shape === "oval" ? 2 : 1.5;
  return {
    id: `p${i}`,
    left: `${x}%`,
    top: `${y}%`,
    w,
    h,
    shape,
    rotation: shape === "line" ? (i * 47) % 360 : 0,
    delay: `${(i % 11) * -1.2}s`,
    duration: `${30 + (i % 7) * 3}s`,
  };
});

/* ── Layer 3: Satellites ── */
const satellites = [
  {
    id: "sat-1",
    left: "16%",
    top: "24%",
    w: 30,
    h: 9,
    orbitR: 130,
    orbitDur: "24s",
    rotDur: "20s",
    delay: "0s",
    scale: 1,
    opacity: 0.9,
    blinkDur: "3.2s",
    blinkDelay: "0s",
    signalDur: "2.4s",
    signalDelay: "0.3s",
  },
  {
    id: "sat-2",
    left: "80%",
    top: "66%",
    w: 22,
    h: 7,
    orbitR: 90,
    orbitDur: "30s",
    rotDur: "26s",
    delay: "-9s",
    scale: 0.72,
    opacity: 0.65,
    blinkDur: "4s",
    blinkDelay: "-1.5s",
    signalDur: "2.8s",
    signalDelay: "0.8s",
  },
  {
    id: "sat-3",
    left: "62%",
    top: "14%",
    w: 17,
    h: 5.5,
    orbitR: 65,
    orbitDur: "36s",
    rotDur: "32s",
    delay: "-16s",
    scale: 0.55,
    opacity: 0.45,
    blinkDur: "3.6s",
    blinkDelay: "-2.2s",
    signalDur: "3s",
    signalDelay: "1.1s",
  },
];

/* ── Layer 4: Moon ── */
const moon = {
  left: "78%",
  top: "18%",
  size: 34,
};

/* ── Layer 5: Shooting Stars ── */
const shootingStars = Array.from({ length: 5 }, (_, i) => {
  const fromLeft = i % 2 === 0;
  const sx = fromLeft ? -8 : 108;
  const ex = fromLeft ? 108 : -8;
  const sy = 6 + (i % 4) * 14;
  const ey = sy + (i % 3 === 0 ? 28 : i % 3 === 1 ? 18 : 12);
  const color =
    i % 5 === 0 ? "amber" : i % 3 === 0 ? "pale-blue" : i % 2 === 0 ? "orange" : "white";
  return {
    id: `ss${i}`,
    sx: `${sx}%`,
    sy: `${sy}%`,
    ex: `${ex}%`,
    ey: `${ey}%`,
    dur: `${9 + (i % 3)}s`,
    delay: `${i * 4.2 - 10}s`,
    color,
  };
});

/* ── Spacecraft ── */
const spacecraft = {
  left: "22%",
  top: "74%",
  size: 20,
  pathDur: "48s",
  delay: "-6s",
};

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
    const onMove = (e: MouseEvent) => {
      if (raf) return;
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
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
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
  const homeFalling = Array.from({ length: 8 }, (_, i) => ({
    id: `hf${i}`,
    left: `${8 + ((i * 29) % 84)}%`,
    delay: `${i * 1.7 - 7}s`,
    dur: `${7 + (i % 4)}s`,
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

          {/* Layer 2: Celestial Particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              className={`space-particle space-particle--${p.shape}`}
              data-layer={2}
              style={{
                left: p.left,
                top: p.top,
                width: p.w,
                height: p.h,
                animationDelay: p.delay,
                animationDuration: p.duration,
                transform: `translate(${px(2).toFixed(2)}%, ${py(2).toFixed(2)}%) rotate(${p.rotation}deg)`,
              }}
            />
          ))}

          {/* Layer 3: Satellites */}
          {satellites.map((s) => (
            <span
              key={s.id}
              className="space-satellite space-satellite--enhanced"
              data-layer={3}
              style={{
                left: s.left,
                top: s.top,
                width: s.w,
                height: s.h,
                animationDelay: s.delay,
                transform: `translate(${px(3).toFixed(2)}%, ${py(3).toFixed(2)}%) scale(${s.scale})`,
                opacity: s.opacity,
                "--orbit-radius": `${s.orbitR}px`,
                "--orbit-duration": s.orbitDur,
                "--rotation-duration": s.rotDur,
              } as React.CSSProperties}
            >
              <b
                className="satellite-light"
                style={{
                  animationDuration: s.blinkDur,
                  animationDelay: s.blinkDelay,
                }}
              />
              <i
                className="satellite-signal"
                style={{
                  animationDuration: s.signalDur,
                  animationDelay: s.signalDelay,
                }}
              />
            </span>
          ))}

          {/* Layer 3.5: Spacecraft */}
          <span
            className="space-spacecraft"
            data-layer={3.5}
            style={{
              left: spacecraft.left,
              top: spacecraft.top,
              width: spacecraft.size,
              height: spacecraft.size,
              animationDelay: spacecraft.delay,
              transform: `translate(${px(3.5).toFixed(2)}%, ${py(3.5).toFixed(2)}%)`,
            }}
          >
            <i className="spacecraft-body" />
            <i className="spacecraft-trail" />
          </span>

          {/* Layer 4: Moon */}
          <span
            className="space-moon space-moon--enhanced"
            data-layer={4}
            style={{
              left: moon.left,
              top: moon.top,
              width: moon.size,
              height: moon.size,
              transform: `translate(${px(4).toFixed(2)}%, ${py(4).toFixed(2)}%)`,
            }}
          >
            <i className="moon-surface" />
            <i className="moon-glow" />
          </span>

          {/* Layer 5: Shooting Stars */}
          {shootingStars.map((s) => (
            <span
              key={s.id}
              className={`space-shooting-star space-shooting-star--${s.color}`}
              data-layer={5}
              style={{
                animationDelay: s.delay,
                animationDuration: s.dur,
                "--start-x": s.sx,
                "--start-y": s.sy,
                "--end-x": s.ex,
                "--end-y": s.ey,
              } as React.CSSProperties}
            >
              <i className="shooting-star-head" />
              <i className="shooting-star-trail" />
            </span>
          ))}

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
