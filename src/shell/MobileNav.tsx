"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Compass,
  Brain,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MODULES, FOUNDATIONS } from "@/modules/registry";

/**
 * Mobile-first navigation. Two surfaces:
 *   1. Always-visible top bar with brand + hamburger + current module pill.
 *   2. Sheet drawer (shadcn) with the module list.
 *
 * On lg+ we still render the same top bar but the drawer becomes a static sidebar via
 * the parent layout (kept as a separate component so the layout decides).
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const current =
    MODULES.find((m) => pathname === `/lab/${m.slug}`) ??
    FOUNDATIONS.find((m) => pathname === `/lab/${m.slug}`);

  const closeSheet = () => setOpen(false);

  return (
    <header className="glass sticky top-0 z-40 flex items-center gap-2 border-b border-bg-border px-3 py-2 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open module menu"
            className="border border-bg-border bg-bg-elevated"
          >
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-[86%] max-w-sm flex-col bg-bg-subtle p-0 sm:max-w-sm"
        >
          <SheetTitle className="sr-only">Modules</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate React Rendering Lab modules.
          </SheetDescription>

          <div className="flex items-center justify-between border-b border-bg-border px-4 py-3">
            <Link href="/" onClick={closeSheet} className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-accent animate-pulse_dot" />
              <span className="font-mono text-xs tracking-wider">
                react-rendering-lab
              </span>
            </Link>
          </div>

          <p className="px-4 py-3 text-[11px] leading-snug text-ink-dim">
            One broken dashboard. Each module fixes one thing — and exposes the next bottleneck.
          </p>

          <nav className="flex-1 overflow-y-auto px-2 pb-6">
            <div className="flex flex-col gap-2 px-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-accent/40 bg-accent/5 text-accent hover:bg-accent/10 hover:text-accent"
              >
                <Link href="/lab/journey" onClick={closeSheet}>
                  <Compass />
                  <span className="flex-1 text-left">Journey · one codebase</span>
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-accent-warn/40 bg-accent-warn/5 text-accent-warn hover:bg-accent-warn/10 hover:text-accent-warn"
              >
                <Link href="/lab/interview" onClick={closeSheet}>
                  <Brain />
                  <span className="flex-1 text-left">Interview · question bank</span>
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>

            <Separator className="my-3" />

            <SectionHeader label="Foundations" count={FOUNDATIONS.length} />
            <ul className="mb-3 space-y-0.5">
              {FOUNDATIONS.map((m, i) => {
                const active = pathname === `/lab/${m.slug}`;
                return (
                  <li key={m.slug}>
                    <Link
                      href={`/lab/${m.slug}`}
                      onClick={closeSheet}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-2.5 py-3 text-sm transition-colors",
                        active
                          ? "bg-accent/15 text-accent"
                          : "text-ink-muted active:bg-bg-elevated hover:bg-bg-elevated hover:text-ink"
                      )}
                    >
                      <Badge
                        variant={active ? "default" : "outline"}
                        className={cn(
                          "w-10 justify-center font-mono text-[10px]",
                          active ? "bg-accent/20 text-accent" : "text-ink-dim"
                        )}
                      >
                        F{String(i + 1).padStart(2, "0")}
                      </Badge>
                      <span className="flex-1 truncate">{m.title}</span>
                      {active ? (
                        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                      ) : (
                        <ChevronRight aria-hidden className="size-4 text-ink-dim" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Separator className="my-3" />

            <SectionHeader label="Core" count={MODULES.length} suffix="modules" />
            <ul className="space-y-0.5">
              {MODULES.map((m, i) => {
                const active = pathname === `/lab/${m.slug}`;
                return (
                  <li key={m.slug}>
                    <Link
                      href={`/lab/${m.slug}`}
                      onClick={closeSheet}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-2.5 py-3 text-sm transition-colors",
                        active
                          ? "bg-accent/15 text-accent"
                          : "text-ink-muted active:bg-bg-elevated hover:bg-bg-elevated hover:text-ink"
                      )}
                    >
                      <Badge
                        variant={active ? "default" : "outline"}
                        className={cn(
                          "w-10 justify-center font-mono text-[10px]",
                          active ? "bg-accent/20 text-accent" : "text-ink-dim"
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </Badge>
                      <span className="flex-1 truncate">{m.title}</span>
                      {active ? (
                        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                      ) : (
                        <ChevronRight aria-hidden className="size-4 text-ink-dim" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-bg-border px-4 py-3 font-mono text-[10px] text-ink-dim">
            Tap the FPS pill at the bottom to expand the profiler.
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-accent animate-pulse_dot" />
        <span className="font-mono text-[11px] tracking-wider">react-rendering-lab</span>
      </Link>

      {current && (
        <Badge
          variant="outline"
          className="ml-auto truncate rounded-full bg-bg-panel font-mono text-[10px] uppercase tracking-wider text-ink-muted"
        >
          {current.title}
        </Badge>
      )}
    </header>
  );
}

interface SectionHeaderProps {
  label: string;
  count: number;
  suffix?: string;
}

function SectionHeader({ label, count, suffix }: SectionHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 px-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
        {label}
        {suffix ? ` · ${suffix}` : ""}
      </span>
      <Badge variant="secondary" className="font-mono text-[10px]">
        {count}
      </Badge>
    </div>
  );
}
