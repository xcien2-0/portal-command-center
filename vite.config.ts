import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

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
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Portal de Operaciones XCIEN",
        short_name: "XCIEN",
        description: "Command Center de operaciones, NOC y campo XCIEN",
        theme_color: "#1a4a2e",
        background_color: "#1a4a2e",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Nunca cachear /api — los datos de NOC/Odoo/UISP siempre deben ser frescos
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
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
