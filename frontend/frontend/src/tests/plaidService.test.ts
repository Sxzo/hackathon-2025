import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  exchangePublicTokenSignup, 
  exchangePublicToken, 
  getTransactions, 
  createLinkToken 
} from '../services/plaidService';

// Mock fetch
global.fetch = vi.fn();

describe('Plaid Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('exchangePublicTokenSignup', () => {
    it('exchanges a public token during signup', async () => {
      const mockResponse = {
        message: 'Bank account linked successfully',
        transactions: [],
        accounts: []
      };

      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const publicToken = 'public-token';
      const phoneNumber = '(555) 123-4567';
      const result = await exchangePublicTokenSignup(publicToken, phoneNumber);

      expect(global.fetch).toHaveBeenCalledWith('/api/plaid/signup-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token: publicToken,
          phone_number: phoneNumber,
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles errors when exchanging a public token during signup', async () => {
      const errorMessage = 'Failed to exchange public token';
      
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage })
      });

      const publicToken = 'public-token';
      const phoneNumber = '(555) 123-4567';
      
      await expect(exchangePublicTokenSignup(publicToken, phoneNumber)).rejects.toThrow(errorMessage);
    });
  });

  describe('exchangePublicToken', () => {
    it('exchanges a public token for authenticated users', async () => {
      const mockResponse = {
        access_token: 'access-token',
        item_id: 'item-id',
        message: 'Public token exchanged successfully'
      };

      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const publicToken = 'public-token';
      const jwtToken = 'jwt-token';
      const result = await exchangePublicToken(publicToken, jwtToken);

      expect(global.fetch).toHaveBeenCalledWith('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          public_token: publicToken,
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles errors when exchanging a public token', async () => {
      const errorMessage = 'Failed to exchange public token';
      
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage })
      });

      const publicToken = 'public-token';
      const jwtToken = 'jwt-token';
      
      await expect(exchangePublicToken(publicToken, jwtToken)).rejects.toThrow(errorMessage);
    });
  });

  describe('getTransactions', () => {
    it('gets transactions for a user', async () => {
      const mockResponse = {
        transactions: [
          { transaction_id: 'txn1', amount: 100, name: 'Test Transaction' }
        ],
        accounts: [
          { account_id: 'acc1', name: 'Test Account' }
        ]
      };

      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const accessToken = 'access-token';
      const jwtToken = 'jwt-token';
      const result = await getTransactions(accessToken, jwtToken);

      expect(global.fetch).toHaveBeenCalledWith(`/api/plaid/transactions?access_token=${accessToken}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles errors when getting transactions', async () => {
      const errorMessage = 'Failed to get transactions';
      
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage })
      });

      const accessToken = 'access-token';
      const jwtToken = 'jwt-token';
      
      await expect(getTransactions(accessToken, jwtToken)).rejects.toThrow(errorMessage);
    });
  });

  describe('createLinkToken', () => {
    it('creates a link token', async () => {
      const mockResponse = {
        link_token: 'link-token',
        expiration: '2023-01-01T00:00:00Z'
      };

      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const jwtToken = 'jwt-token';
      const result = await createLinkToken(jwtToken);

      expect(global.fetch).toHaveBeenCalledWith('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles errors when creating a link token', async () => {
      const errorMessage = 'Failed to create link token';
      
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage })
      });

      const jwtToken = 'jwt-token';
      
      await expect(createLinkToken(jwtToken)).rejects.toThrow(errorMessage);
    });
  });
}); 