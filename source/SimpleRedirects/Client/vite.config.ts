import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'simple-redirects',
    },
    outDir: '../wwwroot/App_Plugins/SimpleRedirects',
    emptyOutDir: false,
    rollupOptions: {
      external: [/^@umbraco/],
    },
  },
});
