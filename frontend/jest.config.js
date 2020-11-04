module.exports = {
  verbose: true,
  testRegex: "(/tests/(.*).(test|spec)).[jt]sx?$",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,vue}",
    "!**/node_modules/**",
    "!<rootDir>/src/main.js",
	"!<rootDir>/src/exploreGensMain.js",
	"!<rootDir>/src/exploreGensMessages.js",
    "!<rootDir>/src/ExploreGensApp.vue",
    "!<rootDir>/src/plugins/**"
  ],
  coverageReporters: [
    "lcov",
    "html",
    "text-summary"
  ],
  moduleFileExtensions: [
    "js",
    "vue",
    "json"
  ],
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!(@sap-devx)/)"
  ],
  modulePaths: [
    "<rootDir>/src",
    "<rootDir>/node_modules"
  ],
  transform: {
    ".*\\.(vue)$": "vue-jest",
    '^.+\\.vue$': 'vue-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^.+\\.tsx?$': 'ts-jest',
    "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
  },
  snapshotSerializers: [
    "<rootDir>/node_modules/jest-serializer-vue"
  ],
  coverageThreshold: {
    "global": {
      "branches": 92,
      "functions": 98,
      "lines": 95,
      "statements": 95
    }
  }
}
