import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121311",
        paper: "#f7f3eb",
        brass: "#c0913a",
        mint: "#67d7ba",
        signal: "#ff5b57",
      },
      boxShadow: {
        panel: "0 20px 60px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [forms],
};

export default config;
