"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { MODULES } from "@/modules/registry";

/**
 * Mobile-first navigation. Two surfaces:
 *   1. Always-visible top bar with brand + hamburger + current module pill.
 *   2. Slide-down drawer (full-width on phones, max-w on tablets) with the module list.
 *
 * On lg+ we still render the same top bar but the drawer becomes a static sidebar via
 * the parent layout (kept as a separate component so the layout decides).
 */
export function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname();
  const current = MODULES.find((m) => pathname?.includes(m.slug));

  return (
    <header className="glass sticky top-0 z-40 flex items-center gap-2 border-b border-bg-border px-3 py-2 lg:hidden">
      <button
        aria-label="Open module menu"
        onClick={onOpen}
        className="grid size-9 place-items-center rounded-md border border-bg-border bg-bg-elevated active:scale-95"
      >
        <Hamburger />
      </button>
      <Link href="/" className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-accent animate-pulse_dot" />
        <span className="font-mono text-[11px] tracking-wider">react-rendering-lab</span>
      </Link>
      {current && (
        <span className="ml-auto truncate rounded-full border border-bg-border bg-bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          {current.title}
        </span>
      )}
    </header>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col border-r border-bg-border bg-bg-subtle lg:hidden"
            role="dialog"
            aria-label="Modules"
          >
            <div className="flex items-center justify-between border-b border-bg-border px-4 py-3">
              <Link href="/" onClick={onClose} className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent animate-pulse_dot" />
                <span className="font-mono text-xs tracking-wider">react-rendering-lab</span>
              </Link>
              <button
                aria-label="Close menu"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-md border border-bg-border bg-bg-elevated active:scale-95"
              >
                <Close />
              </button>
            </div>
            <p className="px-4 py-3 text-[11px] leading-snug text-ink-dim">
              One broken dashboard. Each module fixes one thing — and exposes the next bottleneck.
            </p>
            <nav className="flex-1 overflow-y-auto px-2 pb-6">
              <Link
                href="/lab/journey"
                onClick={onClose}
                className="mx-2 mb-2 flex items-center justify-between rounded-md border border-accent/40 bg-accent/5 px-3 py-3 text-sm text-accent hover:bg-accent/10"
              >
                <span>Journey · one codebase</span>
                <span aria-hidden>▸</span>
              </Link>
              <Link
                href="/lab/interview"
                onClick={onClose}
                className="mx-2 mb-3 flex items-center justify-between rounded-md border border-accent-warn/40 bg-accent-warn/5 px-3 py-3 text-sm text-accent-warn hover:bg-accent-warn/10"
              >
                <span>Interview · question bank</span>
                <span aria-hidden>▸</span>
              </Link>
              <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">Modules</p>
              <ul className="space-y-0.5">
                {MODULES.map((m, i) => {
                  const active = pathname?.includes(m.slug) ?? false;
                  return (
                    <li key={m.slug}>
                      <Link
                        href={`/lab/${m.slug}`}
                        onClick={onClose}
                        className={clsx(
                          "flex items-center gap-3 rounded-md px-2.5 py-3 text-sm",
                          active
                            ? "bg-accent/15 text-accent"
                            : "text-ink-muted active:bg-bg-elevated hover:bg-bg-elevated hover:text-ink"
                        )}
                      >
                        <span className="w-6 font-mono text-[11px] text-ink-dim">{String(i + 1).padStart(2, "0")}</span>
                        <span className="flex-1 truncate">{m.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-bg-border px-4 py-3 text-[10px] font-mono text-ink-dim">
              Tap the FPS pill at the bottom to expand the profiler.
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MobileTopBar onOpen={() => setOpen(true)} />
      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Hamburger() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
      <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function Close() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
