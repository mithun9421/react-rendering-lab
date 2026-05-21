import type { Config } from "tailwindcss";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const animate = require("tailwindcss-animate");

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Existing lab palette (kept verbatim — many lessons reference these
        // directly via bg-bg-panel, text-ink-muted, etc.).
        bg: {
          DEFAULT: "#0a0a0b",
          subtle: "#111114",
          panel: "#15151a",
          elevated: "#1c1c22",
          border: "#26262e",
        },
        ink: {
          DEFAULT: "#e7e7ea",
          muted: "#9a9aa6",
          dim: "#6c6c78",
        },
        accent: {
          DEFAULT: "#7c5cff",
          warm: "#ff7a5c",
          good: "#3ddc97",
          bad: "#ff5c7a",
          warn: "#ffc857",
          info: "#5cc8ff",
        },

        // shadcn token mapping — driven by CSS variables in globals.css. New
        // components consume these; legacy lab code keeps using the named
        // palette above. Both coexist.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        pulse_dot: {
          "0%,100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        flash: {
          "0%": { backgroundColor: "rgba(124,92,255,0.45)" },
          "100%": { backgroundColor: "transparent" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        pulse_dot: "pulse_dot 1.4s ease-in-out infinite",
        flash: "flash 600ms ease-out 1",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
