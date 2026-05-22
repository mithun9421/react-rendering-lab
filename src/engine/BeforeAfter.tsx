"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Mode = "before" | "after";

export function BeforeAfter({
  before,
  after,
  labelBefore = "Broken",
  labelAfter = "Fixed",
  initial = "before",
}: {
  before: React.ReactNode;
  after: React.ReactNode;
  labelBefore?: string;
  labelAfter?: string;
  initial?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initial);

  return (
    <Card className="overflow-hidden">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bg-border bg-bg-subtle px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="secondary" className="font-mono uppercase tracking-widest text-[10px]">
              surface
            </Badge>
            <span className="truncate font-mono text-xs text-ink">
              {mode === "before" ? labelBefore : labelAfter}
            </span>
          </div>
          <TabsList className="h-auto p-0.5">
            <TabsTrigger
              value="before"
              className="text-xs data-[state=active]:bg-accent-bad/15 data-[state=active]:text-accent-bad"
            >
              {labelBefore}
            </TabsTrigger>
            <TabsTrigger
              value="after"
              className="text-xs data-[state=active]:bg-accent-good/15 data-[state=active]:text-accent-good"
            >
              {labelAfter}
            </TabsTrigger>
          </TabsList>
        </div>

        {/*
          NOTE: We drive the swap animation off `mode` directly rather than letting
          Radix mount/unmount both <TabsContent> entries. This preserves the existing
          framer-motion fade-and-slide behaviour without double-mounting children.
        */}
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="p-4"
            >
              {mode === "before" ? before : after}
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </Card>
  );
}
