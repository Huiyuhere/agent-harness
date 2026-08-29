"use client";

import {
  AlignCenter, AlignLeft, AlignRight, ArrowRight, ArrowUp, Bold, Bot, Check,
  ChevronDown, ChevronRight, CircleStop, Code2, Copy, Eye, GitBranch, Grid2X2,
  Italic, Layers3, Link2, Maximize2, MessageSquare, MousePointer2,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Palette, Plus,
  Redo2, Route, Search, Settings2, Sparkles, Undo2, ZoomIn, ZoomOut,
} from "lucide-react";
import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";

type CanvasMode = "edit" | "prototype" | "graph";
type InspectorTab = "design" | "layers" | "code" | "changes";
type Align = "left" | "center" | "right";
type FrameSpec = { id: string; route: string; name: string; state: string; x: number; y: number; width: number; height: number; accent: string; updatedAt: string };
type RouteDesign = { headline: string; supporting: string; font: string; size: number; lineHeight: number; weight: number; italic: boolean; color: string; align: Align; vertical: "start" | "center" | "end" };
type WorkspaceSpec = { id: string; name: string; repository: string; baseSha: string; updatedAt: string; frames: FrameSpec[]; designs: Record<string, RouteDesign>; brand: { colors: string[]; fonts: string[]; sourceFiles: string[] } };
type EditTransaction = { id: string; workspaceId: string; frameId: string; timestamp: string; date: string; target: string; property: string; before: string; after: string; status: "validated" | "pending" };

const now = () => new Date().toISOString();
const INITIAL_STAMP = "2026-08-29T01:00:00.000Z";
const timeLabel = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dateLabel = (value: string) => new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
const DEFAULT_BRAND = { colors: ["#202225", "#315EFB", "#FF6B47", "#F7F7F4"], fonts: ["Inter", "Geist", "IBM Plex Sans"], sourceFiles: ["styles/tokens.css", "app/globals.css"] };
const baseDesign = (headline: string, supporting: string, color = "#101216"): RouteDesign => ({ headline, supporting, font: "Inter", size: 27, lineHeight: 1.04, weight: 700, italic: false, color, align: "left", vertical: "start" });
const initialFrames: FrameSpec[] = [
  { id: "home", route: "/", name: "Home", state: "Default", x: 80, y: 80, width: 430, height: 300, accent: "#ff6b47", updatedAt: INITIAL_STAMP },
  { id: "pricing", route: "/pricing", name: "Pricing", state: "Default", x: 570, y: 80, width: 430, height: 300, accent: "#7a64ff", updatedAt: INITIAL_STAMP },
  { id: "welcome", route: "/welcome", name: "Welcome", state: "Success", x: 80, y: 455, width: 430, height: 300, accent: "#16a978", updatedAt: INITIAL_STAMP },
  { id: "settings", route: "/settings", name: "Settings", state: "Account", x: 570, y: 455, width: 430, height: 300, accent: "#3478f6", updatedAt: INITIAL_STAMP },
];
const firstWorkspace: WorkspaceSpec = {
  id: "northstar", name: "Northstar website", repository: "Huiyuhere / northstar-web", baseSha: "8f31ae", updatedAt: INITIAL_STAMP, frames: initialFrames,
  brand: DEFAULT_BRAND,
  designs: {
    home: baseDesign("From interface idea\nto working React.", "Select real DOM layers, refine the layout, and commit source-ready changes."),
    pricing: baseDesign("Choose the workspace\nthat fits your team.", "Simple plans for teams designing in production code."),
    welcome: { ...baseDesign("Your routes are on the canvas.", "Follow an interaction to the next route without losing this frame."), align: "center" },
    settings: baseDesign("Brand foundations", "Typography and colors inherited from this workspace only."),
  },
};
const nextTarget: Record<string, string> = { home: "pricing", pricing: "welcome", welcome: "home", settings: "home" };
const MODE_COPY = {
  edit: { title: "Edit page", body: "Select real elements. Text and inspector changes update only this route.", icon: MousePointer2 },
  prototype: { title: "Preview flow", body: "Clickable hotspots show their destination. Click one to move to the linked frame.", icon: Link2 },
  graph: { title: "Map relationships", body: "Review the route graph and the states connected by real interactions.", icon: GitBranch },
};

function HarnessMark({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "mark compact" : "mark"} aria-hidden="true"><span /><span /><span /></div>;
}

