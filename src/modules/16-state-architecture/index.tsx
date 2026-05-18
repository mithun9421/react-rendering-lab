"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";
import { MetricsPanel } from "@/engine/MetricsPanel";
import { ArchitectGate } from "@/engine/ArchitectGate";
import { useRenderCount } from "@/profiler/useRenderCount";
import clsx from "clsx";

/**
 * The single evolving dashboard surface used everywhere — re-imagined as a state-architecture lab.
 * We render the SAME `<Theme>` + `<Cart>` + `<User>` triplet four ways and let the user toggle
 * between them to feel how each strategy scales.
 */
export default function Module16() {
  return (
    <Lesson slug="16-state-architecture">
      <Step n={1} kind="observe" title="The state question is never 'where do I put it' — it's 'who reacts when it changes'">
        <p>
          Every state mutation has a blast radius. Prop drilling makes it explicit. Context
          makes it implicit. Stores make it surgical. The wrong choice at scale doesn&apos;t
          crash — it just renders the world on every keystroke.
        </p>
      </Step>

      <Step n={2} kind="profile" title="One dashboard, four state strategies — count the renders">
        <TryIt
          title="strategy"
          knobs={[
            { key: "drill", label: "prop drilling", default: true },
            { key: "context", label: "single context", default: false },
            { key: "split", label: "split contexts", default: false },
            { key: "store", label: "external store + selector", default: false },
          ]}
          hint="Bump the cart. Watch the four 'reacts' counters in the metrics panel. Only the store strategy keeps the unrelated parts at 0."
        >
          {(flags) => <StrategyDemo flags={flags} />}
        </TryIt>
        <div className="mt-4">
          <MetricsPanel
            watch={[
              "Strat:drill:Theme",
              "Strat:drill:Unrelated",
              "Strat:ctx:Unrelated",
              "Strat:split:Unrelated",
              "Strat:store:Unrelated",
            ]}
          />
        </div>
      </Step>

      <Step n={3} kind="explain" title="What each strategy actually does to the render tree">
        <ul>
          <li>
            <strong>Prop drilling</strong> — any parent that owns the state re-renders the
            whole subtree below it. Pure but blunt.
          </li>
          <li>
            <strong>Single context</strong> — every consumer re-renders on every value change.
            Inserting <code>useMemo</code> on the value <em>object</em> doesn&apos;t help unless
            consumers also memo.
          </li>
          <li>
            <strong>Split contexts</strong> — one provider per slice. A cart change no longer
            re-renders theme consumers. The art is picking the slices.
          </li>
          <li>
            <strong>External store + selector</strong> (Zustand / Redux / Jotai) — consumers
            subscribe via <code>useSyncExternalStore</code>; React only re-runs them when the{" "}
            <em>selected</em> slice changes. This is the production answer.
          </li>
        </ul>
      </Step>

      <Step n={4} kind="explain" title="Server cache vs client state — they aren't the same thing">
        <p>
          A common Staff-interview trap: candidates put fetched data in Redux. <em>It almost
          never belongs there.</em> Server data is a <strong>cache</strong> — it has a key, a
          freshness window, and an invalidation strategy. Client state is what the user is{" "}
          <em>doing</em> right now (form input, modal open, optimistic mutation).
        </p>
        <p>
          React Query / SWR / RSC own the server cache. Stores own the client state. When the
          two are conflated, you get cache invalidation bugs that look like state bugs and
          state bugs that look like cache bugs.
        </p>
      </Step>

      <Step n={5} kind="fix" title="The recipe">
        <ArchitectGate
          prompts={["why-this-approach", "tradeoffs", "next-bottleneck"]}
        >
          <div className="rounded-lg border border-bg-border bg-bg-panel p-4 text-sm">
            <ol className="space-y-2 text-ink">
              <li>
                <strong>1.</strong> Server cache → React Query / SWR / RSC. Keyed by URL or
                args. Invalidate on mutation.
              </li>
              <li>
                <strong>2.</strong> Cross-cutting client state → external store (Zustand) with
                <em>selector</em>-based reads. One store per domain.
              </li>
              <li>
                <strong>3.</strong> Local UI state → <code>useState</code> next to the
                component that owns it. Colocate ruthlessly.
              </li>
              <li>
                <strong>4.</strong> Derived state → never store it; compute it.{" "}
                <code>useMemo</code> only when the compute is real.
              </li>
              <li>
                <strong>5.</strong> Optimistic mutations → <code>useOptimistic</code> over the
                cache key. Server reconciles.
              </li>
            </ol>
          </div>
        </ArchitectGate>
      </Step>

      <Step n={6} kind="next" title="State sorted. But state changes still pay the browser tax.">
        <Callout tone="next" title="next bottleneck">
          Even a perfectly-architected store still triggers DOM mutations — and the browser
          pipeline owns what happens next. Module 17 unpacks style → layout → paint → composite.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────────── strategy demo ─────────────── */

function StrategyDemo({ flags }: { flags: { drill: boolean; context: boolean; split: boolean; store: boolean } }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {flags.drill && (
        <Panel title="prop drilling">
          <DrillRoot />
        </Panel>
      )}
      {flags.context && (
        <Panel title="single context">
          <CtxRoot />
        </Panel>
      )}
      {flags.split && (
        <Panel title="split contexts">
          <SplitRoot />
        </Panel>
      )}
      {flags.store && (
        <Panel title="external store + selector">
          <StoreRoot />
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">{title}</p>
      {children}
    </div>
  );
}

/* ── Prop drilling ── */

function DrillRoot() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [cart, setCart] = useState(0);
  return (
    <div className="space-y-2">
      <Controls onTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} onCart={() => setCart((c) => c + 1)} />
      <DrillFrame theme={theme} cart={cart} />
    </div>
  );
}
function DrillFrame({ theme, cart }: { theme: string; cart: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <DrillTheme theme={theme} />
      <DrillCart cart={cart} />
      <DrillUnrelated />
    </div>
  );
}
function DrillTheme({ theme }: { theme: string }) {
  useRenderCount("Strat:drill:Theme");
  return <Slot label="theme" value={theme} />;
}
function DrillCart({ cart }: { cart: number }) {
  useRenderCount("Strat:drill:Cart");
  return <Slot label="cart" value={cart} />;
}
function DrillUnrelated() {
  useRenderCount("Strat:drill:Unrelated");
  return <Slot label="unrelated" value="static" muted />;
}

/* ── Single context ── */

const SingleCtx = createContext<{ theme: string; cart: number }>({ theme: "dark", cart: 0 });
function CtxRoot() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [cart, setCart] = useState(0);
  return (
    <SingleCtx.Provider value={{ theme, cart }}>
      <Controls
        onTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onCart={() => setCart((c) => c + 1)}
      />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <CtxTheme />
        <CtxCart />
        <CtxUnrelated />
      </div>
    </SingleCtx.Provider>
  );
}
function CtxTheme() {
  useRenderCount("Strat:ctx:Theme");
  const { theme } = useContext(SingleCtx);
  return <Slot label="theme" value={theme} />;
}
function CtxCart() {
  useRenderCount("Strat:ctx:Cart");
  const { cart } = useContext(SingleCtx);
  return <Slot label="cart" value={cart} />;
}
function CtxUnrelated() {
  useRenderCount("Strat:ctx:Unrelated");
  // unrelated still subscribes because we read the context object
  useContext(SingleCtx);
  return <Slot label="unrelated" value="reads ctx" muted />;
}

