import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Source Sans 3'", "system-ui", "sans-serif"],
        serif: ["'Merriweather'", "Georgia", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
        // Word status colors
        "word-new": "hsl(var(--word-new))",
        "word-new-foreground": "hsl(var(--word-new-foreground))",
        "word-learning-1": "hsl(var(--word-learning-1))",
        "word-learning-2": "hsl(var(--word-learning-2))",
        "word-learning-3": "hsl(var(--word-learning-3))",
        "word-learning-4": "hsl(var(--word-learning-4))",
        "word-learning-foreground": "hsl(var(--word-learning-foreground))",
        "word-phrase": "hsl(var(--word-phrase))",
        "word-phrase-foreground": "hsl(var(--word-phrase-foreground))",
        "word-known": "hsl(var(--word-known))",
        "word-known-foreground": "hsl(var(--word-known-foreground))",
        // Utility colors
        success: "hsl(var(--success))",
        "success-foreground": "hsl(var(--success-foreground))",
        warning: "hsl(var(--warning))",
        "warning-foreground": "hsl(var(--warning-foreground))",
        info: "hsl(var(--info))",
        "info-foreground": "hsl(var(--info-foreground))",
        streak: "hsl(var(--streak))",
        "streak-foreground": "hsl(var(--streak-foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "flame-flicker": {
          "0%, 100%": { transform: "scaleY(1) scaleX(1)", opacity: "1" },
          "25%": { transform: "scaleY(1.1) scaleX(0.95)", opacity: "0.9" },
          "50%": { transform: "scaleY(0.95) scaleX(1.05)", opacity: "1" },
          "75%": { transform: "scaleY(1.05) scaleX(0.98)", opacity: "0.95" },
        },
        "count-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--streak) / 0.3), 0 0 10px hsl(var(--streak) / 0.2)" },
          "50%": { boxShadow: "0 0 15px hsl(var(--streak) / 0.5), 0 0 25px hsl(var(--streak) / 0.3)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
          "70%": { transform: "scale(0.9)", opacity: "0.9" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "progress-fill": {
          from: { strokeDashoffset: "100" },
          to: { strokeDashoffset: "var(--progress-value)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "flame-flicker": "flame-flicker 0.5s ease-in-out infinite",
        "count-up": "count-up 0.5s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "bounce-in": "bounce-in 0.5s ease-out",
        "progress-fill": "progress-fill 1s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
