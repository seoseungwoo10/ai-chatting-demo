/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-user': '#007bff',
        'chat-ai': '#6c757d',
        'chat-bg': '#f8f9fa',
      }
    },
  },
  plugins: [],
}
