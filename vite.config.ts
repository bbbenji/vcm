import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [vue(), tailwindcss()];

  if (mode === "development") {
    plugins.push(vueDevTools());
  }

  return {
    base: process.env.VITE_BASE_PATH ?? "/",
    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
