import { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Check } from "lucide-react";

// Android 13+ shows its own system clipboard overlay (with content
// preview) on every copy, so an in-app toast would double-confirm.
// Older Android, iOS and desktop get our snackbar instead.
function isAndroid13OrLater(): boolean {
  if (typeof navigator === "undefined") return false;
  const m = /Android\s+(\d+)/i.exec(navigator.userAgent);
  return m ? parseInt(m[1], 10) >= 13 : false;
}

// Tactile confirmation on devices with a vibration motor (Android
// Chrome). Silent no-op on iOS/desktop. Never fires without a tap.
function hapticConfirm() {
  try {
    if (
      "vibrate" in navigator &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      navigator.vibrate(15);
    }
  } catch {
    // Haptics are best-effort only.
  }
}

// Briefly intensifies ::selection so the copied range flashes.
function flashSelection() {
  try {
    const root = document.documentElement;
    root.classList.add("copy-flash");
    window.setTimeout(() => root.classList.remove("copy-flash"), 400);
  } catch {
    // Visual-only enhancement.
  }
}

interface SelectionState {
  text: string;
  rect: DOMRect | null;
}

export function TextSelectionCopy() {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [snack, setSnack] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const later = useCallback(
    (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms));
    },
    [],
  );

  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.toString().trim().length === 0) {
        setSelection(null);
        return;
      }

      // Only show for non-trivial selections (more than just whitespace)
      const selectedText = sel.toString().trim();
      if (selectedText.length < 2) {
        setSelection(null);
        return;
      }

      // Get the bounding rect of the selection
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Don't show if selection is too large (likely accidental)
      if (
        rect.width > window.innerWidth * 0.8 ||
        rect.height > window.innerHeight * 0.6
      ) {
        setSelection(null);
        return;
      }

      // New selection re-arms the button state
      setCopied(false);
      setFailed(false);
      setSnack(false);
      clearTimers();
      setSelection({ text: selectedText, rect });
    }

    function handleMouseUp() {
      // Use requestAnimationFrame to allow the selection to fully settle
      requestAnimationFrame(handleSelectionChange);
    }

    function handleKeyUp() {
      // Check for selection changes via keyboard (shift+arrow, etc.)
      requestAnimationFrame(handleSelectionChange);
    }

    function handleTouchEnd() {
      // Touch needs a beat longer: the OS selection handles + native
      // menu settle after touchend before the range is final.
      window.setTimeout(handleSelectionChange, 120);
    }

    function handleScroll() {
      // Hide popup when scrolling
      setSelection(null);
    }

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("scroll", handleScroll);
      clearTimers();
    };
  }, [clearTimers]);

  const copyToClipboard = useCallback(async () => {
    if (!selection) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(selection.text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = selection.text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      clearTimers();
      setFailed(false);
      setCopied(true);
      hapticConfirm();
      flashSelection();
      // The OS already confirms on Android 13+ — don't double-confirm.
      if (!isAndroid13OrLater()) {
        setSnack(true);
        later(() => setSnack(false), 1800);
      }
      later(() => setCopied(false), 2000);
    } catch {
      // Loud failure: tell the user to copy manually instead of
      // failing silently.
      clearTimers();
      setFailed(true);
      later(() => setFailed(false), 2600);
    }
  }, [selection, clearTimers, later]);

  useEffect(() => {
    if (!selection) return;

    const popup = popupRef.current;
    if (!popup) return;

    // Position the popup near the selection (viewport-fixed coordinates)
    const rect = selection.rect;
    if (!rect) return;

    const popupHeight = popup.offsetHeight || 48;
    const popupWidth = popup.offsetWidth || 140;
    const margin = 8;

    let top = rect.top - popupHeight - 10;
    // Not enough room above (sticky header / viewport top) — drop below.
    if (top < 64) {
      top = rect.bottom + 10;
    }
    const left = Math.min(
      Math.max(margin, rect.left + (rect.width - popupWidth) / 2),
      Math.max(margin, window.innerWidth - popupWidth - margin),
    );

    popup.style.position = "fixed";
    popup.style.top = `${Math.max(margin, top)}px`;
    popup.style.left = `${left}px`;
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0)";
    // Hand transform back to CSS once the entrance settles so the
    // :active press scale can apply (inline styles beat stylesheets).
    const settle = window.setTimeout(() => {
      popup.style.transform = "";
    }, 220);
    return () => window.clearTimeout(settle);
  }, [selection]);

  if (!selection) return null;

  const label = failed ? "Copy failed" : copied ? "Copied!" : "Copy text";

  return (
    <>
      <div
        ref={popupRef}
        className={`text-selection-copy-popup${copied ? " is-copied" : ""}${failed ? " is-failed" : ""}`}
        style={{
          opacity: 0,
          transform: "translateY(-10px)",
          transition: "opacity 0.18s ease-out, transform 0.18s ease-out",
        }}
        role="button"
        tabIndex={0}
        aria-label={failed ? "Copy failed. Activate to retry." : label}
        // preventDefault on mousedown keeps the text selection alive
        // while tapping (otherwise the tap collapses the range, the
        // mouseup handler sees an empty selection, the popup unmounts
        // before click fires — the mobile "nothing happens" bug).
        // NOTE: must be mousedown, not pointerdown — canceling
        // pointerdown would also cancel the click event itself.
        onMouseDown={(e) => e.preventDefault()}
        onClick={copyToClipboard}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void copyToClipboard();
          }
        }}
      >
        <span className="text-selection-copy-text">{label}</span>
        <span className="copy-btn-icon" aria-hidden="true">
          <Copy size={16} className="copy-btn-icon-idle" />
          <Check size={16} className="copy-btn-icon-check" />
        </span>
        {/* Screen-reader confirmation (the icon swap is silent). */}
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? "Text copied to clipboard." : failed ? "Copy failed. Long-press the text to copy it manually." : ""}
        </span>
      </div>
      {snack && (
        <div className="copy-snack" role="status" aria-live="polite">
          <Check size={15} aria-hidden="true" />
          <span>{failed ? "Copy failed — long-press to copy manually" : "Copied to clipboard"}</span>
        </div>
      )}
    </>
  );
}
