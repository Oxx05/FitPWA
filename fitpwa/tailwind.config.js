/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        background: '#0a0a0a',
        surface: {
          100: '#111111',
          200: '#1a1a1a',
        },
        primary: {
          DEFAULT: '#00ff87',
          hover: '#00cc6c',
        },
        error: '#ef4444',
        pr: '#fbbf24', // golden for PRs
      }
    },
  },
  plugins: [],
}
