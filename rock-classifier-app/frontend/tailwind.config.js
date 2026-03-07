/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rock: {
          50: '#fafaf9',
          100: '#f5f5f4',
          500: '#78716c',
          700: '#44403c',
          900: '#1c1917',
        }
      },
    },
  },
  plugins: [],
}
