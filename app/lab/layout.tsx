import Link from "next/link";
import { MODULES } from "@/modules/registry";
import { ProfilerDock } from "@/profiler/ProfilerDock";
import { MobileNav } from "@/shell/MobileNav";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 overflow-x-hidden">{children}</main>
        <ProfilerDock />
      </div>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-bg-border bg-bg-subtle lg:flex">
      <div className="border-b border-bg-border px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-accent animate-pulse_dot" />
          <span className="font-mono text-xs tracking-wider">react-rendering-lab</span>
        </Link>
        <p className="mt-2 text-[11px] leading-snug text-ink-dim">
          One broken dashboard. Each module fixes one thing — and exposes the next bottleneck.
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-ink-dim">Modules</p>
        <ul className="space-y-0.5">
          {MODULES.map((m, i) => (
            <li key={m.slug}>
              <Link
                href={`/lab/${m.slug}`}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-muted hover:bg-bg-elevated hover:text-ink"
              >
                <span className="w-5 font-mono text-[10px] text-ink-dim group-hover:text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate">{m.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-bg-border px-4 py-3 text-[10px] font-mono text-ink-dim">
        <p>Profiler: bottom dock</p>
        <p className="mt-1">FPS · renders · commits · mem</p>
      </div>
    </aside>
  );
}
