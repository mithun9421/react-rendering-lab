import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AdSenseLoader } from "@/ads/AdSenseLoader";
import { CookieConsent } from "@/legal/CookieConsent";
import { RouteProgress } from "@/shell/RouteProgress";
import { ProgressBoot } from "@/progress/ProgressBoot";
import { AchievementToast } from "@/progress/AchievementToast";
import { EntitlementBoot } from "@/entitlement/EntitlementBoot";
import { BoredomBuster } from "@/games/BoredomBuster";

export const metadata: Metadata = {
  title: "React Rendering Lab",
  description:
    "An interactive lab that teaches advanced React rendering, hydration, concurrency and SSR through a single intentionally-flawed dashboard you fix step-by-step.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <AdSenseLoader />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <ProgressBoot />
        <EntitlementBoot />
        <RouteProgress />
        {children}
        <AchievementToast />
        <BoredomBuster />
        <CookieConsent />
      </body>
    </html>
  );
}
