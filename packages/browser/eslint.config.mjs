import { defineConfig, globalIgnores } from "eslint/config";
import baseConfig from "eslint-config-pcc-custom/flat";

export default defineConfig([globalIgnores(["dist/*"]), ...baseConfig]);
