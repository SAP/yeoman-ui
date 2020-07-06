const _ = require("lodash");
const path = require("path");

const argv3 = _.get(process, "argv[3]");
const publicPath = argv3 ? path.join(".", "exploregens") : path.join(".");
const filename = argv3 ? "index.html" : path.join("exploregens", "index.html")

module.exports = {
  runtimeCompiler: true,
  publicPath,
  transpileDependencies: ["vuetify"],
  productionSourceMap: false,
  configureWebpack: {
    devtool: 'source-map'
  },
  pages: {
    index: {
      // entry for the page
      entry: path.join("src", "main.js"),
      // the source template
      template: path.join("public", "index.html"),
      // output as dist/index.html
      filename: 'index.html',
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
    exploreGensIndex: {
      // entry for the page
      entry: path.join("src", "exploreGensMain.js"),
      // the source template
      template: path.join("public", "exploregens", "index.html"),
      // output as dist/exploregens/index.html
      filename,
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ['chunk-vendors', 'chunk-common', 'exploreGensIndex']
    }
  }
};
