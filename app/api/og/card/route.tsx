import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/**
 * Dynamic OG image — /api/og/card?level=...&xp=...&streak=...&lessons=...&track=...
 *
 * Used for: shareable progress cards (LinkedIn + Twitter), per-track certificates.
 * The image is 1200×630 — standard OG dimensions.
 *
 * Privacy: numbers are encoded into the URL by the client when generating the
 * share link. Nothing is read from cookies or sessions here — this endpoint is
 * stateless + cacheable per-URL.
 */

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = parseInt(searchParams.get("level") ?? "1", 10);
  const xp = parseInt(searchParams.get("xp") ?? "0", 10);
  const streak = parseInt(searchParams.get("streak") ?? "0", 10);
  const lessons = parseInt(searchParams.get("lessons") ?? "0", 10);
  const track = searchParams.get("track") ?? "Foundations + Core";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0b",
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,92,255,0.24), transparent 60%)",
          color: "#e7e7ea",
          fontFamily: "system-ui",
          padding: "64px",
          position: "relative",
        }}
      >
        {/* Top brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#7c5cff",
              boxShadow: "0 0 16px rgba(124,92,255,0.6)",
            }}
          />
          <div
            style={{
              display: "flex",
              fontFamily: "ui-monospace, monospace",
              fontSize: 22,
              letterSpacing: "0.15em",
              color: "#9a9aa6",
              textTransform: "uppercase",
            }}
          >
            react-rendering-lab
          </div>
        </div>

        {/* Title */}
        <div style={{ marginTop: 80, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "ui-monospace, monospace",
              fontSize: 16,
              letterSpacing: "0.2em",
              color: "#7c5cff",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            progress card
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 80,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            Level {level} · {track}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            marginTop: 80,
            display: "flex",
            gap: 24,
          }}
        >
          <Stat label="XP" value={xp.toLocaleString()} accent="#7c5cff" />
          <Stat label="streak" value={`${streak} 🔥`} accent="#ff7a5c" />
          <Stat label="lessons completed" value={`${lessons} / 36`} accent="#3ddc97" />
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 64,
            right: 64,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "ui-monospace, monospace",
            fontSize: 18,
            color: "#6c6c78",
          }}
        >
          <div style={{ display: "flex" }}>react-rendering-lab.vercel.app</div>
          <div style={{ display: "flex" }}>One broken dashboard · 36 architectural fixes</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: "rgba(28,28,34,0.7)",
        border: `1px solid ${accent}40`,
        borderRadius: 16,
        padding: "24px 28px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "ui-monospace, monospace",
          fontSize: 14,
          letterSpacing: "0.15em",
          color: "#9a9aa6",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "ui-monospace, monospace",
          fontSize: 56,
          color: accent,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
