/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
        primary: 'var(--color-primary)',
        muted: 'var(--color-muted)',
        danger: 'var(--color-danger)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
