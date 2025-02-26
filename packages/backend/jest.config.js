export default {
  coverageProvider: "v8",
  preset: "ts-jest",
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "!<rootDir>/src/utils/**/*.d.ts"],
  roots: ["<rootDir>/src", "<rootDir>/test"],
  moduleFileExtensions: ["ts", "js"],
  moduleNameMapper: {
    "^vscode$": "<rootDir>/test/resources/mocks/mockVSCode.ts",
  },
  moduleDirectories: [
    "node_modules"
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  modulePathIgnorePatterns: ["<rootDir>/src/test/resources/"],
  coveragePathIgnorePatterns: ["<rootDir>/dist/src/test/resources/"],
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
};
