import assert from "node:assert/strict";
import test from "node:test";
import { brandDocuments, contextSummary, defaultDocument, simpleUnifiedDiff } from "../lib/brand-documents";

test("extracts exact brand and design Markdown with hashes", async () => {
  const documents = await brandDocuments([
    { path: "docs/BRAND.md", content: "# Brand\nUse blue." },
    { path: "design.md", content: "# Design\nUse a grid." },
    { path: "README.md", content: "Ignore me." },
  ]);
  assert.deepEqual(documents.map((document) => document.kind), ["brand", "design"]);
  assert.equal(documents.every((document) => document.sourceHash.length === 64), true);
});

test("builds reviewable defaults and a Markdown diff", () => {
  const tokens = { colors: ["#112233"], fonts: ["Inter"], sourceFiles: ["tokens.css"] };
  const brand = defaultDocument("brand", tokens);
  assert.match(brand, /#112233/);
  assert.match(simpleUnifiedDiff("brand.md", "old", "new"), /--- a\/brand\.md[\s\S]*\+new/);
  assert.equal(contextSummary(tokens, []).rules.length, 3);
});
