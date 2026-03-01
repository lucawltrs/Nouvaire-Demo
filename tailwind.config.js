/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f0',
          100: '#fee4df',
          200: '#fdc5bb',
          300: '#fb9e8c',
          400: '#f8755d',
          500: '#ed4c27',
          600: '#d8431f',
          700: '#c93d20',
          800: '#a6331b',
          900: '#8a2e1a',
          primary: '#ED4C27',
          hover: '#D8431F',
        },
        page: '#E9ECEF',
        card: '#FFFFFF',
        sidebar: '#F1F3F5',
        border: {
          DEFAULT: '#E9ECEF',
          light: '#F1F3F5',
        },
      },
    },
  },
  plugins: [],
};
