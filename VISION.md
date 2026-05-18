# Vision Audit — what we hit, what we missed

> Audit done **2026-05-18 late evening**, after v0.4 (25 modules, all interactive). The goal: be honest about where we delivered on the original brief and where we drifted.

## What the original brief asked for

Two non-negotiable promises:

1. **One evolving codebase.** Every module's content emerges from the *same* deliberately broken dashboard. Fix one bottleneck → the next one becomes visible *in the same surface*.
2. **Bottleneck chain.** Each module's fix exposes the next module's problem. The learner *feels* the architectural evolution as a continuous arc, not isolated puzzles.

## What we shipped

### What we hit ✅

- **The narrative chain is fully wired.** Every module's `next` field in `registry.ts` points at the bottleneck the fix exposes. Each `<Lesson>` ends with a "next bottleneck" callout that links forward. Run `/lab/01-reconciliation` → keep clicking "next" → you arrive at `/lab/25-incident-simulator` having read a continuous argument. ✓
- **One shared visualisation system.** Every module composes the same engine primitives (`Lesson`, `Step`, `TryIt`, `BeforeAfter`, `MetricsPanel`, `Callout`, `ArchitectGate`). Every module reads the same `useProfiler` store. The profiler dock is global. ✓
- **One shared design language.** Dark glassmorphism, the dev-tool aesthetic, mobile-first responsiveness, the same colour palette, typography, motion conventions. ✓
- **Architect Mode** as a global reflection primitive — applies across the lab. ✓

### Where we drifted ⚠

This is the honest part:

- **Only Module 1 actually touches the shared `/dashboard/` surface.** A grep of `src/modules/*` for imports from `@/dashboard` returns four files: Module 1 (`<StockFeed>` in `<BeforeAfter>`), Module 9, Module 20, Module 22 — and 9 / 20 / 22 only mention dashboard components in their *narrative*, not their interactive demos.
- **Most modules built isolated demos.** Module 4's `SearchDemo` is its own 8k-item list. Module 8's `Waterfall` is its own three-component tree. Module 10's `List` is its own 50k-row table. Module 16's strategy demos are bespoke. Module 25's incidents are described as if affecting the dashboard, but the dashboard isn't on screen during diagnosis.
- **No `<PatchProvider>`.** The original architectural sketch in `PROGRESS.md` called for a provider that lets each module swap implementations in/out of the *same* `<Dashboard>`. We never built it.
- **The "feel the evolution" promise is fulfilled by reading, not by watching.** A learner reading top-to-bottom *will* understand the argument. But they don't get to see the same broken `StockFeed` they met in Module 1 visibly improve across Modules 11, 16, 10 — that visceral payoff is missing.

### Why we drifted

Three reasons, in order of weight:

1. **Scope.** 25 modules is a lot. Each interactive demo built into a module is faster to ship than a fully patched-dashboard mode. The local optimum (isolated demos) is faster than the global optimum (patched dashboard).
2. **Concept fit.** Some concepts genuinely don't map to the StockFeed/Chart/Activity surface — XSS, CSP, focus traps, MFE federation, build-bundle treemaps. Forcing those into the dashboard would be artificial.
3. **The mobile rewrite landed mid-stream** and reset some surface area we might have otherwise spent on the journey route.

## The fix — `/lab/journey` (this commit)

The new `/lab/journey` route is the literal embodiment of "one evolving codebase":

The **same** `<Dashboard>` component is rendered six times, each instance with progressively more of the modules' fixes applied (stable keys → memo → split state → time-sliced → islands → virtualised). The learner picks a "fix level" 0..5; every instance below that level shows the older surface, every instance above shows the newer. Render counts and FPS read live from the same profiler store.

This doesn't replace the per-module deep-dives. It complements them — the per-module page is the *explanation*, the journey is the *demonstration*. It's the missing link.

## What still drifts and we're choosing to accept

- **Modules 17-24 stay topical** (their content doesn't shoehorn into the dashboard). We're not going to fake-XSS the StockFeed for the sake of vision purity.
- **`<PatchProvider>` as originally sketched** is overkill given the modules now exist. The `/lab/journey` route uses props on `<Dashboard>` directly, which achieves the same observable behaviour with less abstraction. We're calling that the v1 design.

## What's next (post-polish)

- **Interview Mode** (`/lab/interview`) — dynamic question generator that scores answers, building on `ArchitectGate`.
- **Trace recorder** — capture a session's commits + renders to JSON, replay deterministically. Turns the lab into an eval harness.
- **Real `<Profiler>` API** wired into the dock for `actualDuration` / `baseDuration` per commit.
- The remaining polish items listed in `TODO.md`.

## Bottom line

The lab is *not* a perfect realisation of the brief. The narrative spine is rock-solid; the literal "watch one app evolve" payoff was 70% present and is now 95% present after `/lab/journey`. We're calling that good enough for v0.5.

The remaining drift is intentional — fidelity to teaching value over fidelity to a single-surface constraint.
