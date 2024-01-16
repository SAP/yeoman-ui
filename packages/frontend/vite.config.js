// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  return {
    base: "./",
    plugins: [vue()],
    build: {
      sourcemap: isProd ? false : "inline",
      minify: isProd,
      rollupOptions: {
        input: {
          youi: resolve(__dirname, "index.html"),
          exploregens: resolve(__dirname, "exploregens/index.html"),
        },
      },
    },
  };
});
