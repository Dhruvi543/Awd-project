/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#2196f3',
          600: '#1976d2',
          700: '#1565c0',
        },
        secondary: {
          50: '#f3e5f5',
          100: '#e1bee7',
          500: '#9c27b0',
          600: '#8e24aa',
          700: '#7b1fa2',
        },
        success: {
          50: '#e8f5e8',
          500: '#4caf50',
          600: '#43a047',
        },
        warning: {
          50: '#fff3e0',
          500: '#ff9800',
          600: '#fb8c00',
        },
        error: {
          50: '#ffebee',
          500: '#f44336',
          600: '#e53935',
        },
        navy: '#03234C',
        'text-primary': '#171A1F',
        'text-secondary': '#898989',
      },
      spacing: {
        'card-padding': '1.5rem',
        'container-padding': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}