import { Check, ExternalLink, ShieldCheck } from "lucide-react";

interface VerificationMapProps {
  title: string;
}

/** A truthful front-end map for verification work; live checks belong to a future backend. */
export default function VerificationMap({ title }: VerificationMapProps) {
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
          <p className="section-eyebrow">Evidence map</p>
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
          <strong>Explorer</strong>
          <small>Inspect the public transaction and token records.</small>
        </div>
        <div>
          <span>02</span>
          <strong>RPC</strong>
          <small>Compare account state with the documented claims.</small>
        </div>
        <div>
          <span>03</span>
          <strong>Cross-check</strong>
          <small>Confirm the same facts across more than one source.</small>
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
