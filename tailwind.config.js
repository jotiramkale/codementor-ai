/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Sora carries headings/branding; IBM Plex Sans is the workhorse
        // body/UI face; Plex Mono is reserved for code and technical
        // strings (editor content, problem IDs) — never used decoratively.
        display: ['"Sora"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
