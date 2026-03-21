import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const backendDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: backendDir,
  test: {
    environment: "node",
    include: ["../tests/backend/**/*.test.{js,jsx}"],
  },
});
