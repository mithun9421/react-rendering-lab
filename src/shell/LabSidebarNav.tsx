"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Brain,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FOUNDATIONS, MODULES } from "@/modules/registry";

/**
 * The active-aware module list for the desktop sidebar. Lives in its own
 * client component so the surrounding layout can stay a server component.
 *
 * Active rules:
 *  - Exact-match for top-level entries (Hub, Journey, Interview, Daily)
 *  - Substring match for module slugs (handles future sub-routes)
 */
export function LabSidebarNav() {
  const pathname = usePathname() ?? "";
  const isExact = (href: string) => pathname === href;
  const isInModule = (slug: string) => pathname === `/lab/${slug}`;

  return (
    <>
      {/* Top buckets */}
      <div className="flex flex-col gap-2 px-2">
        <Button
          asChild
          variant={isExact("/lab") ? "default" : "outline"}
          className="w-full justify-start"
          aria-current={isExact("/lab") ? "page" : undefined}
        >
          <Link href="/lab">
            <LayoutDashboard />
            <span className="flex-1 text-left">Lab hub</span>
          </Link>
        </Button>
        <Button
          asChild
          variant={isExact("/lab/journey") ? "default" : "outline"}
          className="w-full justify-start"
          aria-current={isExact("/lab/journey") ? "page" : undefined}
        >
          <Link href="/lab/journey">
            <Compass />
            <span className="flex-1 text-left">Journey · one codebase</span>
          </Link>
        </Button>
        <Button
          asChild
          variant={isExact("/lab/interview") ? "default" : "outline"}
          className="w-full justify-start"
          aria-current={isExact("/lab/interview") ? "page" : undefined}
        >
          <Link href="/lab/interview">
            <Brain />
            <span className="flex-1 text-left">Interview · question bank</span>
          </Link>
        </Button>
        <Button
          asChild
          variant={isExact("/lab/daily") ? "default" : "outline"}
          className="w-full justify-start"
          aria-current={isExact("/lab/daily") ? "page" : undefined}
        >
          <Link href="/lab/daily">
            <CalendarDays />
            <span className="flex-1 text-left">Daily challenge</span>
          </Link>
        </Button>
      </div>

      <Separator className="my-3" />

      <SectionHeader label="Foundations" count={FOUNDATIONS.length} />
      <ul className="space-y-0.5">
        {FOUNDATIONS.map((m, i) => {
          const active = isInModule(m.slug);
          return (
            <li key={m.slug}>
              <Link
                href={`/lab/${m.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-ink-muted hover:bg-bg-elevated hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "w-7 font-mono text-[10px]",
                    active ? "text-accent" : "text-ink-dim group-hover:text-accent"
                  )}
                >
                  F{String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate">{m.title}</span>
                {active ? (
                  <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                ) : (
                  <ChevronRight
                    aria-hidden
                    className="size-3.5 text-ink-dim opacity-0 transition-opacity group-hover:opacity-100"
                  />
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
          const active = isInModule(m.slug);
          return (
            <li key={m.slug}>
              <Link
                href={`/lab/${m.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-ink-muted hover:bg-bg-elevated hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "w-7 font-mono text-[10px]",
                    active ? "text-accent" : "text-ink-dim group-hover:text-accent"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate">{m.title}</span>
                {active ? (
                  <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                ) : (
                  <ChevronRight
                    aria-hidden
                    className="size-3.5 text-ink-dim opacity-0 transition-opacity group-hover:opacity-100"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
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
