import clsx from "clsx";

/** Pure CSS-animated skeleton block. Use for loading.tsx placeholders. */
export function SkelBar({
  w = "100%",
  h = 12,
  className,
}: {
  w?: string | number;
  h?: number;
  className?: string;
}) {
  return (
    <div
      className={clsx("rounded bg-bg-border/60 animate-pulse", className)}
      style={{ width: typeof w === "number" ? `${w}px` : w, height: h }}
    />
  );
}

export function SkelCard({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-lg border border-bg-border bg-bg-panel p-4 space-y-2", className)}>
      <SkelBar w="40%" h={10} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkelBar key={i} w={`${60 + ((i * 13) % 35)}%`} />
      ))}
    </div>
  );
}
