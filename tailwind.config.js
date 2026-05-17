/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        unicef: {
          blue: '#1CABE2',
          darkblue: '#374EA2',
          green: '#00833D',
          yellow: '#FFC20E',
          orange: '#F26A21',
          red: '#E2231A',
          purple: '#6A1E74',
        }
      }
    },
  },
  plugins: [],
}
