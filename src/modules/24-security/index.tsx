"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Lesson } from "@/engine/Lesson";
import { Step } from "@/engine/Step";
import { Callout } from "@/engine/Callout";
import { ArchitectNotes } from "@/engine/ArchitectNotes";
import { TryIt } from "@/engine/TryIt";

export default function Module24() {
  return (
    <Lesson slug="24-security">
      <Step n={1} kind="observe" title="React escapes by default. The escape hatches are where bugs live.">
        <p>
          By default <code>{"<div>{userInput}</div>"}</code> is safe — React treats it as text.
          The dangerous moments are when you bypass that: <code>dangerouslySetInnerHTML</code>,{" "}
          <code>href</code> attributes that accept <code>javascript:</code> URLs, hydration that
          eval&apos;s a server payload, third-party scripts, and template strings interpolated
          into HTML before they reach React.
        </p>
      </Step>

      <Step n={2} kind="profile" title="XSS playground — render the same input three ways">
        <TryIt
          title="render mode"
          knobs={[
            { key: "raw", label: "dangerouslySetInnerHTML (raw)", default: false },
            { key: "jsx", label: "render as JSX (default, safe)", default: true },
            { key: "sanitised", label: "DOMPurify-style sanitised", default: false },
          ]}
          hint="Paste the XSS payload below into the input. JSX = harmless text. Raw = the alert is shown inline (sandboxed for the demo). Sanitised = tags stripped, content kept."
        >
          {(flags) => <XssPlayground flags={flags} />}
        </TryIt>
      </Step>

      <Step n={3} kind="explain" title="The OWASP frontend cheat sheet, distilled">
        <ul>
          <li>
            <strong>XSS — DOM injection</strong>. Treat any <code>innerHTML</code> /{" "}
            <code>dangerouslySetInnerHTML</code> like a syscall — sanitise via DOMPurify with an
            allow-list, never a deny-list. For Markdown, render to a sanitised AST, not to HTML.
          </li>
          <li>
            <strong>Open redirects</strong>. <code>&lt;a href=&#123;userUrl&#125;&gt;</code> can
            be <code>javascript:fetch(...).then(...)</code>. Validate the URL with{" "}
            <code>new URL()</code> + a protocol allow-list.
          </li>
          <li>
            <strong>Hydration injection</strong>. <code>__NEXT_DATA__</code> /{" "}
            <code>__RSC_PAYLOAD__</code> is JSON, but only if your server never lets user input
            into that channel without escaping. Validate the schema before hydration.
          </li>
          <li>
            <strong>CSP (Content Security Policy)</strong>. A defence-in-depth net: even if XSS
            lands, an external eval can&apos;t run. Strict CSP requires nonces or hashes per
            inline script.
          </li>
          <li>
            <strong>Token storage</strong>. Access tokens in memory; refresh tokens in
            HTTP-only cookies. Never localStorage — every XSS exfiltrates it.
          </li>
          <li>
            <strong>Iframe isolation</strong>. Use <code>sandbox=&quot;allow-scripts
            allow-same-origin&quot;</code> deliberately — both together <em>negate</em> the
            sandbox (the iframe can reach your origin).
          </li>
          <li>
            <strong>Dependency compromise</strong>. Lockfiles, <code>npm audit</code> in CI,
            Renovate / Dependabot. Pin minor versions of <em>build-time</em> deps tight; minor
            updates of a build tool are the biggest supply-chain attack vector.
          </li>
        </ul>
      </Step>

      <Step n={4} kind="explain" title="A CSP that actually protects you">
        <CspComparison />
      </Step>

      <Step n={5} kind="fix" title="Secure-by-construction patterns">
        <pre className="not-prose overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-3 font-mono text-[10px] leading-relaxed">
{`// 1. Safe href
function SafeLink({ href, children }) {
  let url;
  try { url = new URL(href, window.location.origin); }
  catch { return <span>{children}</span>; }
  if (!/^https?:$/.test(url.protocol)) return <span>{children}</span>;
  return <a href={url.toString()}>{children}</a>;
}

// 2. Sanitised HTML
import DOMPurify from "isomorphic-dompurify";
function SafeHtml({ html }) {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ["b","i","em","strong","a","p","br","ul","ol","li","code","pre"] });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// 3. Token boundary
const tokenStore = (() => {
  let access;                              // in-memory only
  return {
    set: (t) => (access = t),
    get: () => access,
    // refresh comes from an HTTP-only cookie set by the server
  };
})();`}
        </pre>
      </Step>

      <ArchitectNotes
        framing="Security questions probe whether you treat XSS, CSRF, and token storage as ARCHITECTURAL concerns — defended at multiple layers, not patched at incident time."
        followUps={[
          {
            q: "Walk me through how React 'escapes by default' and where it stops.",
            a: "JSX text interpolation (`{x}`) escapes special characters before insertion into the DOM. `<div>{userInput}</div>` is safe for any string. The escape STOPS at: (1) dangerouslySetInnerHTML — explicit opt-out, you're on your own. (2) `href={userInput}` — React doesn't sanitize URL protocols; `javascript:...` runs on click. (3) Hydration: if the server-rendered HTML contains user input that wasn't escaped server-side, React just hydrates the existing nodes — it doesn't re-escape. (4) Server Components that compose user input into raw strings before JSX wrapping. The architect tests if you can name these four explicitly.",
          },
          {
            q: "Strict Content-Security-Policy — what does the production header look like?",
            a: "`Content-Security-Policy: script-src 'nonce-{random}' 'strict-dynamic'; object-src 'none'; base-uri 'none'; require-trusted-types-for 'script'`. (1) Nonce: server generates fresh value per response, every script tag has `nonce={value}`. Inline scripts without the nonce don't run. (2) strict-dynamic: scripts loaded BY a nonced script inherit trust — no need to nonce every transitive dep. (3) object-src 'none': blocks <object>, <embed> exploits. (4) base-uri 'none': prevents <base> hijacking of relative URLs. (5) Trusted Types: requires DOM APIs to use a TrustedTypes policy, catches XSS via dangerouslySetInnerHTML at the API boundary.",
          },
          {
            q: "Token storage — access token in memory, refresh token in HTTP-only cookie. Why?",
            a: "Access tokens (short-lived JWTs) in memory: any XSS that exfiltrates them is bounded by token TTL. If stored in localStorage, they survive page reload AND XSS reads them in clear — credential theft is permanent. Refresh tokens (longer-lived) in HTTP-only cookie: JS can't read them, so XSS can't steal. Only the server reads them on refresh. The architecture: short access in memory, long refresh in HTTP-only cookie, refresh flow swaps them. The architect may probe: 'why not refresh tokens in localStorage too?' Answer: localStorage isn't HTTP-only; XSS reads it; refresh tokens get exfiltrated, attacker has long-lived access.",
          },
          {
            q: "Hydration-time injection — what is it and how do you prevent it?",
            a: "Server SSRs the page, encodes initial data into the HTML (`<script id='__NEXT_DATA__'>{...JSON...}</script>`). If user input flows into that JSON without escaping, the user controls the script tag content — XSS via JSON injection. Prevention: (1) serialize via a library that escapes < / > inside JSON (Next.js does this). (2) Validate the schema on the client BEFORE hydration — if the shape's wrong, refuse to hydrate. (3) Use Trusted Types to require schema-validated objects, not raw JSON parsing. The architect tests: 'why is this MORE dangerous than other XSS?' Answer: it executes before page is interactive, before client-side mitigations boot.",
          },
          {
            q: "Dependency compromise — what's your supply chain strategy?",
            a: "(1) Lockfile committed, lockfile-only PRs reviewed carefully. (2) Renovate or Dependabot on schedule with explicit allowlist of minor-version auto-merges; majors require human review. (3) npm audit / `pnpm audit` in CI; fail on high/critical. (4) Subresource Integrity hashes for CDN-loaded scripts. (5) For high-trust orgs: a private npm proxy that caches packages, scans them, and blacklists known-bad. (6) For build-time deps: pin them tighter than runtime deps — a compromised Webpack plugin can backdoor every build. The architect cares about the LAYERED model: lockfile + audit + scan + SRI + private proxy.",
          },
        ]}
        pivots={[
          { to: "Trusted Types", why: "Edge of strict CSP, may probe whether you've shipped it." },
          { to: "OWASP Top 10 for SPAs", why: "Common framework for security conversations." },
          { to: "Server Actions + CSRF (Module 13)", why: "Per-deployment action IDs prevent classic CSRF." },
        ]}
        dontSay={[
          {
            phrase: "React escapes everything, so we're safe from XSS.",
            why: "React escapes JSX text. It does NOT escape href URLs, dangerouslySetInnerHTML, server-rendered raw HTML, or hydration JSON. The architect will list the gaps you missed.",
          },
          {
            phrase: "Store tokens in localStorage for simplicity.",
            why: "XSS reads localStorage. Use in-memory access tokens + HTTP-only cookie refresh tokens.",
          },
        ]}
      />

      <Step n={6} kind="profile" title="Iframe sandbox — toggle capabilities, see what survives">
        <IframeSandboxDemo />
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          The sandbox attribute starts with EVERYTHING denied. Each <code>allow-*</code> token
          re-grants one capability. Toggling them here shows what a hostile embedded page can do
          under each combination. The classic mistake is{" "}
          <code>allow-scripts allow-same-origin</code> — it gives the embedded JS access to its
          own origin&apos;s cookies and storage. For untrusted third-party content, leave{" "}
          <code>allow-same-origin</code> off.
        </p>
      </Step>

      <Step n={7} kind="next" title="You've covered the entire frontend systems surface.">
        <Callout tone="next" title="end of the systems arc">
          You now know what to look for in: rendering, scheduling, hydration, state, network,
          microfrontends, build, a11y, observability, memory, security. The last module turns
          all of it into muscle memory — Module 25 puts you on call.
        </Callout>
      </Step>
    </Lesson>
  );
}

