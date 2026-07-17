/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        lab: {
          bg: '#0b0f0d',
          panel: '#121815',
          amber: '#f4b942',
          phosphor: '#39ff88',
          phosphorDim: '#1f8a4c',
          wire: '#2a3a33',
          alert: '#ff5c5c'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
        blueprint: ['"IBM Plex Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
