import { parse } from "@babel/parser";
import postcss from "postcss";
import { sha256 } from "./edit-transaction";

export class SourceConflictError extends Error {
  constructor(message = "The source changed after this edit was planned.") {
    super(message);
    this.name = "SourceConflictError";
  }
}

function requireHash(source: string, expectedHash: string) {
  if (sha256(source) !== expectedHash) throw new SourceConflictError();
}

export function replaceJsxText(source: string, before: string, after: string, expectedHash = sha256(source)) {
  requireHash(source, expectedHash);
  const quoted = source.includes(`>${before}<`) ? `>${before}<` : null;
  if (!quoted) throw new Error("The selected JSX text is no longer unique at its source anchor.");
  if (source.split(quoted).length !== 2) throw new Error("Ambiguous JSX text requires an agent-assisted patch.");
  const output = source.replace(quoted, `>${after}<`);
  parse(output, { sourceType: "module", plugins: ["jsx", "typescript"] });
  return { output, inverse: output.replace(`>${after}<`, `>${before}<`) };
}

export async function setCssDeclaration(source: string, selector: string, property: string, value: string, expectedHash = sha256(source)) {
  requireHash(source, expectedHash);
  const root = postcss.parse(source);
  let previous: string | undefined;
  let matches = 0;
  root.walkRules(selector, (rule) => {
    matches += 1;
    const declaration = rule.nodes.find((node) => node.type === "decl" && node.prop === property);
    if (declaration?.type === "decl") { previous = declaration.value; declaration.value = value; }
    else rule.append({ prop: property, value });
  });
  if (matches !== 1) throw new Error(matches ? "Ambiguous selector requires intent approval." : "CSS selector was not found.");
  const output = root.toString();
  return { output, previous: previous ?? null };
}

export function replaceTailwindToken(source: string, before: string, after: string, expectedHash = sha256(source)) {
  requireHash(source, expectedHash);
  const replaceToken = (input: string, from: string, to: string) => {
    let changes = 0;
    const output = input.replace(/className=(?:"([^"]*)"|'([^']*)')/g, (full, doubleQuoted: string | undefined, singleQuoted: string | undefined) => {
      const tokens = (doubleQuoted ?? singleQuoted ?? "").split(/\s+/);
      const index = tokens.indexOf(from);
      if (index < 0) return full;
      changes += 1;
      tokens[index] = to;
      const quote = doubleQuoted !== undefined ? '"' : "'";
      return `className=${quote}${tokens.join(" ")}${quote}`;
    });
    return { output, changes };
  };
  const result = replaceToken(source, before, after);
  const { output, changes } = result;
  if (changes !== 1) throw new Error(changes ? "Tailwind token is ambiguous." : "Tailwind token was not found.");
  parse(output, { sourceType: "module", plugins: ["jsx", "typescript"] });
  const inverse = replaceToken(output, after, before);
  if (inverse.changes !== 1) throw new Error("Failed to create an exact inverse Tailwind patch.");
  return { output, inverse: inverse.output };
}
