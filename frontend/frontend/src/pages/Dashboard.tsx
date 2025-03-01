const Dashboard = () => {
  return (
    <div className="bg-gray-50 min-h-screen pt-20">
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-bold text-[#004977]">Financial Overview</h1>
          <span className="ml-4 bg-[#d03027] text-white text-xs font-bold px-2 py-1 rounded">LIVE</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portfolio Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-1 bg-[#d03027]"></div>
            <h2 className="text-xl font-semibold mb-4 text-[#004977]">Investment Portfolio</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg border-gray-100 hover:border-[#004977] transition-colors">
                <div className="flex justify-between">
                  <span className="font-medium">AAPL</span>
                  <span className="text-green-600">+2.4%</span>
                </div>
                <div className="text-sm text-gray-500">Apple Inc.</div>
              </div>
              <div className="p-4 border rounded-lg border-gray-100 hover:border-[#004977] transition-colors">
                <div className="flex justify-between">
                  <span className="font-medium">MSFT</span>
                  <span className="text-[#d03027]">-0.8%</span>
                </div>
                <div className="text-sm text-gray-500">Microsoft Corp.</div>
              </div>
            </div>
          </div>

          {/* Banking Section */}
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
      </div>
    </div>
  )
}

export default Dashboard 