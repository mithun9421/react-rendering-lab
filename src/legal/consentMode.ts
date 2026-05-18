/**
 * Google Consent Mode v2 — required for AdSense traffic from the EEA, UK, and
 * Switzerland since January 2024.
 *
 * The Mode is a contract between us and Google: we tell Google's tag what the
 * user has consented to, and Google's ads / analytics respect it (e.g. serve
 * non-personalized ads when ad_personalization is denied).
 *
 * Four signals matter:
 *   ad_storage         — cookies / localStorage used by ads
 *   ad_user_data       — user data sent to Google for ads (hashed IDs, etc.)
 *   ad_personalization — using that data to target ads
 *   analytics_storage  — cookies / localStorage used by analytics
 *
 * Default state on EVERY page load: all denied. We update on consent.
 */

export type ConsentChoice = "granted" | "denied";
export type ConsentState = {
  ad_storage: ConsentChoice;
  ad_user_data: ConsentChoice;
  ad_personalization: ConsentChoice;
  analytics_storage: ConsentChoice;
};

export const STORAGE_KEY = "rrl:consent";

export const DEFAULT_DENIED: ConsentState = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

export const FULL_GRANT: ConsentState = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
};

/** Functional-only — allows non-personalized ads (legal compliant + still earns). */
export const ESSENTIAL_ONLY: ConsentState = DEFAULT_DENIED;

declare global {
  interface Window {
    dataLayer?: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Install the gtag function and push the DEFAULT denied state.
 * Must run BEFORE the AdSense script loads.
 */
export function installConsentDefault() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  // Define gtag if absent; it just pushes to dataLayer.
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  // Default-denied — read prior consent if present and apply it eagerly so
  // returning visitors don't see the banner again AND get the right behavior
  // from the AdSense script on its very first call.
  const saved = readSavedConsent();
  if (saved) {
    window.gtag!("consent", "default", saved);
    return;
  }
  window.gtag!("consent", "default", DEFAULT_DENIED);
}

export function updateConsent(state: ConsentState) {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // private mode / disabled — no-op
  }
  // Broadcast so the banner component can react across tabs / instances.
  window.dispatchEvent(new CustomEvent("rrl:consent-updated", { detail: state }));
}

export function clearConsent() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
  window.dispatchEvent(new CustomEvent("rrl:consent-cleared"));
}

export function readSavedConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      ad_storage: parsed.ad_storage === "granted" ? "granted" : "denied",
      ad_user_data: parsed.ad_user_data === "granted" ? "granted" : "denied",
      ad_personalization: parsed.ad_personalization === "granted" ? "granted" : "denied",
      analytics_storage: parsed.analytics_storage === "granted" ? "granted" : "denied",
    };
  } catch {
    return null;
  }
}
