/**
 * Build de WAPPY Studio portable: genera un único JS (IIFE) + CSS que luego
 * `scripts/build-portable-studio.cjs` incrusta dentro de /wappystudio.html.
 *
 *   npx vite build -c vite.portable-studio.config.ts
 */
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const shim = (file: string) => path.resolve(__dirname, 'src/portable/studio/shims', file);

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  css: {
    postcss: {
      plugins: [tailwindcss({ config: path.resolve(__dirname, 'tailwind.portable-studio.config.cjs') }), autoprefixer()],
    },
  },
  resolve: {
    alias: [
      { find: /^~\/hooks$/, replacement: shim('hooks.ts') },
      { find: /^~\/data-provider$/, replacement: shim('dataProvider.ts') },
      { find: /^~\/components\/Chat\/Menus$/, replacement: shim('menus.tsx') },
      { find: /^~\/utils$/, replacement: shim('utils.ts') },
      { find: /^librechat-data-provider$/, replacement: shim('dataProviderPkg.ts') },
      { find: /^~\//, replacement: path.join(__dirname, 'src/') },
    ],
  },
  build: {
    outDir: path.resolve(__dirname, 'portable-dist/studio'),
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    minify: 'esbuild',
    lib: {
      entry: path.resolve(__dirname, 'src/portable/studio/main.tsx'),
      name: 'WappyStudioPortable',
      formats: ['iife'],
      fileName: () => 'wappy-studio-portable.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'wappy-studio-portable[extname]',
      },
    },
  },
});
