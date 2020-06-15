module.exports = {
  runtimeCompiler: true,
  publicPath: "./",
  transpileDependencies: ["vuetify"],
  productionSourceMap: false,
  configureWebpack: {
    devtool: 'source-map'
  },
  pages: {
    index: {
      // entry for the page
      entry: 'src/main.js',
      // the source template
      template: 'public/index.html',
      // output as dist/index.html
      filename: 'index.html',
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
    exploreGensIndex: {
      // entry for the page
      entry: 'src/exploreGensMain.js',
      // the source template
      template: 'public/exploreGensIndex.html',
      // output as dist/index.html
      filename: 'exploreGensIndex.html',
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ['chunk-vendors', 'chunk-common', 'exploreGensIndex']
    }
  }
};
