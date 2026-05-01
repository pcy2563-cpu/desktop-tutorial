const rawBaseUrl = import.meta.env.BASE_URL || "/";
const normalizedBaseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

const EXTERNAL_OR_INLINE_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

export function assetPath(path: string | undefined | null) {
  if (!path) return "";
  if (EXTERNAL_OR_INLINE_URL.test(path)) return path;
  if (!path.startsWith("/")) return path;
  if (normalizedBaseUrl === "/") return path;
  if (path === normalizedBaseUrl.slice(0, -1) || path.startsWith(normalizedBaseUrl)) {
    return path;
  }

  return `${normalizedBaseUrl}${path.replace(/^\/+/, "")}`;
}
