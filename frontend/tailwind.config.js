/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govblue: {
          50: '#f0f5ff',
          100: '#e0ebff',
          500: '#1d4ed8',
          700: '#1e3a8a',
          800: '#1e293b',
          900: '#0f172a',
        },
        risk: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#EF4444',
          completed: '#3B82F6',
          insufficient: '#9CA3AF'
        }
      }
    },
  },
  plugins: [],
}
