import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    checks: [
      { id: "isolation", label: "Cross-origin isolation", browser: true },
      { id: "webcontainer", label: "WebContainer boot", browser: true },
      { id: "package-install", label: "Package installation after trust", browser: true },
      { id: "preview", label: "Preview iframe rendering", browser: true },
      { id: "messaging", label: "Origin-checked iframe messaging", browser: true },
      { id: "github", label: "GitHub App selected-repository import", server: true },
    ],
    requiredHeaders: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  });
}
