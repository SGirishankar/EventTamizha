import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Default build = normal split files (fast first load: 3D, admin and provider code download only when opened).
// `npm run build:single` makes one inlined index.html that also opens straight from a file (slower to load).
const single = process.env.SINGLE_FILE === '1';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/three') || id.includes('@react-three') ? 'three' : undefined),
      },
    },
  },
});
