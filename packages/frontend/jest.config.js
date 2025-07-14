module.exports = {
  verbose: true,
  testRegex: "(/test/(.*).(test|spec)).[jt]sx?$",
  testEnvironment: "jest-environment-jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  coverageProvider: "v8",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,vue}",
    "!**/node_modules/**",
    "!<rootDir>/src/exploregens/**",
    "!<rootDir>/src/youi/main.js",
    "!<rootDir>/src/plugins/**",
  ],
  coverageReporters: ["lcov", "html", "text-summary"],
  moduleFileExtensions: ["js", "vue", "json"],
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!(@sap-devx|vuetify|material-design-icons-iconfont|@mdi/font)/)"],
  modulePaths: ["<rootDir>/src", "<rootDir>/node_modules"],
  transform: {
    ".*\\.(vue)$": "@vue/vue3-jest",
    "^.+\\.vue$": "@vue/vue3-jest",
    ".+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$": "jest-transform-stub",
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
    "^.+\\.mjs$": "<rootDir>/node_modules/babel-jest",
  },
  snapshotSerializers: ["../../node_modules/jest-serializer-vue"],
  coverageThreshold: {
    global: {
      branches: 87,
      functions: 96,
      lines: 96,
      statements: 96,
    },
  },
};
