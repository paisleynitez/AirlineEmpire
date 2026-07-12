import { defineConfig } from "vite";

export default defineConfig({
  root: "game",
  server: {
    open: true
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});