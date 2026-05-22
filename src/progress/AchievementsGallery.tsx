"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ACHIEVEMENTS, type Achievement, type AchievementTier } from "./achievements";
import { useProgress } from "./store";

/**
 * Gallery of all achievements, sorted by tier (single → bronze → silver → gold).
 * Locked badges are dimmed but visible — the criterion is the call to action.
 */
export function AchievementsGallery() {
  const unlocked = useProgress((s) => s.unlocked);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const sorted = [...ACHIEVEMENTS].sort((a, b) => tierWeight(a.tier) - tierWeight(b.tier));
  const list = sorted.filter((a) => {
    if (filter === "unlocked") return Boolean(unlocked[a.id]);
    if (filter === "locked") return !unlocked[a.id];
    return true;
  });

  const unlockedCount = sorted.filter((a) => unlocked[a.id]).length;

  return (
    <section>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted">
            <Trophy className="size-3.5" />
            Achievements
          </h2>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-ink-dim">
            {unlockedCount} / {sorted.length} unlocked · competence-tied, no participation badges
          </p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="h-auto p-0.5">
            {(["all", "unlocked", "locked"] as const).map((f) => (
              <TabsTrigger
                key={f}
                value={f}
                className="font-mono text-[10px] uppercase tracking-widest"
              >
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((a) => (
          <Tile key={a.id} a={a} unlockedAt={unlocked[a.id]} />
        ))}
      </ul>
    </section>
  );
}

function Tile({ a, unlockedAt }: { a: Achievement; unlockedAt?: number }) {
  const locked = !unlockedAt;
  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <Card
        className={cn(
          "relative overflow-hidden",
          locked ? "opacity-60" : tierGlow(a.tier)
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full text-lg",
                locked ? "bg-bg-elevated text-ink-dim" : tierBg(a.tier)
              )}
            >
              {a.symbol ?? "★"}
            </span>
            <div className="min-w-0">
              <Badge
                variant="outline"
                className="font-mono text-[9px] uppercase tracking-widest tabular-nums"
              >
                {a.tier} · {a.xp} XP
              </Badge>
              <div className="mt-1 truncate text-sm font-medium text-ink">{a.title}</div>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-ink-muted">{a.criterion}</p>
          {unlockedAt && (
            <p className="mt-2 flex items-center gap-1 font-mono text-[10px] text-accent-good">
              <Check className="size-3" />
              {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.li>
  );
}

function tierWeight(t: AchievementTier) {
  return { single: 0, bronze: 1, silver: 2, gold: 3 }[t];
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
function tierGlow(t: AchievementTier) {
  switch (t) {
    case "bronze":
      return "border-accent-warm/30 bg-bg-panel";
    case "silver":
      return "border-ink-muted/30 bg-bg-panel";
    case "gold":
      return "border-accent-warn/40 bg-bg-panel shadow-[0_0_24px_rgba(255,200,87,0.06)]";
    default:
      return "border-accent/30 bg-bg-panel";
  }
}
