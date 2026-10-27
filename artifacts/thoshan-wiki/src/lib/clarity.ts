/**
 * Microsoft Clarity integration, started after the first real user interaction.
 */

declare global {
  interface Window {
    clarity: (method: string, ...args: any[]) => void;
  }
}

let initialized = false;

export function initClarity() {
  if (initialized || typeof window === "undefined") return;

  const loadAfterInteraction = () => {
    if (initialized) return;
    initialized = true;
    const clarity = ((method: string, ...args: any[]) => {
      clarity.q.push([method, ...args]);
    }) as Window["clarity"] & { q: unknown[][] };
    clarity.q = [];
    window.clarity = clarity;
    clarity("consent");

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.clarity.ms/tag/sqliaml0ju";
    document.head.appendChild(script);
  };

  window.addEventListener("pointerdown", loadAfterInteraction, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", loadAfterInteraction, { once: true });
}

export function trackEvent(name: string, properties: Record<string, any> = {}) {
  if (typeof window !== "undefined" && window.clarity) {
    try {
      window.clarity("event", name, properties);
    } catch (e) {
      console.error("Clarity event tracking error:", e);
    }
  }
}

export function trackNewsletterSignup(formName: string, email?: string) {
  trackEvent("Newsletter Signup", {
    form: formName,
    hasEmail: !!email,
  });
}

export function trackClick(element: string, context: Record<string, any> = {}) {
  trackEvent("Click", {
    element,
    ...context,
  });
}

export { initialized };
