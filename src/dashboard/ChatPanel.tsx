"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useRenderCount } from "@/profiler/useRenderCount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = { id: number; user: string; text: string; t: number; mine?: boolean };

const SEED: Message[] = [
  { id: 1, user: "alice", text: "shipped the patch", t: Date.now() - 480000 },
  { id: 2, user: "bob", text: "FPS looking healthy", t: Date.now() - 420000 },
  { id: 3, user: "carol", text: "incident roomed", t: Date.now() - 360000 },
  { id: 4, user: "me", text: "deploying the rollback", mine: true, t: Date.now() - 240000 },
];

/**
 * Real chat panel — websocket-like cadence. Bot replies every few seconds.
 * `optimistic` flag toggles "send immediately, reconcile later" UX
 * (Module 13 fix).
 */
export function ChatPanel({
  optimistic = false,
  tickMs = 5200,
}: {
  optimistic?: boolean;
  tickMs?: number;
}) {
  useRenderCount("ChatPanel");
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [draft, setDraft] = useState("");
  const seq = useRef(SEED.length);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setMessages((prev) => [
        ...prev,
        { id: ++seq.current, user: ["alice", "bob", "carol"][seq.current % 3], text: BOTS[seq.current % BOTS.length], t: Date.now() },
      ]);
    }, tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (optimistic) {
      // Mounting the message immediately, reconciling 700ms later by replacing the id.
      const tempId = -Date.now();
      setMessages((p) => [...p, { id: tempId, user: "me", text, t: Date.now(), mine: true }]);
      setTimeout(() => {
        setMessages((p) =>
          p.map((m) => (m.id === tempId ? { ...m, id: ++seq.current } : m))
        );
      }, 700);
    } else {
      // Pessimistic: simulate the server round-trip before appending
      setTimeout(() => {
        setMessages((p) => [...p, { id: ++seq.current, user: "me", text, t: Date.now(), mine: true }]);
      }, 700);
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-bg-border px-3 py-2">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-ink-dim">chat</CardTitle>
        <Badge variant="outline" className="font-mono text-[10px] text-ink-dim">
          {optimistic ? "optimistic send" : "round-trip send"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        <div className="max-h-56 flex-1 overflow-y-auto p-3">
          <ul className="space-y-1.5">
            {messages.map((m) => (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14 }}
                className={cn(
                  "flex max-w-[80%] gap-2 rounded-md px-2 py-1 text-xs",
                  m.mine ? "ml-auto bg-accent/15 text-ink" : "bg-bg-elevated text-ink-muted",
                  m.id < 0 && "italic opacity-70"
                )}
              >
                <span className={cn("font-mono text-[10px] uppercase tracking-widest", m.mine ? "text-accent" : "text-ink-dim")}>
                  {m.user}
                </span>
                <span>{m.text}</span>
              </motion.li>
            ))}
          </ul>
          <div ref={bottomRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-bg-border bg-bg-subtle p-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="message…"
            className="h-8 flex-1 text-xs"
          />
          <Button type="submit" size="sm" className="h-8 gap-1.5">
            <Send className="size-3.5" aria-hidden />
            send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const BOTS = [
  "pipeline is green",
  "rollback complete",
  "INP up 12% last hour",
  "stale-cache fix shipping",
  "circuit breaker tripped",
  "back to normal",
  "graceful drain done",
];
