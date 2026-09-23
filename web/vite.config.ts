import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: "/anisha-school-dashboard/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Silently swaps in a new build the moment one's deployed (this repo
      // pushes a fresh one twice a day via the scrape workflow) -- without
      // this, a phone that already installed the app would keep serving
      // whatever bundle was cached at install time until someone thought to
      // force-quit and relaunch it.
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        id: "/anisha-school-dashboard/",
        name: "III F Notice Board",
        short_name: "III F Notices",
        description: "Class III F's school notices, homework, exams and timetable.",
        // Relative to the manifest's own URL rather than a hardcoded
        // "/anisha-school-dashboard/..." -- resolves the same regardless of
        // where the site ends up mounted.
        start_url: ".",
        scope: ".",
        display: "standalone",
        theme_color: "#232B3D",
        background_color: "#171B24",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
