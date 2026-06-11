module.exports = {
  // Common settings for JS Files.
  extends: ["plugin:eslint-comments/recommended", "prettier"],
  env: {
    commonjs: true,
    mocha: true,
    node: true,
  },
  rules: {
    // TODO "eslint-comments/require-description": ["error", { ignore: [] }],
    "eslint-comments/require-description": "off",
  },
  overrides: [
    {
      // For pure-java script sub-packages and general scripts (in any package).
      files: ["*.js"],
      extends: ["eslint:recommended"],
      parserOptions: {
        // The `ecmaVersion` should align to the supported features of our target runtimes (browsers / nodejs / others)
        // Consult with: https://kangax.github.io/compat-table/es2016plus/
        ecmaVersion: 2017,
      },
    },
    {
      // For sub-packages using TypeScript (libraries/VSCode Exts) && TypeScript definitions (d.ts)
      files: ["*.ts"],
      plugins: ["@typescript-eslint"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["./tsconfig.base.json", "./tsconfig.json"],
      },
      extends: ["plugin:@typescript-eslint/eslint-recommended", "plugin:@typescript-eslint/recommended-type-checked"],
      rules: {
        semi: "error",
        "no-extra-semi": "error",
        "no-eval": "error",
        // TODO review each exclusion and fix issues if needed
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/no-wrapper-object-types": "off",
        "@typescript-eslint/no-unsafe-function-type": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-unused-vars": ["error", { caughtErrors: "none" }],
        "@typescript-eslint/no-unsafe-argument": "off",
        "no-async-promise-executor": "off",
        "no-irregular-whitespace": "off",
        "prefer-rest-params": "off",
        "prefer-spread": "off",
      },
    },
    {
      // For Vue frontend sub-packages.
      files: ["*.vue"],
      parser: "vue-eslint-parser",
      // Using the smaller vue rule subset (essential) to avoid including formatting rules
      // as formatting as handled by prettier **directly**.
      extends: ["plugin:vue/vue3-essential"],
    },
  ],
};
