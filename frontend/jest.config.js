module.exports = {
  verbose: true,
  testRegex: "(/tests/(.*).(test|spec)).[jt]sx?$",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,vue}",
    "!**/node_modules/**",
    "!<rootDir>/src/main.js",
    "!<rootDir>/src/exploreGensMain.js",
    "!<rootDir>/src/plugins/**"
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
      "branches": 97.9,
      "functions": 97.6,
      "lines": 96.9,
      "statements": 96.9
    }
  }
}
