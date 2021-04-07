module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  branches: 86,
  lines: 90,
  functions: 88,
  statements: 90,
  // To enable **merged** coverage report all relevant file extensions must be listed.
  extension: [".js", ".ts", ".vue"],
};
