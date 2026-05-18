"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { TryIt } from "@/engine/TryIt";
import { MetricsPanel } from "@/engine/MetricsPanel";
import { ArchitectGate } from "@/engine/ArchitectGate";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
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

      <ArchitectNotes
        framing="The architect's real question is 'when do you reach for context vs a store vs lifting?' and 'how does concurrent React change that answer?' Both are tied up with how component subscriptions work under the hood."
        followUps={[
          {
            q: "Why doesn't React.memo prevent re-renders from context updates?",
            a: "memo's shallow compare runs on PROPS. Context isn't a prop — it's a subscription. When a context value changes, every consumer's render gets queued regardless of memo wrapping. The fix: either split the context so consumers subscribe to a smaller slice, or move to a store with selectors via useSyncExternalStore. Practical rule: context for slow-changing values (theme, locale, auth user); stores for fast-changing or selectable state.",
          },
          {
            q: "What is tearing? Why does useSyncExternalStore exist?",
            a: "Tearing is when concurrent rendering reads an external store mid-render, then yields, the store updates, and the same render resumes and reads a different value — producing UI that's inconsistent within a single commit. Two halves of the same render see two different versions of the data. useSyncExternalStore solves this by guaranteeing a CONSISTENT snapshot for the entire render: it stamps the snapshot at the start of the render and re-reads it during commit to verify consistency. If the snapshot changed, React aborts and re-renders. External stores that bypass this hook (older Redux integrations, hand-rolled subscribers) can tear under concurrent React.",
          },
          {
            q: "When does useReducer + context beat a third-party store?",
            a: "When you don't need selector-based subscriptions and don't need cross-route persistence. useReducer + context is 100 lines, lives in your code, no dependency. Trade-off: every consumer re-renders on every dispatch. Acceptable when (a) consumers are few (<10), (b) updates are infrequent, (c) you don't want a runtime dependency. Reach for Zustand/Jotai when (a) consumers are many, (b) updates are frequent, (c) selectors save real renders. The architect wants to hear: 'I default to useReducer; I escalate when I measure a real cost.'",
          },
          {
            q: "Server cache vs client state — give me an example where conflating them caused a bug.",
            a: "The classic: you put fetched user data in Redux, then mutate it locally to reflect an optimistic update. You forget to invalidate. Next time the component mounts, Redux serves the stale optimistic value as if it were fresh server data. The user sees their own edit even though the server rejected it. The cleanup is conceptual: server data is a CACHE with key + freshness + invalidation; client state is what the USER is doing right now. Different lifecycles, different layers. React Query / SWR / RSC own the cache; stores own the client state.",
          },
          {
            q: "How do you architect state for a multi-tab app where two tabs must stay in sync?",
            a: "Three layers. (1) Server is the source of truth — always. (2) Cross-tab notification via BroadcastChannel or storage events to invalidate caches when another tab mutates. (3) Optimistic UI locally with reconciliation on server confirm. Avoid: trying to share a Zustand store directly across tabs — it doesn't work without explicit serialisation. Avoid: polling. The architect wants to hear about CRDTs only if the use case requires concurrent editing — otherwise BroadcastChannel + react-query is fine.",
          },
          {
            q: "Why is the cart-count selector pattern faster than just reading the whole cart from context?",
            a: "Selectors give you fine-grained subscriptions. With context, every consumer re-renders on any cart change. With useSyncExternalStore(subscribe, () => cart.count), only consumers of `cart.count` re-render when the count specifically changes. Adding an item flips the count; replacing item names doesn't. The render reduction at the header (which only displays count) is N:1 where N is the number of cart-mutation operations.",
          },
        ]}
        pivots={[
          { to: "Concurrent rendering + tearing (Module 4)", why: "Senior interviewers will pivot from 'how does Zustand work?' to 'what happens under concurrent React?'" },
          { to: "Server cache (React Query / RSC)", why: "Once you say 'server cache', they'll probe for cache invalidation strategies." },
          { to: "Multi-tab sync", why: "BroadcastChannel, SharedWorker, storage events." },
        ]}
        dontSay={[
          {
            phrase: "Just use Redux for everything.",
            why: "Lazy. Redux is one option; context, useReducer, Zustand, Jotai, server cache all have niches. Senior interviewers want to see your decision tree.",
          },
          {
            phrase: "Context is for global state.",
            why: "Imprecise. Context is for VALUES that need to be available deep in the tree without prop drilling. 'Global state' usually wants a store with selectors.",
          },
          {
            phrase: "Tearing isn't a real problem.",
            why: "Tells the architect you've never debugged a concurrent rendering bug. They'll dig in until you concede or articulate the mechanism.",
          },
        ]}
      />

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

