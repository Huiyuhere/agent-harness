export type BrandTokens = {
  colors: string[];
  fonts: string[];
  sourceFiles: string[];
  documents?: Array<{ path: string; kind: "brand" | "design"; content: string; sourceHash: string }>;
};

export function parseGitHubRepositoryUrl(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== "https:" || url.hostname !== "github.com") throw new Error("Use a full https://github.com/owner/repository URL.");
  const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) throw new Error("The GitHub URL must include an owner and repository.");
  return { owner: parts[0], repository: parts[1].replace(/\.git$/, "") };
}

export function isBrandSource(path: string) {
  return /(?:brand|token|theme|variable|global|tailwind|design-system|style)/i.test(path) && /\.(?:css|scss|sass|less|ts|tsx|js|jsx|json|md)$/i.test(path);
}

export function extractBrandTokens(files: Array<{ path: string; content: string }>): BrandTokens {
  const colors: string[] = [];
  const fonts: string[] = [];
  const addUnique = (target: string[], value: string, limit: number) => {
    if (value && !target.some((item) => item.toLowerCase() === value.toLowerCase()) && target.length < limit) target.push(value);
  };
  for (const file of files) {
    for (const match of file.content.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) addUnique(colors, match[0].toUpperCase(), 16);
    for (const match of file.content.matchAll(/font-family\s*:\s*([^;\n}]+)/gi)) {
      for (const candidate of match[1].split(",")) addUnique(fonts, candidate.trim().replace(/["']/g, ""), 8);
    }
    for (const match of file.content.matchAll(/(?:fontFamily|font-family)["']?\s*[:=]\s*["'`]([^"'`\n]+)/g)) addUnique(fonts, match[1].trim(), 8);
  }
  return {
    colors: colors.length ? colors : ["#202225", "#315EFB", "#FF6B47", "#F7F7F4"],
    fonts: fonts.filter((font) => !/^(sans-serif|serif|monospace|inherit|system-ui)$/i.test(font)).length
      ? fonts.filter((font) => !/^(sans-serif|serif|monospace|inherit|system-ui)$/i.test(font))
      : ["Inter", "Geist"],
    sourceFiles: files.map((file) => file.path),
  };
}
