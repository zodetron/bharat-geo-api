import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/client/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
}));
