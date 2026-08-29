import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

export const sourceAnchorSchema = z.object({
  file: z.string().min(1),
  line: z.number().int().positive(),
  column: z.number().int().nonnegative(),
  component: z.string().min(1),
  ordinal: z.number().int().nonnegative(),
});

export const editTransactionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().min(1),
  baseSha: z.string().regex(/^[a-f0-9]{7,64}$/i),
  route: z.string().startsWith("/"),
  stateId: z.string().nullable(),
  anchor: sourceAnchorSchema,
  operation: z.enum(["replace_text", "set_style", "replace_class", "reorder", "insert", "remove"]),
  property: z.string().min(1),
  before: z.string(),
  after: z.string(),
  expectedSourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  affectedFiles: z.array(z.string().min(1)).min(1),
  inversePatch: z.string(),
  validation: z.object({
    syntax: z.boolean(),
    hmr: z.boolean(),
    diagnostics: z.array(z.string()),
  }),
  status: z.enum(["previewing", "pending", "validated", "rejected", "rolled_back"]),
  createdAt: z.string().datetime(),
});

export type EditTransaction = z.infer<typeof editTransactionSchema>;

export function sha256(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

export function makeTransaction(input: Omit<EditTransaction, "id" | "createdAt">): EditTransaction {
  return editTransactionSchema.parse({ ...input, id: randomUUID(), createdAt: new Date().toISOString() });
}

export function invertTransaction(transaction: EditTransaction): EditTransaction {
  return editTransactionSchema.parse({
    ...transaction,
    id: randomUUID(),
    before: transaction.after,
    after: transaction.before,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
}
