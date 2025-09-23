import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  // Treat 3D models as assets so they can be imported
  assetsInclude: ["**/*.glb", "**/*.gltf"],
});
