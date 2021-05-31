module.exports = {
  runtimeCompiler: true,
  transpileDependencies: ["vuetify"],
  productionSourceMap: false,
  configureWebpack: {
    devtool: "source-map",
  },
  pages: {
    youi: {
      // entry for the page
      entry: "src/youi/main.js",
      // the source template
      template: "public/youi/index.html",
      // output as dist/index.html
      filename: `index.html`,
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ["chunk-vendors", "chunk-common", "youi"],
    },
    exploregens: {
      // entry for the page
      entry: "src/exploregens/main.js",
      // the source template
      template: "public/exploregens/index.html",
      // output as dist/eg/index.html
      filename: `exploregens/index.html`,
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ["chunk-vendors", "chunk-common", "exploregens"],
    },
  },
};
