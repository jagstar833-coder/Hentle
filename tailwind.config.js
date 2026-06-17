/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: { wordle: '#538d4e' },
        yellow: { wordle: '#b59f3b' },
        dark: {
          100: '#818384',
          200: '#565758',
          300: '#3a3a3c',
          400: '#272729',
          500: '#1a1a1b',
          600: '#121213',
        },
      },
      animation: {
        flip: 'flip 0.5s ease-in-out',
        shake: 'shake 0.5s ease-in-out',
        bounce_in: 'bounceIn 0.1s ease-in',
        pop: 'pop 0.1s ease-in-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(-90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 50%, 90%': { transform: 'translateX(-4px)' },
          '30%, 70%': { transform: 'translateX(4px)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
