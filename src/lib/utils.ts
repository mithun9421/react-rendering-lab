import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditional className builder used by all shadcn primitives. `clsx` handles
 * the conditional flatten; `tailwind-merge` collapses conflicting Tailwind
 * classes (last one wins) so consumers can override defaults cleanly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
