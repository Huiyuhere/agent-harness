"use client";

import type { FileSystemTree, WebContainer } from "@webcontainer/api";

let singleton: Promise<WebContainer> | null = null;

export function getRuntimeDiagnostics() {
  return {
    crossOriginIsolated: globalThis.crossOriginIsolated === true,
    sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    desktopChromium: /Chrome|Chromium/.test(navigator.userAgent) && !/Mobile/.test(navigator.userAgent),
  };
}

export async function bootWebContainer(files: FileSystemTree) {
  const diagnostics = getRuntimeDiagnostics();
  if (!diagnostics.crossOriginIsolated || !diagnostics.sharedArrayBuffer) throw new Error("WebContainer requires cross-origin isolation.");
  singleton ??= import("@webcontainer/api").then(({ WebContainer }) => WebContainer.boot({ coep: "credentialless" }));
  const container = await singleton;
  await container.mount({ source: { directory: files }, preview: { directory: files } });
  return container;
}

export async function installDependencies(container: WebContainer, packageManager: "npm" | "pnpm" | "yarn", trustGranted: boolean) {
  if (!trustGranted) throw new Error("Dependency scripts require explicit project trust.");
  const process = await container.spawn(packageManager, ["install"]);
  const exitCode = await process.exit;
  if (exitCode !== 0) throw new Error(`${packageManager} install failed with exit code ${exitCode}.`);
}
