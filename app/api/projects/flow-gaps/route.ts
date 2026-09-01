import { NextRequest } from "next/server";
import { z } from "zod";
import { saveFlowGap } from "../../../../lib/project-context-store";
import { jsonError, requestUser, sameOrigin } from "../../../../lib/request-security";

export const dynamic = "force-dynamic";

const schema = z.object({
  project: z.object({ id: z.string().min(1).max(120), name: z.string().min(1).max(200), repository: z.string().min(1).max(300), baseSha: z.string().min(1).max(100) }),
  gap: z.object({
    id: z.string().min(1), frameId: z.string().min(1), node: z.string().min(1), label: z.string().max(500), role: z.string().max(100).optional(), sourceAnchor: z.unknown().optional(), computedStyle: z.unknown().optional(), clickCount: z.number().int().min(1).max(100_000), suggestedRoute: z.string().max(500), status: z.enum(["open", "resolved"]), firstSeenAt: z.string(), lastClickedAt: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  const user = requestUser(request);
  if (!user) return jsonError("Sign in to save flow gaps.", 401);
  if (!sameOrigin(request)) return jsonError("Cross-origin requests are not allowed.", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid flow-gap request.", 400);
  try {
    await saveFlowGap(user, parsed.data.project, parsed.data.gap);
    return Response.json({ saved: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to save the flow gap.", 409);
  }
}
