/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ovara: {
          dark: '#0b0c10',
          darker: '#1f2833',
          accent: '#6366f1',
          'accent-hover': '#4f46e5',
          gray: '#c5c6c7',
          light: '#66fcf1',
        }
      }
    },
  },
  plugins: [],
}
