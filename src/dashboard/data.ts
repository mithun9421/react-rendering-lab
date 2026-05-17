import { rng, pick } from "@/lib/rng";

export type Stock = { sym: string; name: string; price: number; change: number };
export type Activity = { id: string; user: string; action: string; t: number };
export type Product = { id: string; name: string; cat: string; price: number };

const SYMS = ["AAPL", "MSFT", "GOOG", "AMZN", "META", "NVDA", "TSLA", "AMD", "NFLX", "ORCL", "INTC", "CRM"];
const NAMES: Record<string, string> = {
  AAPL: "Apple",
  MSFT: "Microsoft",
  GOOG: "Alphabet",
  AMZN: "Amazon",
  META: "Meta Platforms",
  NVDA: "Nvidia",
  TSLA: "Tesla",
  AMD: "Adv. Micro Devices",
  NFLX: "Netflix",
  ORCL: "Oracle",
  INTC: "Intel",
  CRM: "Salesforce",
};

export function initialStocks(): Stock[] {
  const r = rng(42);
  return SYMS.map((s) => ({
    sym: s,
    name: NAMES[s],
    price: Math.round(50 + r() * 450),
    change: 0,
  }));
}

/** Mutates `prev` immutably — returns a new array. */
export function tickStocks(prev: Stock[]): Stock[] {
  return prev.map((s) => {
    const delta = (Math.random() - 0.5) * 4;
    return { ...s, price: Math.max(1, +(s.price + delta).toFixed(2)), change: +delta.toFixed(2) };
  });
}

const USERS = ["alice", "bob", "carol", "dan", "eve", "frank", "gina", "harper"];
const ACTIONS = ["opened ticket", "closed PR", "deployed", "rolled back", "merged branch", "commented", "shipped"];

export function makeActivity(n: number, seed = 7): Activity[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => ({
    id: `${seed}-${i}`,
    user: pick(USERS, r),
    action: pick(ACTIONS, r),
    t: Date.now() - i * 1000 * Math.floor(r() * 60),
  }));
}

const CATS = ["GPU", "CPU", "RAM", "SSD", "Mobo", "PSU"];
export function makeProducts(n: number): Product[] {
  const r = rng(13);
  return Array.from({ length: n }, (_, i) => ({
    id: `p-${i}`,
    name: `${pick(CATS, r)} model ${1000 + Math.floor(r() * 8999)}`,
    cat: pick(CATS, r),
    price: Math.round(50 + r() * 1950),
  }));
}
