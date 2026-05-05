/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./SRC/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
      colors: {
        gray: {
          850: '#1f2937',
        }
      }
    },
  },
  plugins: [],
}
