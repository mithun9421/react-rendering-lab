"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  DEFAULT_DENIED,
  ESSENTIAL_ONLY,
  FULL_GRANT,
  installConsentDefault,
  readSavedConsent,
  updateConsent,
  type ConsentState,
} from "./consentMode";

/**
 * First-visit cookie consent banner. Reads saved consent (returning visitors
 * never see it). Three actions:
 *   - Accept all      → grants ads + personalization + analytics
 *   - Reject non-essential → keeps everything denied; non-personalized ads only
 *   - Manage          → opens a small inline panel with per-category toggles
 *
 * The banner is bottom-pinned so it doesn't disrupt the hero. Mobile-first.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [state, setState] = useState<ConsentState>(DEFAULT_DENIED);

  // Install Consent Mode v2 default-denied as early as we can, then decide whether to surface the banner.
  useEffect(() => {
    installConsentDefault();
    const saved = readSavedConsent();
    if (!saved) {
      // Show banner on next paint so it doesn't fight the hero animation.
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
    setState(saved);
  }, []);

  // Allow the footer link to re-open the banner.
  useEffect(() => {
    const onReopen = () => {
      setOpen(true);
      setManaging(true);
    };
    window.addEventListener("rrl:consent-reopen", onReopen);
    return () => window.removeEventListener("rrl:consent-reopen", onReopen);
  }, []);

  const acceptAll = () => {
    setState(FULL_GRANT);
    updateConsent(FULL_GRANT);
    setOpen(false);
  };
  const rejectAll = () => {
    setState(ESSENTIAL_ONLY);
    updateConsent(ESSENTIAL_ONLY);
    setOpen(false);
  };
  const saveCustom = () => {
    updateConsent(state);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 26 }}
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-2 bottom-2 z-[60] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md"
        >
          <div className="glass overflow-hidden rounded-xl border border-bg-border shadow-glass">
            <div className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                cookies + ads
              </p>
              <h2 className="mt-1 text-sm font-medium text-ink">
                We&apos;d like to use cookies to fund the lab
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                We use Google AdSense to show ads in three spots and pay for hosting. With your
                permission we&apos;ll let AdSense personalize what you see — otherwise you&apos;ll
                still see ads, just generic ones. Either way, no personal account is required to
                use the lab. Read our{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  privacy policy
                </Link>
                .
              </p>

              {managing && (
                <div className="mt-3 space-y-2 rounded-md border border-bg-border bg-bg-elevated p-3">
                  <Toggle
                    label="Ad cookies"
                    desc="Lets ads pay better by remembering ad frequency caps and clicks."
                    checked={state.ad_storage === "granted"}
                    onChange={(v) =>
                      setState((s) => ({
                        ...s,
                        ad_storage: v ? "granted" : "denied",
                        ad_user_data: v ? "granted" : "denied",
                      }))
                    }
                  />
                  <Toggle
                    label="Ad personalization"
                    desc="Tailors ads to topics you've shown interest in."
                    checked={state.ad_personalization === "granted"}
                    onChange={(v) => setState((s) => ({ ...s, ad_personalization: v ? "granted" : "denied" }))}
                  />
                  <Toggle
                    label="Analytics"
                    desc="Helps us understand which modules people actually read."
                    checked={state.analytics_storage === "granted"}
                    onChange={(v) => setState((s) => ({ ...s, analytics_storage: v ? "granted" : "denied" }))}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-bg-border bg-bg-subtle px-4 py-3">
              {!managing && (
                <button
                  onClick={() => setManaging(true)}
                  className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-[11px] text-ink-muted hover:text-ink"
                >
                  Manage
                </button>
              )}
              <button
                onClick={rejectAll}
                className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-[11px] text-ink-muted hover:text-ink"
              >
                Reject non-essential
              </button>
              {managing ? (
                <button onClick={saveCustom} className="ml-auto rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white">
                  Save preferences
                </button>
              ) : (
                <button onClick={acceptAll} className="ml-auto rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] text-white">
                  Accept all
                </button>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-md p-1">
      <span>
        <span className="block text-[12px] font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-ink-muted">{desc}</span>
      </span>
      <span
        className={clsx(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition",
          checked ? "bg-accent" : "bg-bg-border"
        )}
      >
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <span
          className={clsx(
            "inline-block size-4 transform rounded-full bg-white transition",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
    </label>
  );
}
