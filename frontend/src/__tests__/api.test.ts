import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';

// Example API service for testing
const apiService = {
  getUser: async (id: number) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  },

  createUser: async (data: { name: string; email: string }) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteUser: async (id: number) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Mock fetch globally
global.fetch = vi.fn() as MockedFunction<typeof fetch>;

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('fetches user data', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockUser,
      } as Response);

      const result = await apiService.getUser(1);

      expect(global.fetch).toHaveBeenCalledWith('/api/users/1');
      expect(result).toEqual(mockUser);
    });

    it('handles fetch errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getUser(1)).rejects.toThrow('Network error');
    });
  });

  describe('createUser', () => {
    it('creates a new user', async () => {
      const newUser = { name: 'Jane Doe', email: 'jane@example.com' };
      const mockResponse = { id: 2, ...newUser };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.createUser(newUser);

      expect(global.fetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteUser', () => {
    it('deletes user by id', async () => {
      const mockResponse = { success: true };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.deleteUser(1);

      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
