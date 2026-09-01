import { NextRequest } from "next/server";
import { clearApiKeyCookie } from "../../../../lib/api-key-session";
import { apiKeySessionFromRequest, encryptionSecret } from "../../../../lib/openai-key";
import { jsonError, requestUser, sameOrigin } from "../../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = requestUser(request);
  if (!user) return jsonError("Sign in to connect a personal OpenAI API key.", 401);
  const session = await apiKeySessionFromRequest(request, user);
  if (!session) {
    return Response.json(
      { connected: false, encryptionConfigured: Boolean(encryptionSecret()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json({ connected: true, masked: session.masked, models: session.models, validatedAt: session.validatedAt }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: NextRequest) {
  const user = requestUser(request);
  if (!user) return jsonError("Sign in to manage your API key.", 401);
  if (!sameOrigin(request)) return jsonError("Cross-origin requests are not allowed.", 403);
  return Response.json({ connected: false }, { headers: { "Set-Cookie": clearApiKeyCookie(), "Cache-Control": "no-store" } });
}
