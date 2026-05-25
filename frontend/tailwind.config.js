/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#18181b",
        panelSoft: "#202024",
        borderSoft: "#303036",
        brand: "#38bdf8",
      },
    },
  },
  plugins: [],
};

