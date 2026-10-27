declare global {
  interface Window {
    clarity: (method: string, ...args: any[]) => void;
  }
}

let initialized = false;

export function initClarity() {
  if (initialized || typeof window === "undefined") return;

  const clarity = ((...args: any[]) => {
    clarity.q.push(args);
  }) as Window["clarity"] & { q: unknown[][] };
  clarity.q = [];
  window.clarity = clarity;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.clarity.ms/tag/sqliaml0ju";
  script.addEventListener("error", () => {
    console.error("Microsoft Clarity failed to load.");
  });
  document.head.appendChild(script);
  initialized = true;
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
