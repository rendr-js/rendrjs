import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "@rendrjs/cypress-ct-rendrjs" as "angular",
      bundler: "vite" as "webpack",
    },
    defaultCommandTimeout: 1000,
  },
});
