import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

// Config Vite : support des imports .glsl / .vert / .frag pour les shaders,
// et base relative pour un deploiement statique simple (Netlify, Vercel, GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [glsl()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext', // WebGPU / top-level await : on vise les navigateurs recents
  },
})
