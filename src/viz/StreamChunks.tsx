"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

type Chunk = { id: string; label: string; delay: number; bytes: number };

const STREAM: Chunk[] = [
  { id: "doc", label: "<!doctype html> ... shell", delay: 100, bytes: 1800 },
  { id: "nav", label: "<header>Nav</header>", delay: 120, bytes: 350 },
  { id: "fb1", label: "fallback: feed", delay: 130, bytes: 80 },
  { id: "fb2", label: "fallback: chart", delay: 140, bytes: 80 },
  { id: "feed", label: "Suspense boundary: feed", delay: 700, bytes: 4400 },
  { id: "chart", label: "Suspense boundary: chart", delay: 1100, bytes: 6100 },
  { id: "comments", label: "Suspense boundary: comments", delay: 1600, bytes: 2200 },
];

export function StreamChunks() {
  const [received, setReceived] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const replay = () => {
    setReceived([]);
    setRunning(true);
    STREAM.forEach((c) => setTimeout(() => setReceived((r) => [...r, c.id]), c.delay));
    setTimeout(() => setRunning(false), STREAM[STREAM.length - 1].delay + 100);
  };

  useEffect(() => {
    replay();
  }, []);

  const totalBytes = STREAM.reduce((a, c) => a + c.bytes, 0);
  const receivedBytes = STREAM.filter((c) => received.includes(c.id)).reduce((a, c) => a + c.bytes, 0);

  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex items-center justify-between border-b border-bg-border px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-widest text-ink-dim">streamed html · TTFB → done</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-ink-dim">
            {receivedBytes} / {totalBytes} bytes
          </span>
          <button
            disabled={running}
            onClick={replay}
            className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[11px] disabled:opacity-50"
          >
            ▶ replay
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px bg-bg-border">
        <div className="bg-bg-panel p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">byte stream</p>
          <ul className="space-y-1 font-mono text-[11px]">
            {STREAM.map((c) => {
              const got = received.includes(c.id);
              return (
                <motion.li
                  key={c.id}
                  animate={{ opacity: got ? 1 : 0.35 }}
                  className={clsx("flex items-center justify-between rounded px-2 py-1", got ? "bg-accent/10" : "")}
                >
                  <span className={got ? "text-ink" : "text-ink-dim"}>{c.label}</span>
                  <span className="text-ink-dim">{c.delay}ms</span>
                </motion.li>
              );
            })}
          </ul>
        </div>
        <div className="bg-bg-panel p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">simulated page</p>
          <div className="space-y-2 rounded-md border border-bg-border bg-bg-elevated p-3">
            <Slot ok={received.includes("nav")} label="navigation" lines={1} />
            <Slot ok={received.includes("doc")} label="hero" lines={2} />
            <Slot
              ok={received.includes("feed")}
              fallback={received.includes("fb1")}
              label="stock feed"
              lines={3}
            />
            <Slot
              ok={received.includes("chart")}
              fallback={received.includes("fb2")}
              label="chart"
              lines={3}
            />
            <Slot ok={received.includes("comments")} label="comments" lines={2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Slot({ ok, fallback, label, lines }: { ok: boolean; fallback?: boolean; label: string; lines: number }) {
  return (
    <div className="rounded border border-bg-border bg-bg-panel p-2">
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-dim">
        <span>{label}</span>
        <span className={ok ? "text-accent-good" : fallback ? "text-accent-warn" : "text-ink-dim"}>
          {ok ? "rendered" : fallback ? "fallback" : "—"}
        </span>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            "mb-1 h-2 rounded",
            ok ? "bg-accent/30" : fallback ? "bg-accent-warn/30 animate-pulse" : "bg-bg-border"
          )}
          style={{ width: `${60 + (i * 17) % 35}%` }}
        />
      ))}
    </div>
  );
}
