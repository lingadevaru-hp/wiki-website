const encoder = new TextEncoder();
const VERIFICATION_COOKIE_MAX_AGE = 86400;

export function escapeHtmlAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function safeLocalReturnTo(
  value: FormDataEntryValue | null,
  origin: string,
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/";
  }

  try {
    const target = new URL(value, origin);
    if (target.origin !== origin) return "/";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function verificationKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createVerificationCookie(
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const expiresAt = nowSeconds + VERIFICATION_COOKIE_MAX_AGE;
  const payload = String(expiresAt);
  const key = await verificationKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function isVerificationCookieValid(
  secret: string,
  value: string | null,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!value || !/^\d{1,12}\.[A-Za-z0-9_-]{43}$/.test(value)) return false;

  const separator = value.indexOf(".");
  const payload = value.slice(0, separator);
  const expiresAt = Number(payload);
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= nowSeconds ||
    expiresAt > nowSeconds + VERIFICATION_COOKIE_MAX_AGE
  ) {
    return false;
  }

  const encodedSignature = value.slice(separator + 1);
  const base64 = encodedSignature
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(encodedSignature.length / 4) * 4, "=");
  const binary = atob(base64);
  const signature = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
  const key = await verificationKey(secret);
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(payload));
}

export function createCspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return encodeBase64Url(bytes);
}

export function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://www.clarity.ms https://eu.i.posthog.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://challenges.cloudflare.com https://eu.i.posthog.com https://*.i.posthog.com https://www.clarity.ms https://*.clarity.ms https://chat.lingadevaru.in wss://chat.lingadevaru.in",
    "frame-src https: blob:",
    "frame-ancestors 'self' https://lingadevaru.in https://*.lingadevaru.in",
    "worker-src 'self' blob:",
    "media-src 'self' data: blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
