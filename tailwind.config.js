/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{ts,tsx,js,jsx}", // Scan everything inside src
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // This name must match the string used in React Native styles
        italianno: ["Italianno_400Regular"], 
      },
    },
  },
  plugins: [],
};
