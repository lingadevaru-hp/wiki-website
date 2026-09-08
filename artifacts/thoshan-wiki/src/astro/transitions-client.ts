/** Vite adapter: the transplanted official router shim expects Astro's
 * client-side navigation. MusicControl never reaches this path (it only
 * uses useLocation), so a plain navigation is enough. */
export function navigate(href: string, _opts?: { history?: string }) {
  window.location.assign(href)
  return Promise.resolve()
}
