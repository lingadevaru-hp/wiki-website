import { useEffect, useRef } from "react";
import { X, Keyboard } from "lucide-react";
import { useLocale } from "../contexts/LocaleContext";
import { useFocusRestore } from "../hooks/use-focus-restore";

/** Other components open the manual by dispatching this event. */
export const OPEN_SHORTCUTS_EVENT = "thoshan:open-shortcuts";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Row = { keys: string[]; labelKey: string; fallback: string };
type Group = { titleKey: string; titleFallback: string; rows: Row[] };

/**
 * Shortcut choices are deliberate:
 * - NEVER Super (Omarchy/Hyprland eats it) and never browser-reserved
 *   Ctrl+W/T/N/P/S/R/F/L — so the site can't fight the OS or the browser.
 * - Single letters work only outside text fields; typing is never hijacked.
 * - Desktop-only enhancement: phones have no physical keyboard, and every
 *   action below is also one tap away for touch users.
 */
const GROUPS: Group[] = [
  {
    titleKey: "shortcuts.groupSearch",
    titleFallback: "Search",
    rows: [
      { keys: ["Ctrl", "K"], labelKey: "shortcuts.openSearch", fallback: "Open search" },
      { keys: ["/"], labelKey: "shortcuts.focusSearch", fallback: "Focus search" },
      { keys: ["↑", "↓"], labelKey: "shortcuts.navigateResults", fallback: "Move in results" },
      { keys: ["↵"], labelKey: "shortcuts.openResult", fallback: "Open highlighted result" },
      { keys: ["Esc"], labelKey: "shortcuts.closeDialog", fallback: "Close dialog" },
    ],
  },
  {
    titleKey: "shortcuts.groupMenu",
    titleFallback: "Menu & pages",
    rows: [
      { keys: ["M"], labelKey: "shortcuts.openMenu", fallback: "Open main menu" },
      { keys: ["G", "H"], labelKey: "shortcuts.goHome", fallback: "Go to Home" },
      { keys: ["G", "W"], labelKey: "shortcuts.goWiki", fallback: "Go to Wiki home" },
      { keys: ["G", "A"], labelKey: "shortcuts.goArticles", fallback: "Go to Articles" },
      { keys: ["G", "P"], labelKey: "shortcuts.goProjects", fallback: "Go to Projects" },
      { keys: ["G", "V"], labelKey: "shortcuts.goAchievements", fallback: "Go to Achievements" },
      { keys: ["G", "N"], labelKey: "shortcuts.goNews", fallback: "Go to News" },
      { keys: ["G", "B"], labelKey: "shortcuts.goAbout", fallback: "Go to About" },
      { keys: ["?"], labelKey: "shortcuts.openHelp", fallback: "Open this manual" },
    ],
  },
  {
    titleKey: "shortcuts.groupReading",
    titleFallback: "Reading & scroll",
    rows: [
      { keys: ["J", "/", "K"], labelKey: "shortcuts.scrollLine", fallback: "Scroll down / up" },
      { keys: ["D", "/", "U"], labelKey: "shortcuts.scrollHalf", fallback: "Half page down / up" },
      { keys: ["G", "G"], labelKey: "shortcuts.goTop", fallback: "Top of page" },
      { keys: ["Shift", "G"], labelKey: "shortcuts.goBottom", fallback: "Bottom of page" },
    ],
  },
  {
    titleKey: "shortcuts.groupPanels",
    titleFallback: "Panels & sound",
    rows: [
      { keys: ["C"], labelKey: "shortcuts.toggleChat", fallback: "Toggle chat panel" },
      { keys: ["T"], labelKey: "shortcuts.toggleTheme", fallback: "Open themes" },
      { keys: ["X"], labelKey: "shortcuts.toggleMusic", fallback: "Mute / unmute music" },
    ],
  },
  {
    titleKey: "shortcuts.groupGeneral",
    titleFallback: "General",
    rows: [
      { keys: ["Tab"], labelKey: "shortcuts.tabMove", fallback: "Move focus to next item" },
      { keys: ["Shift", "Tab"], labelKey: "shortcuts.tabBack", fallback: "Move focus back" },
      { keys: ["↵", "/", "Space"], labelKey: "shortcuts.enterActivate", fallback: "Activate focused item" },
    ],
  },
];

export default function ShortcutsModal({
  isOpen,
  onClose,
}: ShortcutsModalProps) {
  const { t } = useLocale();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Return focus to the opener on close.
  useFocusRestore(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      // Keep Tab inside the manual while it is open.
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const label = (row: Row) => {
    const hit = t(row.labelKey);
    return hit === row.labelKey ? row.fallback : hit;
  };
  const groupTitle = (group: Group) => {
    const hit = t(group.titleKey);
    return hit === group.titleKey ? group.titleFallback : hit;
  };

  return (
    <div
      className="global-search-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("shortcuts.title")}
      data-testid="shortcuts-modal"
    >
      <div className="shortcuts-modal" ref={modalRef}>
        <div className="shortcuts-modal-header">
          <Keyboard size={16} className="text-accent" />
          <span>{t("shortcuts.title")}</span>
          <button
            ref={closeRef}
            onClick={onClose}
            className="shortcuts-close"
            aria-label={t("shortcuts.close")}
          >
            <X size={15} />
          </button>
        </div>

        <div className="shortcuts-list">
          {GROUPS.map((group) => (
            <div key={group.titleKey}>
              <div
                className="shortcuts-group-title"
                role="heading"
                aria-level={3}
              >
                {groupTitle(group)}
              </div>
              {group.rows.map((row) => (
                <div
                  key={row.labelKey + row.keys.join("")}
                  className="shortcut-row"
                >
                  <span className="shortcut-label">{label(row)}</span>
                  <div className="shortcut-keys">
                    {row.keys.map((k, i) => (
                      <span key={i}>
                        <kbd className="shortcut-kbd">{k}</kbd>
                        {i < row.keys.length - 1 && (
                          <span className="shortcut-plus">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          Press <kbd className="shortcut-kbd">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
