import { SkelBar, SkelCard } from "@/shell/Skeleton";

export default function InterviewLoading() {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <SkelBar w={180} h={10} />
      <div className="mt-3 space-y-2">
        <SkelBar w="55%" h={32} />
        <SkelBar w="35%" h={32} />
      </div>
      <div className="mt-4 space-y-2">
        <SkelBar w="85%" />
        <SkelBar w="65%" />
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkelCard key={i} rows={2} />
        ))}
      </div>
      <SkelCard className="mt-6" rows={6} />
    </article>
  );
}
