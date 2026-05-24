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
        sky: token("sky"),
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        display: [
          "var(--font-fredoka)",
          "var(--font-nunito)",
          "system-ui",
          "sans-serif",
        ],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        // Soft, rounded, friendly geometry.
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      backgroundImage: {
        // Soft vertical green — like a freshly painted barn button.
        brand: "linear-gradient(180deg, hsl(var(--brand-from)), hsl(var(--brand-to)))",
        "brand-soft":
          "linear-gradient(180deg, hsl(var(--brand-from) / 0.2), hsl(var(--brand-to) / 0.12))",
        "sky-soft":
          "linear-gradient(180deg, hsl(var(--sky) / 0.35), hsl(var(--warning) / 0.18))",
      },
      boxShadow: {
        // Soft, warm, lifted — no neon glow.
        panel: "0 24px 60px -24px hsl(var(--shadow-color) / 0.4)",
        soft: "0 4px 14px -6px hsl(var(--shadow-color) / 0.3)",
        glow: "0 10px 26px -10px hsl(var(--primary) / 0.45)",
        lamp: "0 8px 24px -8px hsl(var(--warning) / 0.55)",
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
        // Gentle idle bob — for the bear mascot.
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%": { transform: "translateY(-5px) rotate(1deg)" },
        },
        // Soft sway — for wheat / leaf decorations.
        sway: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-in-up": "fade-in-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        shimmer: "shimmer 1.6s infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        bob: "bob 4s ease-in-out infinite",
        sway: "sway 5s ease-in-out infinite",
      },
    },
  },
  plugins: [forms],
};

export default config;
