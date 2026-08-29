import assert from "node:assert/strict";
import test from "node:test";
import { sha256 } from "../lib/edit-transaction";
import { replaceJsxText, replaceTailwindToken, setCssDeclaration, SourceConflictError } from "../lib/source-patcher";

test("replaces JSX text and produces an exact inverse", () => {
  const source = `export function Hero(){return <h1>Hello world</h1>}`;
  const result = replaceJsxText(source, "Hello world", "Design in code", sha256(source));
  assert.match(result.output, />Design in code</);
  assert.equal(result.inverse, source);
});

test("rejects stale source hashes", () => {
  assert.throws(() => replaceJsxText("const A=()=> <p>A</p>", "A", "B", "0".repeat(64)), SourceConflictError);
});

test("updates one CSS declaration without changing the selector", async () => {
  const source = `.hero { display: flex; gap: 24px; }`;
  const result = await setCssDeclaration(source, ".hero", "gap", "32px");
  assert.match(result.output, /gap: 32px/);
  assert.equal(result.previous, "24px");
});

test("replaces one Tailwind token and produces an inverse", () => {
  const source = `export const Card=()=> <div className="p-4 gap-4 text-sm">A</div>`;
  const result = replaceTailwindToken(source, "gap-4", "gap-8");
  assert.match(result.output, /gap-8/);
  assert.equal(result.inverse, source);
});
