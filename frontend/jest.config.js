module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
      "**/src/**/*.{js,vue}",
      "!**/node_modules/**"
    ],
    coverageReporters: [
      "html",
      "text-summary"
    ],
    moduleFileExtensions: [
      "js",
      "vue",
      "json"
    ],
    modulePaths: [
      "<rootDir>/src",
      "<rootDir>/node_modules"
    ],
    transform: {
      "^.+\\.js$": "babel-jest",
      ".*\\.(vue)$": "vue-jest"
    },
    snapshotSerializers: [
      "<rootDir>/node_modules/jest-serializer-vue"
    ]
}