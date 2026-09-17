/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#0a5c36",
          "green-dark": "#084a2c",
          "green-light": "#0d7a46",
          gold: "#c8a951",
          "gold-light": "#dbbf6a",
          "gold-dark": "#b3953e",
          cream: "#faf8f0",
          "cream-dark": "#f0edd8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
