import { defineConfig, globalIgnores } from "eslint/config";
import baseConfig, { reactConfig } from "eslint-config-pcc-custom/flat";
import storybook from "eslint-plugin-storybook";

export default defineConfig([
  globalIgnores(["dist/*"]),
  ...baseConfig,
  ...reactConfig,
  ...(storybook.configs["flat/recommended"] || []),
]);
