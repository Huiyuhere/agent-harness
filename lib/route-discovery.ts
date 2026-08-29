export type DiscoveredRoute = { route: string; file: string; dynamic: boolean; framework: "next-app" | "next-pages" | "react-router" };

function normalizeNextSegment(segment: string) {
  if (segment === "page.tsx" || segment === "page.jsx" || segment === "index.tsx" || segment === "index.jsx") return "";
  return segment.replace(/\.(?:t|j)sx$/, "").replace(/^\((.*)\)$/, "");
}

export function discoverFileRoutes(files: string[]): DiscoveredRoute[] {
  const routes: DiscoveredRoute[] = [];
  for (const file of files) {
    if (/^app\/.+\/page\.(?:t|j)sx$/.test(file) || /^app\/page\.(?:t|j)sx$/.test(file)) {
      const parts = file.split("/").slice(1).map(normalizeNextSegment).filter(Boolean);
      routes.push({ route: `/${parts.join("/")}`, file, dynamic: parts.some((part) => part.includes("[")), framework: "next-app" });
    } else if (/^pages\/.+\.(?:t|j)sx$/.test(file) && !/^pages\/(?:_app|_document|api\/)/.test(file)) {
      const parts = file.split("/").slice(1).map(normalizeNextSegment).filter(Boolean);
      routes.push({ route: `/${parts.join("/")}`, file, dynamic: parts.some((part) => part.includes("[")), framework: "next-pages" });
    }
  }
  return routes.sort((a, b) => a.route.localeCompare(b.route));
}

export function discoverSourceRoutes(files: Array<{ path: string; content: string }>): DiscoveredRoute[] {
  const routes = new Map<string, DiscoveredRoute>();
  for (const file of files) {
    const patterns = [
      /<Route\b[^>]*\bpath\s*=\s*(?:\{\s*)?["'`]([^"'`]+)["'`](?:\s*\})?/g,
      /\b(?:path|route)\s*:\s*["'`]([^"'`]+)["'`]/g,
    ];
    for (const pattern of patterns) {
      for (const match of file.content.matchAll(pattern)) {
        const route = match[1].trim();
        if (!route.startsWith("/") || route === "*") continue;
        routes.set(route, { route, file: file.path, dynamic: /[:*\[]/.test(route), framework: "react-router" });
      }
    }
  }
  return [...routes.values()].sort((a, b) => a.route.localeCompare(b.route));
}

export function extractLinkEdges(source: string, fromRoute: string) {
  const edges = new Set<string>();
  for (const match of source.matchAll(/(?:href|to)\s*=\s*["'](\/[A-Za-z0-9_\-\/[\]]*)["']/g)) edges.add(match[1]);
  return [...edges].map((toRoute) => ({ fromRoute, toRoute, kind: "declared" as const }));
}
