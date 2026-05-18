import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { moduleBySlug, MODULES } from "@/modules/registry";
import { MODULE_COMPONENTS } from "@/modules/components";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://react-rendering-lab.vercel.app";

// Module 8 + 14 deliberately throw inside Suspense to teach error boundaries —
// those throws break static prerender. Server-render module pages on demand
// instead. Google's crawler treats SSR identical to SSG for indexing, and the
// per-route generateMetadata below is what AdSense actually cares about.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module: slug } = await params;
  const def = moduleBySlug(slug);
  if (!def) return {};
  const idx = MODULES.findIndex((m) => m.slug === slug);
  const number = String(idx + 1).padStart(2, "0");
  const title = `Module ${number} · ${def.title} — React Rendering Lab`;
  const description = def.hook;
  const url = `${SITE_URL}/lab/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "React Rendering Lab",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const def = moduleBySlug(slug);
  if (!def) notFound();

  const Component = MODULE_COMPONENTS[slug];
  if (!Component) {
    return <ComingSoon title={def.title} hook={def.hook} />;
  }
  return <Component />;
}

function ComingSoon({ title, hook }: { title: string; hook: string }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">Coming soon</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">{title}</h1>
      <p className="mt-3 text-ink-muted">{hook}</p>
      <div className="mt-8 rounded-lg border border-dashed border-bg-border bg-bg-panel p-5 text-sm text-ink-muted">
        This module is scaffolded — its visualization and interactive steps are queued. The bottleneck chain
        already references it from earlier modules.
      </div>
    </section>
  );
}
