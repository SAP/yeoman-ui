//@ts-check

'use strict';

const CopyPlugin = require('copy-webpack-plugin');
const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
  entry: "./src/dummy.js",
  output: {path: path.resolve(__dirname, 'dummy')},
  plugins: [
    new CopyPlugin({
		patterns: [
      		{ from: '../frontend/dist/', to: '../dist/media/', force: true }
		]
	})
  ]
};
module.exports = config;