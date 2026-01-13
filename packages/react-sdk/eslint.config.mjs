import baseConfig, { reactConfig } from "eslint-config-pcc-custom/flat";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/*"]),
  ...baseConfig,
  ...reactConfig,
]);
