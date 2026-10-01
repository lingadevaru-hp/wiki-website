import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "../contexts/LocaleContext";
import { posthog } from "../lib/posthog";
import { trackEvent, trackNewsletterSignup } from "../lib/clarity";

const DISMISSED_KEY = "newsletter-dismissed";
const SUBSCRIBED_KEY = "newsletter-subscribed";
const EMAIL_KEY = "newsletter-email";
const NAME_KEY = "newsletter-name";
const DWELL_MS = 10_000;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function readStr(key: string): string {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStr(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
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
 *  perched, the whole bird gently bobs (both via CSS classes).
 *  The envelope is a full letter (body + back flap + front folds),
 *  gripped at its left edge by the beak tip; feather grooves, brow,
 *  mandible split and fanned tail feathers keep it reading as a bird. */
export function Thunderbird({ flying }: { flying: boolean }) {
  return (
    <svg
      viewBox="0 0 178 110"
      className={`thunderbird${flying ? " is-flying" : ""}`}
      aria-hidden="true"
    >
      {/* tail feathers (fanned trio) */}
      <polygon points="28,62 8,50 12,62 6,72 28,68" className="tb-tail" />
      <polygon points="28,68 10,62 12,72 8,82 28,74" className="tb-tail" />
      <polygon points="28,73 16,70 16,80 14,88 28,78" className="tb-tail" />
      {/* far wing + feather grooves */}
      <g className="tb-wing tb-wing-far">
        <polygon points="70,58 40,18 62,60 52,66" />
        <polyline points="52,30 62,52" className="tb-detail" />
        <polyline points="46,42 58,58" className="tb-detail" />
      </g>
      {/* body */}
      <path
        d="M28 66 Q60 40 104 52 Q128 58 132 68 Q110 78 78 80 Q48 82 28 66 Z"
        className="tb-body"
      />
      {/* belly curve + chest ticks */}
      <path d="M42 73 Q72 84 106 71" className="tb-detail" />
      <polyline points="100,61 106,63" className="tb-detail" />
      <polyline points="96,67 102,68" className="tb-detail" />
      {/* head + split beak */}
      <circle cx="126" cy="58" r="11" className="tb-body" />
      <polygon points="134,54 150,59 134,60" className="tb-beak" />
      <polygon points="134,60 146,63 134,66" className="tb-beak" />
      <polyline points="134,60 148,60" className="tb-detail" />
      <circle cx="138" cy="57" r="1" className="tb-detail-fill" />
      <circle cx="129" cy="55" r="2.2" className="tb-eye" />
      <polyline points="122,48 130,46 136,49" className="tb-detail" />
      {/* near wing (flaps) + feather grooves */}
      <g className="tb-wing tb-wing-near">
        <polygon points="72,60 56,10 84,56 96,50 78,64" />
        <polyline points="60,26 66,50" className="tb-detail" />
        <polyline points="70,30 74,52" className="tb-detail" />
      </g>
      {/* legs tucked (pair) */}
      <polygon points="70,80 78,80 74,88" className="tb-tail" />
      <polygon points="82,80 90,80 86,88" className="tb-tail" />
      {/* full letter gripped at its left edge by the beak tip */}
      <g className="tb-envelope" transform="translate(143,47) rotate(6)">
        <rect x="0" y="0" width="30" height="22" rx="2" />
        <polyline points="2,3 15,14 28,3" />
        <polyline points="2,21 11,12" />
        <polyline points="28,21 19,12" />
      </g>
    </svg>
  );
}

export default function NewsletterSection({
  autoOpenAfterMs,
}: { autoOpenAfterMs?: number } = {}) {
  const { locale, t } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const landTimer = useRef<number | null>(null);
  const [dwelled, setDwelled] = useState(false);
  const [inView, setInView] = useState(false);
  const [flown, setFlown] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [landed, setLanded] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(() => readFlag(SUBSCRIBED_KEY));
  const [storedEmail, setStoredEmail] = useState(() => readStr(EMAIL_KEY));
  const [storedName, setStoredName] = useState(() => readStr(NAME_KEY));
  // 'new' doubles as the already-subscribed choice screen for returners.
  const [mode, setMode] = useState<"new" | "edit" | "again">("new");
  const [ackKind, setAckKind] = useState<"new" | "edited" | "again">("new");
  const [viewAck, setViewAck] = useState(false);
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
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOverlay(true);
    setLanded(false);
    setError("");
    setMode("new");
    setViewAck(false);
    // Land the form FIRST: analytics must never block the open flow.
    // Brave Shields breaks trackers, which used to throw here and leave the
    // bird flying forever with no form (the exact customer complaint).
    // Flight duration matches the CSS flight-path animation; reduced-motion
    // users skip the wait.
    if (landTimer.current) window.clearTimeout(landTimer.current);
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
      false;
    landTimer.current = window.setTimeout(
      () => setLanded(true),
      reduceMotion ? 300 : 2500,
    );
    try {
      posthog.capture("newsletter_open", { locale });
    } catch {
      /* tracker blocked — form still opens */
    }
    try {
      trackEvent("newsletter_open", { locale });
    } catch {
      /* tracker blocked — form still opens */
    }
  }, [locale]);

  const closeOverlay = useCallback(() => {
    if (landTimer.current) {
      window.clearTimeout(landTimer.current);
      landTimer.current = null;
    }
    setOverlay(false);
    setLanded(false);
    setDismissed(true);
    writeFlag(DISMISSED_KEY);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  // Optional timed auto-popup (news/article pages): opens the modal once
  // after the visitor has spent autoOpenAfterMs on the page. Suppressed
  // forever once dismissed or subscribed (localStorage flags).
  useEffect(() => {
    if (!autoOpenAfterMs || autoOpenAfterMs <= 0) return;
    if (readFlag(SUBSCRIBED_KEY) || readFlag(DISMISSED_KEY)) return;
    const timer = window.setTimeout(() => {
      if (readFlag(SUBSCRIBED_KEY) || readFlag(DISMISSED_KEY)) return;
      openOverlay();
    }, autoOpenAfterMs);
    return () => window.clearTimeout(timer);
  }, [autoOpenAfterMs, openOverlay]);

  // Esc dismisses.
  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay, closeOverlay]);

  useEffect(() => {
    if (overlay && landed) closeButtonRef.current?.focus();
  }, [overlay, landed]);

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      const name = firstName.trim();
      const address = email.trim();
      if (name.length > 80 || /[\r\n\0]/.test(name)) {
        setError(t("newsletter.nameInvalid"));
        return;
      }
      if (!/.+@.+\..+/.test(address)) {
        setError(t("newsletter.invalid"));
        return;
      }

      setSubmitting(true);
      setError("");
      try {
        const response = await fetch("/api/newsletter/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: name,
            email: address,
            language: locale,
            // Fresh visitors subscribe; returners explicitly chose edit/again.
            mode: done ? mode : "new",
            previousEmail: done ? storedEmail : undefined,
          }),
        });
        const data = (await response.json().catch(() => null)) as {
          edited?: boolean;
          resubscribed?: boolean;
          duplicate?: boolean;
        } | null;
        if (response.status === 404) {
          setError(t("newsletter.notFound"));
          posthog.capture("newsletter_submit_failed", { locale });
          return;
        }
        if (!response.ok) throw new Error("Newsletter signup failed");
        if (data?.duplicate) {
          setError(t("newsletter.duplicate"));
          posthog.capture("newsletter_submit_failed", { locale });
          return;
        }

        const kind =
          done && mode === "edit"
            ? "edited"
            : done && mode === "again"
              ? "again"
              : "new";
        setAckKind(kind);
        setDone(true);
        setViewAck(true);
        setStoredEmail(address);
        setStoredName(name);
        writeFlag(SUBSCRIBED_KEY);
        writeStr(EMAIL_KEY, address);
        writeStr(NAME_KEY, name);
        posthog.capture("newsletter_submit_success", { locale, kind });
        trackNewsletterSignup("portfolio-newsletter", address);
        trackEvent("newsletter_submit_success", { locale, kind });
      } catch {
        setError(t("newsletter.submitFailed"));
        try {
          posthog.capture("newsletter_submit_failed", { locale });
        } catch {
          /* tracker blocked — error already shown */
        }
      } finally {
        setSubmitting(false);
      }
    },
    [email, firstName, locale, submitting, t, done, mode, storedEmail],
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
                ref={closeButtonRef}
                type="button"
                className="newsletter-close"
                onClick={closeOverlay}
                aria-label={t("newsletter.close")}
              >
                <X size={17} />
              </button>
              {viewAck ? (
                <div className="newsletter-ack" role="status">
                  <Thunderbird flying={false} />
                  <h3>
                    {ackKind === "edited"
                      ? t("newsletter.editedAckTitle")
                      : ackKind === "again"
                        ? t("newsletter.againAckTitle")
                        : t("newsletter.ackTitle")}
                  </h3>
                  <p>
                    {ackKind === "edited"
                      ? t("newsletter.editedAckBody")
                      : ackKind === "again"
                        ? t("newsletter.againAckBody")
                        : t("newsletter.ackBody")}
                  </p>
                </div>
              ) : done && mode === "new" && storedEmail ? (
                <>
                  <h3>{t("newsletter.alreadyTitle")}</h3>
                  <p>{t("newsletter.alreadyBody")}</p>
                  <p>
                    <strong>{storedEmail}</strong>
                  </p>
                  <form
                    className="newsletter-form"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="newsletter-field newsletter-choices">
                      <button
                        type="button"
                        onClick={() => {
                          setFirstName(storedName);
                          setEmail(storedEmail);
                          setError("");
                          setMode("edit");
                        }}
                      >
                        {t("newsletter.editDetails")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFirstName("");
                          setEmail("");
                          setError("");
                          setMode("again");
                        }}
                      >
                        {t("newsletter.subscribeAgain")}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h3>
                    {mode === "edit"
                      ? t("newsletter.editTitle")
                      : mode === "again"
                        ? t("newsletter.againTitle")
                        : t("newsletter.modalTitle")}
                  </h3>
                  <p>{t("newsletter.modalSub")}</p>
                  <form className="newsletter-form" onSubmit={submit} noValidate>
                    <label htmlFor="newsletter-first-name">
                      {t("newsletter.nameLabel")}
                    </label>
                    <input
                      id="newsletter-first-name"
                      className="newsletter-input"
                      type="text"
                      autoComplete="given-name"
                      maxLength={80}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "newsletter-error" : undefined}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <label htmlFor="newsletter-email">
                      {t("newsletter.emailLabel")}
                    </label>
                    <div className="newsletter-field">
                      <input
                        id="newsletter-email"
                        className="newsletter-input"
                        type="email"
                        autoComplete="email"
                        placeholder={t("newsletter.emailPlaceholder")}
                        required
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "newsletter-error" : undefined}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <button type="submit" disabled={submitting}>
                        {submitting
                          ? t("newsletter.submitting")
                          : mode === "edit"
                            ? t("newsletter.saveChanges")
                            : t("newsletter.submit")}
                      </button>
                    </div>
                    {error && (
                      <p
                        id="newsletter-error"
                        className="newsletter-error"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                    {done && mode !== "new" && (
                      <button
                        type="button"
                        className="newsletter-switch"
                        onClick={() => {
                          setError("");
                          setMode("new");
                        }}
                      >
                        {t("newsletter.chooseDifferent")}
                      </button>
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
