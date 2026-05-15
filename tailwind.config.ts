import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        muni: {
          blue: "#3484A5",
          green: "#2CA792",
          gold: "#F0C84F",
          ink: "#102633",
          muted: "#64747D",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
