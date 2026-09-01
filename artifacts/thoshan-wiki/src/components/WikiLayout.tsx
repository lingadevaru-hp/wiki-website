import { useState, type ReactNode } from "react";
import WikiHeader from "./WikiHeader";
import WikiSidebar from "./WikiSidebar";
import WikiFooter from "./WikiFooter";

interface WikiLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  footer?: boolean;
  mainClassName?: string;
}

export default function WikiLayout({
  children,
  showBackButton = false,
  footer = false,
  mainClassName = "wiki-main",
}: WikiLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={`min-h-screen bg-background text-foreground${footer ? " flex flex-col" : ""}`}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <WikiHeader
        onMenuClick={() => setSidebarOpen((open) => !open)}
        showBackButton={showBackButton}
      />
      <div className={footer ? "wiki-shell flex-1" : "wiki-shell"}>
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main id="main-content" className={mainClassName} tabIndex={-1}>
          {children}
        </main>
      </div>
      {footer ? <WikiFooter /> : null}
    </div>
  );
}
