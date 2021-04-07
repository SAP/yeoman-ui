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
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      rules: {
        semi: "error",
        "no-extra-semi": "error",
        "no-eval": "error",
        // TODO review each exclusion and fix issues if needed
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/prefer-readonly": "off",
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/restrict-plus-operands": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
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
      extends: ["plugin:vue/essential"],
    },
  ],
};
