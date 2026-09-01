export const API_KEY_COOKIE = "agent_harness_openai";

export type ApiKeySession = {
  apiKey: string;
  models: string[];
  validatedAt: string;
  masked: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey(secret: string) {
  if (secret.length < 24) throw new Error("API_KEY_ENCRYPTION_KEY must contain at least 24 characters.");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export function maskApiKey(apiKey: string) {
  const suffix = apiKey.slice(-4);
  return `••••${suffix}`;
}

export async function sealApiKeySession(session: ApiKeySession, userId: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(secret);
  const plaintext = encoder.encode(JSON.stringify(session));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(userId) },
    key,
    plaintext,
  );
  return `v1.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
}

export async function unsealApiKeySession(value: string, userId: string, secret: string): Promise<ApiKeySession | null> {
  try {
    const [version, ivValue, encryptedValue] = value.split(".");
    if (version !== "v1" || !ivValue || !encryptedValue) return null;
    const key = await encryptionKey(secret);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64Url(ivValue), additionalData: encoder.encode(userId) },
      key,
      fromBase64Url(encryptedValue),
    );
    const parsed = JSON.parse(decoder.decode(decrypted)) as Partial<ApiKeySession>;
    if (typeof parsed.apiKey !== "string" || typeof parsed.masked !== "string" || typeof parsed.validatedAt !== "string" || !Array.isArray(parsed.models)) return null;
    return parsed as ApiKeySession;
  } catch {
    return null;
  }
}

export function readCookie(cookieHeader: string | null, name = API_KEY_COOKIE) {
  if (!cookieHeader) return null;
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === name) return decodeURIComponent(pair.slice(separator + 1).trim());
  }
  return null;
}

export function apiKeyCookie(value: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${API_KEY_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=34560000`;
}

export function clearApiKeyCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${API_KEY_COOKIE}=; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=0`;
}
