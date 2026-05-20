"use client";

import { create } from "zustand";

/**
 * Pro entitlement state — client-side mirror of the server-issued `rrl_ent` cookie.
 *
 * Until Polar + Clerk are wired (Phase 2 of the monetisation plan), this defaults
 * to `tier: "free"` with no way to flip to "pro" from the client. The shape is
 * ready: hooks consume from `useEntitlement()`, gating components read it,
 * everything reads through the same place so the eventual auth integration is
 * one writer change.
 *
 * Dev override: set `localStorage["rrl:ent"] = "pro"` in the browser console to
 * test paywall UX. This is dev-only behaviour and is documented in MONETISATION.md.
 */

export type Tier = "free" | "pro" | "team";

type State = {
  tier: Tier;
  hydrated: boolean;
  setTier: (t: Tier) => void;
};

export const useEntitlement = create<State>((set) => ({
  tier: "free",
  hydrated: false,
  setTier: (t) => set({ tier: t }),
}));

export function hydrateEntitlement() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("rrl:ent");
    if (raw === "pro" || raw === "team") {
      useEntitlement.setState({ tier: raw, hydrated: true });
      return;
    }
  } catch {
    // ignore
  }
  useEntitlement.setState({ hydrated: true });
}
