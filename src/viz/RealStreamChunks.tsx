"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Chunk = {
  id: string;
  label: string;
  delay: number;
  bytes: number;
  kind: "shell" | "boundary";
  t: number;
};

/**
 * Real-streaming-SSR demo for Module 7.
 *
 * Calls `/api/stream`, reads the body as a stream, and appends one chunk at a
 * time as the bytes arrive. This is the actual byte-level shape of a streamed
 * SSR response — Next.js's renderer emits HTML chunks the same way.
 *
 * Compare with `<StreamChunks/>` (the simulated version). Same UX, different
 * mechanism. Useful to convince yourself the timing isn't a CSS animation —
 * the chunks really are arriving at different wall-clock times from the server.
 */
export function RealStreamChunks() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const replay = async () => {
    abortRef.current?.abort();
    setChunks([]);
    setDone(false);
    setRunning(true);
    startedAt.current = performance.now();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/stream", { signal: ac.signal });
      if (!res.body) throw new Error("stream not supported in this browser");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        // ndjson — split on newline, parse each complete line, keep partial in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const c = JSON.parse(line) as Chunk;
            setChunks((prev) => [...prev, c]);
          } catch {
            // ignore malformed
          }
        }
      }
      setDone(true);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        // we just stop; the UI shows the partial state
      }
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    replay();
    return () => abortRef.current?.abort();
  }, []);

  const totalBytes = chunks.reduce((a, c) => a + c.bytes, 0);
  const elapsed = chunks.length === 0 ? 0 : performance.now() - startedAt.current;

  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-panel">
      <header className="flex flex-col gap-2 border-b border-bg-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono uppercase tracking-widest text-ink-dim">
          real `/api/stream` · {running ? "in flight" : done ? "done" : "idle"}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-ink-dim">
            {chunks.length} chunks · {totalBytes} B · {elapsed.toFixed(0)}ms
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

      <ul className="space-y-1 p-3 font-mono text-[11px]">
        {chunks.length === 0 && (
          <li className="text-ink-dim">waiting for first byte from the server…</li>
        )}
        {chunks.map((c, i) => {
          const arrivedAt = i === 0 ? 0 : c.t - chunks[0].t;
          return (
            <li key={c.id} className="grid grid-cols-[1fr_auto] gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    c.kind === "shell" ? "bg-accent-good" : "bg-accent"
                  )}
                />
                <span className="text-ink">{c.label}</span>
              </span>
              <span className="text-ink-dim">
                +{arrivedAt}ms · {c.bytes} B
              </span>
            </li>
          );
        })}
      </ul>

      <footer className="border-t border-bg-border px-3 py-2 font-mono text-[10px] text-ink-dim">
        green = shell · purple = suspense boundary · the timestamps are wall-clock, not animated
      </footer>
    </div>
  );
}
