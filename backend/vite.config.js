import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sass from "sass";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        implementation: sass,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: "src/",
        replacement: `${path.resolve(__dirname, "src")}/`,
      },
    ],
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".scss"],
  },
  server: {
    port: 5174,
    host: true,
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, "../backend-api/root/STAR.acon-eco.com_key.txt")
      ),
      cert: fs.readFileSync(
        path.resolve(
          __dirname,
          "../backend-api/root/STAR.acon-eco.com.fullchain.crt"
        )
      ),
      ca: [
        fs.readFileSync(
          path.resolve(
            __dirname,
            "../backend-api/root/STAR.acon-eco.com.ca.pem"
          )
        ),
      ],
    },
    proxy: {
      "/api": {
        target: "https://reRental.acon-eco.com:3005",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: true,
        ca: fs.readFileSync(
          path.resolve(
            __dirname,
            "../backend-api/root/STAR.acon-eco.com.ca.pem"
          )
        ),
      },
    },
  },
});
