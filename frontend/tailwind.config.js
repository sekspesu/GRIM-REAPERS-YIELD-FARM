/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'halloween-orange': '#FF6B35',
        'halloween-purple': '#6B2D5C',
        'halloween-black': '#1A1A1A',
        'halloween-green': '#00FF41',
      },
    },
  },
  plugins: [],
}