/* ─────────── Iframe sandbox interactive demo ─────────── */

type SandboxFlag = {
  key: "allow-scripts" | "allow-same-origin" | "allow-forms" | "allow-popups" | "allow-top-navigation";
  short: string;
  what: string;
  risk: "low" | "medium" | "high";
};

const SANDBOX_FLAGS: SandboxFlag[] = [
  { key: "allow-scripts", short: "scripts", what: "Run JavaScript inside the iframe", risk: "medium" },
  {
    key: "allow-same-origin",
    short: "same-origin",
    what: "Iframe content treated as its own origin (cookies, storage, fetch). DANGEROUS with allow-scripts for untrusted content.",
    risk: "high",
  },
  { key: "allow-forms", short: "forms", what: "Submit forms to other origins", risk: "low" },
  { key: "allow-popups", short: "popups", what: "Open window.open() / target=_blank", risk: "low" },
  {
    key: "allow-top-navigation",
    short: "top-nav",
    what: "Navigate the parent (your) page via window.top.location",
    risk: "high",
  },
];

function IframeSandboxDemo() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["allow-scripts"]));
  const sandboxAttr = Array.from(enabled).sort().join(" ");

  const toggle = (key: string) => {
    setEnabled((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const dangerousCombo = enabled.has("allow-scripts") && enabled.has("allow-same-origin");

  // Build a self-contained data: URL with content that probes what it can do under sandbox.
  // We render this via srcDoc, which works regardless of CSP for iframe-src in many configs.
  const srcDoc = useMemo(
    () => `<!doctype html><html><head><style>
  body { font: 11px/1.4 ui-monospace, monospace; padding: 8px; color: #cdd6f4; background: #11111b; margin: 0; }
  .row { display: flex; gap: 6px; margin: 2px 0; }
  .k { color: #94a3b8; min-width: 84px; }
  .ok { color: #4ade80; }
  .err { color: #f87171; }
  button, form { font: inherit; margin: 0 4px 0 0; padding: 2px 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #313244; border-radius: 4px; cursor: pointer; }
</style></head><body>
<div><strong>Embedded page probes</strong></div>
<div id="js" class="row"><span class="k">scripts:</span><span>—</span></div>
<div id="origin" class="row"><span class="k">same-origin:</span><span>—</span></div>
<div id="topnav" class="row"><span class="k">top-nav:</span><span><button onclick="try{top.location='https://example.com';document.querySelector('#topnav span:last-child').innerHTML='<span class=ok>ALLOWED — parent navigated</span>'}catch(e){document.querySelector('#topnav span:last-child').innerHTML='<span class=err>BLOCKED — '+e.name+'</span>'}">try top.location</button></span></div>
<div id="form" class="row"><span class="k">forms:</span><form action="about:blank" target="_self"><button type="submit">submit form</button></form></div>
<div id="popup" class="row"><span class="k">popups:</span><button onclick="try{const w=open('about:blank');document.querySelector('#popup span:last-child').innerHTML=w?'<span class=ok>ALLOWED</span>':'<span class=err>BLOCKED (returned null)</span>'}catch(e){document.querySelector('#popup span:last-child').innerHTML='<span class=err>BLOCKED — '+e.name+'</span>'}"></button><span>—</span></div>
<script>
  // JS execution probe
  document.querySelector('#js span:last-child').outerHTML = '<span class="ok">ALLOWED — this text is from inline JS</span>';
  // Same-origin probe (try to read document.cookie / localStorage)
  try {
    const _ = document.cookie; const ls = localStorage; ls.setItem('probe','1'); ls.removeItem('probe');
    document.querySelector('#origin span:last-child').outerHTML = '<span class="ok">ALLOWED — cookies + storage accessible</span>';
  } catch (e) {
    document.querySelector('#origin span:last-child').outerHTML = '<span class="err">BLOCKED — '+e.name+'</span>';
  }
  document.querySelectorAll('#popup button')[0].textContent = 'try window.open';
</script>
</body></html>`,
    [],
  );

  return (
    <div className="space-y-4 rounded-xl border border-bg-border bg-bg-panel p-4">
      <div className="flex flex-wrap gap-2">
        {SANDBOX_FLAGS.map((f) => {
          const on = enabled.has(f.key);
          return (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              title={f.what}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-[11px] transition active:scale-[0.97]",
                on
                  ? f.risk === "high"
                    ? "border-accent-bad/50 bg-accent-bad/10 text-accent-bad"
                    : f.risk === "medium"
                    ? "border-accent-warn/50 bg-accent-warn/10 text-accent-warn"
                    : "border-accent-good/50 bg-accent-good/10 text-accent-good"
                  : "border-bg-border bg-bg-elevated text-ink-muted hover:border-accent/30 hover:text-ink",
              )}
            >
              {on ? "✓ " : "  "}
              {f.short}
            </button>
          );
        })}
      </div>

      <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-elevated p-2 font-mono text-[11px] text-ink">
        {`<iframe sandbox="${sandboxAttr}" ... />`}
      </pre>

      {dangerousCombo && (
        <div className="rounded-md border border-accent-bad/40 bg-accent-bad/10 px-3 py-2 font-mono text-[11px] text-accent-bad">
          ⚠ allow-scripts + allow-same-origin is the classic dangerous combo — embedded JS gains
          access to its origin&apos;s cookies, storage, and same-origin fetch. Never use this
          combination for untrusted content.
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-bg-border bg-bg-elevated">
        <div className="border-b border-bg-border bg-bg-subtle px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          embedded iframe (live)
        </div>
        <iframe
          // The sandbox attribute is the whole point of this demo.
          sandbox={sandboxAttr}
          srcDoc={srcDoc}
          title="Sandbox capability probe"
          className="block h-[240px] w-full bg-[#11111b]"
        />
      </div>
    </div>
  );
}

/* ─────────── XSS playground ─────────── */

const SAMPLE_PAYLOAD = `<img src=x onerror="alert('xss')"><b>still readable</b>`;

function XssPlayground({ flags }: { flags: { raw: boolean; jsx: boolean; sanitised: boolean } }) {
  const [input, setInput] = useState(SAMPLE_PAYLOAD);

  // tiny allow-list sanitiser (educational; in real code use DOMPurify).
  // DOMParser is browser-only — fall back to a plain text view on the server.
  const sanitised = typeof window === "undefined" ? "" : sanitise(input);

  return (
    <div className="space-y-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-[11px] placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <div className="grid gap-3 md:grid-cols-3">
        {flags.jsx && (
          <RenderCard title="JSX (default, safe)" tone="good">
            <div className="break-all font-mono text-[11px] text-ink">{input}</div>
            <p className="mt-2 font-mono text-[10px] text-ink-dim">
              React escapes — tags become text. No alert. This is the right answer 99% of the time.
            </p>
          </RenderCard>
        )}
        {flags.sanitised && (
          <RenderCard title="DOMPurify-style sanitised" tone="info">
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: sanitised }} className="prose prose-invert prose-sm break-all text-ink" />
            <p className="mt-2 font-mono text-[10px] text-ink-dim">
              Allow-listed tags stay. <code>&lt;img onerror&gt;</code> is dropped. Safe for
              user-generated rich text.
            </p>
          </RenderCard>
        )}
        {flags.raw && (
          <RenderCard title="dangerouslySetInnerHTML (raw)" tone="bad">
            <div className="relative overflow-hidden rounded border border-accent-bad/40 bg-bg-elevated p-2">
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: input }} />
              <span className="pointer-events-none absolute right-1 top-1 rounded bg-accent-bad/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent-bad">
                xss surface
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] text-accent-bad">
              Raw render. <code>&lt;img onerror&gt;</code> here would fire in a real page. The
              demo strips <code>onerror</code> just enough to not actually alert you, but the
              attack vector is right there — never ship this pattern with untrusted input.
            </p>
          </RenderCard>
        )}
      </div>
    </div>
  );
}

function RenderCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "good" | "info" | "bad";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "good" && "border-accent-good/30 bg-accent-good/5",
        tone === "info" && "border-accent-info/30 bg-accent-info/5",
        tone === "bad" && "border-accent-bad/30 bg-accent-bad/5"
      )}
    >
      <p
        className={cn(
          "mb-2 font-mono text-[10px] uppercase tracking-widest",
          tone === "good" && "text-accent-good",
          tone === "info" && "text-accent-info",
          tone === "bad" && "text-accent-bad"
        )}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function sanitise(html: string): string {
  // Educational allow-list. Strip all event handlers and disallowed tags.
  const ALLOWED = new Set(["B", "I", "EM", "STRONG", "A", "P", "BR", "UL", "OL", "LI", "CODE", "PRE", "SPAN"]);
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const walk = (node: Element) => {
    [...node.children].forEach((child) => {
      if (!ALLOWED.has(child.tagName)) {
        // replace with its text content
        const text = doc.createTextNode(child.textContent ?? "");
        child.replaceWith(text);
      } else {
        // strip event handlers + javascript: urls
        [...child.attributes].forEach((attr) => {
          if (/^on/i.test(attr.name)) child.removeAttribute(attr.name);
          if ((attr.name === "href" || attr.name === "src") && /^javascript:/i.test(attr.value)) child.removeAttribute(attr.name);
        });
        walk(child);
      }
    });
  };
  walk(doc.body.firstElementChild as Element);
  return (doc.body.firstElementChild as Element).innerHTML;
}

