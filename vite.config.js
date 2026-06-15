import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
      ],

      manifest: {
        id: "/",
        name: "FindYourBuddy",
        short_name: "FYB",
        description:
          "Find buddies, communities and activities near you.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#f3f6f4",
        theme_color: "#07110b",
        categories: [
          "social",
          "lifestyle",
          "sports",
        ],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
