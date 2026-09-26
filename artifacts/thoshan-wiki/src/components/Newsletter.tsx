import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "../contexts/LocaleContext";

const DISMISSED_KEY = "newsletter-dismissed";
const SUBSCRIBED_KEY = "newsletter-subscribed";
const DWELL_MS = 10_000;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
}

/** Stylised thunderbird carrying an envelope. Wings flap while flying;
 *  perched, the whole bird gently bobs (both via CSS classes). */
export function Thunderbird({ flying }: { flying: boolean }) {
  return (
    <svg
      viewBox="0 0 160 110"
      className={`thunderbird${flying ? " is-flying" : ""}`}
      aria-hidden="true"
    >
      {/* tail feathers */}
      <polygon points="18,62 2,52 4,66 0,78 20,72" className="tb-tail" />
      {/* far wing */}
      <g className="tb-wing tb-wing-far">
        <polygon points="70,58 40,18 62,60 52,66" />
      </g>
      {/* body */}
      <path
        d="M28 66 Q60 40 104 52 Q128 58 132 68 Q110 78 78 80 Q48 82 28 66 Z"
        className="tb-body"
      />
      {/* head + beak */}
      <circle cx="126" cy="58" r="11" className="tb-body" />
      <polygon points="136,55 148,60 136,65" className="tb-beak" />
      <circle cx="129" cy="55" r="2.2" className="tb-eye" />
      {/* near wing (flaps) */}
      <g className="tb-wing tb-wing-near">
        <polygon points="72,60 56,10 84,56 96,50 78,64" />
      </g>
      {/* legs tucked */}
      <polygon points="70,80 78,80 74,88" className="tb-tail" />
      {/* envelope in beak */}
      <g className="tb-envelope" transform="translate(138,64) rotate(8)">
        <rect x="0" y="0" width="26" height="18" rx="2" />
        <polyline points="1,2 13,11 25,2" />
      </g>
    </svg>
  );
}

export default function NewsletterSection() {
  const { t } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [dwelled, setDwelled] = useState(false);
  const [inView, setInView] = useState(false);
  const [flown, setFlown] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [landed, setLanded] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(() => readFlag(SUBSCRIBED_KEY));
  const [dismissed, setDismissed] = useState(() => readFlag(DISMISSED_KEY));

  // 10s dwell timer.
  useEffect(() => {
    const timer = window.setTimeout(() => setDwelled(true), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Near-bottom visibility.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // One celebratory fly-across once dwelled + visible.
  useEffect(() => {
    if (!dwelled || !inView || flown || dismissed) return;
    setFlown(true);
  }, [dwelled, inView, flown, dismissed]);

  const openOverlay = useCallback(() => {
    setOverlay(true);
    setLanded(false);
    setError("");
    // Flight duration matches the CSS flight-path animation.
    window.setTimeout(() => setLanded(true), 2500);
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlay(false);
    setLanded(false);
    setDismissed(true);
    writeFlag(DISMISSED_KEY);
  }, []);

  // Esc dismisses.
  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay, closeOverlay]);

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const value = email.trim();
      if (!/.+@.+\..+/.test(value)) {
        setError(t("newsletter.invalid"));
        return;
      }
      // TODO(future backend): POST /api/subscribe { email } -> ZeptoMail
      // welcome mail. Frontend-only for now: acknowledge + remember.
      try {
        // eslint-disable-next-line no-console
        console.info("[newsletter] stubbed subscribe:", value);
      } catch {
        /* noop */
      }
      setDone(true);
      setError("");
      writeFlag(SUBSCRIBED_KEY);
    },
    [email, t],
  );

  return (
    <>
      <section
        ref={sectionRef}
        className="newsletter-section"
        aria-label={t("newsletter.title")}
      >
        <p className="section-eyebrow">{t("newsletter.eyebrow")}</p>
        <h2>{t("newsletter.title")}</h2>
        <p className="newsletter-sub">{t("newsletter.sub")}</p>
        <button
          type="button"
          className={`newsletter-bird${flown ? " has-flown" : ""}`}
          onClick={openOverlay}
          aria-haspopup="dialog"
          aria-label={t("newsletter.birdLabel")}
          title={t("newsletter.hint")}
        >
          <Thunderbird flying={flown && !dismissed} />
        </button>
        <p className="newsletter-hint">{t("newsletter.hint")}</p>
      </section>

      {overlay && (
        <div
          className="newsletter-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("newsletter.modalTitle")}
          onClick={closeOverlay}
        >
          <div className="newsletter-sky" aria-hidden="true">
            <div className={`newsletter-flight${landed ? " is-landed" : ""}`}>
              <Thunderbird flying={!landed} />
            </div>
          </div>
          {landed && (
            <div
              className="newsletter-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="newsletter-close"
                onClick={closeOverlay}
                aria-label={t("newsletter.close")}
              >
                <X size={17} />
              </button>
              {done ? (
                <div className="newsletter-ack" role="status">
                  <Thunderbird flying={false} />
                  <h3>{t("newsletter.ackTitle")}</h3>
                  <p>{t("newsletter.ackBody")}</p>
                </div>
              ) : (
                <>
                  <h3>{t("newsletter.modalTitle")}</h3>
                  <p>{t("newsletter.modalSub")}</p>
                  <form onSubmit={submit} noValidate>
                    <label htmlFor="newsletter-email">
                      {t("newsletter.emailLabel")}
                    </label>
                    <div className="newsletter-field">
                      <input
                        id="newsletter-email"
                        type="email"
                        autoComplete="email"
                        placeholder={t("newsletter.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                      <button type="submit">{t("newsletter.submit")}</button>
                    </div>
                    {error && (
                      <p className="newsletter-error" role="alert">
                        {error}
                      </p>
                    )}
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
