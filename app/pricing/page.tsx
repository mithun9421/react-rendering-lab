import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/shell/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing · React Rendering Lab",
  description:
    "Free forever for Foundations + core React rendering. Pro unlocks the Staff+ modules, full interview bank, and certifications.",
};

/**
 * /pricing — three columns: Free, Pro Lifetime ($39), Pro Monthly ($19).
 *
 * Checkout buttons are env-gated. Without NEXT_PUBLIC_POLAR_CHECKOUT_LIFETIME
 * + NEXT_PUBLIC_POLAR_CHECKOUT_MONTHLY set, the buttons read 'Coming soon'.
 * This is the Phase 2 wiring point — drop in the Polar checkout URLs and ship.
 */
export default function PricingPage() {
  const lifetimeUrl = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_LIFETIME;
  const monthlyUrl = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_MONTHLY;
  const live = Boolean(lifetimeUrl && monthlyUrl);

  return (
    <main className="relative min-h-screen overflow-x-hidden grid-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(ellipse_at_top,rgba(124,92,255,0.18),transparent_60%)]" />

      <article className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <header className="mb-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">pricing</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-5xl">
            Free forever for the basics.
            <br />
            <span className="text-ink-muted">Pro for the Staff+ material.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            All 11 Foundations and the first 8 Core modules stay free — that&apos;s most of what
            working React devs need. Pro unlocks the rest, including the full interview bank,
            all incident scenarios, and LinkedIn-shareable certificates.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Tier
            name="Free"
            price="$0"
            sub="forever"
            cta={{ href: "/lab/01-reconciliation", label: "Start free →" }}
            tone="muted"
            features={[
              "All 11 Foundations (F01-F11)",
              "Core modules 01-08 (Reconciliation → Suspense)",
              "Journey route (the 11-stage tour)",
              "30% rotating sample of the interview bank",
              "Daily challenge",
              "1 streak-freeze / month",
              "Ad-supported (Google AdSense)",
            ]}
          />
          <Tier
            name="Pro Lifetime"
            price="$39"
            sub="one-time, all future modules included"
            cta={
              live
                ? { href: lifetimeUrl!, label: "Buy lifetime →", external: true }
                : { href: "#", label: "Coming soon — early-access list" }
            }
            tone="accent"
            highlighted
            features={[
              "Everything in Free",
              "Core modules 09-25 (Islands → Incident Simulator)",
              "Full 200-question interview bank with rationale",
              "All 6 incident-simulator scenarios",
              "Spaced-repetition review queue",
              "Unlimited streak freezes",
              "LinkedIn-shareable certificates",
              "Ad-free",
              "Future modules included — no upsells",
            ]}
          />
          <Tier
            name="Pro Monthly"
            price="$19"
            sub="per month, cancel anytime"
            cta={
              live
                ? { href: monthlyUrl!, label: "Start monthly →", external: true }
                : { href: "#", label: "Coming soon — early-access list" }
            }
            tone="info"
            features={[
              "Everything in Pro Lifetime",
              "Auto-converts to lifetime after 12 months paid",
              "Cancel from the customer portal anytime",
              "Use it for a job-search sprint, then cancel",
            ]}
          />
        </div>

        <p className="mt-8 text-center font-mono text-[11px] text-ink-dim">
          Polar.sh handles payment + VAT globally as the Merchant of Record. We don&apos;t
          touch your card.
        </p>

        <section className="mt-16">
          <h2 className="text-xl font-medium">Questions</h2>
          <div className="mt-6 space-y-3">
            <FaqItem q="Is the free tier going to shrink later?" a="No. The free split is committed — see MONETISATION.md in the repo. Shrinking free tier would destroy the SEO + word-of-mouth that's the lab's whole growth model." />
            <FaqItem q="Why not a $9/mo tier?" a="Research consistently shows $9/mo under-values dev tools and attracts low-quality users. The lab's audience is working engineers; $19 is the floor that signals 'serious learning resource.'" />
            <FaqItem q="What happens if I stop paying monthly?" a="Pro features lock; your progress + completed lessons stay. Re-subscribe anytime to resume Pro. Lifetime buyers keep Pro forever, including all future modules." />
            <FaqItem q="Can my company buy seats?" a="Not yet. Team licenses (Slack-style invites, admin dashboard, central billing) ship after 50+ individual Pro customers. Email if you want to be on the team-tier waitlist." />
            <FaqItem q="Refund policy?" a="14 days, no questions. The lab is content; if it didn't help, we'd rather refund and improve than argue." />
            <FaqItem q="What about students / OSS maintainers?" a="50% off for verified students (GitHub Student Pack) and any OSS maintainer with ≥1k GitHub stars on a public project. Email after purchase with proof and we'll refund the difference." />
          </div>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}

function Tier({
  name,
  price,
  sub,
  features,
  cta,
  tone,
  highlighted,
}: {
  name: string;
  price: string;
  sub: string;
  features: string[];
  cta: { href: string; label: string; external?: boolean };
  tone: "muted" | "accent" | "info";
  highlighted?: boolean;
}) {
  const palette =
    tone === "accent"
      ? "border-accent/40"
      : tone === "info"
      ? "border-accent-info/30"
      : "border-bg-border";
  const cardBg = highlighted ? "bg-gradient-to-b from-accent/[0.08] to-transparent" : "bg-bg-panel";

  const CtaTag = cta.external ? "a" : (Link as unknown as "a");
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border ${palette} ${cardBg} p-6 ${
        highlighted ? "shadow-glass" : ""
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
          most popular
        </span>
      )}
      <h3 className="text-sm font-medium uppercase tracking-widest text-ink-muted">{name}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-medium text-ink">{price}</span>
        <span className="font-mono text-[11px] text-ink-dim">{sub}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-ink-muted">
            <span className="mt-0.5 text-accent-good">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <CtaTag
          href={cta.href}
          {...(cta.external ? { target: "_blank", rel: "noreferrer" } : {})}
          className={`block rounded-md px-4 py-2.5 text-center text-sm font-medium ${
            highlighted
              ? "bg-accent text-white shadow-glass hover:brightness-110"
              : "border border-bg-border bg-bg-elevated text-ink hover:bg-bg-panel"
          }`}
        >
          {cta.label}
        </CtaTag>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-lg border border-bg-border bg-bg-panel p-4 open:border-accent/40">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-ink">
        <span>{q}</span>
        <span className="font-mono text-[11px] text-ink-dim group-open:text-accent">+</span>
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{a}</p>
    </details>
  );
}
