//@ts-check

'use strict';

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  node: { global: true},
  entry: [
    './src/extension.ts'
  ], // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  devtool: 'source-map',
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    modules: [
      'node_modules'
    ],
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]environment.js/,
        loader: 'string-replace-loader',
        options: {
          search: 'require.resolve[(]([^\'"])',
          replace: '__non_webpack_require__.resolve($1',
          flags: 'g'
        }
      },
      {
        test: /yeoman-environment[/|\\]lib[/|\\]store.js/,
        loader: 'string-replace-loader',
        options: {
          search: 'require[(]([^\'"])',
          replace: '__non_webpack_require__($1',
          flags: 'g'
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin([
      { from: '../frontend/dist/', to: 'media/', force: true },
      { from: '../LICENSE', to: '../LICENSE', toType: "file", force: true },
      { from: '../README.md', to: '../README.md', toType: "file", force: true }
    ])
  ]
};
module.exports = config;

