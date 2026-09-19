import { useLocale } from "../contexts/LocaleContext";
import { Check, ExternalLink, ShieldCheck } from "lucide-react";

interface VerificationMapProps {
  title: string;
}

/** A truthful front-end map for verification work; live checks belong to a future backend. */
export default function VerificationMap({ title }: VerificationMapProps) {
  const { t } = useLocale();
  return (
    <section
      className="verification-map"
      aria-labelledby="verification-map-title"
    >
      <div className="verification-map-header">
        <div className="verification-map-icon">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="section-eyebrow">{t('verify.evidence')}</p>
          <h2 id="verification-map-title">
            Verify {title.replace(" — ", " ")}
          </h2>
        </div>
        <span className="verification-badge">
          <Check size={12} /> Documented
        </span>
      </div>
      <p className="verification-map-note">
        This page organizes public evidence for independent checking. It does
        not run live network checks in the browser.
      </p>
      <div className="verification-steps">
        <div>
          <span>01</span>
          <strong>{t('verify.explorer')}</strong>
          <small>{t('verify.inspect')}</small>
        </div>
        <div>
          <span>02</span>
          <strong>{t('verify.rpc')}</strong>
          <small>{t('verify.compare')}</small>
        </div>
        <div>
          <span>03</span>
          <strong>{t('verify.crossCheck')}</strong>
          <small>{t('verify.confirm')}</small>
        </div>
      </div>
      <a
        href="https://developers.cloudflare.com"
        target="_blank"
        rel="noreferrer"
        className="verification-future-link"
      >
        <ExternalLink size={13} /> Backend verification can be connected later
      </a>
    </section>
  );
}
