import { NextRequest } from "next/server";
import { readCookie, unsealApiKeySession } from "./api-key-session";
import { RequestUser } from "./request-security";

export function encryptionSecret() {
  return process.env.API_KEY_ENCRYPTION_KEY ?? (process.env.NODE_ENV !== "production" ? "agent-harness-local-development-encryption-secret" : "");
}

export async function apiKeySessionFromRequest(request: NextRequest, user: RequestUser) {
  const value = readCookie(request.headers.get("cookie"));
  const secret = encryptionSecret();
  if (!value || !secret) return null;
  return unsealApiKeySession(value, user.userId, secret);
}
