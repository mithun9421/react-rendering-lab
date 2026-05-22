import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SiteFooter } from "@/shell/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing · React Rendering Lab",
  description:
    "Free forever for Foundations + core React rendering. Pro unlocks the Staff+ modules, full interview bank, and certifications.",
};

interface Cta {
  href: string;
  label: string;
  external?: boolean;
}

interface TierData {
  name: string;
  price: string;
  sub: string;
  features: string[];
  cta: Cta;
  highlighted?: boolean;
}

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Is the free tier going to shrink later?",
    a: "No. The free split is committed — see MONETISATION.md in the repo. Shrinking free tier would destroy the SEO + word-of-mouth that's the lab's whole growth model.",
  },
  {
    q: "Why not a $9/mo tier?",
    a: "Research consistently shows $9/mo under-values dev tools and attracts low-quality users. The lab's audience is working engineers; $19 is the floor that signals 'serious learning resource.'",
  },
  {
    q: "What happens if I stop paying monthly?",
    a: "Pro features lock; your progress + completed lessons stay. Re-subscribe anytime to resume Pro. Lifetime buyers keep Pro forever, including all future modules.",
  },
  {
    q: "Can my company buy seats?",
    a: "Not yet. Team licenses (Slack-style invites, admin dashboard, central billing) ship after 50+ individual Pro customers. Email if you want to be on the team-tier waitlist.",
  },
  {
    q: "Refund policy?",
    a: "14 days, no questions. The lab is content; if it didn't help, we'd rather refund and improve than argue.",
  },
  {
    q: "What about students / OSS maintainers?",
    a: "50% off for verified students (GitHub Student Pack) and any OSS maintainer with ≥1k GitHub stars on a public project. Email after purchase with proof and we'll refund the difference.",
  },
];

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

  const tiers: TierData[] = [
    {
      name: "Free",
      price: "$0",
      sub: "forever",
      cta: { href: "/lab/01-reconciliation", label: "Start free" },
      features: [
        "All 11 Foundations (F01-F11)",
        "Core modules 01-08 (Reconciliation → Suspense)",
        "Journey route (the 11-stage tour)",
        "30% rotating sample of the interview bank",
        "Daily challenge",
        "1 streak-freeze / month",
        "Ad-supported (Google AdSense)",
      ],
    },
    {
      name: "Pro Lifetime",
      price: "$39",
      sub: "one-time · all future modules included",
      cta: live
        ? { href: lifetimeUrl!, label: "Buy lifetime", external: true }
        : { href: "#", label: "Coming soon — early-access list" },
      highlighted: true,
      features: [
        "Everything in Free",
        "Core modules 09-25 (Islands → Incident Simulator)",
        "Full 200-question interview bank with rationale",
        "All 6 incident-simulator scenarios",
        "Spaced-repetition review queue",
        "Unlimited streak freezes",
        "LinkedIn-shareable certificates",
        "Ad-free",
        "Future modules included — no upsells",
      ],
    },
    {
      name: "Pro Monthly",
      price: "$19",
      sub: "per month · cancel anytime",
      cta: live
        ? { href: monthlyUrl!, label: "Start monthly", external: true }
        : { href: "#", label: "Coming soon — early-access list" },
      features: [
        "Everything in Pro Lifetime",
        "Auto-converts to lifetime after 12 months paid",
        "Cancel from the customer portal anytime",
        "Use it for a job-search sprint, then cancel",
      ],
    },
  ];

  return (
    <main className="relative min-h-screen overflow-x-hidden grid-bg">
      <article className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <header className="mb-12 text-center">
          <p className="text-xs font-medium tracking-tight text-accent">Pricing</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-ink sm:text-5xl">
            Free forever for the basics.
            <br />
            <span className="text-ink-muted">Pro for the Staff+ material.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            All 11 Foundations and the first 8 Core modules stay free — that&apos;s
            most of what working React devs need. Pro unlocks the rest, including
            the full interview bank, all incident scenarios, and LinkedIn-shareable
            certificates.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
          {tiers.map((tier) => (
            <Tier key={tier.name} tier={tier} />
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-ink-dim">
          <Badge variant="secondary">Polar.sh</Badge>
          <span>
            handles payment + VAT globally as the Merchant of Record. We don&apos;t
            touch your card.
          </span>
        </p>

        <section className="mt-16">
          <h2 className="text-xl font-medium tracking-tight text-ink">Questions</h2>
          <Accordion type="single" collapsible className="mt-4 w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-ink">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}

function Tier({ tier }: { tier: TierData }) {
  const { name, price, sub, features, cta, highlighted } = tier;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col rounded-lg transition-colors duration-150 ease-out",
        highlighted
          ? "border-accent/50 ring-1 ring-accent/30"
          : "border-bg-border"
      )}
    >
      {highlighted && (
        <Badge
          variant="default"
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md px-2.5 py-0.5 text-[11px]"
        >
          Most popular
        </Badge>
      )}

      <CardHeader className="pb-3">
        <h3 className="text-sm font-medium tracking-tight text-ink-muted">
          {name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-medium tabular-nums tracking-tight text-ink">
            {price}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-dim">{sub}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-ink-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-accent-good" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          asChild
          size="lg"
          variant={highlighted ? "default" : "outline"}
          className="w-full"
        >
          {cta.external ? (
            <a href={cta.href} target="_blank" rel="noreferrer">
              {cta.label}
            </a>
          ) : (
            <Link href={cta.href}>{cta.label}</Link>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
