"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

type Node = { id: string; label: string; kind: "rsc" | "client"; jsKb: number; child?: Node[] };

/**
 * Interactive tree where you can toggle a node's `'use client'` boundary.
 * Sub-tree colour propagates: client nodes turn purple and "infect" descendants only on render path.
 * Bundle size below recalculates live.
 */
export function RscBoundary() {
  const [tree, setTree] = useState<Node>(initialTree);

  const totalKb = sumKb(tree);
  const clientKb = sumClientKb(tree);

  const toggle = (id: string) => {
    setTree((t) => mutate(t, id));
  };

  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">component tree · click to flip the boundary</span>
        <span className="font-mono text-ink-dim">
          shipped JS:{" "}
          <span className={clientKb < totalKb / 2 ? "text-accent-good" : "text-accent-warn"}>
            {clientKb.toFixed(1)}
          </span>
          <span className="text-ink-dim"> / {totalKb.toFixed(1)} KB</span>
        </span>
      </header>
      <div className="p-3">
        <TreeNode node={tree} depth={0} onToggle={toggle} parentClient={false} />
      </div>
      <footer className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        green = server component (zero JS) · purple = client component (ships to bundle) · grey = static (no JS regardless)
      </footer>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  onToggle,
  parentClient,
}: {
  node: Node;
  depth: number;
  onToggle: (id: string) => void;
  parentClient: boolean;
}) {
  // A child of a client component is implicitly client (unless passed as a prop, which we abstract away).
  const isClient = parentClient || node.kind === "client";
  return (
    <div>
      <motion.button
        layout
        whileTap={{ scale: 0.97 }}
        onClick={() => onToggle(node.id)}
        className={clsx(
          "mb-1 flex w-full items-center justify-between rounded px-2 py-1 text-left font-mono text-xs",
          isClient
            ? "bg-accent/15 text-accent"
            : node.jsKb === 0
            ? "bg-bg-elevated text-ink-muted"
            : "bg-accent-good/10 text-accent-good"
        )}
        style={{ marginLeft: depth * 16 }}
      >
        <span>
          <span aria-hidden className="mr-1">{isClient ? "●" : node.jsKb === 0 ? "○" : "◐"}</span>
          {node.label}
        </span>
        <span className="font-mono text-[10px] opacity-70">
          {isClient ? "'use client'" : node.kind === "rsc" && node.jsKb === 0 ? "static" : "server"} ·{" "}
          {isClient ? `${node.jsKb}KB ships` : `${node.jsKb}KB skipped`}
        </span>
      </motion.button>
      {(node.child ?? []).map((c) => (
        <TreeNode key={c.id} node={c} depth={depth + 1} onToggle={onToggle} parentClient={isClient} />
      ))}
    </div>
  );
}

function mutate(node: Node, id: string): Node {
  if (node.id === id) {
    return { ...node, kind: node.kind === "rsc" ? "client" : "rsc" };
  }
  if (!node.child) return node;
  return { ...node, child: node.child.map((c) => mutate(c, id)) };
}

function sumKb(n: Node): number {
  return n.jsKb + (n.child?.reduce((a, c) => a + sumKb(c), 0) ?? 0);
}
function sumClientKb(n: Node, parentClient = false): number {
  const isClient = parentClient || n.kind === "client";
  const me = isClient ? n.jsKb : 0;
  const kids = n.child?.reduce((a, c) => a + sumClientKb(c, isClient), 0) ?? 0;
  return me + kids;
}

const initialTree: Node = {
  id: "app",
  label: "<App>",
  kind: "rsc",
  jsKb: 0,
  child: [
    { id: "nav", label: "<Nav>", kind: "rsc", jsKb: 0 },
    {
      id: "page",
      label: "<DashboardPage>",
      kind: "rsc",
      jsKb: 0,
      child: [
        { id: "hero", label: "<Hero>", kind: "rsc", jsKb: 0 },
        { id: "feed", label: "<StockFeed>", kind: "client", jsKb: 14.2 },
        { id: "chart", label: "<Chart>", kind: "client", jsKb: 26.5 },
        { id: "activity", label: "<ActivityFeed>", kind: "client", jsKb: 8.1 },
        { id: "comments", label: "<Comments> (static)", kind: "rsc", jsKb: 0 },
      ],
    },
    { id: "footer", label: "<Footer>", kind: "rsc", jsKb: 0 },
  ],
};
