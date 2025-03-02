import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiRefreshCw } from 'react-icons/fi';
import DateRangeSelector from './DateRangeSelector';

interface StockTransaction {
  transaction_id?: string;
  id?: string;
  date: string;
  name: string;
  amount: number;
  ticker: string;
  shares: number;
  price_per_share: number;
  fees: number;
  transaction_type: string;
}

const StockTransactionsList: React.FC = () => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState<number>(365); // Default to a year for stocks
  const { token } = useAuth();
  
  const BASE_URL = 'http://localhost:5001';

  useEffect(() => {
    fetchStockTransactions();
  }, [daysBack]);

  const fetchStockTransactions = async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${BASE_URL}/api/plaid/transactions?days=${daysBack}&stock_only=true`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.transactions && data.transactions.length > 0) {
        // Format transactions from Plaid API
        const formattedTransactions = data.transactions.map((tx: any) => ({
          id: tx.transaction_id || tx.id,
          date: new Date(tx.date).toLocaleDateString(),
          name: tx.name,
          amount: tx.amount,
          ticker: tx.ticker,
          shares: tx.shares,
          price_per_share: tx.price_per_share,
          fees: tx.fees,
          transaction_type: tx.transaction_type
        }));
        
        // Sort by date (newest first)
        formattedTransactions.sort((a: StockTransaction, b: StockTransaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setTransactions(formattedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Error fetching stock transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stock transactions');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format transaction amount
  const formatAmount = (amount: number) => {
    // For stocks, negative amounts are purchases (money leaving your account)
    const formattedAmount = Math.abs(amount).toFixed(2);
    
    if (amount > 0) {
      return <span className="text-green-600 font-medium">+${formattedAmount}</span>;
    } else {
      return <span className="text-[#d03027] font-medium">-${formattedAmount}</span>;
    }
  };

  // Format date to show time as well
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#004977]">Stock Transactions</h2>
        <div className="flex items-center gap-3">
          <DateRangeSelector 
            selectedDays={daysBack} 
            onRangeChange={(days) => setDaysBack(days)} 
          />
          <button 
            onClick={fetchStockTransactions}
            disabled={isLoading}
            className="text-gray-500 hover:text-[#004977] p-2 rounded-full"
            title="Refresh stock transactions"
          >
            <FiRefreshCw className={isLoading ? 'animate-spin' : ''} size={18} />
          </button>
        </div>
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
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Ticker</th>
                <th className="py-3 px-4">Shares</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Fees</th>
                <th className="py-3 px-4 text-right">Realized Gains / Losses</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No stock transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const formattedDate = formatDateTime(transaction.date);
                  
                  return (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-gray-800">{formattedDate}</div>
                        <div className="text-xs text-gray-500 capitalize">{transaction.transaction_type}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-blue-600">{transaction.ticker}</div>
                      </td>
                      <td className="py-3 px-4">
                        {transaction.shares}
                      </td>
                      <td className="py-3 px-4">
                        ${transaction.price_per_share.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        ${transaction.fees.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatAmount(transaction.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockTransactionsList;