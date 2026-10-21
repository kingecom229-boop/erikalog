export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#0047AB',
          800: '#003B95',
          900: '#002D72',
          950: '#071B3E',
        },
        sage: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        brand: {
          blue: '#003B95',
          blueDark: '#071B3E',
          orange: '#F97316',
          orangeHover: '#EA580C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(7, 27, 62, 0.07)',
        card: '0 12px 32px -4px rgba(0, 59, 149, 0.10)',
        glow: '0 8px 24px -4px rgba(249, 115, 22, 0.35)',
      },
    },
  },
  plugins: [],
};
