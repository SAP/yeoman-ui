const _ = require("lodash");
const path = require("path");

const INDEX_HTML = "index.html";
let pagePath = _.get(process, "argv[3]", "");
if (!_.isEmpty(pagePath)) {
  pagePath = pagePath.substr(2);
}

module.exports = {
  runtimeCompiler: true,
  publicPath: _.isEmpty(pagePath) ? path.join(".") : path.join(".", pagePath),
  transpileDependencies: ["vuetify"],
  productionSourceMap: false,
  configureWebpack: {
    devtool: "source-map",
  },
  pages: {
    index: {
      // entry for the page
      entry: path.join("src", "main.js"),
      // the source template
      template: path.join("public", INDEX_HTML),
      // output as dist/index.html
      filename: INDEX_HTML,
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ["chunk-vendors", "chunk-common", "index"],
    },
    exploreGensIndex: {
      // entry for the page
      entry: path.join("src", "exploreGensMain.js"),
      // the source template
      template: path.join("public", path.join("exploregens", INDEX_HTML)),
      // output as dist/exploregens/index.html
      filename:
        pagePath === "exploregens"
          ? INDEX_HTML
          : path.join("exploregens", INDEX_HTML),
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ["chunk-vendors", "chunk-common", "exploreGensIndex"],
    },
  },
};
