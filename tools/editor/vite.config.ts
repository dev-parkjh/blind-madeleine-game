import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const allowedHosts = ["editor.parkjh.co.kr"];

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5178,
    allowedHosts
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
