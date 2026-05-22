"use client";

import { useEffect, useRef, useState } from "react";
import { makeActivity, type Activity } from "./data";
import { useRenderCount } from "@/profiler/useRenderCount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROW_H = 26;

export function ActivityFeed({
  size = 50,
  virtualised = false,
}: {
  size?: number;
  /** Module 10's fix applied to this surface. */
  virtualised?: boolean;
}) {
  useRenderCount("ActivityFeed");
  const [items, setItems] = useState<Activity[]>(() => makeActivity(size));

  useEffect(() => {
    const i = setInterval(() => {
      setItems((prev) => [...makeActivity(1, Math.floor(Math.random() * 1e6)), ...prev].slice(0, size + 50));
    }, 2000);
    return () => clearInterval(i);
  }, [size]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-bg-border px-3 py-2">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-ink-dim">activity</CardTitle>
        <Badge variant="outline" className="font-mono text-[10px] text-ink-dim">
          {items.length} items{virtualised ? " · windowed" : ""}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {virtualised ? <Windowed items={items} /> : <Naive items={items} />}
      </CardContent>
    </Card>
  );
}

function Naive({ items }: { items: Activity[] }) {
  return (
    <ul className="max-h-72 divide-y divide-bg-border overflow-y-auto">
      {items.map((a) => (
        <Row key={a.id} a={a} />
      ))}
    </ul>
  );
}

function Windowed({ items }: { items: Activity[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [vh, setVh] = useState(288);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setVh(el.clientHeight);
    const on = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - 4);
  const end = Math.min(items.length, start + Math.ceil(vh / ROW_H) + 8);
  const visible = items.slice(start, end);

  return (
    <div ref={ref} className="max-h-72 overflow-y-auto">
      <div style={{ height: items.length * ROW_H, position: "relative" }}>
        <div style={{ transform: `translateY(${start * ROW_H}px)`, position: "absolute", left: 0, right: 0 }}>
          {visible.map((a) => (
            <Row key={a.id} a={a} fixedHeight />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ a, fixedHeight }: { a: Activity; fixedHeight?: boolean }) {
  return (
    <div
      style={fixedHeight ? { height: ROW_H } : undefined}
      className={cn("flex items-center justify-between border-b border-bg-border px-3 text-xs", !fixedHeight && "py-1.5")}
    >
      <span>
        <span className="font-mono text-accent">{a.user}</span>{" "}
        <span className="text-ink-muted">{a.action}</span>
      </span>
      <span className="font-mono text-ink-dim">{rel(a.t)}</span>
    </div>
  );
}

function rel(t: number) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
