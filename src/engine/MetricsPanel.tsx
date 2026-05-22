"use client";

import { Circle } from "lucide-react";
import { useProfiler } from "@/profiler/store";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Tone = "good" | "warn" | "bad";

/** Pulls specific render counters out of the global profiler store and shows them as cards. */
export function MetricsPanel({
  watch,
  showFps = true,
}: {
  watch: string[];
  showFps?: boolean;
}) {
  const renders = useProfiler((s) => s.renders);
  const fps = useProfiler((s) => s.fps);
  const commits = useProfiler((s) => s.commits);

  const avgCommit =
    commits.length === 0
      ? 0
      : commits.slice(-30).reduce((a, c) => a + c.dur, 0) / Math.min(30, commits.length);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {showFps && (
        <MetricCard
          label="FPS"
          value={fps}
          tone={fps >= 55 ? "good" : fps >= 40 ? "warn" : "bad"}
          hint="Frames/sec, EMA-smoothed"
        />
      )}
      <MetricCard
        label="avg commit"
        value={`${avgCommit.toFixed(1)}ms`}
        tone={avgCommit < 8 ? "good" : avgCommit < 16 ? "warn" : "bad"}
        hint="Mean over last 30 commits"
      />
      {watch.map((label) => (
        <MetricCard
          key={label}
          label={label}
          value={renders[label] ?? 0}
          tone={(renders[label] ?? 0) > 100 ? "bad" : (renders[label] ?? 0) > 30 ? "warn" : "good"}
          hint="Render invocations"
        />
      ))}
    </div>
  );
}

const toneDotColor: Record<Tone, string> = {
  good: "fill-accent-good text-accent-good",
  warn: "fill-accent-warn text-accent-warn",
  bad: "fill-accent-bad text-accent-bad",
};

const toneValueColor: Record<Tone, string> = {
  good: "text-ink",
  warn: "text-accent-warn",
  bad: "text-accent-bad",
};

interface MetricCardProps {
  label: string;
  value: number | string;
  tone: Tone;
  hint?: string;
}

function MetricCard({ label, value, tone, hint }: MetricCardProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</span>
        <Circle className={cn("size-2", toneDotColor[tone])} strokeWidth={0} />
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className={cn("font-mono text-2xl tabular-nums", toneValueColor[tone])}>{value}</div>
        {hint && <div className="mt-1 text-[10px] text-ink-dim">{hint}</div>}
      </CardContent>
    </Card>
  );
}
