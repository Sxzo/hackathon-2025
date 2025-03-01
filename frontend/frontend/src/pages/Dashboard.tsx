import React, { useState } from 'react';
import { BsCreditCard2Front } from 'react-icons/bs';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState({
    id: 'venture',
    name: 'Capital One Venture',
    icon: <BsCreditCard2Front className="text-[#004977]" />
  });
  
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

  const handleCardSelect = (card: typeof cards[0]) => {
    setSelectedCard(card);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-20">
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-bold text-[#004977]">Financial Overview</h1>
          <span className="ml-4 bg-[#d03027] text-white text-xs font-bold px-2 py-1 rounded">LIVE</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portfolio Performance Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-1 bg-[#d03027]"></div>
            <h2 className="text-xl font-semibold mb-6 text-[#004977]">Portfolio Performance</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={portfolioData}>
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
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
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

          {/* Expenses Distribution Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-1 bg-[#d03027]"></div>
            <h2 className="text-xl font-semibold mb-6 text-[#004977]">Monthly Expenses</h2>
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
        </div>

        {/* Connected Accounts Section */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-1 bg-[#d03027]"></div>
            <h2 className="text-xl font-semibold mb-4 text-[#004977]">Connected Accounts</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg border-gray-100 hover:border-[#004977] transition-colors">
                <div className="flex justify-between">
                  <span className="font-medium">Checking Account</span>
                  <span>$4,285.75</span>
                </div>
                <div className="text-sm text-gray-500">Capital One</div>
              </div>
              <div className="p-4 border rounded-lg border-gray-100 hover:border-[#004977] transition-colors">
                <div className="flex justify-between">
                  <span className="font-medium">Credit Card</span>
                  <span className="text-[#d03027]">-$1,249.50</span>
                </div>
                <div className="text-sm text-gray-500">Capital One Venture</div>
              </div>
            </div>
          </div>
        </div>

        {/* New Transactions Section */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-1 bg-[#d03027]"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#004977]">Recent Transactions</h2>
              
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-64 p-2.5 bg-white border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977] transition-all"
                >
                  <div className="flex items-center gap-2">
                    {selectedCard.icon}
                    <span className="text-gray-700">{selectedCard.name}</span>
                  </div>
                  <FiChevronDown
                    className={`text-gray-500 transition-transform duration-200 ${
                      isDropdownOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {cards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleCardSelect(card)}
                        className={`flex items-center gap-2 w-full p-2.5 text-left hover:bg-gray-50 transition-colors ${
                          selectedCard.id === card.id ? 'bg-gray-50' : ''
                        }`}
                      >
                        {card.icon}
                        <span className="text-gray-700">{card.name}</span>
                        {selectedCard.id === card.id && (
                          <FiCheck className="ml-auto text-[#004977]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Merchant</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
                    <th className="text-right py-3 px-4 text-gray-600 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sample transactions - In a real app, this would come from your API */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="text-gray-800">Mar 15, 2024</div>
                      <div className="text-xs text-gray-500">8:30 PM</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-800">Whole Foods Market</div>
                      <div className="text-xs text-gray-500">#TX123456</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Groceries</span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#d03027] font-medium">-$156.78</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="text-gray-800">Mar 14, 2024</div>
                      <div className="text-xs text-gray-500">2:15 PM</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-800">Amazon.com</div>
                      <div className="text-xs text-gray-500">#TX123455</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Shopping</span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#d03027] font-medium">-$89.99</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="text-gray-800">Mar 14, 2024</div>
                      <div className="text-xs text-gray-500">11:45 AM</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-800">Starbucks</div>
                      <div className="text-xs text-gray-500">#TX123454</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Dining</span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#d03027] font-medium">-$5.65</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="text-gray-800">Mar 13, 2024</div>
                      <div className="text-xs text-gray-500">7:20 PM</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-800">Netflix</div>
                      <div className="text-xs text-gray-500">#TX123453</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">Entertainment</span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#d03027] font-medium">-$15.99</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-right">
              <button className="text-[#004977] hover:text-[#003d66] text-sm font-medium">
                View All Transactions →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 