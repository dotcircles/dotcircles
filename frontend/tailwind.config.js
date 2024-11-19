import { darkLayout, nextui } from "@nextui-org/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        "custom-radial-gradient":
          "radial-gradient( circle 748px at 50.4% 51.5%,  rgba(231,1,122,1) 0%, rgba(0,0,0,1) 90.1% )",
        // "linear-gradient( 270deg,  rgba(24,2,2,1) 10%, rgba(231,1,122,0.50) 50%, rgba(24,2,2,1) 90% )",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
