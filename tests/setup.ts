// Test setup file for Vitest
import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup global test environment
beforeAll(() => {
  // Set test environment variables if needed
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after all tests
});

afterEach(() => {
  // Reset mocks after each test
});

// Mock structuredClone if not available (for Node < 17)
if (!global.structuredClone) {
  global.structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}
