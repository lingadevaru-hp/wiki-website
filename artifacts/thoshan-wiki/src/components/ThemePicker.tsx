import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Palette, X } from "lucide-react";
import { SITE_THEMES, useTheme, type Theme } from "../contexts/ThemeContext";

const OPEN_EVENT = "wiki-open-theme-picker";

export function requestThemePicker() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(() =>
    Math.max(0, SITE_THEMES.findIndex((item) => item.id === theme)),
  );

  useEffect(() => {
    const openPicker = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, openPicker);
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;
      const omarchyChord = event.code === "Space" && event.metaKey && event.ctrlKey && event.shiftKey;
      if ((!typing && event.key.toLowerCase() === "t" && !event.metaKey && !event.ctrlKey && !event.altKey) || omarchyChord) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, openPicker);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setIndex(Math.max(0, SITE_THEMES.findIndex((item) => item.id === theme)));
  }, [theme]);

  if (!open) return null;
  const selected = SITE_THEMES[index];
  const step = (delta: number) => setIndex((value) => (value + delta + SITE_THEMES.length) % SITE_THEMES.length);
  const choose = () => {
    setTheme(selected.id as Theme);
    setOpen(false);
  };

  return (
    <div className="theme-picker-backdrop" role="dialog" aria-modal="true" aria-label="Theme picker" onClick={(event) => event.target === event.currentTarget && setOpen(false)}>
      <button className="theme-picker-close" aria-label="Close theme picker" onClick={() => setOpen(false)}><X size={18} /></button>
      <button className="theme-picker-arrow theme-picker-arrow-left" aria-label="Previous theme" onClick={() => step(-1)}><ChevronLeft /></button>
      <div className="theme-picker-card">
        <div className="theme-picker-preview" data-preview-theme={selected.id}>
          <Palette size={42} />
          <strong>Thoshan&apos;s Wiki</strong>
          <span>Projects, systems, and lessons worth keeping.</span>
        </div>
        <button className="theme-picker-name" onClick={choose}>
          {selected.name} <Check size={15} />
        </button>
        <div className="theme-picker-dots" aria-label="Choose theme">
          {SITE_THEMES.map((item, itemIndex) => (
            <button key={item.id} aria-label={`Use ${item.name}`} aria-pressed={item.id === selected.id} className={item.id === selected.id ? "selected" : ""} onClick={() => setIndex(itemIndex)} />
          ))}
        </div>
      </div>
      <button className="theme-picker-arrow theme-picker-arrow-right" aria-label="Next theme" onClick={() => step(1)}><ChevronRight /></button>
    </div>
  );
}
