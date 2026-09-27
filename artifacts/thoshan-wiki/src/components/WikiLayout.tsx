import { useLocale } from "../contexts/LocaleContext";
import { useEffect, useState, type ReactNode } from "react";
import WikiHeader from "./WikiHeader";

interface WikiLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  showBackTop?: boolean;
  mainClassName?: string;
  backHref?: string;
}

function LayoutBackToTop() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      className="back-to-top print:hidden"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t('nav.backToTop')}
    >
      ↑
    </button>
  );
}

export default function WikiLayout({
  children,
  showBackButton = false,
  showBackTop = false,
  mainClassName = "wiki-main",
  backHref,
}: WikiLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <WikiHeader
        showBackButton={showBackButton}
        backHref={backHref}
      />
      <div className="wiki-shell">
        <main id="main-content" className={mainClassName} tabIndex={-1}>
          {children}
        </main>
      </div>
      {showBackTop ? <LayoutBackToTop /> : null}
    </div>
  );
}
