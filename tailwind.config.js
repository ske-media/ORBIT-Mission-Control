/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'space-black': '#0A0A0F',
        'deep-space': '#13131A',
        'nebula-purple': '#6E44FF',
        'nebula-purple-light': '#9277FF',
        'galaxy-blue': '#3644FF',
        'galaxy-blue-light': '#5A79FF',
        'star-white': '#F8F9FF',
        'moon-gray': '#72727E',
        'red-alert': '#FF4455',
        'yellow-warning': '#FFAA33',
        'green-success': '#33DD77',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
        'sans': ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 15s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.nebula-purple), 0 0 20px theme(colors.nebula-purple-light)',
        'neon-blue': '0 0 5px theme(colors.galaxy-blue), 0 0 20px theme(colors.galaxy-blue-light)',
      },
    },
  },
  plugins: [],
};