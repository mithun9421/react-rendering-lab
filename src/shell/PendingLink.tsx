"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * <PendingLink/> — a Link that shows a tiny spinner while the route is loading.
 *
 * Uses React 19's `useLinkStatus()` (Next.js exposes it as `next/link`'s named
 * export of the same name). It returns `{ pending: boolean }` whenever the link
 * has been clicked and the new route hasn't finished rendering yet.
 *
 * The status hook MUST be called from a child of the Link — not from the Link
 * itself. We wrap the user's children so the status hook sees the right context.
 */
export function PendingLink({
  href,
  className,
  children,
  prefetch,
  pendingClassName,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  prefetch?: boolean;
  /** Extra classes applied while pending — e.g. dim, disable pointer events. */
  pendingClassName?: string;
}) {
  return (
    <Link href={href} prefetch={prefetch} className={className}>
      <PendingContent pendingClassName={pendingClassName}>{children}</PendingContent>
    </Link>
  );
}

function PendingContent({
  children,
  pendingClassName,
}: {
  children: React.ReactNode;
  pendingClassName?: string;
}) {
  const { pending } = useLinkStatus();
  return (
    <span className={cn("inline-flex items-center gap-2", pending && (pendingClassName ?? "opacity-70"))}>
      {children}
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
    </span>
  );
}
