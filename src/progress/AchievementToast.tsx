"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useProgress } from "./store";
import { findAchievement, type AchievementTier } from "./achievements";

/**
 * Drains the pending-toasts queue in the progress store. One toast at a time;
 * bottom-right on desktop, top on mobile (above the consent banner). 4-second
 * autodismiss.
 *
 * Mount once near the root (we use the same layout slot as CookieConsent).
 */
export function AchievementToast() {
  const popToast = useProgress((s) => s.popToast);
  const pending = useProgress((s) => s.pendingToasts);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (current) return;
    if (pending.length === 0) return;
    const next = popToast();
    if (next) setCurrent(next);
  }, [pending, current, popToast]);

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => setCurrent(null), 4000);
    return () => clearTimeout(id);
  }, [current]);

  const a = current ? findAchievement(current) : null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-2 top-16 z-50 flex justify-center sm:inset-x-auto sm:bottom-24 sm:right-4 sm:top-auto sm:justify-end"
    >
      <AnimatePresence>
        {a && (
          <motion.div
            key={a.id}
            initial={{ y: -16, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="pointer-events-auto"
          >
            <button
              type="button"
              onClick={() => setCurrent(null)}
              className={clsx(
                "glass flex items-center gap-3 rounded-lg border px-4 py-3 text-left shadow-glass",
                tierBorder(a.tier)
              )}
            >
              <span
                className={clsx(
                  "grid size-10 shrink-0 place-items-center rounded-full text-xl",
                  tierBg(a.tier)
                )}
              >
                {a.symbol ?? "★"}
              </span>
              <div className="min-w-0">
                <div
                  className={clsx(
                    "font-mono text-[10px] uppercase tracking-widest",
                    tierText(a.tier)
                  )}
                >
                  achievement · +{a.xp} XP
                </div>
                <div className="text-sm font-medium text-ink">{a.title}</div>
                <div className="font-mono text-[11px] text-ink-muted">{a.criterion}</div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function tierBorder(t: AchievementTier) {
  switch (t) {
    case "bronze":
      return "border-accent-warm/40";
    case "silver":
      return "border-ink-muted/40";
    case "gold":
      return "border-accent-warn/50";
    default:
      return "border-accent/40";
  }
}
function tierBg(t: AchievementTier) {
  switch (t) {
    case "bronze":
      return "bg-accent-warm/15 text-accent-warm";
    case "silver":
      return "bg-ink-muted/15 text-ink";
    case "gold":
      return "bg-accent-warn/15 text-accent-warn";
    default:
      return "bg-accent/15 text-accent";
  }
}
function tierText(t: AchievementTier) {
  switch (t) {
    case "bronze":
      return "text-accent-warm";
    case "silver":
      return "text-ink-muted";
    case "gold":
      return "text-accent-warn";
    default:
      return "text-accent";
  }
}
