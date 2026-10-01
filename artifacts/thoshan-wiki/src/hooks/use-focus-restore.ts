// Remembers which element opened a modal/sheet while it is active and moves
// focus back to it on close — keyboard and screen-reader users land where
// they started instead of losing their place (WCAG 2.4.3 focus order).
// Mount-safe: components that return null when closed still restore, because
// the cleanup runs on the active→false transition.
import { useEffect, useRef } from "react";

export function useFocusRestore(active: boolean) {
  const invoker = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    invoker.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    return () => {
      // Guarded: the opener may have unmounted (e.g. route change) — then
      // dropping focus silently is better than throwing.
      try {
        invoker.current?.focus({ preventScroll: true });
      } catch {
        /* opener gone */
      }
    };
  }, [active ]);
}
