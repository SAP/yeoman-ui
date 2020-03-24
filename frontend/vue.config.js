module.exports = {
    runtimeCompiler: true,
    publicPath: "./",
    transpileDependencies: ["vuetify"],
    configureWebpack: (config) => {
      config.devtool = 'source-map'
  },
};
