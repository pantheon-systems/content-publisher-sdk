import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  return {
    test: {
      globals: true,
      coverage: {
        reportsDirectory: `./coverage`,
      },
      setupFiles: ["./setupVitest.js"],
      exclude: [...configDefaults.exclude, "./playwright-tests/*"],
    },
    plugins: [react()],
  };
});
