/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'dark-theme',
  theme: {
    extend: {
      colors:{
        primary: '#46777f', // primary color
      },
      fontSize: {
        // Mobile-optimized font sizes
        'xs': ['14px', { lineHeight: '1.4' }], // Increased from 12px
        'sm': ['16px', { lineHeight: '1.5' }], // Increased from 14px
        'base': ['18px', { lineHeight: '1.6' }], // Increased from 16px
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

