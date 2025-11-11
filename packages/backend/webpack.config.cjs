//@ts-check

"use strict";

const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node",
  node: { global: true },
  entry: ["./src/extension.ts"],
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.cjs",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    modules: ["node_modules"],
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /usage-report[/|\\]usage-analytics-wrapper.ts/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]environment.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]resolve[(]",
          replace: "__non_webpack_require__.resolve(",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]store.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]path",
          replace: "__non_webpack_require__(path",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]util[/|\\]repository.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]packageJson",
          replace: "__non_webpack_require__(packageJson",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]util[/|\\]repository.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]absolutePath",
          replace: "__non_webpack_require__(absolutePath",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]resolver.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]path",
          replace: "__non_webpack_require__(path",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]resolver.js/,
        loader: "string-replace-loader",
        options: {
          search: "PACKAGE_NAME_PATTERN = [[]require.*",
          replace: "PACKAGE_NAME_PATTERN = ['yeoman-environment'];",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]composability.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'yeoman",
          replace: "__non_webpack_require__('yeoman",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]colors[/|\\]lib[/|\\]colors.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]theme",
          replace: "__non_webpack_require__(theme",
          flags: "g",
        },
      },
      {
        test: /node-gyp[/|\\]lib[/|\\]node-gyp.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'[.]",
          replace: "__non_webpack_require__('.",
          flags: "g",
        },
      },
      {
        test: /node-gyp[/|\\]bin[/|\\]node-gyp.js/,
        loader: "string-replace-loader",
        options: {
          search: "[#][!]",
          replace: "//#!",
          flags: "g",
        },
      },
      {
        test: /promise-inflight[/|\\]inflight.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]util[/|\\]binary-diff.js/,
        loader: "string-replace-loader",
        options: {
          search: "const istextorbinary.*",
          replace: "import {isBinary} from 'istextorbinary';",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]util[/|\\]binary-diff.js/,
        loader: "string-replace-loader",
        options: {
          search: "istextorbinary[.]isBinary",
          replace: "isBinary",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]download-stats[/|\\]lib[/|\\]utils.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]download-stats[/|\\]lib[/|\\]utils.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[)]",
          replace: "__non_webpack_require__)",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]ejs[/|\\]lib[/|\\]ejs.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]extensions",
          replace: "__non_webpack_require__.extensions",
          flags: "g",
        },
      },
      {
        test: /utils[/|\\]env.ts/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]cache",
          replace: "__non_webpack_require__.cache",
          flags: "g",
        },
      },
      {
        test: /utils[/|\\]vscodeProxy.ts/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]main",
          replace: "__non_webpack_require__.main",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]ws[/|\\]lib[/|\\]buffer-util.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'bufferutil",
          replace: "__non_webpack_require__('bufferutil",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]ws[/|\\]lib[/|\\]validation.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'utf-8-validate",
          replace: "__non_webpack_require__('utf-8-validate",
          flags: "g",
        },
      },
    ],
  },
};
module.exports = config;
