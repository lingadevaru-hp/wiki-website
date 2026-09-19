import { useEffect, useRef } from "react";
import { X, Keyboard } from "lucide-react";
import { useLocale } from "../contexts/LocaleContext";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Win", "K"], label: "Open search" },
  { keys: ["Ctrl", "K"], label: "Open search" },
  { keys: ["/"], label: "Focus header search" },
  { keys: ["Ctrl", "/"], label: "Open keyboard shortcuts" },
  { keys: ["↑", "↓"], label: "Navigate search results" },
  { keys: ["↵"], label: "Open selected result" },
  { keys: ["Esc"], label: "Close modal / blur input" },
];

export default function ShortcutsModal({
  isOpen,
  onClose,
}: ShortcutsModalProps) {
  const { t } = useLocale();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
      <div className="shortcuts-modal">
        <div className="shortcuts-modal-header">
          <Keyboard size={16} className="text-accent" />
          <span>{t("shortcuts.title")}</span>
          <button
            onClick={onClose}
            className="shortcuts-close"
            aria-label={t("shortcuts.close")}
          >
            <X size={15} />
          </button>
        </div>

        <div className="shortcuts-list">
          {shortcuts.map(({ keys, label }) => (
            <div key={label + keys.join("")} className="shortcut-row">
              <span className="shortcut-label">{label}</span>
              <div className="shortcut-keys">
                {keys.map((k, i) => (
                  <span key={i}>
                    <kbd className="shortcut-kbd">{k}</kbd>
                    {i < keys.length - 1 && (
                      <span className="shortcut-plus">+</span>
                    )}
                  </span>
                ))}
              </div>
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
