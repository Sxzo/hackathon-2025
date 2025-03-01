import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiRefreshCw, FiCreditCard, FiDollarSign } from 'react-icons/fi';

interface Account {
  account_id: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
  balances: {
    available: number;
    current: number;
    limit?: number;
    iso_currency_code: string;
  };
}

const AccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  const BASE_URL = 'http://localhost:5001';

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/plaid/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Accounts data:', data);
      
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  // Get account icon based on account type
  const getAccountIcon = (type: string, subtype: string) => {
    if (type === 'credit') {
      return <FiCreditCard className="text-purple-500" size={24} />;
    } else if (type === 'depository' && (subtype === 'checking' || subtype === 'savings')) {
      return <FiDollarSign className="text-green-500" size={24} />;
    } else {
      return <FiDollarSign className="text-blue-500" size={24} />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get account type display name
  const getAccountTypeDisplay = (type: string, subtype: string) => {
    if (subtype) {
      return subtype.charAt(0).toUpperCase() + subtype.slice(1);
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#004977]">Your Accounts</h2>
        <button 
          onClick={fetchAccounts}
          disabled={isLoading}
          className="text-gray-500 hover:text-[#004977] p-2 rounded-full"
          title="Refresh accounts"
        >
          <FiRefreshCw className={isLoading ? 'animate-spin' : ''} size={18} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004977]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No accounts found. Connect your bank to see your accounts.
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.account_id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getAccountIcon(account.type, account.subtype)}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">{account.name}</h3>
                      <p className="text-xs text-gray-500">
                        {getAccountTypeDisplay(account.type, account.subtype)} •••• {account.mask}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(account.balances.current)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {account.balances.available !== null && account.balances.available !== undefined ? 
                        `Available: ${formatCurrency(account.balances.available)}` : 
                        ''}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AccountsList; 