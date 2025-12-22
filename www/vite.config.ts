import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { viteAlias } from "../alias";

export default defineConfig({
  resolve: {
    alias: viteAlias,
  },
  plugins: [vue(), tailwindcss()],
});
