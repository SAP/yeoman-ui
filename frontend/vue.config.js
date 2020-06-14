module.exports = {
    runtimeCompiler: true,
    publicPath: "./",
    transpileDependencies: ["vuetify"],
    productionSourceMap: false,
    configureWebpack: {
      devtool: 'source-map',
      entry: {
        app: './src/main.js',
        exploregens: './src/exploreGensMain.js'
      }
    }
};
