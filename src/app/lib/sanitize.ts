/**
 * sanitize.ts — Shared security utilities for NoirKart
 *
 * Provides:
 * - HTML escaping / XSS prevention
 * - Input length enforcement
 * - Email and URL validation
 * - SHA-256 password hashing (Web Crypto API — no external dependency)
 */

// ---------------------------------------------------------------------------
// 1. HTML Escaping — prevents XSS in email templates and rendered content
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escapes all HTML special characters in a string.
 * Use this before injecting any user input into HTML templates.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

// ---------------------------------------------------------------------------
// 2. Text Sanitization — strip tags, trim, enforce length
// ---------------------------------------------------------------------------

/**
 * Sanitizes a plain-text input field:
 * - Removes all HTML tags
 * - Trims leading/trailing whitespace
 * - Enforces a maximum character length
 */
export function sanitizeText(str: string, maxLength = 500): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes a URL string — only allows http/https URLs.
 * Returns empty string for any dangerous protocol (javascript:, data:, etc.).
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return trimmed;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// 3. Validation
// ---------------------------------------------------------------------------

/**
 * Validates an email address using RFC 5322 compliant regex.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false;
  // RFC 5322 simplified
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Validates that a string is a valid http/https URL.
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates a price: must be a positive finite number.
 */
export function validatePrice(value: string | number): boolean {
  const n = Number(value);
  return isFinite(n) && n > 0;
}

// ---------------------------------------------------------------------------
// 4. Password Hashing — SHA-256 via Web Crypto API (no external lib needed)
// ---------------------------------------------------------------------------

/**
 * Hashes a password string with SHA-256 using the native Web Crypto API.
 * Returns a hex string.
 *
 * Usage: const hashed = await hashPassword("mypassword");
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  // Add a fixed application-level salt to prevent rainbow table attacks
  const salted = `noirkart_v1_${password}`;
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Checks if a hashed value matches a plain-text password.
 */
export async function verifyPassword(
  plaintext: string,
  hashed: string
): Promise<boolean> {
  const computed = await hashPassword(plaintext);
  return computed === hashed;
}
