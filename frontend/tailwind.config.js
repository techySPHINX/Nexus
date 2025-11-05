/** @type {import('tailwindcss').Config} */
export default {
  // important: true,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          50: '#eaf4ff',
          100: '#d3eaff',
          500: '#1976d2',
        },
      },
    },
  },
  plugins: [],
};
