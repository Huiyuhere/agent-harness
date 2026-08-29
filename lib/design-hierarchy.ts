export const TEXT_NODE_KEYS = [
  "brand", "navProduct", "navCompany", "navDocs", "navAction",
  "eyebrow", "headline", "supporting", "primaryAction", "secondaryAction",
] as const;

export type TextNodeKey = (typeof TEXT_NODE_KEYS)[number];
export type CssUnit = "px" | "rem" | "em" | "%";
export type TextAlign = "left" | "center" | "right";

export type TextNodeStyle = {
  font: string;
  size: number;
  unit: CssUnit;
  lineHeight: number;
  weight: number;
  italic: boolean;
  color: string;
  align: TextAlign;
};

export type RouteDesignData = {
  content: Record<TextNodeKey, string>;
  styles: Record<TextNodeKey, TextNodeStyle>;
  vertical: "start" | "center" | "end";
};

export const NODE_META: Record<TextNodeKey, { label: string; tag: string; group: "Navigation" | "Route content" }> = {
  brand: { label: "Brand name", tag: "span", group: "Navigation" },
  navProduct: { label: "Product link", tag: "a", group: "Navigation" },
  navCompany: { label: "Company link", tag: "a", group: "Navigation" },
  navDocs: { label: "Docs link", tag: "a", group: "Navigation" },
  navAction: { label: "Navigation action", tag: "button", group: "Navigation" },
  eyebrow: { label: "Eyebrow", tag: "p", group: "Route content" },
  headline: { label: "Headline", tag: "h1", group: "Route content" },
  supporting: { label: "Supporting text", tag: "p", group: "Route content" },
  primaryAction: { label: "Primary action", tag: "button", group: "Route content" },
  secondaryAction: { label: "Secondary action", tag: "button", group: "Route content" },
};

const style = (size: number, unit: CssUnit, weight: number, color: string, align: TextAlign = "left"): TextNodeStyle => ({
  font: "Inter", size, unit, lineHeight: 1.35, weight, italic: false, color, align,
});

export function createRouteDesign(headline: string, supporting: string): RouteDesignData {
  return {
    content: {
      brand: "northstar", navProduct: "Product", navCompany: "Company", navDocs: "Docs", navAction: "Sign in",
      eyebrow: "DESIGN WITH THE REAL PRODUCT", headline, supporting, primaryAction: "Explore plans", secondaryAction: "See the canvas",
    },
    styles: {
      brand: style(9, "px", 800, "#101216"), navProduct: style(7, "px", 500, "#6F7176"), navCompany: style(7, "px", 500, "#6F7176"), navDocs: style(7, "px", 500, "#6F7176"), navAction: style(7, "px", 600, "#202225"),
      eyebrow: { ...style(7, "px", 750, "#7C7E84"), lineHeight: 1.2 }, headline: { ...style(27, "px", 700, "#101216"), lineHeight: 1.04 }, supporting: style(8, "px", 400, "#777980"), primaryAction: style(7, "px", 650, "#FFFFFF"), secondaryAction: style(7, "px", 600, "#34363A"),
    },
    vertical: "start",
  };
}

export function normalizeRouteDesign(input: unknown, headline: string, supporting: string): RouteDesignData {
  const fallback = createRouteDesign(headline, supporting);
  if (!input || typeof input !== "object") return fallback;
  const legacy = input as Record<string, unknown>;
  const content = legacy.content && typeof legacy.content === "object" ? legacy.content as Partial<Record<TextNodeKey, string>> : {};
  const styles = legacy.styles && typeof legacy.styles === "object" ? legacy.styles as Partial<Record<TextNodeKey, Partial<TextNodeStyle>>> : {};
  const legacyHeadlineStyle: Partial<TextNodeStyle> = {
    font: typeof legacy.font === "string" ? legacy.font : undefined,
    size: typeof legacy.size === "number" ? legacy.size : undefined,
    lineHeight: typeof legacy.lineHeight === "number" ? legacy.lineHeight : undefined,
    weight: typeof legacy.weight === "number" ? legacy.weight : undefined,
    italic: typeof legacy.italic === "boolean" ? legacy.italic : undefined,
    color: typeof legacy.color === "string" ? legacy.color : undefined,
    align: legacy.align === "left" || legacy.align === "center" || legacy.align === "right" ? legacy.align : undefined,
  };
  const normalizedContent = Object.fromEntries(TEXT_NODE_KEYS.map((key) => [key, typeof content[key] === "string" ? content[key] : key === "headline" && typeof legacy.headline === "string" ? legacy.headline : key === "supporting" && typeof legacy.supporting === "string" ? legacy.supporting : fallback.content[key]])) as Record<TextNodeKey, string>;
  const normalizedStyles = Object.fromEntries(TEXT_NODE_KEYS.map((key) => [key, { ...fallback.styles[key], ...(key === "headline" ? legacyHeadlineStyle : {}), ...(styles[key] ?? {}) }])) as Record<TextNodeKey, TextNodeStyle>;
  return { content: normalizedContent, styles: normalizedStyles, vertical: legacy.vertical === "center" || legacy.vertical === "end" ? legacy.vertical : "start" };
}

export function cloneRouteDesign(design: RouteDesignData): RouteDesignData {
  return { content: { ...design.content }, styles: Object.fromEntries(TEXT_NODE_KEYS.map((key) => [key, { ...design.styles[key] }])) as Record<TextNodeKey, TextNodeStyle>, vertical: design.vertical };
}

export function cssSize(styleValue: Pick<TextNodeStyle, "size" | "unit">) {
  return `${styleValue.size}${styleValue.unit}`;
}
