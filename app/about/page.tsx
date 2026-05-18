import type { Metadata } from "next";
import { LegalPage } from "@/legal/LegalPage";

export const metadata: Metadata = {
  title: "About · React Rendering Lab",
  description:
    "What the lab is, who built it, and the editorial principles behind the 25 modules.",
};

export default function AboutPage() {
  return (
    <LegalPage eyebrow="about" title="About this lab">
      <p>
        React Rendering Lab is a free, open-source teaching site that walks you through advanced
        React rendering, hydration, concurrency, SSR, and the full frontend systems surface — all
        anchored to a single intentionally-broken dashboard you watch get fixed one bottleneck
        at a time.
      </p>

      <h2>The premise</h2>
      <p>
        Most React courses teach concepts in isolation. The lab takes the opposite approach: one
        deliberately broken application, twenty-five fixes, every fix exposing the next
        bottleneck. The point is to <em>feel</em> the architectural evolution — the difference
        between knowing what <code>useMemo</code> does and knowing when it&apos;s the wrong
        answer.
      </p>

      <p>
        The whole journey runs in your browser. There&apos;s no server-side curriculum, no
        accounts, no progress tracking that follows you across devices. If you bookmark a module
        page and come back six months later, it&apos;ll behave exactly the same.
      </p>

      <h2>What&apos;s covered</h2>
      <ol>
        <li>
          <strong>Rendering internals</strong> (Modules 1-10) — reconciliation, diffing, fiber,
          concurrent rendering, time slicing, hydration, streaming SSR, suspense, islands,
          virtualisation.
        </li>
        <li>
          <strong>Modern React (19+)</strong> (Modules 11-15) — the Compiler, Server Components,
          Server Actions, the <code>use()</code> hook, Partial Prerendering.
        </li>
        <li>
          <strong>Frontend systems</strong> (Modules 16-25) — state architecture, browser
          pipeline, network, microfrontends, build, accessibility, observability, memory,
          security, and on-call incident response.
        </li>
      </ol>

      <h2>Editorial principles</h2>
      <ol>
        <li>
          <strong>No isolated toys.</strong> Concepts emerge from one evolving app. The Journey
          page is the literal payoff — same dashboard, eleven progressive states.
        </li>
        <li>
          <strong>Show the cost, not just the cure.</strong> Every fix exposes a new bottleneck.
          Frontend engineering is trading constraints, not eliminating them.
        </li>
        <li>
          <strong>Numbers, not vibes.</strong> The built-in profiler reads live FPS, render
          counts, commit durations. Whatever a module claims, the dock confirms or denies.
        </li>
        <li>
          <strong>Anti-patterns get equal time.</strong> When to <em>not</em> apply a pattern is
          half of being senior.
        </li>
        <li>
          <strong>Mobile-first.</strong> The lab is responsive top-to-bottom — every viz, every
          dock, every module page reflows under 360px.
        </li>
      </ol>

      <h2>Who built this</h2>
      <p>
        Hi — I&apos;m{" "}
        <a href="https://github.com/mithun9421" target="_blank" rel="noreferrer">
          Mithun
        </a>
        , a working software engineer. The lab is an open-source side project. If you find a bug,
        disagree with a claim, or want to contribute a module,{" "}
        <a href="https://github.com/mithun9421/react-rendering-lab/issues" target="_blank" rel="noreferrer">
          open an issue
        </a>
        .
      </p>

      <h2>How it&apos;s funded</h2>
      <p>
        Hosting + domain are paid from a small Google AdSense integration on the landing page,
        the lab sidebar (desktop only), and inside module pages between content blocks. Ads are
        deliberately placed where they don&apos;t fight with the lab&apos;s primary surface and
        never appear on policy pages. See{" "}
        <a href="/privacy">privacy policy</a> for details.
      </p>

      <h2>Tech stack</h2>
      <ul>
        <li>Next.js 15 (App Router)</li>
        <li>React 19</li>
        <li>TypeScript (strict)</li>
        <li>Tailwind CSS for styling</li>
        <li>Framer Motion for transitions</li>
        <li>Zustand for the profiler store</li>
        <li>No backend; statically rendered + a single Server Action route for the form demo in Module 13</li>
      </ul>

      <h2>License</h2>
      <p>
        Source: MIT. Written content: CC BY 4.0. See <a href="/terms">terms of use</a>.
      </p>
    </LegalPage>
  );
}
