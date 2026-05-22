import { SkelBar, SkelCard } from "@/shell/Skeleton";
import { LoadingGame } from "@/games/LoadingGame";

/**
 * Module page skeleton. Matches the real <Lesson/> layout closely so when the
 * skeleton is replaced there's no jolt — title in roughly the same place, step
 * column with the same gutter, etc.
 */
export default function ModuleLoading() {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <LoadingGame subtitle="fetching the lesson…" />
      <header className="mb-8 sm:mb-10">
        <SkelBar w={160} h={10} />
        <div className="mt-3 space-y-2">
          <SkelBar w="60%" h={32} />
          <SkelBar w="40%" h={32} />
        </div>
        <div className="mt-4 space-y-1.5">
          <SkelBar w="80%" />
          <SkelBar w="70%" />
        </div>
      </header>

      <div className="space-y-8 sm:space-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <section key={i} className="grid grid-cols-[28px_1fr] gap-3 sm:grid-cols-[40px_1fr] sm:gap-4">
            <div className="flex flex-col items-center">
              <div className="size-7 rounded-full border border-bg-border bg-bg-panel sm:size-8" />
              <div className="mt-2 w-px flex-1 bg-bg-border" />
            </div>
            <div className="space-y-2 pb-2">
              <SkelBar w="30%" h={14} />
              <SkelBar w="92%" />
              <SkelBar w="86%" />
              <SkelBar w="74%" />
              {i === 1 && <SkelCard className="mt-2" rows={4} />}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
