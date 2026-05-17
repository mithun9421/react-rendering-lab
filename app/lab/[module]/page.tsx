import { notFound } from "next/navigation";
import { moduleBySlug } from "@/modules/registry";
import { MODULE_COMPONENTS } from "@/modules/components";

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
