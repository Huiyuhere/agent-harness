import { TextNodeKey } from "./design-hierarchy";

export type FlowGap = { id: string; frameId: string; node: TextNodeKey; label: string; firstSeenAt: string; lastClickedAt: string; clickCount: number; suggestedRoute: string; status: "open" | "resolved" };

export function recordFlowGap(gaps: FlowGap[], input: Omit<FlowGap, "id" | "clickCount" | "status" | "firstSeenAt"> & { id: string }) {
  const existing = gaps.find((gap) => gap.frameId === input.frameId && gap.node === input.node && gap.status === "open");
  if (existing) return gaps.map((gap) => gap.id === existing.id ? { ...gap, label: input.label, lastClickedAt: input.lastClickedAt, clickCount: gap.clickCount + 1 } : gap);
  return [...gaps, { ...input, firstSeenAt: input.lastClickedAt, clickCount: 1, status: "open" as const }];
}

export function resolveFlowGap(gaps: FlowGap[], gapId: string) {
  return gaps.map((gap) => gap.id === gapId ? { ...gap, status: "resolved" as const } : gap);
}
