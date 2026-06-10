import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/ics": {
        target: "http://localhost:3030",
        changeOrigin: true
      }
    }
  }
});