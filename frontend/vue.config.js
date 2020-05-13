module.exports = {
    runtimeCompiler: true,
    publicPath: "./",
    transpileDependencies: ["vuetify"],
    productionSourceMap: false,
    configureWebpack: (config) => {
      config.devtool = 'source-map'
  }
};