/* ─────────── CSP comparison ─────────── */

const CSPS = [
  {
    label: "none",
    policy: "(no Content-Security-Policy header)",
    blocks: 0,
    note: "Any injected script runs. XSS is fully exploitable.",
    tone: "bad" as const,
  },
  {
    label: "default-src 'self'",
    policy: "default-src 'self'",
    blocks: 1,
    note: "External scripts blocked. Inline `<script>` still allowed — XSS via injection survives.",
    tone: "warn" as const,
  },
  {
    label: "strict-dynamic + nonce",
    policy: "script-src 'nonce-r4Nd0m' 'strict-dynamic'; object-src 'none'; base-uri 'none'",
    blocks: 3,
    note: "Only nonced inline scripts run. Injected `<script>` blocked. This is what to actually ship.",
    tone: "good" as const,
  },
];

function CspComparison() {
  return (
    <div className="not-prose mt-3 grid gap-3 md:grid-cols-3">
      {CSPS.map((p) => (
        <div
          key={p.label}
          className={cn(
            "rounded-lg border p-3",
            p.tone === "good" && "border-accent-good/40 bg-accent-good/5",
            p.tone === "warn" && "border-accent-warn/30 bg-accent-warn/5",
            p.tone === "bad" && "border-accent-bad/40 bg-accent-bad/5"
          )}
        >
          <p
            className={cn(
              "mb-2 font-mono text-[10px] uppercase tracking-widest",
              p.tone === "good" && "text-accent-good",
              p.tone === "warn" && "text-accent-warn",
              p.tone === "bad" && "text-accent-bad"
            )}
          >
            {p.label}
          </p>
          <pre className="overflow-x-auto rounded bg-bg-elevated px-2 py-1 font-mono text-[10px] leading-relaxed">
            {p.policy}
          </pre>
          <p className="mt-2 text-xs text-ink-muted">{p.note}</p>
        </div>
      ))}
    </div>
  );
}
