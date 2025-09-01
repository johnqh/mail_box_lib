// Jest setup for React testing
require('@testing-library/jest-dom');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window events
Object.defineProperty(window, 'addEventListener', { value: jest.fn() });
Object.defineProperty(window, 'removeEventListener', { value: jest.fn() });