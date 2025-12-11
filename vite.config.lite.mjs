import { defineConfig } from 'vite';
import bundleAudioWorkletPlugin from 'vite-plugin-bundle-audioworklet';
import path from 'path';

/**
 * Vite configuration for r0astr Lite build
 * - No WebSocket/remote control functionality
 * - Deployed to GitHub Pages under /app/ path
 * - Static-only, works without server
 */
export default defineConfig({
  // Base path for GitHub Pages deployment (under /app/ subdirectory)
  base: '/app/',

  plugins: [
    bundleAudioWorkletPlugin()
    // Note: websocketAndApiPlugin is NOT included - lite mode has no server
  ],

  resolve: {
    alias: {
      // Swap websocketManager for lite stub at build time
      './managers/websocketManager.js': path.resolve(__dirname, 'src/managers/websocketManager.lite.js')
    }
  },

  build: {
    outDir: 'dist-lite',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
        // Note: remote.html is NOT included - lite mode is single-user
      }
    }
  },

  // Define LITE_MODE flag for conditional code
  define: {
    'import.meta.env.LITE_MODE': 'true'
  }
});
