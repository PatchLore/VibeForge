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
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
}

