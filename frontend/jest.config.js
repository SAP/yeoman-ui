module.exports = {
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "./coverage/",
  collectCoverageFrom: [
    "src/**/*.{js,vue}",
    "!**/node_modules/**",
    "!<rootDir>/src/main.js"
  ],
  coverageReporters: [
    "html",
    "text-summary",
    "json-summary", 
    "text",
    "lcov"
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
      "branches": 85,
      "functions": 98,
      "lines": 94,
      "statements": 94
    }
  }
}
