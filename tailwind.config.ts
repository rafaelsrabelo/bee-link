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
        "background-primary": "#F8F9FA",
        "background-secondary": "#FFFFFF",
        "background-tertiary": "#F1F3F4",
        "content-body": "#4A5568",
        "content-placeholder": "#9CA3AF",
        "content-headline": "#1A202C",
        "border-primary": "#E2E8F0",
        "border-secondary": "#CBD5E0",
        "border-tertiary": "#A0AEC0",
        "accent-purple": "#7C3AED",
        "accent-green": "#10B981",
        "accent-pink": "#EC4899"
      },
    },
  },
  plugins: [],
};
export default config;