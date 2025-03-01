/**
 * Service for handling Plaid API interactions
 */

const API_URL = 'http://localhost:5001/api';

/**
 * Exchange a public token for an access token during signup
 * @param publicToken The public token from Plaid Link
 * @param phoneNumber The user's phone number
 * @returns The response from the API
 */
export const exchangePublicTokenSignup = async (publicToken: string, phoneNumber: string) => {
  try {
    const response = await fetch(`${API_URL}/plaid/signup-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_token: publicToken,
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to exchange public token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
};

/**
 * Exchange a public token for an access token (authenticated user)
 * @param publicToken The public token from Plaid Link
 * @param token JWT token for authentication
 * @returns The response from the API
 */
export const exchangePublicToken = async (publicToken: string, token: string) => {
  try {
    const response = await fetch(`${API_URL}/plaid/exchange-public-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        public_token: publicToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to exchange public token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
};

/**
 * Get transactions for a user
 * @param accessToken Plaid access token
 * @param token JWT token for authentication
 * @returns The transactions and accounts
 */
export const getTransactions = async (accessToken: string, token: string) => {
  try {
    const response = await fetch(`${API_URL}/plaid/transactions?access_token=${accessToken}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get transactions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

/**
 * Create a link token for Plaid Link
 * @param token JWT token for authentication
 * @returns The link token
 */
export const createLinkToken = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/plaid/create-link-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create link token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
};

/**
 * Check if the user has a linked bank account
 * @param token JWT token for authentication
 * @returns Object with plaid_connected status
 */
export const getAccountStatus = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/plaid/account-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get account status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting account status:', error);
    throw error;
  }
};

/**
 * Get stock transactions for a user
 * @param token JWT token for authentication
 * @param days Number of days to look back
 * @returns The stock transactions
 */
export const getStockTransactions = async (token: string, days: number = 365) => {
  try {
    const response = await fetch(`${API_URL}/plaid/transactions?stock_only=true&days=${days}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get stock transactions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting stock transactions:', error);
    throw error;
  }
}; 