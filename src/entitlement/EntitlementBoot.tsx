"use client";

import { useEffect } from "react";
import { hydrateEntitlement } from "./store";

/** Mount once at the root. Reads localStorage flag and hydrates the entitlement store. */
export function EntitlementBoot() {
  useEffect(() => {
    hydrateEntitlement();
  }, []);
  return null;
}
