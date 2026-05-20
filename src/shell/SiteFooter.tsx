"use client";

import Link from "next/link";

/**
 * Shared footer rendered on every public page. Carries the policy + about links
 * that AdSense reviewers (and humans) look for. Also reopens the cookie consent
 * banner via a custom event so users can change their mind.
 */
export function SiteFooter() {
  return (
    <footer className="relative mx-auto max-w-6xl border-t border-bg-border px-4 py-6 text-xs text-ink-dim sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono">
          react-rendering-lab · MIT · built by{" "}
          <a
            href="https://github.com/mithun9421"
            target="_blank"
            rel="noreferrer"
            className="text-ink hover:text-accent"
          >
            @mithun9421
          </a>
        </span>
        <nav className="flex flex-wrap gap-3">
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Contact
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("rrl:consent-reopen"))}
            className="hover:text-ink"
          >
            Cookie preferences
          </button>
          <a
            href="https://github.com/mithun9421/react-rendering-lab"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
