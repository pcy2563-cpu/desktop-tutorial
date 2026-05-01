import { createServer } from "node:http";
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { extname, normalize, resolve } from "node:path";
import { Readable } from "node:stream";
import serverEntry from "./dist/server/server.js";

const clientDir = resolve(process.cwd(), "dist/client");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOSTNAME || "0.0.0.0";
const basePath = normalizeBasePath(process.env.MAGIC_RESUME_BASE_PATH || "");
const MAX_AI_BODY_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_BODY_BYTES = 12 * 1024 * 1024;
const apiHits = new Map();
const ALLOWED_HOSTS = new Set([
  "qianxian.site",
  "www.qianxian.site",
  "111.230.107.137",
  "localhost",
  "127.0.0.1",
]);
const ALLOWED_ORIGINS = new Set([
  "https://qianxian.site",
  "https://www.qianxian.site",
]);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8"
};

const SUPPORTED_LOCALES = new Set(["zh", "en"]);
const DEFAULT_LOCALE = "zh";

function getContentType(filePath) {
  const extension = extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function hostnameFromHeader(hostHeader) {
  return String(hostHeader || "")
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();
}

function isAllowedHost(hostHeader) {
  const hostname = hostnameFromHeader(hostHeader);
  return !hostname || ALLOWED_HOSTS.has(hostname);
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(String(origin));
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  return String(forwarded.split(",")[0] || req.socket.remoteAddress || "unknown").trim();
}

function apiLimitFor(pathname) {
  if (pathname === "/api/auth/me") return { limit: 360, windowMs: 10 * 60 * 1000 };
  if (pathname === "/api/auth/login" || pathname === "/api/auth/register") {
    return { limit: 30, windowMs: 10 * 60 * 1000 };
  }
  if (pathname.startsWith("/api/auth/")) return { limit: 120, windowMs: 10 * 60 * 1000 };
  if (pathname === "/api/proxy/image") return { limit: 90, windowMs: 10 * 60 * 1000 };
  if (pathname === "/api/resume-import") return { limit: 20, windowMs: 10 * 60 * 1000 };
  return { limit: 45, windowMs: 10 * 60 * 1000 };
}

function checkRateLimit(req, pathname) {
  const now = Date.now();
  const rule = apiLimitFor(pathname);
  const key = `${pathname}:${getClientIp(req)}`;
  const item = apiHits.get(key);
  if (!item || item.resetAt <= now) {
    apiHits.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }
  item.count += 1;
  return item.count <= rule.limit;
}

function bodyLimitFor(pathname) {
  return pathname === "/api/resume-import" ? MAX_IMPORT_BODY_BYTES : MAX_AI_BODY_BYTES;
}

function reject(res, statusCode, message) {
  setSecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: message }));
}

function normalizeBasePath(value) {
  const trimmed = String(value || "").trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

function stripBasePath(pathname) {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }
  return pathname;
}

function toHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (typeof value === "undefined") continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

function resolveStaticFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = normalize(decoded).replace(/^[/\\]+/, "");
  const absolutePath = resolve(clientDir, normalized);
  if (!absolutePath.startsWith(clientDir)) return null;
  if (!existsSync(absolutePath)) return null;
  const stats = statSync(absolutePath);
  if (!stats.isFile()) return null;
  return absolutePath;
}

function findFallbackCssAsset(staticPathname) {
  const assetsDir = resolve(clientDir, "assets");
  const requestedFile = staticPathname.split("/").pop() || "";
  const requestedPrefix = requestedFile.includes("-")
    ? requestedFile.split("-")[0]
    : "";

  try {
    const candidates = readdirSync(assetsDir)
      .filter((file) => file.endsWith(".css"))
      .map((file) => {
        const absolutePath = resolve(assetsDir, file);
        const stats = statSync(absolutePath);
        return {
          absolutePath,
          file,
          mtimeMs: stats.mtimeMs,
          size: stats.size
        };
      })
      .filter((item) => item.size > 0)
      .sort((left, right) => right.mtimeMs - left.mtimeMs);

    const matched = requestedPrefix
      ? candidates.find((item) => item.file.startsWith(`${requestedPrefix}-`))
      : null;

    return matched?.absolutePath || candidates[0]?.absolutePath || null;
  } catch {
    return null;
  }
}

