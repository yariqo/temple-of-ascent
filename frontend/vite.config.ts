import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// production build  (npm run build)      -> dist/       static files for the Stake Engine "frontend" upload
// demo build        (npm run build:demo) -> dist-demo/  ONE self-contained html file with embedded demo books
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'demo' ? [viteSingleFile()] : [],
  build: {
    outDir: mode === 'demo' ? 'dist-demo' : 'dist',
    target: 'es2020',
    assetsInlineLimit: mode === 'demo' ? 100_000_000 : 4096,
    chunkSizeWarningLimit: 8000,
  },
}));
