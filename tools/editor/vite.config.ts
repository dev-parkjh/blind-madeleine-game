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
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@codemirror") || id.includes("codemirror") || id.includes("@lezer")) return "codemirror";
          if (id.includes("react")) return "react";
          return "vendor";
        }
      }
    }
  }
});
