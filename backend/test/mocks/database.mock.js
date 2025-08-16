// Mock database module for unit tests
export const mockDb = {
  query: jest.fn().mockResolvedValue({ rows: [] }),
  connect: jest.fn().mockResolvedValue(),
  end: jest.fn().mockResolvedValue(),
  on: jest.fn(),
  off: jest.fn()
};

export const createPool = jest.fn().mockReturnValue(mockDb);
export const Client = jest.fn().mockImplementation(() => mockDb);

// Mock the pg module
export default {
  Client,
  Pool: createPool,
  createPool
};
