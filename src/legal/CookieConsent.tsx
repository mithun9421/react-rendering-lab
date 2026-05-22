"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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
 * Bottom-pinned card (banners > modals for first-visit consent). Mobile-first.
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
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-2 bottom-2 z-[60] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md"
        >
          <Card className={cn("glass overflow-hidden rounded-lg")}>
            <CardHeader className="pb-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                cookies + ads
              </p>
              <CardTitle className="text-sm">
                We&apos;d like to use cookies to fund the lab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs leading-relaxed text-ink-muted">
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
                <div className="space-y-3 rounded-md border border-bg-border bg-bg-elevated p-3">
                  <ConsentToggle
                    id="consent-ads"
                    label="Ad cookies"
                    desc="Lets ads pay better by remembering ad frequency caps and clicks."
                    checked={state.ad_storage === "granted"}
                    onCheckedChange={(v) =>
                      setState((s) => ({
                        ...s,
                        ad_storage: v ? "granted" : "denied",
                        ad_user_data: v ? "granted" : "denied",
                      }))
                    }
                  />
                  <ConsentToggle
                    id="consent-personalization"
                    label="Ad personalization"
                    desc="Tailors ads to topics you've shown interest in."
                    checked={state.ad_personalization === "granted"}
                    onCheckedChange={(v) =>
                      setState((s) => ({
                        ...s,
                        ad_personalization: v ? "granted" : "denied",
                      }))
                    }
                  />
                  <ConsentToggle
                    id="consent-analytics"
                    label="Analytics"
                    desc="Helps us understand which modules people actually read."
                    checked={state.analytics_storage === "granted"}
                    onCheckedChange={(v) =>
                      setState((s) => ({
                        ...s,
                        analytics_storage: v ? "granted" : "denied",
                      }))
                    }
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap items-center gap-2 border-t border-bg-border bg-bg-subtle px-5 py-3">
              {!managing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManaging(true)}
                  className="font-mono text-[11px]"
                >
                  Manage
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="font-mono text-[11px]"
              >
                Reject non-essential
              </Button>
              {managing ? (
                <Button
                  size="sm"
                  onClick={saveCustom}
                  className="ml-auto font-mono text-[11px]"
                >
                  Save preferences
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="ml-auto font-mono text-[11px]"
                >
                  Accept all
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

interface ConsentToggleProps {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function ConsentToggle({ id, label, desc, checked, onCheckedChange }: ConsentToggleProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="flex-1 cursor-pointer">
        <span className="block text-[12px] font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-ink-muted">{desc}</span>
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}
