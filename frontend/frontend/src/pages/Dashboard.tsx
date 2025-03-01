import React, { useState } from 'react';
import { BsCreditCard2Front } from 'react-icons/bs';
import { FiChevronDown, FiCheck, FiEdit2 } from 'react-icons/fi';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import TransactionsList from '../components/TransactionsList';
import AccountsList from '../components/AccountsList';

const Dashboard = () => {
  const [selectedChart, setSelectedChart] = useState<'portfolio' | 'bank'>('portfolio');

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

  // Dummy data for the portfolio performance chart
  const portfolioData = [
    { date: '2024-01', value: 50000 },
    { date: '2024-02', value: 52000 },
    { date: '2024-03', value: 51500 },
    { date: '2024-04', value: 53500 },
    { date: '2024-05', value: 54800 },
    { date: '2024-06', value: 54200 },
    { date: '2024-07', value: 56000 },
  ];

  // Dummy data for the expenses pie chart
  const expensesData = [
    { name: 'Housing', value: 1800, color: '#004977' },
    { name: 'Food', value: 600, color: '#d03027' },
    { name: 'Transport', value: 400, color: '#2ecc71' },
    { name: 'Entertainment', value: 300, color: '#f1c40f' },
    { name: 'Shopping', value: 500, color: '#9b59b6' },
    { name: 'Others', value: 400, color: '#34495e' },
  ];

  // New bank account performance data
  const bankData = [
    { date: '2024-01', value: 4500 },
    { date: '2024-02', value: 5200 },
    { date: '2024-03', value: 4800 },
    { date: '2024-04', value: 5500 },
    { date: '2024-05', value: 6100 },
    { date: '2024-06', value: 5800 },
    { date: '2024-07', value: 6500 },
  ];

  // Modified Portfolio/Bank Account Chart Component
  const renderPerformanceChart = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-1 bg-[#d03027]"></div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#004977]">
          {selectedChart === 'portfolio' ? 'Portfolio Performance' : 'Bank Account Performance'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedChart('portfolio')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedChart === 'portfolio'
                ? 'bg-[#004977] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setSelectedChart('bank')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedChart === 'bank'
                ? 'bg-[#004977] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bank Account
          </button>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={selectedChart === 'portfolio' ? portfolioData : bankData}>
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
      </div>
    </div>
  );

  // Modify the expenses pie chart section to include the total in the center
  const renderExpensesChart = () => {
    const totalExpenses = expensesData.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-1 bg-[#d03027]"></div>
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-[#004977]">Monthly Expenses</h2>
          <div className="text-2xl font-bold text-[#004977] mt-2 mb-4">
            ${totalExpenses.toLocaleString()}
          </div>
        </div>
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

        <TransactionsList />
      </div>
    </div>
  );
};

export default Dashboard; 