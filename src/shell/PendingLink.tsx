"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import clsx from "clsx";

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
    <span className={clsx("inline-flex items-center gap-2", pending && (pendingClassName ?? "opacity-70"))}>
      {children}
      {pending && <Spinner />}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="size-3.5 animate-spin"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
