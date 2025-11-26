//@ts-check

"use strict";

const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  node: { global: true },
  entry: ["./src/extension.ts"], // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  devtool: "source-map",
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  externals: {
    vscode: "commonjs vscode",
    // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    modules: ["node_modules"],
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
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
      // We replace require() with __non_webpack_require__() to bypass webpack's module resolution and use
      // Node's native require at runtime, allowing dynamic loading of generators installed globally or locally.
      {
        test: /yeoman-environment[/|\\]lib[/|\\]util[/|\\]esm.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      // ESM (ES Module) dynamic import workaround for bundled context:
      // Webpack processes dynamic import() calls at build time, converting them to webpack's chunk loading system.
      // However, yeoman-environment's esm.js needs to use native Node.js dynamic import() at runtime to load
      // external .mjs generator files from the file system (not bundled).
      // We wrap import() in a Function constructor to hide it from webpack's static analysis, forcing it to
      // use the native import() at runtime. This is similar to __non_webpack_require__ but for ESM modules.
      {
        test: /yeoman-environment[/|\\]lib[/|\\]util[/|\\]esm.js/,
        loader: "string-replace-loader",
        options: {
          search: "return import[(]",
          replace: "return new Function('specifier', 'return import(specifier)')(",
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
  optimization: {
    minimize: true,
    minimizer: [
      (compiler) => {
        const TerserPlugin = require("terser-webpack-plugin");
        new TerserPlugin({
          terserOptions: {
            keep_classnames: true,
            keep_fnames: true,
            mangle: {
              keep_classnames: true,
              keep_fnames: true,
            },
          },
        }).apply(compiler);
      },
    ],
  },
};
module.exports = config;
