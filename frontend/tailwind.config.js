/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        // Landing page palette
        lemon: '#F7E96B',
        ivory: '#FFFCF4',
        ink: '#26352F',
        mint: '#CDEDD8',
        lavender: '#E7DEFF',
        coral: '#FFAB91',
        // Warm neutrals for the portals (borders, table headers, hovers) so they sit on ivory
        sand: {
          50: '#FBF7EC',
          100: '#F4EEDD',
          200: '#E9E1CB',
          300: '#D5CBAF',
        },
        sage: {
          DEFAULT: '#5E7163', // text-safe muted green (5.1:1 on ivory)
          soft: '#75877A',    // decorative only (3.7:1 on ivory)
        },
      },
      fontFamily: {
        landing: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'slideInLeft': 'slideInLeft 0.6s ease-out',
        'slideInRight': 'slideInRight 0.6s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
    },
  },
  plugins: [],
}
