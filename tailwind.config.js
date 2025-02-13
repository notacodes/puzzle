module.exports = {
  content: ['./src/**/*.{html,js}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        primary: '#ffb600',
        secondary: '#68d2c5',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ["retro"],
  },
};
