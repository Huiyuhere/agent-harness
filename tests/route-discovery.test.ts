import assert from "node:assert/strict";
import test from "node:test";
import { discoverFileRoutes, extractLinkEdges } from "../lib/route-discovery";

test("discovers Next app and pages routes", () => {
  const routes = discoverFileRoutes(["app/page.tsx", "app/pricing/page.tsx", "app/blog/[slug]/page.tsx", "pages/settings.tsx", "pages/_app.tsx"]);
  assert.deepEqual(routes.map((route) => route.route), ["/", "/blog/[slug]", "/pricing", "/settings"]);
  assert.equal(routes.find((route) => route.route === "/blog/[slug]")?.dynamic, true);
});

test("extracts declared click edges from href and to", () => {
  const edges = extractLinkEdges(`<Link href="/pricing"/><NavLink to='/settings'/>`, "/");
  assert.deepEqual(edges.map((edge) => edge.toRoute), ["/pricing", "/settings"]);
});
