/**
 * Microsoft Clarity Analytics Integration
 * 
 * This module initializes Microsoft Clarity for tracking:
 * - All page views
 * - All clicks
 * - Form submissions (including newsletter forms)
 * - Scroll behavior
 * - Session recordings
 * 
 * Project ID: sqliaml0ju
 * Domain: lingadevaru.in
 */

declare global {
  interface Window {
    clarity: (method: string, ...args: any[]) => void;
  }
}

let initialized = false;

/**
 * Initialize Microsoft Clarity with the project ID
 * Clarity automatically tracks:
 * - All clicks
 * - Page views
 * - Form submissions
 * - Scroll depth
 * - Session recordings
 * - Heatmaps
 */
export function initClarity() {
  if (initialized) return;
  
  const projectId = "sqliaml0ju";
  
  // Check if clarity is already loaded (from the script tag in index.html)
  if (typeof window !== "undefined" && window.clarity) {
    // Clarity script is already loaded, just ensure it's initialized
    try {
      // The script tag should have already initialized it, but we can send a pageview
      if (typeof window.clarity === "function") {
        window.clarity("consent");
      }
    } catch (e) {
      console.error("Clarity initialization error:", e);
    }
    initialized = true;
    return;
  }
  
  // If for some reason the script tag didn't load, we can inject it
  if (typeof document !== "undefined") {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${projectId}`;
    
    const head = document.getElementsByTagName("head")[0];
    if (head) {
      head.appendChild(script);
    }
  }
  
  initialized = true;
}

/**
 * Track a custom event in Clarity
 * @param name - Event name
 * @param properties - Event properties
 */
export function trackEvent(name: string, properties: Record<string, any> = {}) {
  if (typeof window !== "undefined" && window.clarity) {
    try {
      window.clarity("event", name, properties);
    } catch (e) {
      console.error("Clarity event tracking error:", e);
    }
  }
}

/**
 * Track a newsletter form submission
 * @param formName - Name of the newsletter form
 * @param email - User email (optional, anonymized)
 */
export function trackNewsletterSignup(formName: string, email?: string) {
  trackEvent("Newsletter Signup", {
    form: formName,
    // Don't send actual email for privacy - just track the event
    hasEmail: !!email,
  });
}

/**
 * Track a click event with additional context
 * @param element - Element description or selector
 * @param context - Additional context about the click
 */
export function trackClick(element: string, context: Record<string, any> = {}) {
  trackEvent("Click", {
    element,
    ...context,
  });
}

export { initialized };
