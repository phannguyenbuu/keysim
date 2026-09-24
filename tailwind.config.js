/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0a0b10',
          panel: '#10131c',
          card: '#151926',
          cardHover: '#1c2234',
          border: '#22293d',
          lime: '#ccff00',
          limeHover: '#b8e600',
          cyan: '#38bdf8',
          blue: '#3b82f6',
          accent: '#c6ff00',
        }
      },
      boxShadow: {
        'lime-glow': '0 0 25px -5px rgba(204, 255, 0, 0.35)',
        'blue-glow': '0 0 25px -5px rgba(59, 130, 246, 0.35)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Figma Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
