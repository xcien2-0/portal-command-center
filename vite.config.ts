import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/academia': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Mapas — Leaflet + react-leaflet (~420 KB)
          'vendor-maps': ['leaflet', 'react-leaflet', '@react-leaflet/core'],
          // 3D — Three.js (~600 KB)
          'vendor-three': ['three'],
          // Gráficas — Recharts + D3 (~200 KB)
          'vendor-charts': ['recharts', 'd3'],
          // UI base de React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
