"use strict";

// Webpack loader that patches all yeoman-environment dist files for CJS bundling.
//
// yeoman-environment v6 is a pure ESM package. When webpack bundles it into a CJS
// output (libraryTarget: "commonjs2"), several patterns break:
//
// 1. createRequire(import.meta.url)
//    webpack replaces import.meta.url with undefined in CJS context.
//    createRequire(undefined) produces a broken require() that throws at runtime.
//    Affected: environment-base.js, store.js
//
// 2. fileURLToPath(import.meta.url) for __filename/__dirname computation
//    webpack replaces import.meta.url with the static file:// URL of the SOURCE FILE
//    on the BUILD MACHINE. At runtime on a different machine (BAS), those paths
//    don't exist and readFileSync/join calls throw ENOENT.
//    Affected: module-lookup.js
//
// This loader is applied to ALL files under yeoman-environment/dist/ to ensure
// the patches land regardless of webpack's ESM ModuleConcatenation order.

"use strict";

const path = require("path");

module.exports = function yeomanEnvAllPatchLoader(source) {
  // Lazily load package.json once per webpack process (loader is called per file).
  // Use require.resolve to find the package regardless of where node_modules lives.
  const pkgPath = require.resolve("yeoman-environment/package.json", {
    paths: [path.resolve(__dirname, "../../../../")],
  });
  const pkg = require(pkgPath);

  let result = source;

  // --- environment-base.js patches ---
  // Remove createRequire(import.meta.url) — the `require` variable it creates is
  // only used to read package.json for the version string (patched below).
  result = result.replace(
    /^const require = createRequire\(import\.meta\.url\);$/m,
    "// createRequire(import.meta.url) removed by yeoman-env-all-patch-loader (CJS bundle: import.meta.url is undefined)",
  );
  // Inline the version string so require('../package.json').version never runs.
  result = result.replace(
    /^const ENVIRONMENT_VERSION = require\(['"]\.\.\/package\.json['"]\)\.version;$/m,
    `const ENVIRONMENT_VERSION = ${JSON.stringify(pkg.version)}; // inlined by yeoman-env-all-patch-loader`,
  );

  // --- store.js patches ---
  // Remove createRequire(import.meta.url) (store.js line 15).
  // The generated `require` variable is used for require.resolve() and require() of
  // generator packages at runtime. Replace those call sites with __non_webpack_require__
  // so the native Node require is used for runtime disk loading.
  result = result.replace(
    /^const require = createRequire\(import\.meta\.url\);$/m,
    "// createRequire(import.meta.url) removed by yeoman-env-all-patch-loader (store.js)",
  );
  result = result.replace(/\brequire\.resolve\(meta\.resolved\)/g, "__non_webpack_require__.resolve(meta.resolved)");
  result = result.replace(/\brequire\(meta\.resolved\)/g, "__non_webpack_require__(meta.resolved)");

  // --- module-lookup.js patches ---
  // Replace the 4-line block that uses import.meta.url to compute __filename/__dirname.
  // webpack provides __filename and __dirname for node-target bundles (they point to
  // the bundle file itself, e.g. dist/extension.js). PROJECT_ROOT becomes the bundle
  // directory — the npm path fallback heuristics that use it only push candidate paths
  // and skip non-existent ones, so this is safe.
  result = result.replace(
    /^const __filename = fileURLToPath\(import\.meta\.url\);$/m,
    "// fileURLToPath(import.meta.url) replaced by yeoman-env-all-patch-loader\n" +
      "// webpack provides __filename/__dirname for node-target bundles",
  );
  result = result.replace(
    /^const __dirname = dirname\(__filename\);$/m,
    "// __dirname provided by webpack for node-target",
  );
  result = result.replace(
    /^const PROJECT_ROOT = join\(__dirname, '\.\.'\);$/m,
    "const PROJECT_ROOT = __dirname; // bundle dir; used only as fallback npm path hint",
  );
  // Inline PACKAGE_NAME_PATTERN so readFileSync(join(PROJECT_ROOT, 'package.json')) never runs.
  result = result.replace(
    /^const PACKAGE_NAME_PATTERN = \[JSON\.parse\(readFileSync\(join\(PROJECT_ROOT, 'package\.json'\)\)\.toString\(\)\)\.name\];$/m,
    `const PACKAGE_NAME_PATTERN = [${JSON.stringify(pkg.name)}]; // inlined by yeoman-env-all-patch-loader`,
  );

  return result;
};
