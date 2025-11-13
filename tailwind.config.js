/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <-- this is critical
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brandPurple: "#432389", // 💜 your duck purple
      },
    },
  },
  plugins: [],
};