import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createFileRoute } from "@tanstack/react-router";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/apng",
]);
const BLOCKED_HOSTS = new Set(["localhost", "ip6-localhost", "ip6-loopback"]);

function isPrivateIp(address: string) {
  const value = address.toLowerCase();
  if (
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe80:") ||
    value === "0.0.0.0" ||
    value.startsWith("127.") ||
    value.startsWith("10.") ||
    value.startsWith("192.168.") ||
    value.startsWith("169.254.")
  ) {
    return true;
  }
  const private172 = /^172\.(1[6-9]|2\d|3[0-1])\./.test(value);
  return private172;
}

async function assertSafeImageUrl(imageUrl: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return { error: "Invalid image URL" };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { error: "Only HTTP and HTTPS image URLs are supported" };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".local")) {
    return { error: "Private image URLs are not allowed" };
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { error: "Private image URLs are not allowed" };
    }
    return { parsedUrl };
  }

  try {
    const records = await lookup(hostname, { all: true, verbatim: true });
    if (!records.length || records.some((record) => isPrivateIp(record.address))) {
      return { error: "Private image URLs are not allowed" };
    }
  } catch {
    return { error: "Unable to resolve image host" };
  }

  return { parsedUrl };
}

export const Route = createFileRoute("/api/proxy/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { searchParams } = new URL(request.url);
          const imageUrl = searchParams.get("url") || "";
          if (!imageUrl || imageUrl.length > 2048) {
            return Response.json({ error: "Missing image URL" }, { status: 400 });
          }

          const safety = await assertSafeImageUrl(imageUrl);
          if (safety.error || !safety.parsedUrl) {
            return Response.json({ error: safety.error }, { status: 400 });
          }

          let response: Response;
          try {
            response = await fetch(safety.parsedUrl.toString(), {
              redirect: "error",
              signal: AbortSignal.timeout(8000),
              headers: {
                "User-Agent": "QianxianResumeImageProxy/1.0",
                Accept: "image/avif,image/webp,image/apng,image/png,image/jpeg,image/gif,*/*;q=0.1",
                Referer: safety.parsedUrl.origin,
              },
            });
          } catch {
            return Response.json({ error: "Failed to fetch image" }, { status: 502 });
          }

          if (!response.ok) {
            return Response.json({ error: "Image request failed" }, { status: response.status });
          }

          const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
          if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
            return Response.json({ error: "Remote resource is not an allowed image type" }, { status: 400 });
          }

          const contentLength = Number(response.headers.get("content-length") || 0);
          if (contentLength > MAX_IMAGE_BYTES) {
            return Response.json({ error: "Image is too large" }, { status: 413 });
          }

          const imageBuffer = await response.arrayBuffer();
          if (imageBuffer.byteLength === 0) {
            return Response.json({ error: "Image is empty" }, { status: 400 });
          }
          if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
            return Response.json({ error: "Image is too large" }, { status: 413 });
          }

          return new Response(imageBuffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "private, max-age=300",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch (error) {
          console.error("Image proxy error:", error);
          return Response.json({ error: "Image proxy failed" }, { status: 500 });
        }
      },
    },
  },
});
