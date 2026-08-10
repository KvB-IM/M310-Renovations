module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#1B2A4E', dark: '#0F1B36', light: '#2C4074' },
        gold:   { DEFAULT: '#B08D57', bright: '#C9A66B', dark: '#8B6F42', text: '#7A6038' },
        cream:  '#FAF7F0',
        card:   '#FFFFFF',
        warm:   '#3A3833',
        muted:  '#6B6862',
        divider:'#E5DFD3'
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"]
      }
    }
  }
};
