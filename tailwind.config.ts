import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
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
      },
      animation: {
        pulse_dot: "pulse_dot 1.4s ease-in-out infinite",
        flash: "flash 600ms ease-out 1",
      },
    },
  },
  plugins: [],
};

export default config;
