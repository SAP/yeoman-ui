//@ts-check

"use strict";

const path = require("path");
const webpack = require("webpack");

/**
 * Investigate the usage of "import(/webpackIgnore: true / 'ignored-module.js');"
 * https://webpack.js.org/api/module-methods/#magic-comments
 * This will become relevant once we move to the newer versions of yeoman-evnironment
 * that require the migration to ESM modules of the yeoman-ui.
 */

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
    // yeoman-environment and yeoman-generator are ESM-only packages (type: "module").
    // They cannot be loaded via CommonJS require() on Node < 22.12 (ERR_REQUIRE_ESM).
    // They must be bundled so webpack can handle their ESM internals via the
    // string-replace-loader rules below.
    // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    "spdx-license-ids": "commonjs spdx-license-ids",
    "spdx-license-ids/deprecated": "commonjs spdx-license-ids/deprecated",
    "spdx-exceptions": "commonjs spdx-exceptions",
    "@azure/functions-core": "commonjs @azure/functions-core",
    "applicationinsights-native-metrics": "commonjs applicationinsights-native-metrics",
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
      // yeoman-environment v6 (dist/) rules — replaces the old lib/ rules.
      // environment-base.js uses createRequire(import.meta.url) for package.json and native lookups;
      // those require() calls must bypass webpack and use Node's native require at runtime.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]environment-base\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      // store.js calls require.resolve(meta.resolved) to resolve generator package paths at runtime.
      // Must use the native resolver, not webpack's.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]store\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]resolve[(]",
          replace: "__non_webpack_require__.resolve(",
          flags: "g",
        },
      },
      // store.js loads generator modules at runtime via require(meta.resolved); must stay native.
      // It also has a dynamic import() fallback for ESM generators — hide it from webpack's
      // static analysis so it stays as a real native import() at runtime.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]store\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]meta[.]resolved[)]",
          replace: "__non_webpack_require__(meta.resolved)",
          flags: "g",
        },
      },
      // ESM (ES Module) dynamic import workaround for bundled context:
      // store.js falls back to import() for ESM generators. Webpack would convert this to
      // its own chunk-loading system, breaking runtime loading of generators from disk.
      // Wrap in Function constructor to hide it from webpack's static analysis.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]store\.js/,
        loader: "string-replace-loader",
        options: {
          search: "return import[(]",
          replace: "return new Function('specifier', 'return import(specifier)')(",
          flags: "g",
        },
      },
      // environment-full.js dynamically imports yeoman-generator at runtime. Must stay native.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]environment-full\.js/,
        loader: "string-replace-loader",
        options: {
          search: "await import[(]'yeoman-generator'[)]",
          replace: "await new Function('s', 'return import(s)')('yeoman-generator')",
          flags: "g",
        },
      },
      // generator-lookup.js resolves installed generator packages from disk at runtime.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]generator-lookup\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      // module-lookup.js resolves npm paths and package locations from disk at runtime.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]module-lookup\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      // yeoman-generator v8 (dist/) — lifecycle.js loads generator sub-generators from disk.
      {
        test: /yeoman-generator[/|\\]dist[/|\\]actions[/|\\]lifecycle\.js/,
        loader: "string-replace-loader",
        options: {
          search: "await import[(]",
          replace: "await new Function('s', 'return import(s)')(",
          flags: "g",
        },
      },
      // fly-import is yeoman-environment's fallback for loading generators dynamically at runtime.
      // Its dynamic import() must stay as native import() — wrap in Function to hide from webpack.
      {
        test: /fly-import[/|\\]dist[/|\\]fly-import\.js/,
        loader: "string-replace-loader",
        options: {
          search: "async [(][)] => import[(]",
          replace: "async () => new Function('s', 'return import(s)')(",
          flags: "g",
        },
      },
      // @pnpm/npm-conf uses require.resolve() at runtime to find npm installation paths.
      // Only require.resolve() calls need to be native — the require('./lib/*') internal requires
      // must stay as webpack require so those files get bundled.
      {
        test: /@pnpm[/|\\]npm-conf[/|\\]index\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]resolve",
          replace: "__non_webpack_require__.resolve",
          flags: "g",
        },
      },
      // lib/make.js uses require.resolve('npm/lib/config/defaults') at build-time to parse npm defaults.
      {
        test: /@pnpm[/|\\]npm-conf[/|\\]lib[/|\\]make\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]resolve",
          replace: "__non_webpack_require__.resolve",
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
    // Disable ESM scope hoisting (ModuleConcatenationPlugin) for yeoman-environment.
    // yeoman-environment v6 uses import.meta.url patterns that must be patched before bundling.
    // With concatenation enabled, webpack merges all ESM modules into one block and our
    // per-file loader patches may be overwritten by webpack's own ESM→CJS rewriting.
    // Disabling concatenation forces each file through the full loader pipeline individually.
    concatenateModules: false,
    minimizer: [
      (compiler) => {
        const TerserPlugin = require("terser-webpack-plugin");
        // Required for ESM generator support: keep_classnames and keep_fnames prevent mangling that breaks dynamic ESM imports
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
  plugins: [
    // yeoman-environment v6 is pure ESM. Several dist/ files use import.meta.url patterns
    // that break when bundled as CJS:
    //   - createRequire(import.meta.url)  → becomes createRequire(undefined) → throws
    //   - fileURLToPath(import.meta.url)  → bakes build-machine absolute path into bundle → ENOENT on other machines
    // Apply a single patch loader to all yeoman-environment dist files so the patches
    // land regardless of webpack's ESM ModuleConcatenation processing order.
    new webpack.NormalModuleReplacementPlugin(/yeoman-environment[/\\]dist[/\\].+\.js$/, (resolveData) => {
      // NormalModuleReplacementPlugin passes the full resolveData object.
      // Loaders are processed right-to-left (last in array runs first on raw source).
      // We push (append) so our patch loader runs first on the raw ESM source,
      // before string-replace-loader modifies require() calls.
      const createData = resolveData.createData || resolveData;
      createData.loaders = createData.loaders || [];
      createData.loaders.push({
        loader: require.resolve("./src/utils/yeoman-env-all-patch-loader.js"),
      });
    }),
  ],
};
module.exports = config;
