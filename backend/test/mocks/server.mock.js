// Mock server module for unit tests
export const mockServer = {
  listen: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

export const mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  listen: jest.fn()
};

export default {
  server: mockServer,
  app: mockApp
};
