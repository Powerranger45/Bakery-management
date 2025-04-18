// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          primary: '#d35400', // Warm orange
          secondary: '#e74c3c', // Red for accents
          light: '#f9f9f9', // Light background
        },
        fontFamily: {
          sans: ['Poppins', 'sans-serif'],
          serif: ['Playfair Display', 'serif'],
        },
      },
    },
    plugins: [],
  };
