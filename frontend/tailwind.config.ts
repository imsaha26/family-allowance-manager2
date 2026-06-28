import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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
      // ── Brand color palette ──────────────────────────────────────────────
      colors: {
        // Stellar-inspired deep navy + warm amber
        brand: {
          50: "hsl(220, 100%, 97%)",
          100: "hsl(220, 96%, 93%)",
          200: "hsl(220, 94%, 86%)",
          300: "hsl(220, 91%, 75%)",
          400: "hsl(220, 88%, 63%)",
          500: "hsl(220, 85%, 52%)",
          600: "hsl(220, 82%, 43%)",
          700: "hsl(220, 80%, 35%)",
          800: "hsl(220, 76%, 27%)",
          900: "hsl(220, 72%, 20%)",
          950: "hsl(220, 68%, 13%)",
        },
        accent: {
          50: "hsl(38, 100%, 97%)",
          100: "hsl(38, 97%, 91%)",
          200: "hsl(38, 95%, 80%)",
          300: "hsl(38, 93%, 67%)",
          400: "hsl(38, 90%, 55%)",
          500: "hsl(38, 88%, 45%)",
          600: "hsl(38, 85%, 37%)",
          700: "hsl(38, 82%, 29%)",
          800: "hsl(38, 78%, 22%)",
          900: "hsl(38, 74%, 16%)",
        },

        // shadcn/ui CSS-variable tokens (dark mode default)
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Semantic transaction-status colors
        status: {
          pending: "hsl(45, 100%, 55%)",
          processing: "hsl(200, 100%, 55%)",
          confirmed: "hsl(142, 76%, 46%)",
          failed: "hsl(0, 84%, 60%)",
          cancelled: "hsl(220, 14%, 55%)",
        },
      },

      // ── Border radius ────────────────────────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },

      // ── Animations ───────────────────────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsla(var(--primary), 0.4)" },
          "50%": { boxShadow: "0 0 0 8px hsla(var(--primary), 0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slide-in-from-right 0.3s ease-out",
        "slide-in-top": "slide-in-from-top 0.25s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
      },

      // ── Background gradients ─────────────────────────────────────────────
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient":
          "linear-gradient(135deg, hsl(220, 68%, 8%) 0%, hsl(230, 60%, 12%) 50%, hsl(220, 68%, 8%) 100%)",
        "card-gradient":
          "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 100%)",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, hsl(var(--muted)) 50%, transparent 100%)",
      },

      // ── Box shadows ──────────────────────────────────────────────────────
      boxShadow: {
        glow: "0 0 20px -5px hsl(var(--primary))",
        "glow-accent": "0 0 20px -5px hsl(38, 88%, 45%)",
        "card-hover": "0 8px 32px -8px hsl(220, 68%, 8%)",
        glass:
          "inset 0 1px 0 0 hsl(0 0% 100% / 0.05), 0 4px 16px 0 hsl(220, 68%, 4% / 0.4)",
      },

      // ── Backdrop blur ────────────────────────────────────────────────────
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [animate],
};

export default config;
