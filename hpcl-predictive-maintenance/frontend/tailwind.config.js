/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hpcl-orange': {
          DEFAULT: '#F7941D',
          50: '#FEF3E4',
          100: '#FDE7C9',
          400: '#FAAE4F',
          600: '#F7941D',
          700: '#D97C0C',
          800: '#B3650A',
        },
        'hpcl-blue': {
          DEFAULT: '#003DA5',
          50: '#E6EBF7',
          100: '#C0CDEC',
          600: '#003DA5',
          700: '#002F80',
          900: '#001F55',
        },
      },
    },
  },
  plugins: [],
}