"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Edge,
  Handle,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";
import { AlertTriangle, Box, Globe, Layers, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type FederationFlags = { shared: boolean; v19: boolean };

type TeamNodeData = {
  id: "host" | "A" | "B" | "C" | "shared";
  name: string;
  subtitle?: string;
  react?: string;
  bundleKb?: number;
  status: "host" | "remote" | "registry" | "conflict";
  badge?: string;
};

const TeamNode = ({ data }: NodeProps<TeamNodeData>) => {
  const isHost = data.status === "host";
  const isConflict = data.status === "conflict";
  const isRegistry = data.status === "registry";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="w-[200px]"
    >
      <Card
        className={cn(
          "relative overflow-hidden border-2 transition-colors",
          isHost && "border-accent/60 bg-accent/[0.06]",
          isConflict && "border-accent-bad/60 bg-accent-bad/[0.08] shadow-[0_0_0_4px_rgba(255,92,122,0.08)]",
          isRegistry && "border-accent-good/60 bg-accent-good/[0.06]",
          !isHost && !isConflict && !isRegistry && "border-bg-border bg-bg-panel"
        )}
      >
        {/* glow overlay for host / registry */}
        {(isHost || isRegistry) && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full blur-2xl",
              isHost ? "bg-accent/30" : "bg-accent-good/30"
            )}
          />
        )}
        <CardContent className="relative space-y-2 p-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
              {isHost && <Globe className="size-3" aria-hidden />}
              {isRegistry && <ShieldCheck className="size-3" aria-hidden />}
              {!isHost && !isRegistry && <Box className="size-3" aria-hidden />}
              {data.id}
            </span>
            {data.react && (
              <Badge
                variant={isConflict ? "destructive" : isHost ? "default" : "secondary"}
                className="font-mono text-[9px]"
              >
                react {data.react}
              </Badge>
            )}
          </div>
          <div className="font-mono text-sm leading-tight text-ink">{data.name}</div>
          {data.subtitle && (
            <div className="font-mono text-[10px] leading-snug text-ink-dim">{data.subtitle}</div>
          )}
          {typeof data.bundleKb === "number" && (
            <div className="flex items-end justify-between border-t border-bg-border/60 pt-2">
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    "font-mono text-xl tabular-nums leading-none",
                    isConflict ? "text-accent-bad" : isHost ? "text-accent" : "text-ink"
                  )}
                >
                  {data.bundleKb}
                </span>
                <span className="font-mono text-[10px] text-ink-dim">KB</span>
              </div>
              {data.badge && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px]",
                    isConflict
                      ? "bg-accent-bad/15 text-accent-bad"
                      : isHost || isRegistry
                        ? "bg-accent/15 text-accent"
                        : "bg-bg-elevated text-ink-muted"
                  )}
                >
                  {isConflict && <AlertTriangle className="size-2.5" aria-hidden />}
                  {data.badge}
                </span>
              )}
            </div>
          )}
        </CardContent>

        {/* handles */}
        {isHost && <Handle type="source" position={Position.Bottom} className="!size-2 !border-2 !border-accent !bg-bg-panel" />}
        {!isHost && !isRegistry && (
          <Handle type="target" position={Position.Top} className="!size-2 !border-2 !border-bg-border !bg-bg-panel" />
        )}
        {isRegistry && (
          <>
            <Handle id="reg-in" type="target" position={Position.Top} className="!size-2 !border-2 !border-accent-good !bg-bg-panel" />
            <Handle id="reg-out" type="source" position={Position.Bottom} className="!size-2 !border-2 !border-accent-good !bg-bg-panel" />
          </>
        )}
      </Card>
    </motion.div>
  );
};

const nodeTypes = { team: TeamNode } as const;

export function FederationGraph({ flags }: { flags: FederationFlags }) {
  const { nodes, edges, total, savedPct, conflict } = useMemo(() => buildGraph(flags), [flags]);
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);

  // Re-sync graph whenever flags change.
  useEffect(() => {
    setRfNodes(nodes);
    setRfEdges(edges);
  }, [nodes, edges, setRfNodes, setRfEdges]);

  return (
    <Card className="overflow-hidden">
      {/* header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border bg-bg-subtle/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-accent" aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
            module federation topology
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-ink-dim">
            total shipped JS:{" "}
            <span className={cn("tabular-nums", conflict ? "text-accent-bad" : "text-ink")}>{total} KB</span>
          </span>
          {flags.shared && !conflict && savedPct > 0 && (
            <Badge variant="success" className="gap-1 font-mono text-[10px]">
              <Sparkles className="size-2.5" aria-hidden />
              {savedPct}% saved
            </Badge>
          )}
          {conflict && (
            <Badge variant="destructive" className="gap-1 font-mono text-[10px]">
              <AlertTriangle className="size-2.5" aria-hidden />
              contract failed
            </Badge>
          )}
        </div>
      </div>

      {/* the canvas */}
      <div className="h-[420px] w-full bg-bg-panel">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.6}
          maxZoom={1.4}
          panOnDrag
          zoomOnScroll={false}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true }}
          className="!bg-bg-panel"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="#26262e" />
        </ReactFlow>
      </div>

      {/* footnote / contract message */}
      <div className="border-t border-bg-border bg-bg-subtle/60 px-3 py-2 font-mono text-[10px] text-ink-dim">
        {conflict ? (
          <span className="text-accent-bad">
            ⚠ host pins react@19, team-C requires react@18 — <code>singleton: true</code> with{" "}
            <code>strictVersion</code> rejects the load. Unify versions or widen the range.
          </span>
        ) : flags.shared ? (
          <span>
            edges → <span className="text-accent-good">solid green</span> = shared singleton;
            remotes resolve <code>react</code>/<code>react-dom</code> from the host registry.
          </span>
        ) : (
          <span>
            edges → <span className="text-ink-dim">dashed grey</span> = independent bundles; each
            remote ships its own React. Toggle &ldquo;share React&rdquo; to see the bundle math.
          </span>
        )}
      </div>
    </Card>
  );
}

