module.exports = {
  presets: [
    "@vue/app",
    ["@babel/preset-env", { "modules": false }]
  ],
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { "targets": { "node": "current" }}]
      ]
    }
  }
}
