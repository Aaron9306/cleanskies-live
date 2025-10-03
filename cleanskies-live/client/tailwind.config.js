/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nasa-blue': '#0B3D91',
        'nasa-red': '#FC3D21',
        'nasa-gray': '#6C757D',
        'aqi-good': '#00E400',
        'aqi-moderate': '#FFFF00',
        'aqi-unhealthy-sensitive': '#FF8C00',
        'aqi-unhealthy': '#FF0000',
        'aqi-very-unhealthy': '#8F3F97',
        'aqi-hazardous': '#7E0023'
      },
      fontFamily: {
        'nasa': ['Orbitron', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite'
      }
    },
  },
  plugins: [],
}
