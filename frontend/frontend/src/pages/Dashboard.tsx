const Dashboard = () => {
  return (
    <div className="bg-gray-100 min-h-screen pt-20">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Financial Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portfolio Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Investment Portfolio</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">AAPL</span>
                  <span className="text-green-600">+2.4%</span>
                </div>
                <div className="text-sm text-gray-500">Apple Inc.</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">MSFT</span>
                  <span className="text-red-600">-0.8%</span>
                </div>
                <div className="text-sm text-gray-500">Microsoft Corp.</div>
              </div>
            </div>
          </div>

          {/* Banking Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Connected Accounts</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">Checking Account</span>
                  <span>$4,285.75</span>
                </div>
                <div className="text-sm text-gray-500">Bank of America</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">Credit Card</span>
                  <span className="text-red-600">-$1,249.50</span>
                </div>
                <div className="text-sm text-gray-500">Chase Sapphire</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 