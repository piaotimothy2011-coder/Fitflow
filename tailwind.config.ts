import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgRoot: "#111111",
        bgPhone: "#0A0A0A",
        bgCard: "#141414",
        border: "#1E1E1E",
        borderStrong: "#252525",
        accentGreen: "#4ADE80",
        accentGreenDark: "#22C55E",
        deepGreen: "#052E16",
        midDeepGreen: "#166534",
        mintBg: "#F0FDF4",
        textMuted: "#B8B8B8",
        textFaint: "#949494",
        textQuiet: "#A3A3A3",
        textDisabled: "#7A7A7A",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "system-ui", "sans-serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        chip: "12px",
        card: "14px",
        hero: "22px",
        button: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
