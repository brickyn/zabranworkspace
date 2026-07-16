import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
        card: {
          bg: "var(--card-bg)",
          border: "var(--card-border)",
        },
        nav: {
          bg: "var(--nav-bg)",
          border: "var(--nav-border)",
          hover: "var(--nav-hover)",
        },
        muted: "var(--text-muted)",
      },
    },
  },
  plugins: [],
};
export default config;
