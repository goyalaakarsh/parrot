/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#141414',
        'surface-hover': '#1c1c1c',
        border: '#252525',
        accent: '#6ee7b7',
        'accent-dim': '#1a3a30',
        primary: '#efefef',
        muted: '#666666',
        danger: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