function setStaticCacheHeaders(res, staticPathname) {
  const extension = extname(staticPathname).toLowerCase();
  if (staticPathname.startsWith("/assets/")) {
    if (extension === ".css" || extension === ".js" || extension === ".mjs") {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=604800");
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=3600");
}

function resolvePreferredLocale(cookieHeader) {
  const cookies = String(cookieHeader || "")
    .split(";")
    .map((item) => item.trim());
  const localeCookie = cookies.find((item) => item.startsWith("NEXT_LOCALE="));
  const locale = localeCookie ? decodeURIComponent(localeCookie.slice("NEXT_LOCALE=".length)) : "";
  return SUPPORTED_LOCALES.has(locale) ? locale : DEFAULT_LOCALE;
}

function tryServeStatic(req, res, url) {
  const staticPathname = stripBasePath(url.pathname);
  if (!staticPathname || staticPathname.endsWith("/")) return false;
  const filePath = resolveStaticFile(staticPathname);
  if (!filePath) {
    return tryServeMissingAssetRecovery(req, res, staticPathname);
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", getContentType(filePath));
  setStaticCacheHeaders(res, staticPathname);

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
}

function tryServeMissingAssetRecovery(req, res, staticPathname) {
  if (!staticPathname.startsWith("/assets/")) return false;

  const extension = extname(staticPathname).toLowerCase();
  res.statusCode = 200;
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (extension === ".js" || extension === ".mjs") {
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    if (req.method === "HEAD") {
      res.end();
      return true;
    }
    const fallbackTarget = basePath ? `${basePath}/` : "/";
    res.end(`
try {
  var key = "qx_magic_resume_asset_reload";
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "1");
    location.reload();
  } else {
    sessionStorage.removeItem(key);
    location.replace(${JSON.stringify(fallbackTarget)});
  }
} catch (error) {
  location.replace(${JSON.stringify(fallbackTarget)});
}
`);
    return true;
  }

  if (extension === ".css") {
    const fallbackCssPath = findFallbackCssAsset(staticPathname);
    res.setHeader("Content-Type", "text/css; charset=utf-8");
    if (!fallbackCssPath) {
      res.statusCode = 404;
      res.end("/* missing stylesheet */");
      return true;
    }
    res.setHeader("X-Magic-Resume-Recovered-Asset", "stylesheet");
    if (req.method === "HEAD") {
      res.end();
      return true;
    }
    createReadStream(fallbackCssPath).pipe(res);
    return true;
  }

  return false;
}

function appendSetCookie(res, value) {
  const existing = res.getHeader("set-cookie");
  if (!existing) {
    res.setHeader("set-cookie", value);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader("set-cookie", [...existing, value]);
    return;
  }
  res.setHeader("set-cookie", [String(existing), value]);
}

createServer(async (req, res) => {
  try {
    const hostHeader = req.headers.host || `localhost:${port}`;
    setSecurityHeaders(res);
    if (!isAllowedHost(hostHeader)) {
      reject(res, 421, "Host is not allowed");
      return;
    }
    if (!isAllowedOrigin(req)) {
      reject(res, 403, "Origin is not allowed");
      return;
    }

    const protocol = (req.headers["x-forwarded-proto"] || "http").toString().split(",")[0].trim();
    const url = new URL(req.url || "/", `${protocol}://${hostHeader}`);
    const appPathname = stripBasePath(url.pathname);

    if (appPathname.startsWith("/api/")) {
      if (!checkRateLimit(req, appPathname)) {
        reject(res, 429, "Too many requests");
        return;
      }
      const contentLength = Number(req.headers["content-length"] || 0);
      if (contentLength > bodyLimitFor(appPathname)) {
        reject(res, 413, "Request body is too large");
        return;
      }
    }

    if (basePath && (url.pathname === basePath || url.pathname === `${basePath}/`)) {
      const locale = resolvePreferredLocale(req.headers.cookie);
      const target = `${basePath}/${locale}${url.search}`;
      res.statusCode = 302;
      res.setHeader("Location", target);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.end();
      return;
    }

    if (tryServeStatic(req, res, url)) return;

    const method = (req.method || "GET").toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const init = {
      method,
      headers: toHeaders(req.headers)
    };

    if (hasBody) {
      init.body = Readable.toWeb(req);
      init.duplex = "half";
    }

    const entryUrl = new URL(url);
    if (basePath && appPathname.startsWith("/api/")) {
      entryUrl.pathname = appPathname;
    }
    const request = new Request(entryUrl, init);
    const response = await serverEntry.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        appendSetCookie(res, value);
      } else {
        res.setHeader(key, value);
      }
    });
    if (appPathname.startsWith("/api/") || String(response.headers.get("content-type") || "").includes("text/html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    setSecurityHeaders(res);

    if (method === "HEAD" || !response.body) {
      res.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error("Server error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end("Internal Server Error");
  }
}).listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
