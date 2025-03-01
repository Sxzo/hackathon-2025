import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiRefreshCw } from 'react-icons/fi';

const BASE_URL = 'http://localhost:5001';

const PlaidTransactionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');
  const { token } = useAuth();

  // Log token on component mount to verify it exists
  useEffect(() => {
    console.log('Auth token available:', !!token);
    console.log('Token first 10 chars:', token ? `${token.substring(0, 10)}...` : 'No token');
  }, [token]);

  const fetchTransactions = async () => {
    if (!token) {
      setError('No authentication token available');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setApiStatus('Starting API request...');
    
    try {
      console.log('Fetching Plaid transactions...');
      console.log('Using token:', token.substring(0, 10) + '...');
      
      // Log the full request details
      setApiStatus('Sending request to /api/plaid/transactions');
      
      const response = await fetch(`${BASE_URL}/api/plaid/transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setApiStatus(`Response received: ${response.status} ${response.statusText}`);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      setApiStatus('Response parsed successfully');
      
      if (!response.ok) {
        throw new Error(data.message || `Failed with status: ${response.status}`);
      }
      
      // Log the full response to console
      console.log('Plaid Transactions Response:', data);
      
      // Log accounts information
      if (data.accounts && data.accounts.length > 0) {
        console.log('Accounts:', data.accounts.map((account: any) => ({
          id: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          balance: account.balances?.current
        })));
      } else {
        console.log('No accounts found in response');
      }
      
      // Log transactions information
      if (data.transactions && data.transactions.length > 0) {
        console.log('Transactions:', data.transactions.map((tx: any) => ({
          id: tx.transaction_id,
          date: tx.date,
          name: tx.name,
          amount: tx.amount,
          category: tx.category
        })));
      } else {
        console.log('No transactions found in response');
      }
      
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setApiStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#004977]">Plaid Transaction Test</h2>
        <button 
          onClick={fetchTransactions}
          disabled={isLoading}
          className="flex items-center bg-[#004977] hover:bg-[#003d66] text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <FiRefreshCw className="mr-2" /> Test Plaid Transactions
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <p className="text-gray-600 mb-3">
        Click the button above to test Plaid transactions. Results will be logged to the browser console.
      </p>
      
      {apiStatus && (
        <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
          <p className="font-semibold mb-1">API Status:</p>
          <p className="text-gray-700">{apiStatus}</p>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Auth token available: {token ? "Yes" : "No"}</p>
        {token && <p>Token preview: {token.substring(0, 10)}...</p>}
      </div>
    </div>
  );
};

export default PlaidTransactionTest; 