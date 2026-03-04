/**
 * Vitest fetch mock setup utilities
 * Provides a custom fetch mock implementation for testing without external dependencies
 */
import { vi } from "vitest";

/**
 * Sets up global fetch mock for Vitest tests
 * Call this function in your setupVitest.js file
 */
export function setupFetchMock() {
  // Create a mock fetch function
  const mockFetch = vi.fn();

  // Store original fetch
  const originalFetch = globalThis.fetch;

  // Set up global fetch mock
  globalThis.fetch = mockFetch;

  // Create a fetchMock helper object for easier mock management
  globalThis.fetchMock = {
    mockResponse: (body: unknown, init?: ResponseInit) => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
          ...init,
        }),
      );
    },
    mockResponseOnce: (body: unknown, init?: ResponseInit) => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
          ...init,
        }),
      );
    },
    mockReject: (error: Error) => {
      mockFetch.mockRejectedValueOnce(error);
    },
    mockRejectOnce: (error: Error) => {
      mockFetch.mockRejectedValueOnce(error);
    },
    resetMocks: () => {
      mockFetch.mockReset();
    },
    enableMocks: () => {
      globalThis.fetch = mockFetch;
    },
    disableMocks: () => {
      globalThis.fetch = originalFetch;
    },
  };

  // Reset mocks before each test
  beforeEach(() => {
    mockFetch.mockClear();
  });
}

// Type augmentation for global fetchMock
declare global {
  var fetchMock: {
    mockResponse: (body: unknown, init?: ResponseInit) => void;
    mockResponseOnce: (body: unknown, init?: ResponseInit) => void;
    mockReject: (error: Error) => void;
    mockRejectOnce: (error: Error) => void;
    resetMocks: () => void;
    enableMocks: () => void;
    disableMocks: () => void;
  };
}
