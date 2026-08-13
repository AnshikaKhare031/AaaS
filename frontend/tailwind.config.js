/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#F8F5F0',
        cream: '#FBF8F4',
        beige: '#EADCCF',
        espresso: '#5A4335',
        'dark-brown': '#3D2E24',
        taupe: '#7B6656',
        gold: {
          DEFAULT: '#C6A15B',
          hover: '#b08d47',
        },
        sage: '#B7C0A6',
        'border-subtle': '#E7DFD7',
        'warm-gray': '#DDD6CF',
        status: {
          success: '#8FA57D',
          error: '#C96A6A',
          warning: '#D4A65A',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        script: ['Allura', 'cursive'],
      },
    },
  },
  plugins: [],
}
