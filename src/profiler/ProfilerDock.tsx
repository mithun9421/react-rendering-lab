"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  Layers,
  Cpu,
  MemoryStick,
  Pause,
  Play,
  RotateCcw,
  ChevronUp,
} from "lucide-react";
import { useProfiler } from "./store";
import { useFpsLoop } from "./useFpsLoop";
import { CommitTimeline } from "./CommitTimeline";
import { TraceTools } from "./TraceTools";
import { ArchitectModeToggle } from "@/engine/ArchitectGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// NOTE: We replaced the mobile framer-motion AnimatePresence height tween with
// a shadcn <Sheet side="bottom"> per refactor brief. A bottom Sheet ships the
// same expand-from-bottom affordance, ships with reduced-motion handling, and
// stays well below the 180ms motion budget without custom animation code.

// Routes where the profiler is noise, not signal. Daily quiz, interview prompts,
// and the journey overview don't teach profiling — hiding the dock declutters
// those surfaces and stops the FPS loop from running on read-only pages.
const PROFILER_HIDDEN_ROUTES = ["/lab/daily", "/lab/interview", "/lab/journey"];

export function ProfilerDock() {
  const pathname = usePathname();
  const hidden = PROFILER_HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`),
  );
  if (hidden) return null;
  return <ProfilerDockInner />;
}

function ProfilerDockInner() {
  useFpsLoop();
  const fps = useProfiler((s) => s.fps);
  const dropped = useProfiler((s) => s.droppedFrames);
  const renders = useProfiler((s) => s.renders);
  const mem = useProfiler((s) => s.mem);
  const recording = useProfiler((s) => s.recording);
  const toggle = useProfiler((s) => s.toggleRecord);
  const reset = useProfiler((s) => s.reset);

  // Mobile: collapsed by default. On lg+ the desktop layout always shows the full dock.
  const [mobileOpen, setMobileOpen] = useState(false);

  const commits = useProfiler((s) => s.commits);
  const longTasks = useProfiler((s) => s.longTasks);
  const totalRenders = Object.values(renders).reduce((a, b) => a + b, 0);
  // Long tasks from the W3C Long Tasks API — any main-thread task > 50ms.
  // We expose just the count; details live in module 22 (Observability).
  const longTaskCount = longTasks.length;
  const topOffenders = Object.entries(renders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const fpsColor =
    fps >= 55 ? "text-accent-good" : fps >= 40 ? "text-accent-warn" : "text-accent-bad";

  // React Profiler API stats — only present when ProfilerWrap is mounted somewhere
  const recentProfiled = commits.slice(-30).filter((c) => c.actualDuration != null);
  const avgActual =
    recentProfiled.length === 0
      ? 0
      : recentProfiled.reduce((a, c) => a + (c.actualDuration ?? 0), 0) / recentProfiled.length;
  const avgBase =
    recentProfiled.length === 0
      ? 0
      : recentProfiled.reduce((a, c) => a + (c.baseDuration ?? 0), 0) / recentProfiled.length;
  const savedPct =
    avgBase === 0 ? 0 : Math.max(0, Math.round((1 - avgActual / avgBase) * 100));

  const actualColor =
    avgActual < 4 ? "text-accent-good" : avgActual < 16 ? "text-accent-warn" : "text-accent-bad";
  const savedColor =
    savedPct > 50 ? "text-accent-good" : savedPct > 10 ? "text-accent-warn" : "text-ink-muted";

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="glass sticky bottom-0 left-0 right-0 z-30 mt-auto border-t border-bg-border">
        {/* ─── Mobile compact pill (always interactive) ─── */}
        <div className="flex items-center gap-2 px-3 py-2 text-xs lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 transition-transform duration-150 ease-out active:scale-95"
            aria-expanded={mobileOpen}
            aria-controls="profiler-mobile-detail"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                recording ? "bg-accent-bad animate-pulse_dot" : "bg-ink-dim"
              )}
            />
            <span className={cn("font-mono tabular-nums", fpsColor)}>{fps}</span>
            <span className="font-mono text-[10px] text-ink-dim">fps</span>
            <span className="font-mono text-[10px] text-ink-dim">·</span>
            <span className="font-mono tabular-nums text-ink-muted">{totalRenders}</span>
            <span className="font-mono text-[10px] text-ink-dim">renders</span>
            <ChevronUp aria-hidden className="ml-1 size-3 text-ink-dim" />
          </button>
          <span className="ml-auto font-mono text-[10px] text-ink-dim">profiler</span>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="bottom"
            id="profiler-mobile-detail"
            className="lg:hidden max-h-[85vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="font-mono text-xs uppercase tracking-wider text-ink-dim">
                Profiler
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <DockStat
                  label="FPS"
                  value={fps}
                  icon={<Activity className="size-3" />}
                  className={fpsColor}
                />
                <DockStat
                  label="Dropped"
                  value={dropped}
                  icon={<Activity className="size-3" />}
                  className={dropped > 0 ? "text-accent-warn" : "text-ink-muted"}
                />
                <DockStat
                  label="Renders"
                  value={totalRenders}
                  icon={<Layers className="size-3" />}
                />
                <DockStat
                  label="Long tasks"
                  value={longTaskCount}
                  icon={<Cpu className="size-3" />}
                  className={longTaskCount > 0 ? "text-accent-warn" : "text-ink-muted"}
                />
                <DockStat
                  label="Mem"
                  value={mem ? `${mem}MB` : "—"}
                  icon={<MemoryStick className="size-3" />}
                />
              </div>
              {topOffenders.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                  <span className="text-ink-dim">top:</span>
                  {topOffenders.map(([k, v]) => (
                    <Badge
                      key={k}
                      variant="secondary"
                      className="font-mono text-[10px] tabular-nums"
                    >
                      {k}{" "}
                      <span className="ml-1 text-accent-warn tabular-nums">{v}</span>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggle}
                      className={cn(
                        "font-mono",
                        recording ? "text-accent-bad" : "text-ink-muted"
                      )}
                    >
                      {recording ? <Pause /> : <Play />}
                      {recording ? "REC" : "PAUSED"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {recording ? "Recording — tap to pause" : "Paused — tap to record"}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={reset}
                      className="font-mono text-ink-muted"
                    >
                      <RotateCcw />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset trace</TooltipContent>
                </Tooltip>
                <ArchitectModeToggle />
                <TraceTools />
              </div>
              <CommitTimeline />
            </div>
          </SheetContent>
        </Sheet>

        {/* ─── Desktop full dock (lg+) ─── */}
        <div className="hidden items-center gap-4 px-4 py-2 text-xs lg:flex">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggle}
                  className={cn(
                    "font-mono",
                    recording ? "text-accent-bad" : "text-ink-muted"
                  )}
                >
                  {recording ? <Pause /> : <Play />}
                  {recording ? "REC" : "OFF"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {recording ? "Recording — click to pause" : "Paused — click to record"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="font-mono text-ink-muted"
                >
                  <RotateCcw />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset trace</TooltipContent>
            </Tooltip>
            <TraceTools />
          </div>

          <Separator orientation="vertical" className="h-5 bg-bg-border" />

          <DockStat
            label="FPS"
            value={fps}
            icon={<Activity className="size-3" />}
            className={fpsColor}
          />
          <DockStat
            label="Dropped"
            value={dropped}
            icon={<Activity className="size-3" />}
            className={dropped > 0 ? "text-accent-warn" : "text-ink-muted"}
          />
          <DockStat
            label="Renders"
            value={totalRenders}
            icon={<Layers className="size-3" />}
          />
          <DockStat
            label="Long tasks"
            value={longTaskCount}
            icon={<Cpu className="size-3" />}
            className={longTaskCount > 0 ? "text-accent-warn" : "text-ink-muted"}
          />
          <DockStat
            label="Mem"
            value={mem ? `${mem}MB` : "—"}
            icon={<MemoryStick className="size-3" />}
          />
          {recentProfiled.length > 0 && (
            <>
              <DockStat
                label="actual"
                value={`${avgActual.toFixed(1)}ms`}
                icon={<Cpu className="size-3" />}
                className={actualColor}
              />
              <DockStat
                label="base"
                value={`${avgBase.toFixed(1)}ms`}
                icon={<Cpu className="size-3" />}
              />
              <DockStat
                label="memo saved"
                value={`${savedPct}%`}
                icon={<Cpu className="size-3" />}
                className={savedColor}
              />
            </>
          )}
          <ArchitectModeToggle />

          <div className="ml-auto flex items-center gap-3">
            {topOffenders.length > 0 && (
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-ink-dim">top:</span>
                {topOffenders.map(([k, v]) => (
                  <Badge
                    key={k}
                    variant="secondary"
                    className="font-mono text-[11px] tabular-nums"
                  >
                    {k}{" "}
                    <span className="ml-1 text-accent-warn tabular-nums">{v}</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hidden border-t border-bg-border px-4 py-2 lg:block">
          <CommitTimeline />
        </div>
      </aside>
    </TooltipProvider>
  );
}

interface DockStatProps {
  label: string;
  value: number | string;
  className?: string;
  icon?: React.ReactNode;
}

function DockStat({ label, value, className, icon }: DockStatProps) {
  return (
    <div className="flex items-center gap-1.5 font-mono">
      {icon ? <span className="text-ink-dim">{icon}</span> : null}
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className={cn("text-sm tabular-nums", className ?? "text-ink")}>{value}</span>
    </div>
  );
}
