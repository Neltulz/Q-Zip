// nuxt.config.ts @preserve
// Description: Nuxt.js configuration file.
// This configuration now explicitly disables Nuxt's default page routing system
// by setting `pages: false`, as page rendering is handled customly within `layouts/default.vue`.
// Usage Example: This file is automatically loaded by Nuxt.js during application startup.
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-28',
  devtools: { enabled: true },
  ssr: false,
  srcDir: 'app/', // Keep this line as it correctly points to your source directory
  devServer: {
    host: process.env.TAURI_DEV_HOST || 'localhost',
    port: 9001,
  },
  vite: {
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      strictPort: true,
    },
    optimizeDeps: {
      exclude: ['@tauri-apps/api'],
    },
    // REMOVED: The explicit vite.resolve.alias configuration.
    // With srcDir: 'app/', Nuxt should handle these aliases automatically.
  },
  // Disable Nuxt's default page system as custom routing is handled in default.vue
  pages: false,
  css: [
    '~/assets/css/styles.css',
    'overlayscrollbars/styles/overlayscrollbars.css',
    '~/assets/css/overlay-scrollbar.css',
  ],
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@pinia/nuxt',
  ],
  plugins: [
    '~/plugins/pinia-persistence.ts',
    '~/plugins/registerResets.client',
    '~/plugins/themePlugin.ts',
    '~/plugins/bounceDirective.ts',
    '~/plugins/flashDirective.ts',
  ],
  sourcemap: {
    server: true,
    client: true,
  },
})
