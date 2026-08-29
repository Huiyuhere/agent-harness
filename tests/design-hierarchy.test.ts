import assert from "node:assert/strict";
import test from "node:test";
import { cloneRouteDesign, createRouteDesign, cssSize, normalizeRouteDesign } from "../lib/design-hierarchy";

test("normalizes legacy route styles into an editable node hierarchy", () => {
  const design = normalizeRouteDesign({ headline: "Legacy", supporting: "Body", size: 42, color: "#123456" }, "Fallback", "Fallback body");
  assert.equal(design.content.headline, "Legacy");
  assert.equal(design.content.supporting, "Body");
  assert.equal(design.styles.headline.size, 42);
  assert.equal(design.styles.headline.color, "#123456");
  assert.equal(design.content.eyebrow, "DESIGN WITH THE REAL PRODUCT");
});

test("duplicates a hierarchy without sharing nested style objects", () => {
  const source = createRouteDesign("Page", "Body");
  const duplicate = cloneRouteDesign(source);
  duplicate.content.eyebrow = "Changed";
  duplicate.styles.headline.size = 3;
  duplicate.styles.headline.unit = "rem";
  assert.equal(source.content.eyebrow, "DESIGN WITH THE REAL PRODUCT");
  assert.equal(cssSize(source.styles.headline), "27px");
  assert.equal(cssSize(duplicate.styles.headline), "3rem");
});