function FramePreview({ frame, design, mode, active, targetId, targetName, onSelect, onNavigate, onInlineText }: {
  frame: FrameSpec; design: RouteDesign; mode: CanvasMode; active: boolean; targetId?: string; targetName?: string; onSelect: (node: string) => void; onNavigate: (target: string) => void; onInlineText: (text: string) => void;
}) {
  const choose = (event: React.MouseEvent, node: string) => { event.stopPropagation(); if (mode === "edit") onSelect(node); };
  const go = (event: React.MouseEvent) => { event.stopPropagation(); if (mode === "prototype" && targetId) onNavigate(targetId); else if (mode === "edit") onSelect(`${frame.id}:primary-action`); };
  const textStyle = { fontFamily: design.font, fontSize: design.size, lineHeight: design.lineHeight, fontWeight: design.weight, fontStyle: design.italic ? "italic" : "normal", color: design.color, textAlign: design.align, whiteSpace: "pre-wrap" as const };
  const isDemoRoute = ["home", "pricing", "welcome", "settings"].includes(frame.id);
  return <article className={`route-frame ${active ? "active-frame" : ""} ${mode === "prototype" ? "prototype-frame" : ""}`} style={{ left: frame.x, top: frame.y, width: frame.width }} data-frame-id={frame.id}>
    <header className="frame-label"><div><strong>{frame.name}</strong><span>{frame.route}</span></div><div className="frame-date"><span>{dateLabel(frame.updatedAt)} · {timeLabel(frame.updatedAt)}</span><span className="state-pill">{frame.state}</span></div></header>
    <div className="browser-frame" style={{ height: frame.height }} onClick={() => mode === "edit" && onSelect(`${frame.id}:canvas`)}>
      <div className="browser-bar"><div className="traffic"><i /><i /><i /></div><div className="address">workspace{frame.route}</div><Maximize2 size={12} /></div>
      <div className={`mini-site mini-${frame.id} align-${design.align} vertical-${design.vertical}`}>
        <nav><span className="mini-logo"><i style={{ background: frame.accent }} />northstar</span><div><span>Product</span><span>Company</span><span>Docs</span></div><button onClick={go}>Sign in</button></nav>
        {frame.id === "home" && <div className="hero-mini route-content"><p className="eyebrow">DESIGN WITH THE REAL PRODUCT</p><h2
          className={active ? "node-selected" : ""} style={textStyle} contentEditable={mode === "edit"} suppressContentEditableWarning
          onClick={(event) => choose(event, "home:headline")} onBlur={(event) => onInlineText(event.currentTarget.innerText)}
        >{design.headline}</h2><p>{design.supporting}</p><div className="mini-actions"><button onClick={go}>Explore plans <ChevronRight size={12} /></button><button className="quiet">See the canvas</button></div></div>}
        {frame.id === "pricing" && <div className="pricing-mini route-content"><p className="eyebrow">SIMPLE PRICING</p><h2 style={textStyle} contentEditable={mode === "edit"} suppressContentEditableWarning onClick={(event) => choose(event, "pricing:headline")} onBlur={(event) => onInlineText(event.currentTarget.innerText)}>{design.headline}</h2><div className="price-cards"><div><span>Starter</span><strong>$0</strong><small>For trying the canvas</small></div><div className="featured" onClick={go}><span>Studio</span><strong>$20</strong><small>For product teams</small></div></div></div>}
        {frame.id === "welcome" && <div className="welcome-mini route-content"><div className="success-ring"><Check size={22} /></div><p className="eyebrow">WORKSPACE READY</p><h2 style={textStyle} contentEditable={mode === "edit"} suppressContentEditableWarning onClick={(event) => choose(event, "welcome:headline")} onBlur={(event) => onInlineText(event.currentTarget.innerText)}>{design.headline}</h2><p>{design.supporting}</p><button onClick={go}>Go to home</button></div>}
        {frame.id === "settings" && <div className="settings-mini route-content"><aside><i /><i /><i /><i /></aside><section><p className="eyebrow">PROJECT SETTINGS</p><h2 style={textStyle} contentEditable={mode === "edit"} suppressContentEditableWarning onClick={(event) => choose(event, "settings:headline")} onBlur={(event) => onInlineText(event.currentTarget.innerText)}>{design.headline}</h2><label>Workspace name<input value="Northstar" readOnly /></label><label>Accent color<div className="color-field"><i /><span>#3478F6</span></div></label><button onClick={go}>Save and return home</button></section></div>}
        {!isDemoRoute && <div className="generic-mini route-content"><p className="eyebrow">IMPORTED ROUTE · {frame.route}</p><h2
          className={active ? "node-selected" : ""} style={textStyle} contentEditable={mode === "edit"} suppressContentEditableWarning
          onClick={(event) => choose(event, `${frame.id}:headline`)} onBlur={(event) => onInlineText(event.currentTarget.innerText)}
        >{design.headline}</h2><p>{design.supporting}</p>{targetId && <button onClick={go}>Continue to {targetName}<ChevronRight size={12} /></button>}</div>}
        {mode === "prototype" && targetId && <button className="prototype-hotspot" onClick={go}><ArrowRight size={12} /> Opens {targetName}</button>}
      </div>
    </div>
    <footer className="frame-meta"><span>{frame.width} × {frame.height} · isolated route state</span><span><Eye size={11} /> live</span></footer>
  </article>;
}

export function AgentHarness() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSpec[]>([firstWorkspace]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(firstWorkspace.id);
  const [storageReady, setStorageReady] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true); const [rightOpen, setRightOpen] = useState(true); const [leftWidth, setLeftWidth] = useState(278);
  const [mode, setMode] = useState<CanvasMode>("edit"); const [inspectorTab, setInspectorTab] = useState<InspectorTab>("design");
  const [zoom, setZoom] = useState(.82); const [pan, setPan] = useState({ x: 60, y: 18 }); const [selectedFrame, setSelectedFrame] = useState("home"); const [selected, setSelected] = useState("home:headline");
  const [transactions, setTransactions] = useState<EditTransaction[]>([]); const [toast, setToast] = useState<string | null>(null);
  const [composer, setComposer] = useState(""); const [agentStatus, setAgentStatus] = useState<"idle" | "thinking" | "done">("idle"); const [agentReply, setAgentReply] = useState<string | null>(null); const [agentMeta, setAgentMeta] = useState({ time: "", duration: "" }); const agentAbort = useRef<AbortController | null>(null);
  const [draggingCanvas, setDraggingCanvas] = useState(false); const dragOrigin = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const [workspaceModal, setWorkspaceModal] = useState(false); const [workspaceTab, setWorkspaceTab] = useState<"create" | "github">("create"); const [workspaceName, setWorkspaceName] = useState(""); const [repositoryUrl, setRepositoryUrl] = useState(""); const [trusted, setTrusted] = useState(false); const [importing, setImporting] = useState(false); const [importError, setImportError] = useState<string | null>(null);
  const textEditStart = useRef(""); const sizeEditStart = useRef(0);
  const workspace = workspaces.find((item) => item.id === activeWorkspaceId) ?? workspaces[0];
  const selectedSpec = workspace.frames.find((frame) => frame.id === selectedFrame) ?? workspace.frames[0];
  const selectedDesign = workspace.designs[selectedSpec.id] ?? baseDesign(selectedSpec.name, "Route-specific design state.");
  const modeCopy = MODE_COPY[mode];
  const activeTransactions = transactions.filter((transaction) => transaction.workspaceId === workspace.id);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agent-harness-workspaces-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as { workspaces: WorkspaceSpec[]; transactions: EditTransaction[] };
        if (parsed.workspaces?.length) { setWorkspaces(parsed.workspaces); setActiveWorkspaceId(parsed.workspaces[0].id); setSelectedFrame(parsed.workspaces[0].frames[0].id); }
        if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
      }
    } catch { localStorage.removeItem("agent-harness-workspaces-v1"); }
    setStorageReady(true);
  }, []);
  useEffect(() => {
    if (storageReady) localStorage.setItem("agent-harness-workspaces-v1", JSON.stringify({ workspaces, transactions }));
  }, [storageReady, transactions, workspaces]);

  const commit = (property: string, before: string, after: string, target = selectedSpec) => {
    if (before === after) return;
    const stamp = now();
    setTransactions((items) => [{ id: crypto.randomUUID(), workspaceId: workspace.id, frameId: target.id, timestamp: timeLabel(stamp), date: dateLabel(stamp), target: `${workspace.name} / ${target.name}`, property, before, after, status: "validated" }, ...items]);
    setToast(`${target.name} updated · ${timeLabel(stamp)}`); window.setTimeout(() => setToast(null), 1800);
  };
  const updateRouteDesign = (frameId: string, patch: Partial<RouteDesign>, property?: string, before?: string, after?: string) => {
    const stamp = now();
    const target = workspace.frames.find((frame) => frame.id === frameId) ?? selectedSpec;
    setWorkspaces((items) => items.map((item) => item.id !== workspace.id ? item : ({ ...item, updatedAt: stamp, frames: item.frames.map((frame) => frame.id === frameId ? { ...frame, updatedAt: stamp } : frame), designs: { ...item.designs, [frameId]: { ...item.designs[frameId], ...patch } } })));
    if (property && before !== undefined && after !== undefined) commit(property, before, after, target);
  };
  const updateDesign = (patch: Partial<RouteDesign>, property?: string, before?: string, after?: string) => updateRouteDesign(selectedSpec.id, patch, property, before, after);
  const targetForFrame = (frameId: string) => {
    if (workspace.frames.length < 2) return undefined;
    const mapped = workspace.frames.find((frame) => frame.id === nextTarget[frameId]);
    if (mapped) return mapped;
    const index = workspace.frames.findIndex((frame) => frame.id === frameId);
    return workspace.frames[(index + 1) % workspace.frames.length];
  };
  const selectFrame = (id: string) => { setSelectedFrame(id); setSelected(`${id}:headline`); };
  const centerFrame = useCallback((frameId: string, fromPrototype = false) => {
    const current = workspaces.find((item) => item.id === activeWorkspaceId) ?? workspaces[0]; const frame = current.frames.find((item) => item.id === frameId);
    if (!frame || !canvasRef.current) return; const rect = canvasRef.current.getBoundingClientRect(); const prior = current.frames.find((item) => item.id === selectedFrame);
    selectFrame(frameId); setPan({ x: rect.width / 2 - (frame.x + frame.width / 2) * zoom, y: rect.height / 2 - (frame.y + frame.height / 2) * zoom });
    if (fromPrototype) { setToast(`Prototype flow · ${prior?.name ?? "Frame"} → ${frame.name}`); window.setTimeout(() => setToast(null), 1800); }
  }, [activeWorkspaceId, selectedFrame, workspaces, zoom]);
  const startCanvasDrag = (event: ReactPointerEvent<HTMLDivElement>) => { if ((event.target as HTMLElement).closest(".route-frame")) return; dragOrigin.current = { clientX: event.clientX, clientY: event.clientY, panX: pan.x, panY: pan.y }; setDraggingCanvas(true); event.currentTarget.setPointerCapture(event.pointerId); };
  const moveCanvas = (event: ReactPointerEvent<HTMLDivElement>) => { if (draggingCanvas) setPan({ x: dragOrigin.current.panX + event.clientX - dragOrigin.current.clientX, y: dragOrigin.current.panY + event.clientY - dragOrigin.current.clientY }); };
  const resizeSidebar = (event: ReactPointerEvent<HTMLDivElement>) => { const start = event.clientX; const width = leftWidth; const onMove = (move: PointerEvent) => setLeftWidth(Math.max(220, Math.min(430, width + move.clientX - start))); const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); }; window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp); };

  const createWorkspace = () => {
    const id = crypto.randomUUID(); const stamp = now(); const frame = { ...initialFrames[0], id: `${id}-home`, updatedAt: stamp };
    const item: WorkspaceSpec = { id, name: workspaceName.trim() || "Untitled workspace", repository: "Local workspace", baseSha: "uncommitted", updatedAt: stamp, frames: [frame], designs: { [frame.id]: baseDesign("Start designing in code.", "This route is isolated from every other workspace.") }, brand: { ...DEFAULT_BRAND } };
    setWorkspaces((items) => [...items, item]); setActiveWorkspaceId(id); setSelectedFrame(frame.id); setSelected(`${frame.id}:headline`); setAgentReply(null); setComposer(""); setWorkspaceModal(false); setWorkspaceName("");
  };
  const importWorkspace = async () => {
    if (!trusted) { setImportError("Confirm that you trust this repository before importing its code."); return; }
    setImporting(true); setImportError(null);
    try {
      const response = await fetch("/api/github/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repositoryUrl }) }); const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Import failed.");
      const stamp = now(); const id = crypto.randomUUID(); const discovered = payload.routes.length ? payload.routes : [{ route: "/", file: "src/App.tsx" }];
      const frames: FrameSpec[] = discovered.slice(0, 30).map((route: { route: string }, index: number) => ({ id: `${id}-${index}`, route: route.route, name: route.route === "/" ? "Home" : route.route.split("/").filter(Boolean).pop()?.replace(/[\[\]-]/g, " ") || "Route", state: "Default", x: 80 + (index % 3) * 490, y: 80 + Math.floor(index / 3) * 375, width: 430, height: 300, accent: payload.brand.colors[index % payload.brand.colors.length], updatedAt: stamp }));
      const designs = Object.fromEntries(frames.map((frame) => [frame.id, { ...baseDesign(frame.name, `Imported from ${payload.repository.fullName}.`), font: payload.brand.fonts[0], color: payload.brand.colors[0] }]));
      const item: WorkspaceSpec = { id, name: workspaceName.trim() || payload.repository.name, repository: payload.repository.fullName, baseSha: payload.repository.baseSha.slice(0, 7), updatedAt: stamp, frames, designs, brand: payload.brand };
      setWorkspaces((items) => [...items, item]); setActiveWorkspaceId(id); setSelectedFrame(frames[0].id); setSelected(`${frames[0].id}:headline`); setAgentReply(null); setComposer(""); setWorkspaceModal(false); setRepositoryUrl(""); setWorkspaceName(""); setTrusted(false); setToast(`Imported ${frames.length} routes and ${payload.brand.colors.length} brand colors`); window.setTimeout(() => setToast(null), 2600);
    } catch (error) { setImportError((error as Error).message); } finally { setImporting(false); }
  };

  const sendAgent = async () => {
    if (!composer.trim() || agentStatus === "thinking") return; const prompt = composer.trim(); const startedAt = performance.now(); const controller = new AbortController(); agentAbort.current = controller; setComposer(""); setAgentReply(""); setAgentStatus("thinking");
    try { const response = await fetch("/api/agent", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, model: "gpt-5.4-mini", contextReceipt: { frames: [selectedSpec.id], files: ["app/page.tsx"], computedStyles: [`font-size:${selectedDesign.size}px`, `color:${selectedDesign.color}`], memoryIds: workspace.brand.sourceFiles, decisionIds: ["route-state-isolated", "source-is-truth"] } }) }); if (!response.ok || !response.body) { const payload = await response.json().catch(() => ({ error: "Agent request failed." })); throw new Error(payload.error); } const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let output = ""; while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; for (const line of lines) { if (!line.startsWith("data: ") || line === "data: [DONE]") continue; const event = JSON.parse(line.slice(6)); if (event.type === "response.output_text.delta") { output += event.delta; setAgentReply(output); } } } if (!output) setAgentReply("The agent completed without a text response."); }
    catch (error) { setAgentReply((error as Error).name === "AbortError" ? "Request stopped. Partial work remains in this task." : `${(error as Error).message}\n\nCanvas editing remains available.`); }
    finally { setAgentMeta({ time: timeLabel(now()), duration: `${((performance.now() - startedAt) / 1000).toFixed(1)}s` }); setAgentStatus("done"); agentAbort.current = null; }
  };

  const addText = (addition: string) => updateDesign({ headline: selectedDesign.headline + addition }, "text", selectedDesign.headline, selectedDesign.headline + addition);
  const ModeIcon = modeCopy.icon;
  const modeIcon = <ModeIcon size={14} />;
  return <main className="harness-shell" style={{ gridTemplateColumns: `${leftOpen ? leftWidth : 54}px minmax(0, 1fr) ${rightOpen ? 304 : 0}px` }}>
    <aside className={`left-sidebar ${leftOpen ? "open" : "closed"}`}><div className="brand-row"><HarnessMark compact={!leftOpen} />{leftOpen && <div><strong>Agent Harness</strong><span>Code-native design</span></div>}<button onClick={() => setLeftOpen(!leftOpen)}>{leftOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</button></div>{leftOpen && <>
      <button className="new-workspace" onClick={() => setWorkspaceModal(true)}><Plus size={14} /> New workspace</button>
      <label className="workspace-picker"><span>WORKSPACE</span><select value={activeWorkspaceId} onChange={(event) => { const next = workspaces.find((item) => item.id === event.target.value)!; setActiveWorkspaceId(next.id); setSelectedFrame(next.frames[0].id); setSelected(`${next.frames[0].id}:headline`); setAgentReply(null); setComposer(""); setPan({ x: 60, y: 18 }); }}><option disabled value="">Choose workspace</option>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="repo-switcher" onClick={() => setWorkspaceModal(true)}><GitBranch size={15} /><span><strong>{workspace.repository}</strong><small>Updated {dateLabel(workspace.updatedAt)} · {timeLabel(workspace.updatedAt)}</small></span><ChevronDown size={14} /></button>
      <div className="sidebar-search"><Search size={14} /><input placeholder="Search this workspace" /></div>
      <div className="side-section"><div className="section-title"><span>ROUTES · ISOLATED</span><button><Plus size={13} /></button></div>{workspace.frames.map((frame) => <button key={frame.id} className={`route-item ${selectedFrame === frame.id ? "active" : ""}`} onClick={() => centerFrame(frame.id)}><Route size={14} /><span><strong>{frame.name}</strong><small>{frame.route} · {timeLabel(frame.updatedAt)}</small></span><i className="live-dot" /></button>)}</div>
      <div className="side-section"><div className="section-title"><span>SAVED STATES</span><button><Plus size={13} /></button></div><button className="state-item"><span className="state-glyph">◇</span><span>Success state</span><small>{dateLabel(workspace.updatedAt)}</small></button><button className="state-item"><span className="state-glyph">◇</span><span>Responsive state</span><small>{timeLabel(workspace.updatedAt)}</small></button></div>
      <div className="memory-card"><Palette size={15} /><div><strong>Brand guide loaded</strong><span>{workspace.brand.colors.length} colors · {workspace.brand.fonts.length} fonts</span></div><ChevronRight size={14} /></div><div className="workspace-status"><span><i /> Preview shell ready</span><small>{workspace.frames.length} independent route frame(s)</small></div>
    </>} {leftOpen && <div className="sidebar-resizer" onPointerDown={resizeSidebar} />}</aside>

    <section className="workspace"><header className="topbar"><div className="mode-group"><button className={mode === "edit" ? "active" : ""} onClick={() => setMode("edit")}><MousePointer2 size={14} />Edit page</button><button className={mode === "prototype" ? "active" : ""} onClick={() => setMode("prototype")}><Link2 size={14} />Preview flow</button><button className={mode === "graph" ? "active" : ""} onClick={() => setMode("graph")}><GitBranch size={14} />Graph</button></div><div className="session-title"><span>{workspace.name}</span><small>Draft · base {workspace.baseSha}</small></div><div className="toolbar-actions"><button><Undo2 size={15} /></button><button><Redo2 size={15} /></button><button><MessageSquare size={14} /><span>Comment</span></button><button><Grid2X2 size={14} /><span>Multi-select</span></button><button className="publish-button"><GitBranch size={14} />Review changes <span>{activeTransactions.length}</span></button></div></header>
      <div ref={canvasRef} className={`canvas-viewport mode-${mode} ${draggingCanvas ? "dragging" : ""}`} onPointerDown={startCanvasDrag} onPointerMove={moveCanvas} onPointerUp={() => setDraggingCanvas(false)}><div className="mode-explainer">{modeIcon}<div><strong>{modeCopy.title}</strong><span>{modeCopy.body}</span></div></div><div className="canvas-grid" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: 1600, height: Math.max(820, Math.ceil(workspace.frames.length / 3) * 375 + 80) }}>
        {mode === "graph" && <svg className="graph-lines" width="1600" height="1200"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>{workspace.frames.map((source) => { const target = targetForFrame(source.id); return !target ? null : <path key={`${source.id}-${target.id}`} d={`M ${source.x + source.width} ${source.y + 190} C ${source.x + source.width + 55} ${source.y + 190}, ${target.x - 55} ${target.y + 190}, ${target.x} ${target.y + 190}`} markerEnd="url(#arrow)" />; })}</svg>}
        {workspace.frames.map((frame) => { const target = targetForFrame(frame.id); return <FramePreview key={frame.id} frame={frame} design={workspace.designs[frame.id]} mode={mode} active={selectedFrame === frame.id} targetId={target?.id} targetName={target?.name} onSelect={(node) => { setSelected(node); selectFrame(frame.id); }} onNavigate={(targetId) => centerFrame(targetId, true)} onInlineText={(text) => { const previous = workspace.designs[frame.id].headline; if (text !== previous) { selectFrame(frame.id); updateRouteDesign(frame.id, { headline: text }, "inline text", previous, text); } }} />; })}
      </div><div className="zoom-control"><button onClick={() => setZoom((value) => Math.max(.4, value - .1))}><ZoomOut size={14} /></button><button className="zoom-value" onClick={() => setZoom(.82)}>{Math.round(zoom * 100)}%</button><button onClick={() => setZoom((value) => Math.min(1.4, value + .1))}><ZoomIn size={14} /></button><i /><button onClick={() => { setZoom(.82); setPan({ x: 60, y: 18 }); }}><Maximize2 size={14} /></button></div></div>
      <section className="agent-dock">{agentReply && <div className="agent-response"><div className="agent-avatar"><Bot size={14} /></div><div><div className="response-meta"><strong>Design agent</strong><span>{agentMeta.time} · {agentMeta.duration}</span></div><p>{agentReply}</p></div><button onClick={() => navigator.clipboard.writeText(agentReply)}><Copy size={14} /></button></div>}<div className={`composer ${agentStatus === "thinking" ? "thinking" : ""}`}><div className="context-chip"><span className="frame-dot" style={{ background: selectedSpec.accent }} />{workspace.name} · {selectedSpec.route}<button>×</button></div><textarea value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendAgent(); } }} placeholder="Ask about this route without mixing other workspaces…" /><div className="composer-footer"><div><button><Plus size={16} /></button><span><Sparkles size={12} /> gpt-5.4 mini</span></div>{agentStatus === "thinking" ? <button className="send-button stop" onClick={() => agentAbort.current?.abort()}><CircleStop size={17} /></button> : <button className="send-button" onClick={() => void sendAgent()} disabled={!composer.trim()}><ArrowUp size={17} /></button>}</div>{agentStatus === "thinking" && <div className="thinking-line"><i /><span>Reading only {workspace.name} / {selectedSpec.name}…</span></div>}</div></section>
    </section>

    <aside className={`right-inspector ${rightOpen ? "open" : "closed"}`}>{rightOpen ? <><div className="inspector-head"><div><strong>{selectedSpec.name} inspector</strong><span>{selected} · updated {timeLabel(selectedSpec.updatedAt)}</span></div><button onClick={() => setRightOpen(false)}><PanelRightClose size={16} /></button></div><div className="inspector-tabs">{(["design", "layers", "code", "changes"] as InspectorTab[]).map((tab) => <button key={tab} className={inspectorTab === tab ? "active" : ""} onClick={() => setInspectorTab(tab)}>{tab}</button>)}</div>
      {inspectorTab === "design" && <div className="inspector-body"><div className="selection-path"><span>{selectedSpec.name}</span><ChevronRight size={11} /><strong>headline</strong></div><section className="property-section text-editor"><header><span>Text content</span><small>Spaces and line breaks preserved</small></header><textarea value={selectedDesign.headline} onFocus={() => { textEditStart.current = selectedDesign.headline; }} onChange={(event) => updateDesign({ headline: event.target.value })} onBlur={(event) => commit("text", textEditStart.current, event.target.value)} /><div className="text-actions"><button onClick={() => addText("\n")}><ArrowRight size={12} /> Line break</button><button onClick={() => addText(" ")}>· Space</button></div></section>
        <section className="property-section"><header><span>Layout</span><small>Semantic alignment</small></header><div className="alignment-grid">{Array.from({ length: 9 }).map((_, index) => { const align: Align = (["left", "center", "right"] as Align[])[index % 3]; const vertical = (["start", "center", "end"] as const)[Math.floor(index / 3)]; return <button key={index} className={selectedDesign.align === align && selectedDesign.vertical === vertical ? "active" : ""} onClick={() => updateDesign({ align, vertical }, "alignment", `${selectedDesign.vertical}/${selectedDesign.align}`, `${vertical}/${align}`)}><i /></button>; })}</div><div className="format-row"><button className={selectedDesign.align === "left" ? "active" : ""} onClick={() => updateDesign({ align: "left" })}><AlignLeft size={13} /></button><button className={selectedDesign.align === "center" ? "active" : ""} onClick={() => updateDesign({ align: "center" })}><AlignCenter size={13} /></button><button className={selectedDesign.align === "right" ? "active" : ""} onClick={() => updateDesign({ align: "right" })}><AlignRight size={13} /></button></div></section>
        <section className="property-section"><header><span>Typography</span><small>From brand guide</small></header><label className="wide-field"><span>Font</span><select value={selectedDesign.font} onChange={(event) => updateDesign({ font: event.target.value }, "font-family", selectedDesign.font, event.target.value)}>{workspace.brand.fonts.map((font) => <option key={font}>{font}</option>)}</select></label><div className="field-row"><label><span>Size</span><input type="number" min="8" max="120" value={selectedDesign.size} onFocus={() => { sizeEditStart.current = selectedDesign.size; }} onChange={(event) => updateDesign({ size: Number(event.target.value) })} onBlur={(event) => commit("font-size", `${sizeEditStart.current}px`, `${event.target.value}px`)} /></label><label><span>Line</span><input type="number" min=".7" max="3" step=".05" value={selectedDesign.lineHeight} onChange={(event) => updateDesign({ lineHeight: Number(event.target.value) })} /></label></div><div className="format-row"><button className={selectedDesign.weight >= 700 ? "active" : ""} onClick={() => updateDesign({ weight: selectedDesign.weight >= 700 ? 400 : 700 }, "font-weight", String(selectedDesign.weight), String(selectedDesign.weight >= 700 ? 400 : 700))}><Bold size={13} /></button><button className={selectedDesign.italic ? "active" : ""} onClick={() => updateDesign({ italic: !selectedDesign.italic }, "font-style", selectedDesign.italic ? "italic" : "normal", selectedDesign.italic ? "normal" : "italic")}><Italic size={13} /></button></div></section>
        <section className="property-section brand-section"><header><span>Brand colors</span><small>{workspace.brand.sourceFiles.length} source file(s)</small></header><div className="brand-swatches">{workspace.brand.colors.map((color) => <button key={color} className={selectedDesign.color.toUpperCase() === color.toUpperCase() ? "active" : ""} style={{ background: color }} onClick={() => updateDesign({ color }, "color", selectedDesign.color, color)} aria-label={`Use ${color}`} />)}<label className="color-wheel"><Plus size={13} /><input type="color" value={selectedDesign.color} onChange={(event) => { const color = event.target.value.toUpperCase(); setWorkspaces((items) => items.map((item) => item.id === workspace.id ? { ...item, brand: { ...item.brand, colors: item.brand.colors.includes(color) ? item.brand.colors : [...item.brand.colors, color] } } : item)); updateDesign({ color }, "custom color", selectedDesign.color, color); }} /></label></div><p>{workspace.brand.sourceFiles.length ? `Loaded from ${workspace.brand.sourceFiles.slice(0, 2).join(" and ")}` : "Default palette. Add colors with the picker."}</p></section>
        <section className="source-anchor"><Code2 size={14} /><div><span>Route-specific source anchor</span><strong>{selectedSpec.route} · headline</strong><small>Changes do not affect other routes</small></div><ChevronRight size={14} /></section></div>}
      {inspectorTab === "layers" && <div className="inspector-body layer-tree"><div><ChevronDown size={13} /><Layers3 size={13} /><strong>{selectedSpec.name}Page</strong></div><div className="indent"><ChevronDown size={13} /><Layers3 size={13} /><span>Route content</span></div><button className="indent-2 active"><Code2 size={13} /><span>h1 · headline</span></button><button className="indent-2"><Code2 size={13} /><span>p · supporting</span></button><button className="indent-2"><Code2 size={13} /><span>button · → {targetForFrame(selectedSpec.id)?.name ?? "No linked route"}</span></button></div>}
      {inspectorTab === "code" && <div className="inspector-body code-panel"><div className="file-chip">{selectedSpec.route === "/" ? "app/page.tsx" : `app${selectedSpec.route}/page.tsx`}</div><pre>{`<h1 className="route-title">\n  ${selectedDesign.headline.replace(/\n/g, "\n  ")}\n</h1>`}</pre><button><Code2 size={13} />Open source</button></div>}
      {inspectorTab === "changes" && <div className="inspector-body changes-list">{activeTransactions.length ? activeTransactions.map((tx) => <article key={tx.id}><header><span>{tx.target}</span><small>{tx.date} · {tx.timestamp}</small></header><strong>{tx.property}</strong><p><del>{tx.before}</del><ChevronRight size={11} /><ins>{tx.after}</ins></p><footer><Check size={11} />{tx.status}</footer></article>) : <div className="empty-changes">No changes in this workspace yet.</div>}</div>}<div className="inspector-footer"><button><Settings2 size={14} />{workspace.name} settings</button></div></> : <button className="open-inspector" onClick={() => setRightOpen(true)}><PanelRightOpen size={16} /></button>}</aside>
    {!rightOpen && <button className="floating-inspector" onClick={() => setRightOpen(true)}><PanelRightOpen size={17} /></button>}{toast && <div className="toast"><Check size={14} />{toast}</div>}

    {workspaceModal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setWorkspaceModal(false)}><section className="workspace-modal"><header><div><span>AGENT HARNESS</span><h2>Start a workspace</h2><p>Every workspace owns its routes, states, brand tokens, and edit history.</p></div><button onClick={() => setWorkspaceModal(false)}>×</button></header><div className="modal-tabs"><button className={workspaceTab === "create" ? "active" : ""} onClick={() => setWorkspaceTab("create")}><Plus size={14} />Blank workspace</button><button className={workspaceTab === "github" ? "active" : ""} onClick={() => setWorkspaceTab("github")}><GitBranch size={14} />Import GitHub repo</button></div><div className="modal-body"><label><span>Workspace name</span><input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder={workspaceTab === "create" ? "New website exploration" : "Defaults to repository name"} /></label>{workspaceTab === "create" ? <div className="blank-workspace-preview"><Grid2X2 size={22} /><div><strong>One independent home route</strong><span>Start with the default brand palette, then edit or add colors.</span></div></div> : <><label><span>GitHub repository URL</span><input value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository" /></label><div className="import-details"><GitBranch size={18} /><div><strong>Direct public-repository import</strong><span>We discover Next routes and read brand, token, theme, global CSS, and Tailwind files. Private repositories require the GitHub App.</span></div></div><label className="trust-check"><input type="checkbox" checked={trusted} onChange={(event) => setTrusted(event.target.checked)} /><span>I trust this repository. Dependency scripts may run only after import and a separate confirmation.</span></label>{importError && <p className="import-error">{importError}</p>}</>}</div><footer><button className="cancel" onClick={() => setWorkspaceModal(false)}>Cancel</button>{workspaceTab === "create" ? <button className="primary" onClick={createWorkspace}>Create workspace</button> : <button className="primary" disabled={!repositoryUrl || importing} onClick={() => void importWorkspace()}>{importing ? "Reading routes and brand guide…" : "Import workspace"}</button>}</footer></section></div>}
  </main>;
}
