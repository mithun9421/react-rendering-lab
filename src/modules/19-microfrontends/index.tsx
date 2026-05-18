"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";

type Team = {
  id: string;
  name: string;
  react: string;
  bundleKb: number;
  sharedReact: boolean;
};

export default function Module19() {
  return (
    <Lesson slug="19-microfrontends">
      <Step n={1} kind="observe" title="The org chart leaks into the bundle">
        <p>
          One team can pick React 19. Three teams cannot — unless they coordinate. Microfrontends
          ship when those teams want autonomy: independent deploys, independent versions,
          independent risk. The system has to make that safe.
        </p>
      </Step>

      <Step n={2} kind="profile" title="Three teams, one host. Three React versions?">
        <TryIt
          title="federation topology"
          knobs={[
            { key: "shared", label: "share React + ReactDOM as singletons", default: false },
            { key: "v19", label: "team-C upgrades to React 19", default: false },
          ]}
          hint="Without sharing: each team ships its own React. With sharing: hosts the singleton, remotes use it — but only if the version range matches. Flip the v19 toggle while sharing is on."
        >
          {(flags) => <FederationGraph flags={flags} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="Three integration styles">
        <ul>
          <li>
            <strong>Build-time monorepo</strong> — one bundler, everything in one repo. Cheapest,
            least autonomous. Good until ~8 teams.
          </li>
          <li>
            <strong>Runtime Module Federation</strong> — each team builds independently, host
            loads remotes at runtime. Shared deps as singletons via the Federation plugin.
            Independent deploys; runtime contract becomes the API.
          </li>
          <li>
            <strong>Iframe + postMessage</strong> — true isolation. Worst UX, easiest blast radius.
            For when teams can&apos;t agree on anything (e.g. an embedded checkout from a partner).
          </li>
        </ul>
      </Step>

      <Step n={4} kind="explain" title="Runtime contracts are the new API">
        <p>
          With Federation, the host doesn&apos;t import from a remote — it imports the{" "}
          <em>type</em> of what the remote will expose, and resolves the real binding at runtime.
          The contract has to be versioned like an API: deprecation windows, breaking-change
          policies, contract tests in CI before deploy.
        </p>
        <pre className="not-prose mt-3 overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// remote.config.js (team-C)
new ModuleFederationPlugin({
  name: "teamC",
  filename: "remoteEntry.js",
  exposes: { "./Checkout": "./src/Checkout" },
  shared: {
    react:     { singleton: true, requiredVersion: "^19.0.0" },
    "react-dom": { singleton: true, requiredVersion: "^19.0.0" },
  },
});

// host.config.js
new ModuleFederationPlugin({
  remotes: { teamC: "teamC@https://teamc.example/remoteEntry.js" },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
});`}
        </pre>
      </Step>

      <Step n={5} kind="fix" title="Failure modes — and the fixes that catch them in CI">
        <ul>
          <li>
            <strong>Duplicate React</strong> → hooks crash with &quot;cannot read null&quot;.
            Fix: <code>singleton: true</code> on react + react-dom in every team. Add a CI check
            that diffs the federation manifest.
          </li>
          <li>
            <strong>Version drift</strong> → host has react@19, a remote requires react@18.
            Fix: <code>strictVersion: true</code> + a deprecation policy enforced by CI.
          </li>
          <li>
            <strong>Loading races</strong> → remote initialises before host, calls a hook from
            the wrong React. Fix: dynamic `import()` the remote, await host bootstrap first.
          </li>
          <li>
            <strong>Style collisions</strong> → two teams ship <code>.btn</code>. Fix: CSS
            modules, scope prefixes, or shadow DOM at the integration boundary.
          </li>
        </ul>
      </Step>

      <Step n={6} kind="next" title="Boundaries set. Now the bundle itself.">
        <Callout tone="next" title="next bottleneck">
          With shared deps and contracts, you&apos;ve cut the duplicate-React tax. But each team
          still ships JS that needs to be small. Module 20 attacks bundling head-on.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── federation graph ─────────── */

function FederationGraph({ flags }: { flags: { shared: boolean; v19: boolean } }) {
  const teams: Team[] = [
    { id: "host", name: "host", react: "19.0.0", bundleKb: flags.shared ? 142 : 142, sharedReact: true },
    { id: "A", name: "team-A · profile", react: "19.0.0", bundleKb: flags.shared ? 38 : 84, sharedReact: flags.shared },
    { id: "B", name: "team-B · search", react: "19.0.0", bundleKb: flags.shared ? 26 : 72, sharedReact: flags.shared },
    {
      id: "C",
      name: "team-C · checkout",
      react: flags.v19 ? "19.0.0" : "18.3.1",
      bundleKb: flags.shared && !flags.v19 ? 90 : flags.shared ? 31 : 78,
      sharedReact: flags.shared && (!flags.v19 ? false : true),
    },
  ];
  const conflict = flags.shared && !flags.v19; // host=19, C=18 with sharing on → mismatch
  const total = teams.reduce((a, t) => a + t.bundleKb, 0);

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {teams.map((t) => (
          <TeamCard key={t.id} team={t} shared={flags.shared} conflict={t.id === "C" && conflict} />
        ))}
      </div>
      <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-dim">
          <span>
            total shipped JS: <span className="text-ink">{total} KB</span>{" "}
            {flags.shared && !conflict && (
              <span className="ml-2 text-accent-good">↓ {((1 - total / 376) * 100).toFixed(0)}% vs. unshared</span>
            )}
          </span>
          {conflict && (
            <span className="rounded-md bg-accent-bad/15 px-2 py-1 text-accent-bad">
              ⨯ runtime contract failed: host React 19, team-C requires React 18 with{" "}
              <code>singleton: true</code>
            </span>
          )}
        </div>
        <Edges shared={flags.shared} conflict={conflict} />
      </div>
    </div>
  );
}

function TeamCard({ team, shared, conflict }: { team: Team; shared: boolean; conflict: boolean }) {
  return (
    <motion.div
      layout
      className={clsx(
        "rounded-lg border bg-bg-panel p-3",
        conflict ? "border-accent-bad/40 bg-accent-bad/5" : team.id === "host" ? "border-accent/40 bg-accent/5" : "border-bg-border"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{team.id}</span>
        <span className={clsx("font-mono text-[10px]", conflict ? "text-accent-bad" : "text-accent")}>
          react {team.react}
        </span>
      </div>
      <div className="mt-1 font-mono text-xs">{team.name}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={clsx(
            "font-mono text-xl tabular-nums",
            conflict ? "text-accent-bad" : "text-ink"
          )}
        >
          {team.bundleKb}
        </span>
        <span className="font-mono text-[10px] text-ink-dim">KB</span>
      </div>
      <div className="mt-1 font-mono text-[10px] text-ink-dim">
        {shared ? (team.sharedReact ? "uses host React" : "ships its own (mismatch!)") : "ships its own React"}
      </div>
    </motion.div>
  );
}

function Edges({ shared, conflict }: { shared: boolean; conflict: boolean }) {
  return (
    <svg viewBox="0 0 400 90" className="w-full">
      {/* host node */}
      <circle cx="200" cy="20" r="6" fill="#7c5cff" />
      <text x="200" y="14" fontSize="9" fill="#9a9aa6" textAnchor="middle">
        host
      </text>
      {/* remotes */}
      {["A", "B", "C"].map((id, i) => {
        const x = 80 + i * 120;
        const bad = id === "C" && conflict;
        return (
          <g key={id}>
            <line
              x1="200"
              y1="20"
              x2={x}
              y2="70"
              stroke={bad ? "#ff5c7a" : shared ? "#3ddc97" : "#26262e"}
              strokeWidth="1.5"
              strokeDasharray={shared ? "0" : "3 3"}
            />
            <circle cx={x} cy="70" r="6" fill={bad ? "#ff5c7a" : "#15151a"} stroke={bad ? "#ff5c7a" : "#26262e"} />
            <text x={x} y="88" fontSize="9" fill="#9a9aa6" textAnchor="middle">
              team-{id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
