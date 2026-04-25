import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages serves the site at /<repo-name>/, so we need a matching base.
// Override with VITE_BASE=/ for local preview at root.
const base = process.env.VITE_BASE ?? "/killteam-companion/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
