import { SkelBar, SkelCard } from "@/shell/Skeleton";

export default function JourneyLoading() {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6">
        <SkelBar w={180} h={10} />
        <div className="mt-3 space-y-2">
          <SkelBar w="55%" h={32} />
          <SkelBar w="40%" h={32} />
        </div>
        <div className="mt-4 space-y-1.5">
          <SkelBar w="85%" />
          <SkelBar w="60%" />
        </div>
      </header>

      {/* Controls skeleton */}
      <div className="mb-6 rounded-lg border border-bg-border bg-bg-panel p-3">
        <div className="flex items-center gap-3">
          <SkelBar w={40} h={10} />
          <SkelBar w="40%" h={20} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {Array.from({ length: 11 }).map((_, i) => (
            <SkelBar key={i} w={140} h={20} />
          ))}
        </div>
      </div>

      {/* Two dashboard skeleton panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-bg-border bg-bg-panel">
            <div className="flex items-center justify-between border-b border-bg-border px-3 py-2">
              <SkelBar w={120} />
              <SkelBar w={80} />
            </div>
            <div className="space-y-3 p-3">
              <SkelCard rows={3} />
              <SkelCard rows={3} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
