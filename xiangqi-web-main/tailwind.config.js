/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        xq: {
          surface: '#F8FAFC',
          'surface-dim': '#F1F5F9',
          'surface-dark': '#0B0F19', // Deep Midnight back
          primary: '#e2e8f0', // Slate-200 for text
          accent: '#3b82f6', // Bright Blue Active
          'accent-hover': '#60a5fa',
          board: '#FDF6E3',
          lines: '#94A3B8',
          'piece-red': '#DC2626',
          'piece-black': '#0f172a',
          gold: '#fbbf24', // Premium gold accent
        },
      },
      screens: {
        'xs': '480px',
        '3xl': '1800px',
      },
      maxWidth: {
        '2000': '2000px',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
