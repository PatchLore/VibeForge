/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 79, 248, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 79, 248, 0.4)',
        'glow-hover': '0 0 30px rgba(123, 47, 247, 0.6)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'glow': 'textGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