/* ── Split contexts ── */

const ThemeCtx = createContext<string>("dark");
const CartCtx = createContext<number>(0);
function SplitRoot() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [cart, setCart] = useState(0);
  return (
    <ThemeCtx.Provider value={theme}>
      <CartCtx.Provider value={cart}>
        <Controls
          onTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onCart={() => setCart((c) => c + 1)}
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SplitTheme />
          <SplitCart />
          <SplitUnrelated />
        </div>
      </CartCtx.Provider>
    </ThemeCtx.Provider>
  );
}
function SplitTheme() {
  useRenderCount("Strat:split:Theme");
  const t = useContext(ThemeCtx);
  return <Slot label="theme" value={t} />;
}
function SplitCart() {
  useRenderCount("Strat:split:Cart");
  const c = useContext(CartCtx);
  return <Slot label="cart" value={c} />;
}
function SplitUnrelated() {
  useRenderCount("Strat:split:Unrelated");
  return <Slot label="unrelated" value="no ctx read" muted />;
}

/* ── External store + selector (useSyncExternalStore) ── */

type StoreState = { theme: "dark" | "light"; cart: number };
function createStore(initial: StoreState) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch: Partial<StoreState>) => {
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}
const store = createStore({ theme: "dark", cart: 0 });

function useStoreSelector<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get())
  );
}

function StoreRoot() {
  return (
    <div>
      <Controls
        onTheme={() => store.set({ theme: store.get().theme === "dark" ? "light" : "dark" })}
        onCart={() => store.set({ cart: store.get().cart + 1 })}
      />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <StoreTheme />
        <StoreCart />
        <StoreUnrelated />
      </div>
    </div>
  );
}
function StoreTheme() {
  useRenderCount("Strat:store:Theme");
  const t = useStoreSelector((s) => s.theme);
  return <Slot label="theme" value={t} />;
}
function StoreCart() {
  useRenderCount("Strat:store:Cart");
  const c = useStoreSelector((s) => s.cart);
  return <Slot label="cart" value={c} />;
}
function StoreUnrelated() {
  useRenderCount("Strat:store:Unrelated");
  return <Slot label="unrelated" value="no subscribe" muted />;
}

/* ── Controls + slot ── */

function Controls({ onTheme, onCart }: { onTheme: () => void; onCart: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button onClick={onTheme} className="rounded-md border border-bg-border bg-bg-elevated px-2.5 py-1 font-mono active:scale-95">
        toggle theme
      </button>
      <button onClick={onCart} className="rounded-md bg-accent px-2.5 py-1 font-mono text-white active:scale-95">
        + add to cart
      </button>
    </div>
  );
}

function Slot({ label, value, muted }: { label: string; value: string | number; muted?: boolean }) {
  return (
    <div className={clsx("rounded-md border border-bg-border bg-bg-elevated p-2 font-mono text-[11px]", muted && "opacity-70")}>
      <div className="text-[10px] uppercase tracking-widest text-ink-dim">{label}</div>
      <div className="mt-1 text-ink">{String(value)}</div>
    </div>
  );
}

