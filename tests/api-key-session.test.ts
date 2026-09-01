import assert from "node:assert/strict";
import test from "node:test";
import { maskApiKey, sealApiKeySession, unsealApiKeySession } from "../lib/api-key-session";

test("seals a personal API key and binds it to one user", async () => {
  const session = { apiKey: "test-key-this-is-not-a-real-secret-1234", models: ["gpt-5.4-mini"], validatedAt: "2026-09-01T00:00:00Z", masked: "••••1234" };
  const sealed = await sealApiKeySession(session, "user-a", "a-long-random-encryption-secret-for-tests");
  assert.equal(sealed.includes(session.apiKey), false);
  assert.deepEqual(await unsealApiKeySession(sealed, "user-a", "a-long-random-encryption-secret-for-tests"), session);
  assert.equal(await unsealApiKeySession(sealed, "user-b", "a-long-random-encryption-secret-for-tests"), null);
});

test("rejects tampered key sessions and only exposes the suffix", async () => {
  const session = { apiKey: "test-key-this-is-not-a-real-secret-9876", models: ["gpt-5.4"], validatedAt: "2026-09-01T00:00:00Z", masked: "••••9876" };
  const sealed = await sealApiKeySession(session, "user-a", "a-long-random-encryption-secret-for-tests");
  assert.equal(await unsealApiKeySession(`${sealed}x`, "user-a", "a-long-random-encryption-secret-for-tests"), null);
  assert.equal(maskApiKey(session.apiKey), "••••9876");
});
