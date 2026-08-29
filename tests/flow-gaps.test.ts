import assert from "node:assert/strict";
import test from "node:test";
import { recordFlowGap, resolveFlowGap } from "../lib/flow-gaps";

test("logs and counts repeated clicks on one missing interaction", () => {
  const first = recordFlowGap([], { id: "gap-1", frameId: "home", node: "navDocs", label: "Docs", lastClickedAt: "2026-08-29T01:00:00Z", suggestedRoute: "/docs" });
  const second = recordFlowGap(first, { id: "ignored", frameId: "home", node: "navDocs", label: "Docs", lastClickedAt: "2026-08-29T01:01:00Z", suggestedRoute: "/docs" });
  assert.equal(second.length, 1);
  assert.equal(second[0].clickCount, 2);
  assert.equal(second[0].lastClickedAt, "2026-08-29T01:01:00Z");
});

test("resolves a logged flow gap after a linked state is created", () => {
  const gaps = recordFlowGap([], { id: "gap-1", frameId: "home", node: "navAction", label: "Sign in", lastClickedAt: "2026-08-29T01:00:00Z", suggestedRoute: "/sign-in" });
  assert.equal(resolveFlowGap(gaps, "gap-1")[0].status, "resolved");
});
