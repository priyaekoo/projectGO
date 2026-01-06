import { defineConfig } from "cypress";

// eslint-disable-next-line no-undef
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.js",
  },
});
