import { vi } from 'vitest';
import { getVscodeMock } from '../src/utils/vscodeProxy';

// Mock VS Code module
vi.mock('vscode', () => {
  return getVscodeMock();
});

// Fix console.Console issue for yeoman-environment
if (typeof global !== 'undefined') {
  if (!global.console.Console) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (global.console as any).Console = function Console(_options?: any) {
      return console;
    };
  }
}

// Add Mocha-compatible globals for existing tests
(globalThis as any).before = beforeAll;
(globalThis as any).after = afterAll;
(globalThis as any).beforeEach = beforeEach;
(globalThis as any).afterEach = afterEach;

// Export the mock for use in tests
export const vscode = getVscodeMock();