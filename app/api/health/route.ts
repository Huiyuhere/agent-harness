import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: "agent-harness",
    runtime: "vinext-cloudflare",
    requiredIsolation: { opener: "same-origin", embedder: "credentialless" },
    capabilities: {
      sourceTransactions: true,
      routeFrames: true,
      readerConcurrency: 3,
      serializedWriters: true,
      githubConfigured: Boolean(process.env.GITHUB_APP_ID),
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    },
  });
}
