"use client";

import {
  ArrowUp, Bot, Check, ChevronDown, ChevronRight, CircleStop, Code2, Copy,
  Eye, GitBranch, Grid2X2, Layers3, Link2, Maximize2, MessageSquare, Minus,
  MousePointer2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Plus, Route, Search, Settings2, Sparkles, Undo2, Redo2, ZoomIn, ZoomOut,
} from "lucide-react";
import { PointerEvent as ReactPointerEvent, useCallback, useMemo, useRef, useState } from "react";

type CanvasMode = "edit" | "prototype" | "graph";
type InspectorTab = "design" | "layers" | "code" | "changes";
type FrameSpec = { id: string; route: string; name: string; state: string; x: number; y: number; width: number; height: number; accent: string };
type EditTransaction = { id: string; timestamp: string; target: string; property: string; before: string; after: string; status: "validated" | "pending" };

const INITIAL_FRAMES: FrameSpec[] = [
  { id: "home", route: "/", name: "Home", state: "Default", x: 80, y: 80, width: 430, height: 300, accent: "#ff6b47" },
  { id: "pricing", route: "/pricing", name: "Pricing", state: "Default", x: 570, y: 80, width: 430, height: 300, accent: "#7a64ff" },
  { id: "welcome", route: "/welcome", name: "Welcome", state: "Success", x: 80, y: 455, width: 430, height: 300, accent: "#16a978" },
  { id: "settings", route: "/settings", name: "Settings", state: "Account", x: 570, y: 455, width: 430, height: 300, accent: "#3478f6" },
];
const GRAPH_EDGES = [["home", "pricing"], ["home", "welcome"], ["pricing", "settings"]] as const;

function HarnessMark({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "mark compact" : "mark"} aria-hidden="true"><span /><span /><span /></div>;
}

