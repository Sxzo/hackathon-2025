import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiRefreshCw } from 'react-icons/fi';
import exampleTransactions from '../assets/example_transactions.json';
import DateRangeSelector from './DateRangeSelector';

interface Transaction {
  transaction_id?: string;
  id?: string;
  date: string;
  name: string;
  amount: number;
  category: string[];
}

const TransactionsList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState<number>(30);
  const { token } = useAuth();
  
  const BASE_URL = 'http://localhost:5001';

  useEffect(() => {
    fetchTransactions();
  }, [daysBack]);

  const fetchTransactions = async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/plaid/transactions?days=${daysBack}`, {
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
      console.log(data);
      if (data.transactions && data.transactions.length > 0) {
        // Format transactions from Plaid API
        const formattedTransactions = data.transactions.map((tx: any) => ({
          id: tx.transaction_id || tx.id,
          date: new Date(tx.date).toLocaleDateString(),
          name: tx.name,
          amount: tx.amount,
          category: tx.category || []
        }));
        
        // Sort by date (newest first)
        formattedTransactions.sort((a: Transaction, b: Transaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setTransactions(formattedTransactions);
      } else {
        // If no transactions, use example data
        setTransactions(exampleTransactions);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      // Fall back to example data
      setTransactions(exampleTransactions);
    } finally {
      setIsLoading(false);
    }
  };

  // Get category badge color based on category
  const getCategoryBadgeClass = (category: string) => {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('food') || lowerCategory.includes('restaurant')) {
      return 'bg-green-100 text-green-800';
    } else if (lowerCategory.includes('travel')) {
      return 'bg-blue-100 text-blue-800';
    } else if (lowerCategory.includes('shopping')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (lowerCategory.includes('entertainment')) {
      return 'bg-purple-100 text-purple-800';
    } else if (lowerCategory.includes('health')) {
      return 'bg-red-100 text-red-800';
    } else if (lowerCategory.includes('transport')) {
      return 'bg-indigo-100 text-indigo-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  // Format transaction amount
  const formatAmount = (amount: number) => {
    // In Plaid, positive amounts are debits (money leaving your account)
    // and negative amounts are credits (money coming into your account)
    const isCredit = amount < 0;
    const formattedAmount = Math.abs(amount).toFixed(2);
    
    if (isCredit) {
      return <span className="text-green-600 font-medium">+${formattedAmount}</span>;
    } else {
      return <span className="text-[#d03027] font-medium">-${formattedAmount}</span>;
    }
  };

  // Format date to show time as well
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Generate a random time for demo purposes
    // In a real app, you'd use the actual time from the transaction
    const hours = Math.floor(Math.random() * 12) + 1;
    const minutes = Math.floor(Math.random() * 60);
    const ampm = Math.random() > 0.5 ? 'AM' : 'PM';
    const randomTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    return {
      date: formattedDate,
      time: randomTime
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#004977]">Recent Transactions</h2>
        <div className="flex items-center gap-3">
          <DateRangeSelector 
            selectedDays={daysBack} 
            onRangeChange={(days) => setDaysBack(days)} 
          />
          <button 
            onClick={fetchTransactions}
            disabled={isLoading}
            className="text-gray-500 hover:text-[#004977] p-2 rounded-full"
            title="Refresh transactions"
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const { date, time } = formatDateTime(transaction.date);
                  const category = transaction.category[0] || 'Uncategorized';
                  const txId = transaction.id?.substring(0, 8) || 'TX000000';
                  
                  return (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-gray-800">{date}</div>
                        <div className="text-xs text-gray-500">{time}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-800">{transaction.name}</div>
                        <div className="text-xs text-gray-500">#{txId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`${getCategoryBadgeClass(category)} text-xs font-medium px-2.5 py-0.5 rounded`}>
                          {category}
                        </span>
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

export default TransactionsList; 