import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Test files
    include: ['test/**/*.{test,spec}.{js,ts}'],
    
    // Setup files to run before tests
    setupFiles: ['./test/setup.ts'],
    
    // Global test functions (describe, it, beforeEach, etc.)
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,ts}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts'
      ]
    },
    
    // Timeout
    testTimeout: 10000,
  },
  
  // Resolve configuration to handle your project structure
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  
  // Define configuration to handle ESM and CommonJS modules
  define: {
    global: 'globalThis',
  },
});