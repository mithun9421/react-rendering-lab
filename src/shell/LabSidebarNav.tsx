"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
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
      <TopLink
        href="/lab"
        label="Lab hub"
        tone="accent"
        active={isExact("/lab")}
        right="◐"
      />
      <TopLink
        href="/lab/journey"
        label="Journey · one codebase"
        tone="accent"
        active={isExact("/lab/journey")}
        right="▸"
      />
      <TopLink
        href="/lab/interview"
        label="Interview · question bank"
        tone="warn"
        active={isExact("/lab/interview")}
        right="▸"
      />
      <TopLink
        href="/lab/daily"
        label="Daily challenge"
        tone="warn-soft"
        active={isExact("/lab/daily")}
        right="◐"
      />

      <p className="mt-3 px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
        Foundations
      </p>
      <ul className="mb-3 space-y-0.5">
        {FOUNDATIONS.map((m, i) => {
          const active = isInModule(m.slug);
          return (
            <li key={m.slug}>
              <Link
                href={`/lab/${m.slug}`}
                className={clsx(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-ink-muted hover:bg-bg-elevated hover:text-ink"
                )}
              >
                <span
                  className={clsx(
                    "w-7 font-mono text-[10px]",
                    active ? "text-accent" : "text-ink-dim group-hover:text-accent"
                  )}
                >
                  F{String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate">{m.title}</span>
                {active && (
                  <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
        Core · 25 modules
      </p>
      <ul className="space-y-0.5">
        {MODULES.map((m, i) => {
          const active = isInModule(m.slug);
          return (
            <li key={m.slug}>
              <Link
                href={`/lab/${m.slug}`}
                className={clsx(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-ink-muted hover:bg-bg-elevated hover:text-ink"
                )}
              >
                <span
                  className={clsx(
                    "w-7 font-mono text-[10px]",
                    active ? "text-accent" : "text-ink-dim group-hover:text-accent"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate">{m.title}</span>
                {active && (
                  <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function TopLink({
  href,
  label,
  active,
  tone,
  right,
}: {
  href: string;
  label: string;
  active: boolean;
  tone: "accent" | "warn" | "warn-soft";
  right?: string;
}) {
  const palette =
    tone === "accent"
      ? {
          base: "border-accent/40 bg-accent/5 text-accent hover:bg-accent/10",
          active: "border-accent/70 bg-accent/15 text-accent",
        }
      : tone === "warn"
      ? {
          base: "border-accent-warn/40 bg-accent-warn/5 text-accent-warn hover:bg-accent-warn/10",
          active: "border-accent-warn/70 bg-accent-warn/15 text-accent-warn",
        }
      : {
          base: "border-accent-warn/30 bg-accent-warn/[0.06] text-accent-warn hover:bg-accent-warn/10",
          active: "border-accent-warn/60 bg-accent-warn/15 text-accent-warn",
        };

  return (
    <Link
      href={href}
      className={clsx(
        "mx-2 mb-2 flex items-center justify-between rounded-md border px-2.5 py-2 text-sm",
        active ? palette.active : palette.base
      )}
      aria-current={active ? "page" : undefined}
    >
      <span>{label}</span>
      <span aria-hidden>{active ? "●" : right ?? "▸"}</span>
    </Link>
  );
}
