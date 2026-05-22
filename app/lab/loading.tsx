import { SkelBar } from "@/shell/Skeleton";

/** Fallback for any /lab/* route that doesn't have its own loading.tsx. */
export default function LabLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <SkelBar w={160} h={10} />
      <div className="mt-3 space-y-2">
        <SkelBar w="55%" h={32} />
        <SkelBar w="35%" h={32} />
      </div>
      <div className="mt-6 space-y-1.5">
        <SkelBar w="90%" />
        <SkelBar w="80%" />
        <SkelBar w="70%" />
      </div>
    </div>
  );
}
