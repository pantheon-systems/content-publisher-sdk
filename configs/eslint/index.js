/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  parser: "typescript-eslint/parser",
  plugins: ["typescript-eslint", "prettier"],
  extends: [
    "turbo",
    "eslint:recommended",
    "plugin:typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "prettier/prettier": "error",
    "typescript-eslint/no-empty-function": [
      "warn",
      { allow: ["arrowFunctions", "functions", "methods"] },
    ],
  },
};
