import { NextResponse } from "next/server";

/**
 * Real streaming SSR demo for Module 7.
 *
 * Returns a ReadableStream that emits 7 newline-delimited JSON chunks over
 * ~1.5s. Each chunk carries:
 *   { id, label, delay, bytes, kind }
 *
 * Module 7's <RealStreamChunks/> consumes it with a fetch + reader.read() loop,
 * appending one chunk at a time to a list — the byte-level analogue of how
 * React's streaming SSR renderer flushes Suspense boundaries.
 *
 * We force the dynamic runtime so Next doesn't try to cache the response.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Chunk = { id: string; label: string; delay: number; bytes: number; kind: "shell" | "boundary" };

const SCRIPT: Chunk[] = [
  { id: "doc", label: "<!doctype> + <head> + shell", delay: 30, bytes: 1820, kind: "shell" },
  { id: "nav", label: "<header> + <nav>", delay: 60, bytes: 350, kind: "shell" },
  { id: "fallbacks", label: "fallback skeletons", delay: 80, bytes: 180, kind: "shell" },
  { id: "feed", label: "boundary: stock feed", delay: 540, bytes: 4400, kind: "boundary" },
  { id: "chart", label: "boundary: chart", delay: 940, bytes: 6100, kind: "boundary" },
  { id: "comments", label: "boundary: comments", delay: 1320, bytes: 2200, kind: "boundary" },
  { id: "footer", label: "<footer>", delay: 1380, bytes: 220, kind: "shell" },
];

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sentAt = Date.now();
      for (const c of SCRIPT) {
        const wait = c.delay - (Date.now() - sentAt);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        const line = JSON.stringify({ ...c, t: Date.now() }) + "\n";
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-store",
    },
  });
}
