/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e' },
        travel: { 50:'#fff7ed',500:'#f97316',600:'#ea580c',700:'#c2410c' },
        leaf: { 50:'#f0fdf4',500:'#10b981',600:'#059669',700:'#047857' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans','system-ui','sans-serif'],
        display: ['Syne','sans-serif'],
        mono: ['JetBrains Mono','monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.06)',
        'card-hover': '0 10px 40px -10px rgba(14,165,233,.18)',
        search: '0 20px 60px -15px rgba(14,165,233,.22)',
        ai: '0 8px 32px -8px rgba(16,185,129,.2)',
      },
    },
  },
  plugins: [],
}
