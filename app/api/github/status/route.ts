import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.GITHUB_APP_ID;
  return NextResponse.json({
    configured: Boolean(appId && process.env.GITHUB_APP_PRIVATE_KEY && process.env.GITHUB_APP_CLIENT_SECRET),
    appId: appId ? `${appId.slice(0, 3)}…` : null,
    permissions: { metadata: "read", contents: "write", pullRequests: "write", workflows: "none" },
  });
}
