import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: token("card"),
        "card-2": token("card-2"),
        muted: token("muted"),
        "muted-foreground": token("muted-foreground"),
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        success: {
          DEFAULT: token("success"),
          foreground: token("success-foreground"),
        },
        warning: {
          DEFAULT: token("warning"),
          foreground: token("warning-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        display: [
          "var(--font-archivo-black)",
          "var(--font-archivo)",
          "system-ui",
          "sans-serif",
        ],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        // Squarer, equipment-panel geometry.
        DEFAULT: "3px",
        md: "4px",
        lg: "6px",
        xl: "9px",
        "2xl": "12px",
      },
      backgroundImage: {
        // Vertical, physical-button orange — not a diagonal rainbow.
        brand: "linear-gradient(180deg, hsl(var(--brand-from)), hsl(var(--brand-to)))",
        "brand-soft":
          "linear-gradient(180deg, hsl(var(--brand-from) / 0.18), hsl(var(--brand-to) / 0.1))",
      },
      boxShadow: {
        panel: "0 30px 80px -28px hsl(var(--shadow-color) / 0.6)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.4), 0 10px 32px -10px hsl(var(--primary) / 0.55)",
        lamp: "0 0 0 2px hsl(var(--primary) / 0.25), 0 0 14px 1px hsl(var(--primary) / 0.7)",
        inset: "inset 0 1px 2px hsl(var(--shadow-color) / 0.45)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        // REC lamp — sharp on, soft fade, like a real indicator.
        "rec-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 hsl(var(--primary) / 0.55)" },
          "50%": { opacity: "0.45", boxShadow: "0 0 0 5px hsl(var(--primary) / 0)" },
        },
        // Single scan sweep across the monitor on load.
        scan: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "12%": { opacity: "0.5" },
          "100%": { transform: "translateY(220%)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-in-up": "fade-in-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "rec-pulse": "rec-pulse 1.8s ease-in-out infinite",
        scan: "scan 2.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both",
      },
    },
  },
  plugins: [forms],
};

export default config;
