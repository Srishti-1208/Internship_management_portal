/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#FBF7EE',
          panel: '#FFFFFF',
          line: '#DFD6BE',
        },
        parchment: {
          DEFAULT: '#17342A',
          dim: '#0F2721',
          text: '#F4EFE2',
        },
        stamp: {
          red: '#9A4432',
          green: '#3D6952',
          amber: '#B88D3F',
          slate: '#4C5A60',
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