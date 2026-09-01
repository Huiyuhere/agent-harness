import { NextRequest } from "next/server";

export type RequestUser = { userId: string; email: string; displayName: string };

export function requestUser(request: NextRequest): RequestUser | null {
  const userId = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email");
  if (userId && email) return { userId, email, displayName: decodeName(request.headers.get("oai-authenticated-user-full-name")) ?? email };
  if (process.env.NODE_ENV !== "production") return { userId: "local-development", email: "local@agent-harness.test", displayName: "Local designer" };
  return null;
}

function decodeName(value: string | null) {
  if (!value) return null;
  try { return decodeURIComponent(value); } catch { return null; }
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? (forwardedHost?.startsWith("localhost") ? "http" : "https");
  const allowed = new Set([request.nextUrl.origin]);
  if (forwardedHost) allowed.add(`${forwardedProto}://${forwardedHost}`);
  return allowed.has(origin);
}

const attempts = new Map<string, number[]>();

export function withinRateLimit(key: string, limit = 8, windowMs = 60_000) {
  const cutoff = Date.now() - windowMs;
  const recent = (attempts.get(key) ?? []).filter((time) => time > cutoff);
  if (recent.length >= limit) return false;
  recent.push(Date.now());
  attempts.set(key, recent);
  return true;
}

export function jsonError(error: string, status: number, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}
