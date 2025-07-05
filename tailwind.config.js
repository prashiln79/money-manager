/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'dark-theme',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Poppins', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors:{
        primary: '#46777f', // primary color light and dark con
        primary50: '#f0f9ff', // primary color light and dark contrast
        primary100: '#e0f2fe', // primary color light and dark contrast
        primary200: '#bae6fd', // primary color light and dark contrast
        primary300: '#93c5fd', // primary color light and dark contrast
        primary400: '#60a5fa', // primary color light and dark contrast
        primary500: '#3b82f6', // primary color light and dark contrast
        primary600: '#2563eb', // primary color light and dark contrast
        primary700: '#1d4ed8', // primary color light and dark contrast
      },
      fontSize: {
        // Mobile-optimized font sizes
        'xs': ['14px', { lineHeight: '1.4' }], // Increased from 12px
        'sm': ['16px', { lineHeight: '1.5' }], // Increased from 14px
        'base': ['18px', { lineHeight: '1.6' }], 
        'lg': ['20px', { lineHeight: '1.6' }],
        'xl': ['22px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['28px', { lineHeight: '1.3' }],
        '4xl': ['32px', { lineHeight: '1.2' }],
        '5xl': ['36px', { lineHeight: '1.1' }],
        '6xl': ['40px', { lineHeight: '1.1' }],
        '7xl': ['48px', { lineHeight: '1' }],
        '8xl': ['56px', { lineHeight: '1' }],
        '9xl': ['64px', { lineHeight: '1' }],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
      },
    },
  },
  plugins: [],
}

