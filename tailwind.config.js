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
        'mono': ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      colors: {
        gray: {
          850: '#1f2937',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.4)',
          dark: 'rgba(15, 23, 42, 0.4)',
        }
      },
      animation: {
        'mesh-gradient': 'mesh 15s ease infinite',
      },
      keyframes: {
        mesh: {
          '0%, 100%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
        },
      },
    },
  },
  plugins: [],
}
