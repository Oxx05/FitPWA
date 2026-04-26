/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        // Editorial display font for hero/heading impact
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        // Refined body font with tight letter-spacing
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        // Tabular numerics for stats / timers
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Layered dark surfaces — true black foundation with progressive elevation
        background: '#070708',
        surface: {
          50: '#1f1f22',
          100: '#141416',
          200: '#0e0e10',
          300: '#0a0a0c',
        },
        // Signature acid-lime paired with electric magenta accent
        primary: {
          DEFAULT: '#c6ff3d',
          hover: '#b1ed1f',
          deep: '#82b800',
          glow: 'rgba(198, 255, 61, 0.45)',
        },
        accent: {
          DEFAULT: '#ff2d75',
          hover: '#ff5294',
          glow: 'rgba(255, 45, 117, 0.4)',
        },
        ink: {
          DEFAULT: '#f4f4f5',
          muted: '#a1a1aa',
          dim: '#71717a',
          faint: '#3f3f46',
        },
        error: '#ef4444',
        warn: '#f59e0b',
        ok: '#22c55e',
        pr: '#fbbf24',
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'crush': '-0.06em',
      },
      boxShadow: {
        'glow-primary': '0 0 0 1px rgba(198,255,61,0.2), 0 8px 32px -8px rgba(198,255,61,0.5)',
        'glow-accent': '0 0 0 1px rgba(255,45,117,0.2), 0 8px 32px -8px rgba(255,45,117,0.5)',
        'inset-soft': 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
        'card': '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 40px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        'mesh-primary': 'radial-gradient(at 20% 0%, rgba(198,255,61,0.15) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(255,45,117,0.10) 0px, transparent 50%)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'rise': 'rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(198,255,61,0.6)' },
          '50%': { boxShadow: '0 0 0 14px rgba(198,255,61,0)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
