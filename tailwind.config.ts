import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--md-sys-color-surface))",
        foreground: "hsl(var(--md-sys-color-on-surface))",
        card: {
          DEFAULT: "hsl(var(--md-sys-color-surface))",
          foreground: "hsl(var(--md-sys-color-on-surface))",
        },
        popover: {
          DEFAULT: "hsl(var(--md-sys-color-surface))",
          foreground: "hsl(var(--md-sys-color-on-surface))",
        },
        primary: {
          DEFAULT: "hsl(var(--md-sys-color-primary))",
          foreground: "hsl(var(--md-sys-color-on-primary))",
        },
        secondary: {
          DEFAULT: "hsl(var(--md-sys-color-secondary))",
          foreground: "hsl(var(--md-sys-color-on-secondary))",
        },
        muted: {
          DEFAULT: "hsl(var(--md-sys-color-surface-variant))",
          foreground: "hsl(var(--md-sys-color-on-surface-variant))",
        },
        accent: {
          DEFAULT: "hsl(var(--md-sys-color-secondary))",
          foreground: "hsl(var(--md-sys-color-on-secondary))",
        },
        destructive: {
          DEFAULT: "hsl(var(--md-sys-color-error))",
          foreground: "hsl(var(--md-sys-color-on-error))",
        },
        border: "hsl(var(--md-sys-color-outline))",
        input: "hsl(var(--md-sys-color-outline))",
        ring: "hsl(var(--md-sys-color-outline))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
