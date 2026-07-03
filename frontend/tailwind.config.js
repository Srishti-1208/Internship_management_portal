/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12181B',
          panel: '#1A2226',
          line: '#2A353B',
        },
        parchment: {
          DEFAULT: '#EDE6D6',
          dim: '#DDD3BC',
          text: '#241F17',
        },
        stamp: {
          red: '#B14B3D',
          green: '#4C7A63',
          amber: '#C98A3E',
          slate: '#5B6B70',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
