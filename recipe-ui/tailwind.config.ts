import type { Config } from 'tailwindcss'
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Roboto'],
      serif: ['Slabo 27px'],
    },
    colors: {
      dark: '#0f2b3e',
      mid: '#194767',
      white: '#ffffff',
    },
    container: {
      center: true,
    },
    extend: {
    },
  },
  plugins: [
  ],
} satisfies Config

