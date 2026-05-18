"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { INCIDENTS, pickIncident, type Incident, type Hypothesis } from "./incidents";

type Stage = "intake" | "diagnose" | "fix" | "validate" | "postmortem";

export default function Module25() {
  // The 'season' counter lets us start a fresh incident on demand
  const [season, setSeason] = useState(0);
  const incident = useMemo(() => pickIncident(season), [season]);
  const [stage, setStage] = useState<Stage>("intake");
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const next = () => {
    if (stage === "intake") setStage("diagnose");
    else if (stage === "diagnose") setStage("fix");
    else if (stage === "fix") setStage("validate");
    else if (stage === "validate") setStage("postmortem");
  };
  const restart = () => {
    setSeason((s) => s + 1);
    setStage("intake");
    setPicked(null);
  };

  const correct = picked != null && incident.hypotheses.find((h) => h.id === picked)?.correct === true;

  // Award points only the first time the correct hypothesis is picked.
  useEffect(() => {
    if (stage === "validate" && correct) {
      setScore((s) => s + incident.difficulty * 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <Lesson slug="25-incident-simulator">
      <Step n={1} kind="observe" title="The pager just went off. Forty seconds to first hypothesis.">
        <p>
          You&apos;ll walk a real on-call playbook: read the symptoms, scan the dock, pick the
          most likely root cause, apply the fix, validate the metrics, write the postmortem.
          Score scales with incident difficulty. Hit <em>new incident</em> to draw another from
          the catalogue.
        </p>
        <div className="not-prose mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-bg-border bg-bg-panel p-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">score</span>
            <span className="font-mono text-2xl text-accent">{score}</span>
            <span className="font-mono text-[10px] text-ink-dim">{INCIDENTS.length} incidents in catalogue</span>
          </div>
          <button
            onClick={restart}
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-[11px] active:scale-95"
          >
            ↻ new incident
          </button>
        </div>
      </Step>

      <Step n={2} kind="profile" title={incident.title}>
        <IncidentPanel incident={incident} stage={stage} picked={picked} setPicked={setPicked} correct={correct} />
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
            stage · {stage}
          </span>
          {stage !== "postmortem" ? (
            <button
              onClick={next}
              disabled={stage === "diagnose" && picked == null}
              className={clsx(
                "rounded-md px-3 py-1.5 font-mono text-[11px] active:scale-95",
                stage === "diagnose" && picked == null
                  ? "cursor-not-allowed bg-bg-elevated text-ink-dim"
                  : "bg-accent text-white"
              )}
            >
              advance →
            </button>
          ) : (
            <button
              onClick={restart}
              className="rounded-md bg-accent-good px-3 py-1.5 font-mono text-[11px] text-bg active:scale-95"
            >
              next incident →
            </button>
          )}
        </div>
      </Step>

      <Step n={3} kind="explain" title="The playbook">
        <ol>
          <li><strong>Intake</strong> — read the alert + the dock. Don&apos;t open the editor yet.</li>
          <li><strong>Diagnose</strong> — pick the highest-leverage hypothesis. Wrong is fine; <em>uncommitted</em> is not.</li>
          <li><strong>Fix</strong> — small, targeted, reversible. Ship behind a feature flag if you can.</li>
          <li><strong>Validate</strong> — confirm the metric you predicted moved. If it didn&apos;t, revert.</li>
          <li><strong>Postmortem</strong> — capture the next bottleneck. Every fix exposes one.</li>
        </ol>
      </Step>

      <Step n={4} kind="next" title="You finished the lab. Read it backwards.">
        <Callout tone="next" title="end of the journey">
          You started with bad keys. You end as on-call for a system you understand top to
          bottom. Restart from Module 1 with Architect Mode <em>on</em> — you&apos;ll catch
          tradeoffs you missed the first time.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────────── incident panel ─────────────── */

function IncidentPanel({
  incident,
  stage,
  picked,
  setPicked,
  correct,
}: {
  incident: Incident;
  stage: Stage;
  picked: string | null;
  setPicked: (id: string) => void;
  correct: boolean;
}) {
  return (
    <div className="not-prose space-y-3">
      <SymptomCard incident={incident} />
      <MetricsCard incident={incident} stage={stage} />

      {(stage === "diagnose" || stage === "fix" || stage === "validate" || stage === "postmortem") && (
        <HypothesisList
          hypotheses={incident.hypotheses}
          picked={picked}
          setPicked={setPicked}
          showCorrect={stage !== "diagnose"}
        />
      )}

      {(stage === "fix" || stage === "validate" || stage === "postmortem") && (
        <RevealCard title="root cause" tone="bad">
          {incident.rootCause}
        </RevealCard>
      )}

      {(stage === "fix" || stage === "validate" || stage === "postmortem") && (
        <RevealCard title="fix" tone="good">
          {incident.fix}
        </RevealCard>
      )}

      {(stage === "validate" || stage === "postmortem") && (
        <RevealCard title={correct ? `validated · +${incident.difficulty * 100} pts` : "validated"} tone={correct ? "good" : "info"}>
          {correct
            ? "Your hypothesis matched the root cause. Score awarded."
            : "Your hypothesis didn't match — but you still got to the fix. The hypothesis discipline is what counts."}
        </RevealCard>
      )}

      {stage === "postmortem" && (
        <RevealCard title="next bottleneck" tone="info">
          {incident.nextBottleneck}
        </RevealCard>
      )}
    </div>
  );
}

function SymptomCard({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-lg border border-accent-bad/30 bg-accent-bad/5 p-3">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-accent-bad animate-pulse_dot" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent-bad">
          incident · severity {incident.difficulty}
        </span>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {incident.symptoms.map((s, i) => (
          <li key={i} className="text-ink">{s}</li>
        ))}
      </ul>
    </div>
  );
}

function MetricsCard({ incident, stage }: { incident: Incident; stage: Stage }) {
  const healed = stage === "validate" || stage === "postmortem";
  const m = healed ? healedMetrics(incident.metrics) : incident.metrics;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Metric label="FPS" value={m.fps} tone={m.fps >= 55 ? "good" : m.fps >= 40 ? "warn" : "bad"} />
      <Metric
        label="renders/s"
        value={m.renderRate}
        tone={m.renderRate > 1000 ? "bad" : m.renderRate > 200 ? "warn" : "good"}
      />
      <Metric
        label="heap MB"
        value={m.mem}
        tone={m.mem > 500 ? "bad" : m.mem > 200 ? "warn" : "good"}
      />
      <Metric
        label="JS errors"
        value={m.jsErr}
        tone={m.jsErr === 0 ? "good" : m.jsErr < 5 ? "warn" : "bad"}
      />
    </div>
  );
}

function healedMetrics(m: Incident["metrics"]) {
  return { ...m, fps: 60, renderRate: Math.min(m.renderRate, 40), mem: Math.min(m.mem, 110), jsErr: 0 };
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "good" | "warn" | "bad" }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</span>
        <span
          className={clsx(
            "size-1.5 rounded-full",
            tone === "good" && "bg-accent-good",
            tone === "warn" && "bg-accent-warn",
            tone === "bad" && "bg-accent-bad"
          )}
        />
      </div>
      <div
        className={clsx(
          "mt-2 font-mono text-2xl tabular-nums",
          tone === "good" && "text-ink",
          tone === "warn" && "text-accent-warn",
          tone === "bad" && "text-accent-bad"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function HypothesisList({
  hypotheses,
  picked,
  setPicked,
  showCorrect,
}: {
  hypotheses: Hypothesis[];
  picked: string | null;
  setPicked: (id: string) => void;
  showCorrect: boolean;
}) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
        diagnose — pick your hypothesis
      </p>
      <ul className="space-y-1">
        {hypotheses.map((h) => {
          const isPicked = picked === h.id;
          const reveal = showCorrect;
          return (
            <li key={h.id}>
              <button
                onClick={() => !showCorrect && setPicked(h.id)}
                disabled={showCorrect && !isPicked}
                className={clsx(
                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition active:scale-[0.99]",
                  isPicked
                    ? reveal
                      ? h.correct
                        ? "border-accent-good/50 bg-accent-good/10 text-ink"
                        : "border-accent-bad/50 bg-accent-bad/10 text-ink"
                      : "border-accent/50 bg-accent/10 text-ink"
                    : reveal && h.correct
                    ? "border-accent-good/30 bg-accent-good/5 text-ink"
                    : "border-bg-border bg-bg-elevated text-ink-muted hover:text-ink"
                )}
              >
                <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
                  {h.id}
                </span>
                <span className="flex-1">{h.text}</span>
                {reveal && h.correct && (
                  <span className="font-mono text-[10px] text-accent-good">root cause</span>
                )}
              </button>
              {reveal && isPicked && h.why && (
                <p className="mt-1 px-3 font-mono text-[11px] text-ink-muted">{h.why}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RevealCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "good" | "bad" | "info";
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence initial>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={clsx(
          "rounded-lg border p-3 text-sm",
          tone === "good" && "border-accent-good/30 bg-accent-good/5",
          tone === "bad" && "border-accent-bad/30 bg-accent-bad/5",
          tone === "info" && "border-accent/30 bg-accent/5"
        )}
      >
        <div
          className={clsx(
            "mb-1 font-mono text-[10px] uppercase tracking-widest",
            tone === "good" && "text-accent-good",
            tone === "bad" && "text-accent-bad",
            tone === "info" && "text-accent"
          )}
        >
          {title}
        </div>
        <div className="text-ink">{children}</div>
      </motion.div>
    </AnimatePresence>
  );
}
