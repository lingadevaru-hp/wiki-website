import { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";

export function TextSelectionCopy() {
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (rect.width > window.innerWidth * 0.8 || rect.height > window.innerHeight * 0.6) {
        setSelection(null);
        return;
      }

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

    function handleScroll() {
      // Hide popup when scrolling
      setSelection(null);
    }

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async () => {
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
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed - do nothing, just hide the popup
    }
  };

  useEffect(() => {
    if (!selection) return;
    
    const popup = popupRef.current;
    if (!popup) return;

    // Position the popup near the selection
    const rect = selection.rect;
    if (!rect) return;

    // Position above the selection
    const top = rect.top + window.scrollY - popup.offsetHeight - 8;
    const left = rect.left + window.scrollX + (rect.width - popup.offsetWidth) / 2;

    popup.style.position = "absolute";
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0)";
  }, [selection]);

  if (!selection) return null;

  return (
    <div
      ref={popupRef}
      className="text-selection-copy-popup"
      style={{
        opacity: 0,
        transform: "translateY(-10px)",
        transition: "opacity 0.15s ease, transform 0.15s ease",
      }}
      onClick={copyToClipboard}
    >
      <span className="text-selection-copy-text">
        {copied ? "text copied" : "Copy text"}
      </span>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </div>
  );
}
