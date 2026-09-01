import { BrandTokens } from "./brand-extractor";

export type BrandDocument = { path: string; kind: "brand" | "design"; content: string; sourceHash: string };
export type DocumentProposal = { id: string; path: string; kind: "brand" | "design"; baseHash: string; originalContent: string; proposedContent: string; diff: string; rationale: string; status: "pending" | "applied" | "rejected" };

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function documentKind(path: string): BrandDocument["kind"] | null {
  const name = path.split("/").pop()?.toLowerCase();
  if (name === "brand.md") return "brand";
  if (name === "design.md") return "design";
  return null;
}

export async function brandDocuments(files: Array<{ path: string; content: string }>) {
  return Promise.all(files.flatMap((file) => {
    const kind = documentKind(file.path);
    return kind ? [{ path: file.path, kind, content: file.content, sourceHash: "" }] : [];
  }).map(async (document) => ({ ...document, sourceHash: await sha256(document.content) })));
}

export function defaultDocument(kind: "brand" | "design", tokens: BrandTokens) {
  if (kind === "brand") return `# Brand guide\n\n## Colors\n${tokens.colors.map((color) => `- ${color}`).join("\n")}\n\n## Typography\n${tokens.fonts.map((font) => `- ${font}`).join("\n")}\n\n## Brand principles\n- Define the promise, personality, and recognizable visual cues.\n`;
  return `# Design system\n\n## Foundations\n- Use the approved brand colors and typography.\n- Preserve accessible contrast and responsive hierarchy.\n\n## Components\n- Document spacing, states, and interaction conventions here.\n\n## Flows\n- Every actionable control should have a designed destination or explicit disabled state.\n`;
}

export function simpleUnifiedDiff(path: string, before: string, after: string) {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const body = [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
    ...oldLines.map((line) => `-${line}`),
    ...newLines.map((line) => `+${line}`),
  ];
  return body.join("\n");
}

export function contextSummary(tokens: BrandTokens, documents: BrandDocument[]) {
  return {
    authoritative: documents.map((document) => ({ kind: document.kind, path: document.path, sourceHash: document.sourceHash })),
    observed: { colors: tokens.colors, fonts: tokens.fonts, sourceFiles: tokens.sourceFiles },
    rules: [
      `Use approved colors: ${tokens.colors.join(", ")}`,
      `Use approved typography: ${tokens.fonts.join(", ")}`,
      "Preserve route hierarchy, accessibility, and explicit interaction states.",
    ],
  };
}