function FramePreview({ frame, mode, selected, onSelect, onNavigate }: {
  frame: FrameSpec; mode: CanvasMode; selected: string | null; onSelect: (node: string) => void; onNavigate: (target: string) => void;
}) {
  const choose = (event: React.MouseEvent, node: string) => { event.stopPropagation(); if (mode === "edit") onSelect(node); };
  const go = (event: React.MouseEvent, target: string) => { event.stopPropagation(); if (mode === "prototype") onNavigate(target); else onSelect(`${frame.id}:primary-action`); };
  return (
    <article className="route-frame" style={{ left: frame.x, top: frame.y, width: frame.width }} data-frame-id={frame.id}>
      <header className="frame-label"><div><strong>{frame.name}</strong><span>{frame.route}</span></div><span className="state-pill">{frame.state}</span></header>
      <div className="browser-frame" style={{ height: frame.height }}>
        <div className="browser-bar"><div className="traffic"><i /><i /><i /></div><div className="address">localhost:3000{frame.route}</div><Maximize2 size={12} /></div>
        <div className={`mini-site mini-${frame.id}`}>
          <nav><span className="mini-logo"><i style={{ background: frame.accent }} />northstar</span><div><span>Product</span><span>Company</span><span>Docs</span></div><button>Sign in</button></nav>
          {frame.id === "home" && <div className="hero-mini">
            <p className="eyebrow">DESIGN WITH THE REAL PRODUCT</p>
            <h2 className={selected === "home:headline" ? "node-selected" : ""} onClick={(event) => choose(event, "home:headline")}>From interface idea<br />to working React.</h2>
            <p>Select real DOM layers, refine the layout, and commit source-ready changes.</p>
            <div className="mini-actions"><button onClick={(event) => go(event, "pricing")}>Explore plans <ChevronRight size={12} /></button><button className="quiet">See the canvas</button></div>
          </div>}
          {frame.id === "pricing" && <div className="pricing-mini"><p className="eyebrow">SIMPLE PRICING</p><h2>Choose the workspace<br />that fits your team.</h2><div className="price-cards"><div><span>Starter</span><strong>$0</strong><small>For trying the canvas</small></div><div className="featured"><span>Studio</span><strong>$20</strong><small>For product teams</small></div></div></div>}
          {frame.id === "welcome" && <div className="welcome-mini"><div className="success-ring"><Check size={22} /></div><p className="eyebrow">WORKSPACE READY</p><h2>Your routes are on the canvas.</h2><p>Start with the homepage or follow an interaction to another frame.</p><button onClick={(event) => go(event, "settings")}>Open settings</button></div>}
          {frame.id === "settings" && <div className="settings-mini"><aside><i /><i /><i /><i /></aside><section><p className="eyebrow">PROJECT SETTINGS</p><h2>Brand foundations</h2><label>Workspace name<input value="Northstar" readOnly /></label><label>Accent color<div className="color-field"><i /><span>#3478F6</span></div></label><button>Save changes</button></section></div>}
        </div>
      </div>
      <footer className="frame-meta"><span>{frame.width} × {frame.height}</span><span><Eye size={11} /> live</span></footer>
    </article>
  );
}

export function AgentHarness() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(264);
  const [mode, setMode] = useState<CanvasMode>("edit");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("design");
  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 60, y: 18 });
  const [selected, setSelected] = useState<string | null>("home:headline");
  const [selectedFrame, setSelectedFrame] = useState("home");
  const [composer, setComposer] = useState("");
  const [agentStatus, setAgentStatus] = useState<"idle" | "thinking" | "done">("idle");
  const [transactions, setTransactions] = useState<EditTransaction[]>([
    { id: "tx-1", timestamp: "09:42", target: "Home / Headline", property: "font-size", before: "48px", after: "52px", status: "validated" },
    { id: "tx-2", timestamp: "09:44", target: "Home / Hero", property: "gap", before: "24px", after: "32px", status: "validated" },
  ]);
  const [toast, setToast] = useState<string | null>(null);
  const [agentReply, setAgentReply] = useState<string | null>(null);
  const [agentMeta, setAgentMeta] = useState({ time: "", duration: "" });
  const agentAbort = useRef<AbortController | null>(null);
  const [draggingCanvas, setDraggingCanvas] = useState(false);
  const dragOrigin = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const selectedSpec = useMemo(() => INITIAL_FRAMES.find((frame) => frame.id === selectedFrame) ?? INITIAL_FRAMES[0], [selectedFrame]);

  const centerFrame = useCallback((frameId: string) => {
    const frame = INITIAL_FRAMES.find((item) => item.id === frameId);
    if (!frame || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setSelectedFrame(frameId);
    setPan({ x: rect.width / 2 - (frame.x + frame.width / 2) * zoom, y: rect.height / 2 - (frame.y + frame.height / 2) * zoom });
  }, [zoom]);
  const startCanvasDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".route-frame")) return;
    dragOrigin.current = { clientX: event.clientX, clientY: event.clientY, panX: pan.x, panY: pan.y };
    setDraggingCanvas(true); event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveCanvas = (event: ReactPointerEvent<HTMLDivElement>) => { if (draggingCanvas) setPan({ x: dragOrigin.current.panX + event.clientX - dragOrigin.current.clientX, y: dragOrigin.current.panY + event.clientY - dragOrigin.current.clientY }); };
  const resizeSidebar = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = event.clientX; const width = leftWidth; event.currentTarget.setPointerCapture(event.pointerId);
    const onMove = (move: PointerEvent) => setLeftWidth(Math.max(210, Math.min(410, width + move.clientX - start)));
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  };
  const selectNode = (node: string) => { setSelected(node); setSelectedFrame(node.split(":")[0]); };
  const commitStyle = (property: string, before: string, after: string) => {
    setTransactions((items) => [{ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), target: "Home / Headline", property, before, after, status: "validated" }, ...items]);
    setToast("Source patch validated"); window.setTimeout(() => setToast(null), 1800);
  };
  const sendAgent = async () => {
    if (!composer.trim() || agentStatus === "thinking") return;
    const prompt = composer.trim();
    const startedAt = performance.now();
    const controller = new AbortController();
    agentAbort.current = controller;
    setComposer(""); setAgentReply(""); setAgentStatus("thinking");
    try {
      const response = await fetch("/api/agent", {
        method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: "gpt-5.4-mini", contextReceipt: { frames: [selectedSpec.id], files: ["app/page.tsx"], computedStyles: ["font-size:52px", "line-height:1.05"], memoryIds: [], decisionIds: ["semantic-layout-first", "source-is-truth"] } }),
      });
      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({ error: "Agent request failed." }));
        throw new Error(payload.error ?? "Agent request failed.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let output = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          const event = JSON.parse(line.slice(6));
          if (event.type === "response.output_text.delta") { output += event.delta; setAgentReply(output); }
        }
      }
      if (!output) setAgentReply("The agent completed without a text response. Review the job diagnostics before retrying.");
    } catch (error) {
      if ((error as Error).name === "AbortError") setAgentReply("Request stopped. Its partial response remains saved in this task.");
      else setAgentReply(`${(error as Error).message}\n\nCanvas editing and source transactions are still available.`);
    } finally {
      setAgentMeta({ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), duration: `${((performance.now() - startedAt) / 1000).toFixed(1)}s` });
      setAgentStatus("done");
      agentAbort.current = null;
    }
  };

  return <main className="harness-shell" style={{ gridTemplateColumns: `${leftOpen ? leftWidth : 54}px minmax(0, 1fr) ${rightOpen ? 292 : 0}px` }}>
    <aside className={`left-sidebar ${leftOpen ? "open" : "closed"}`}>
      <div className="brand-row"><HarnessMark compact={!leftOpen} />{leftOpen && <div><strong>Agent Harness</strong><span>Code-native design</span></div>}<button onClick={() => setLeftOpen(!leftOpen)} aria-label={leftOpen ? "Collapse sidebar" : "Expand sidebar"}>{leftOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</button></div>
      {leftOpen && <>
        <button className="repo-switcher"><GitBranch size={15} /><span>Huiyuhere / northstar-web</span><ChevronDown size={14} /></button>
        <div className="sidebar-search"><Search size={14} /><input aria-label="Search routes" placeholder="Search routes and states" /></div>
        <div className="side-section"><div className="section-title"><span>ROUTES</span><button aria-label="Add route"><Plus size={13} /></button></div>{INITIAL_FRAMES.map((frame) => <button key={frame.id} className={`route-item ${selectedFrame === frame.id ? "active" : ""}`} onClick={() => centerFrame(frame.id)}><Route size={14} /><span><strong>{frame.name}</strong><small>{frame.route}</small></span><i className="live-dot" /></button>)}</div>
        <div className="side-section"><div className="section-title"><span>SAVED STATES</span><button aria-label="Add state"><Plus size={13} /></button></div><button className="state-item"><span className="state-glyph">◇</span><span>Welcome success</span><small>1</small></button><button className="state-item"><span className="state-glyph">◇</span><span>Settings account</span><small>1</small></button></div>
        <div className="memory-card"><Sparkles size={15} /><div><strong>Project memory</strong><span>8 approved decisions</span></div><ChevronRight size={14} /></div>
        <div className="workspace-status"><span><i /> Runtime ready</span><small>4 routes · 4 live frames</small></div>
      </>}
      {leftOpen && <div className="sidebar-resizer" onPointerDown={resizeSidebar} />}
    </aside>

    <section className="workspace">
      <header className="topbar">
        <div className="mode-group"><button className={mode === "edit" ? "active" : ""} onClick={() => setMode("edit")}><MousePointer2 size={14} />Edit</button><button className={mode === "prototype" ? "active" : ""} onClick={() => setMode("prototype")}><Link2 size={14} />Prototype</button><button className={mode === "graph" ? "active" : ""} onClick={() => setMode("graph")}><GitBranch size={14} />Graph</button></div>
        <div className="session-title"><span>Homepage exploration</span><small>Draft · base 8f31ae</small></div>
        <div className="toolbar-actions"><button aria-label="Undo"><Undo2 size={15} /></button><button aria-label="Redo"><Redo2 size={15} /></button><button><MessageSquare size={14} /><span>Comment</span></button><button><Grid2X2 size={14} /><span>Multi-select</span></button><button className="publish-button"><GitBranch size={14} />Review changes <span>{transactions.length}</span></button></div>
      </header>
      <div ref={canvasRef} className={`canvas-viewport ${draggingCanvas ? "dragging" : ""}`} onPointerDown={startCanvasDrag} onPointerMove={moveCanvas} onPointerUp={() => setDraggingCanvas(false)} onPointerCancel={() => setDraggingCanvas(false)}>
        <div className="canvas-grid" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          {mode === "graph" && <svg className="graph-lines" width="1100" height="820" aria-label="Route relationship graph"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>{GRAPH_EDGES.map(([from, to]) => { const source = INITIAL_FRAMES.find((frame) => frame.id === from)!; const target = INITIAL_FRAMES.find((frame) => frame.id === to)!; return <path key={`${from}-${to}`} d={`M ${source.x + source.width} ${source.y + 190} C ${source.x + source.width + 70} ${source.y + 190}, ${target.x - 70} ${target.y + 190}, ${target.x} ${target.y + 190}`} markerEnd="url(#arrow)" />; })}</svg>}
          {INITIAL_FRAMES.map((frame) => <FramePreview key={frame.id} frame={frame} mode={mode} selected={selected} onSelect={selectNode} onNavigate={centerFrame} />)}
        </div>
        <div className="canvas-hint">{mode === "edit" && <><MousePointer2 size={13} />Select a DOM layer to edit source</>}{mode === "prototype" && <><Link2 size={13} />Click an action to move between route frames</>}{mode === "graph" && <><GitBranch size={13} />Showing inferred route relationships</>}</div>
        <div className="zoom-control"><button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.4, value - 0.1))}><ZoomOut size={14} /></button><button className="zoom-value" onClick={() => setZoom(0.82)}>{Math.round(zoom * 100)}%</button><button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.4, value + 0.1))}><ZoomIn size={14} /></button><i /><button aria-label="Fit all" onClick={() => { setZoom(0.82); setPan({ x: 60, y: 18 }); }}><Maximize2 size={14} /></button></div>
      </div>
      <section className="agent-dock">
        {agentReply && <div className="agent-response"><div className="agent-avatar"><Bot size={14} /></div><div><div className="response-meta"><strong>Design agent</strong><span>{agentMeta.time}{agentMeta.time && ` · ${agentMeta.duration}`}</span></div><p>{agentReply}</p></div><button aria-label="Copy response" onClick={() => navigator.clipboard.writeText(agentReply)}><Copy size={14} /></button></div>}
        <div className={`composer ${agentStatus === "thinking" ? "thinking" : ""}`}><div className="context-chip"><span className="frame-dot" style={{ background: selectedSpec.accent }} />{selectedSpec.name} · {selectedSpec.route}<button aria-label="Remove context">×</button></div><textarea value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendAgent(); } }} placeholder="Ask the agent to inspect, explain, or propose a source change…" aria-label="Message the design agent" /><div className="composer-footer"><div><button aria-label="Add context"><Plus size={16} /></button><span><Sparkles size={12} /> gpt-5.4 mini</span></div>{agentStatus === "thinking" ? <button className="send-button stop" onClick={() => agentAbort.current?.abort()} aria-label="Stop agent"><CircleStop size={17} /></button> : <button className="send-button" onClick={() => void sendAgent()} disabled={!composer.trim()} aria-label="Send"><ArrowUp size={17} /></button>}</div>{agentStatus === "thinking" && <div className="thinking-line"><i /><span>Inspecting frame, computed styles, and source anchors…</span></div>}</div>
      </section>
    </section>

    <aside className={`right-inspector ${rightOpen ? "open" : "closed"}`}>{rightOpen ? <>
      <div className="inspector-head"><div><strong>Inspector</strong><span>home:headline</span></div><button onClick={() => setRightOpen(false)} aria-label="Close inspector"><PanelRightClose size={16} /></button></div>
      <div className="inspector-tabs">{(["design", "layers", "code", "changes"] as InspectorTab[]).map((tab) => <button key={tab} className={inspectorTab === tab ? "active" : ""} onClick={() => setInspectorTab(tab)}>{tab}</button>)}</div>
      {inspectorTab === "design" && <div className="inspector-body"><div className="selection-path"><span>Hero</span><ChevronRight size={11} /><strong>h1</strong></div><section className="property-section"><header><span>Layout</span><button><Minus size={13} /></button></header><div className="alignment-grid">{Array.from({ length: 9 }).map((_, index) => <button key={index} className={index === 4 ? "active" : ""} aria-label={`Alignment ${index + 1}`}><i /></button>)}</div><div className="field-row"><label><span>W</span><input defaultValue="Hug" /></label><label><span>H</span><input defaultValue="Auto" /></label></div><div className="field-row"><label><span>X</span><input defaultValue="0" /></label><label><span>Y</span><input defaultValue="0" /></label></div></section><section className="property-section"><header><span>Typography</span><button><Minus size={13} /></button></header><label className="wide-field"><span>Font</span><select defaultValue="Inter"><option>Inter</option><option>Geist</option><option>IBM Plex Sans</option></select></label><div className="field-row"><label><span>Size</span><input defaultValue="52" onBlur={(event) => commitStyle("font-size", "48px", `${event.target.value}px`)} /></label><label><span>Line</span><input defaultValue="1.05" /></label></div><div className="format-row"><button className="active"><strong>B</strong></button><button><em>I</em></button><button>U</button><button className="align-lines"><i /><i /><i /></button></div></section><section className="property-section"><header><span>Fill</span><button><Plus size={13} /></button></header><div className="color-row"><i /><span>#111827</span><small>100%</small></div></section><section className="source-anchor"><Code2 size={14} /><div><span>Source anchor</span><strong>app/page.tsx:42</strong><small>HeroHeading · ordinal 1</small></div><ChevronRight size={14} /></section></div>}
      {inspectorTab === "layers" && <div className="inspector-body layer-tree"><div><ChevronDown size={13} /><Layers3 size={13} /><strong>HomePage</strong></div><div className="indent"><ChevronDown size={13} /><Layers3 size={13} /><span>Hero</span></div><button className="indent-2 active"><Code2 size={13} /><span>h1 · headline</span></button><button className="indent-2"><Code2 size={13} /><span>p · description</span></button><button className="indent-2"><Code2 size={13} /><span>div · actions</span></button></div>}
      {inspectorTab === "code" && <div className="inspector-body code-panel"><div className="file-chip">app/page.tsx</div><pre>{`<h1 className="hero-title">\n  From interface idea\n  <br />\n  to working React.\n</h1>`}</pre><button><Code2 size={13} />Open source</button></div>}
      {inspectorTab === "changes" && <div className="inspector-body changes-list">{transactions.map((tx) => <article key={tx.id}><header><span>{tx.target}</span><small>{tx.timestamp}</small></header><strong>{tx.property}</strong><p><del>{tx.before}</del><ChevronRight size={11} /><ins>{tx.after}</ins></p><footer><Check size={11} />{tx.status}</footer></article>)}</div>}
      <div className="inspector-footer"><button><Settings2 size={14} />Project settings</button></div>
    </> : <button className="open-inspector" onClick={() => setRightOpen(true)} aria-label="Open inspector"><PanelRightOpen size={16} /></button>}</aside>
    {!rightOpen && <button className="floating-inspector" onClick={() => setRightOpen(true)} aria-label="Open inspector"><PanelRightOpen size={17} /></button>}
    {toast && <div className="toast"><Check size={14} />{toast}</div>}
  </main>;
}
