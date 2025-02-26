import * as esbuld from 'esbuild';
const watch = process.argv.includes('--watch');

async function main() {
  try {
    const ctx = await esbuld.context({
      entryPoints: ['dist/src/extension.js'],
      bundle: true,
      format: 'esm',
      minify: false,
      sourcemap: true,
      sourcesContent: false,
      platform: 'node',
      outfile: 'dist/extension.js',
      external: ['vscode', 'fsevents'],
      logLevel: 'warning',
      plugins: [],
      resolveExtensions: ['.js'],
      loader: {
        '.js': 'js'
      },
      external: ['spdx-license-ids', 'spdx-exceptions', 'vscode', 'got'],
    });

    if (watch) {
      await ctx.watch();
    } else {
      await ctx.rebuild();
      await ctx.dispose();
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();