/* ───────────── graph construction ───────────── */

const HOST_BUNDLE = 142;
const UNSHARED = { A: 84, B: 72, C: 78 } as const;
const SHARED = { A: 38, B: 26, C: 31 } as const;
const SHARED_BASELINE_TOTAL = 376;

function buildGraph(flags: FederationFlags): {
  nodes: Node<TeamNodeData>[];
  edges: Edge[];
  total: number;
  savedPct: number;
  conflict: boolean;
} {
  const conflict = flags.shared && !flags.v19;

  const hostKb = HOST_BUNDLE;
  const aKb = flags.shared ? SHARED.A : UNSHARED.A;
  const bKb = flags.shared ? SHARED.B : UNSHARED.B;
  const cKb = flags.shared && flags.v19 ? SHARED.C : flags.shared && !flags.v19 ? 90 : UNSHARED.C;

  const total = hostKb + aKb + bKb + cKb;
  const savedPct = flags.shared ? Math.round((1 - total / SHARED_BASELINE_TOTAL) * 100) : 0;

  const baseNodes: Node<TeamNodeData>[] = [
    {
      id: "host",
      type: "team",
      position: { x: 260, y: 12 },
      data: {
        id: "host",
        name: "host shell",
        subtitle: "owns layout, auth, routing",
        react: "19.0.0",
        bundleKb: hostKb,
        status: "host",
        badge: "shell",
      },
    },
    {
      id: "A",
      type: "team",
      position: { x: 24, y: 280 },
      data: {
        id: "A",
        name: "team-A · profile",
        subtitle: flags.shared ? "uses host React" : "ships its own React",
        react: "19.0.0",
        bundleKb: aKb,
        status: "remote",
        badge: flags.shared ? "shared" : "own copy",
      },
    },
    {
      id: "B",
      type: "team",
      position: { x: 260, y: 280 },
      data: {
        id: "B",
        name: "team-B · search",
        subtitle: flags.shared ? "uses host React" : "ships its own React",
        react: "19.0.0",
        bundleKb: bKb,
        status: "remote",
        badge: flags.shared ? "shared" : "own copy",
      },
    },
    {
      id: "C",
      type: "team",
      position: { x: 496, y: 280 },
      data: {
        id: "C",
        name: "team-C · checkout",
        subtitle: conflict
          ? "requires react 18 — mismatch with host"
          : flags.shared
            ? "uses host React"
            : "ships its own React",
        react: flags.v19 ? "19.0.0" : "18.3.1",
        bundleKb: cKb,
        status: conflict ? "conflict" : "remote",
        badge: conflict ? "version drift" : flags.shared ? "shared" : "own copy",
      },
    },
  ];

  // Add shared registry node centrally when sharing is on (and no conflict)
  if (flags.shared && !conflict) {
    baseNodes.push({
      id: "shared",
      type: "team",
      position: { x: 260, y: 150 },
      data: {
        id: "shared",
        name: "shared singleton",
        subtitle: "react · react-dom",
        status: "registry",
        badge: "singleton",
      },
    });
  }

  const edgeColor = {
    shared: "#3ddc97",
    unshared: "#3a3a44",
    bad: "#ff5c7a",
  };

  const baseEdgeStyle = (color: string, dashed: boolean) => ({
    stroke: color,
    strokeWidth: 1.6,
    strokeDasharray: dashed ? "4 4" : undefined,
  });

  const edges: Edge[] = [];

  if (flags.shared && !conflict) {
    edges.push({
      id: "host-shared",
      source: "host",
      target: "shared",
      targetHandle: "reg-in",
      type: "smoothstep",
      animated: true,
      style: baseEdgeStyle(edgeColor.shared, false),
      label: "registers",
      labelBgPadding: [4, 2],
      labelStyle: { fill: "#3ddc97", fontFamily: "ui-monospace", fontSize: 9 },
      labelBgStyle: { fill: "#15151a", stroke: "#3ddc97", strokeWidth: 0.5 },
    });
    for (const id of ["A", "B", "C"] as const) {
      edges.push({
        id: `shared-${id}`,
        source: "shared",
        sourceHandle: "reg-out",
        target: id,
        type: "smoothstep",
        animated: true,
        style: baseEdgeStyle(edgeColor.shared, false),
      });
    }
  } else {
    for (const id of ["A", "B", "C"] as const) {
      const isBad = id === "C" && conflict;
      edges.push({
        id: `host-${id}`,
        source: "host",
        target: id,
        type: "smoothstep",
        animated: !isBad,
        style: baseEdgeStyle(isBad ? edgeColor.bad : edgeColor.unshared, !flags.shared),
        label: isBad ? "⨯ singleton mismatch" : undefined,
        labelStyle: { fill: "#ff5c7a", fontFamily: "ui-monospace", fontSize: 9 },
        labelBgStyle: { fill: "#15151a", stroke: "#ff5c7a", strokeWidth: 0.5 },
      });
    }
  }

  return { nodes: baseNodes, edges, total, savedPct, conflict };
}
