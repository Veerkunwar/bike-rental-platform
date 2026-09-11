/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf3',
          100: '#d7f9e2',
          200: '#b1f1c8',
          300: '#7ce4a7',
          400: '#42cf80',
          500: '#1eb464',
          600: '#12934f',
          700: '#117541',
          800: '#125d37',
          900: '#104c2f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
