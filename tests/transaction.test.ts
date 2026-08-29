import assert from "node:assert/strict";
import test from "node:test";
import { invertTransaction, makeTransaction, sha256 } from "../lib/edit-transaction";

test("validates and reverses an edit transaction", () => {
  const transaction = makeTransaction({
    projectId: "project-1", baseSha: "8f31aef", route: "/", stateId: null,
    anchor: { file: "app/page.tsx", line: 42, column: 4, component: "HeroHeading", ordinal: 1 },
    operation: "set_style", property: "font-size", before: "48px", after: "52px",
    expectedSourceHash: sha256("source"), affectedFiles: ["app/page.tsx"], inversePatch: "inverse",
    validation: { syntax: true, hmr: true, diagnostics: [] }, status: "validated",
  });
  const inverse = invertTransaction(transaction);
  assert.equal(inverse.before, "52px");
  assert.equal(inverse.after, "48px");
  assert.equal(inverse.status, "pending");
});
