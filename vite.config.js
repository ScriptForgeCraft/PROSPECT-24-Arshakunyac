import { defineConfig } from "vite";

export default defineConfig({
  base: "./", 

  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
    target: "esnext",
    rollupOptions: {
      output: {
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  
  server: {
    port: 3000,
    strictPort: true,
    open: true  
  }
});