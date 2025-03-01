import React, { useState, useEffect } from 'react';
import { BsCreditCard2Front } from 'react-icons/bs';
import { FiChevronDown, FiCheck, FiEdit2, FiRefreshCw, FiLock } from 'react-icons/fi';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import TransactionsList from '../components/TransactionsList';
import AccountsList from '../components/AccountsList';
import StockTransactionsList from '../components/StockTransactionsList';
import { useAuth } from '../context/AuthContext';

// Define transaction interface
interface Transaction {
  transaction_id?: string;
  id?: string;
  date: string;
  name: string;
  amount: number;
  category: string[];
  isCustom: boolean;
}

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

const Dashboard = () => {
  const [selectedChart, setSelectedChart] = useState<'bank' | 'portfolio'>('bank');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expensesData, setExpensesData] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [bankData, setBankData] = useState<Array<{date: string, fullDate?: string, value: number}>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  const BASE_URL = 'http://localhost:5001';

  const cards = [
    {
      id: 'venture',
      name: 'Capital One Venture',
      icon: <BsCreditCard2Front className="text-[#004977]" />
    },
    {
      id: 'quicksilver',
      name: 'Capital One Quicksilver',
      icon: <BsCreditCard2Front className="text-[#004977]" />
    }
  ];

  // Colors for expense categories
  const categoryColors: Record<string, string> = {
    'Food and Drink': '#d03027',
    'General Merchandise': '#004977',
    'Travel': '#2ecc71',
    'Recreation': '#f1c40f',
    'Transportation': '#9b59b6',
    'Payment': '#3498db',
    'Rent and Utilities': '#e67e22',
    'Healthcare': '#e74c3c',
    'Other': '#34495e'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchTransactions(),
      fetchAccounts()
    ]);
  };

  const fetchAccounts = async () => {
    if (!token) {
      return;
    }
    
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
      
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchTransactions = async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/plaid/transactions?days=365&include_custom=true`, {
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
      
      if (data.transactions && data.transactions.length > 0) {
        // Format transactions from Plaid API
        const formattedTransactions = data.transactions.map((tx: any) => ({
          id: tx.transaction_id || tx.id,
          date: tx.date,
          name: tx.name,
          amount: tx.amount,
          category: tx.category || [],
          isCustom: tx.is_custom || false  // Add this to track custom transactions
        }));
        
        setTransactions(formattedTransactions);
        
        // Process transactions for expense chart
        processTransactionsForExpenseChart(formattedTransactions);
        
        // Generate bank account chart data
        generateBankAccountChartData(formattedTransactions, data.accounts);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      
      // Set default expense data if there's an error
      setExpensesData([
        { name: 'Housing', value: 1800, color: '#004977' },
        { name: 'Food', value: 600, color: '#d03027' },
        { name: 'Transport', value: 400, color: '#2ecc71' },
        { name: 'Entertainment', value: 300, color: '#f1c40f' },
        { name: 'Shopping', value: 500, color: '#9b59b6' },
        { name: 'Others', value: 400, color: '#34495e' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBankAccountChartData = (transactions: Transaction[], accounts: Account[]) => {
    if (!transactions.length || !accounts.length) return;
    
    // Get current balance from accounts
    const totalCurrentBalance = accounts.reduce((sum, account) => 
      sum + (account.balances?.current || 0), 0);
    
    // Get today's date and date from 30 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Filter transactions to only include those from the past 30 days
    const recentTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= thirtyDaysAgo && txDate <= today;
    });
    
    // Sort transactions by date (oldest first)
    const sortedTransactions = [...recentTransactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Create a map of daily balances
    const dailyBalances: Record<string, number> = {};
    
    // Start with current balance
    let runningBalance = totalCurrentBalance;
    
    // Work backwards from current balance using transaction amounts
    // In Plaid, positive amounts are debits (money leaving account)
    // and negative amounts are credits (money coming into account)
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
      const tx = sortedTransactions[i];
      runningBalance += tx.amount; // Add because we're working backwards
      
      // Format date to YYYY-MM-DD
      const dateObj = new Date(tx.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      dailyBalances[formattedDate] = runningBalance;
    }
    
    // Fill in missing days within the 30-day period
    const chartData = [];
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Find the most recent balance for this date or earlier
      let balance = null;
      let checkDate = new Date(d);
      
      while (balance === null && checkDate >= thirtyDaysAgo) {
        const checkDateStr = checkDate.toISOString().split('T')[0];
        if (dailyBalances[checkDateStr] !== undefined) {
          balance = dailyBalances[checkDateStr];
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // If no earlier balance found, use the earliest available balance
      if (balance === null) {
        const earliestDate = Object.keys(dailyBalances).sort()[0];
        balance = earliestDate ? dailyBalances[earliestDate] : totalCurrentBalance;
      }
      
      // Format date for display (MM/DD)
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const displayDate = `${month}/${day}`;
      
      chartData.push({
        date: displayDate,
        fullDate: dateStr, // Keep full date for sorting
        value: parseFloat(balance.toFixed(2))
      });
    }
    
    // Add current balance as the most recent point ONLY if not already included
    const todayStr = today.toISOString().split('T')[0];
    if (!dailyBalances[todayStr] && !chartData.some(item => item.fullDate === todayStr)) {
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const displayDate = `${month}/${day}`;
      
      chartData.push({
        date: displayDate,
        fullDate: todayStr,
        value: parseFloat(totalCurrentBalance.toFixed(2))
      });
    }
    
    // Sort by date
    chartData.sort((a, b) => a.fullDate!.localeCompare(b.fullDate!));
    
    // Remove duplicate dates (keep the latest entry for each date)
    const uniqueDates = new Map();
    for (const item of chartData) {
      uniqueDates.set(item.date, item);
    }
    
    // Only keep every 3rd point if we have more than 10 points (to avoid overcrowding)
    let finalChartData = Array.from(uniqueDates.values());
    if (finalChartData.length > 10) {
      const reducedData = [finalChartData[0]]; // Always include first point
      
      for (let i = 1; i < finalChartData.length - 1; i++) {
        if (i % 3 === 0) {
          reducedData.push(finalChartData[i]);
        }
      }
      
      reducedData.push(finalChartData[finalChartData.length - 1]); // Always include last point
      finalChartData = reducedData;
    }
    
    setBankData(finalChartData);
  };

  const processTransactionsForExpenseChart = (transactions: Transaction[]) => {
    // Only include expenses (positive amounts in Plaid are debits)
    const expenses = transactions.filter(tx => tx.amount > 0);
    
    // Group by primary category
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(tx => {
      const primaryCategory = tx.category && tx.category.length > 0 
        ? tx.category[0] 
        : 'Other';
      
      if (!categoryTotals[primaryCategory]) {
        categoryTotals[primaryCategory] = 0;
      }
      
      categoryTotals[primaryCategory] += tx.amount;
    });
    
    // Convert to chart data format
    const chartData = Object.entries(categoryTotals).map(([category, total]) => ({
      name: category,
      value: parseFloat(total.toFixed(2)),
      color: categoryColors[category] || '#34495e' // Default to dark gray if no color defined
    }));
    
    // Sort by value (highest first)
    chartData.sort((a, b) => b.value - a.value);
    
    // Limit to top 6 categories, combine the rest into "Other"
    if (chartData.length > 6) {
      const topCategories = chartData.slice(0, 5);
      const otherCategories = chartData.slice(5);
      
      const otherTotal = otherCategories.reduce((sum, item) => sum + item.value, 0);
      
      if (otherTotal > 0) {
        topCategories.push({
          name: 'Other',
          value: parseFloat(otherTotal.toFixed(2)),
          color: '#34495e'
        });
      }
      
      setExpensesData(topCategories);
    } else {
      setExpensesData(chartData);
    }
  };

  // Modified Portfolio/Bank Account Chart Component
  const renderPerformanceChart = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#004977]">
          {selectedChart === 'portfolio' ? 'Portfolio Performance' : 'Monthly Bank Account Balance'}
        </h2>
        <div className="flex gap-2">
          <button
            disabled={true}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 bg-gray-100 text-gray-400 cursor-not-allowed"
            title="Coming soon"
          >
            <FiLock size={12} /> Portfolio
          </button>
          <button
            onClick={() => setSelectedChart('bank')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-[#004977] text-white"
          >
            Bank Account
          </button>
        </div>
      </div>
      <div className="h-[300px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004977]"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bankData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#718096"
                tick={{ fill: '#718096', fontSize: 12 }}
              />
              <YAxis 
                stroke="#718096"
                tick={{ fill: '#718096', fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#004977" 
                strokeWidth={2}
                dot={{ fill: '#004977', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );

  // Modify the expenses pie chart section to include the total in the center
  const renderExpensesChart = () => {
    const totalExpenses = expensesData.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#004977]">Monthly Expenses</h2>
            <div className="text-2xl font-bold text-[#004977] mt-2">
              ${totalExpenses.toLocaleString()}
            </div>
          </div>
          <button 
            onClick={fetchTransactions}
            disabled={isLoading}
            className="text-gray-500 hover:text-[#004977] p-2 rounded-full"
            title="Refresh expenses"
          >
            <FiRefreshCw className={isLoading ? 'animate-spin' : ''} size={18} />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004977]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        ) : (
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expensesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {expensesData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-4">
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-bold text-[#004977]">Financial Overview</h1>
          <span className="ml-4 bg-[#d03027] text-white text-xs font-bold px-2 py-1 rounded">LIVE</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderPerformanceChart()}
          {renderExpensesChart()}
        </div>

        <AccountsList />
        
        <div className="mt-8">
          <StockTransactionsList />
        </div>

        <TransactionsList />
      </div>
    </div>
  );
};

export default Dashboard; 