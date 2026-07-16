import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // pml-core (this app's `transpilePackages` dependency) is consumed from
    // node_modules, which Tailwind's content scanner never sees by default —
    // any utility class used only in its views (not also present verbatim
    // somewhere in this app's own src/) was silently never generated into
    // the CSS bundle, rendering unstyled rather than with a visible error.
    "../PML_DSL/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        smoky: "#a26769",
        teal: "#156064",
        sandy: "#ffb563",
        honeydew: "#e2fcef",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
