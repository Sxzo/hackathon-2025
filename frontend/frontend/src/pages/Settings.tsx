const Settings = () => {
  return (
    <div className="bg-gray-50 min-h-screen pt-20">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-[#004977]">Settings</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#d03027]"></div>
          
          {/* Account Settings */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-[#004977]">Connected Accounts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 hover:border-[#004977] transition-colors">
                <div>
                  <div className="font-medium">Capital One</div>
                  <div className="text-sm text-gray-500">Connected on May 15, 2023</div>
                </div>
                <button className="text-[#d03027] hover:text-[#b02a23] font-medium">Disconnect</button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 hover:border-[#004977] transition-colors">
                <div>
                  <div className="font-medium">Capital One Investing</div>
                  <div className="text-sm text-gray-500">Connected on June 2, 2023</div>
                </div>
                <button className="text-[#d03027] hover:text-[#b02a23] font-medium">Disconnect</button>
              </div>
              
              <button className="mt-2 flex items-center text-[#004977] hover:text-[#003d66] font-medium">
                <span className="text-[#d03027] text-lg mr-1">+</span> Connect New Account
              </button>
            </div>
          </section>

          {/* AI Preferences */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-[#004977]">AI Preferences</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">AI Model</label>
                <select className="p-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977]">
                  <option>GPT-4</option>
                  <option>Claude 3</option>
                  <option>Gemini Pro</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <input type="checkbox" id="notifications" className="w-4 h-4 text-[#d03027]" />
                <label htmlFor="notifications" className="font-medium text-gray-700">
                  Enable AI-powered insights notifications
                </label>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-[#004977]">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg border-gray-200">
                <div className="font-medium">Weekly Financial Summary</div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d03027]"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg border-gray-200">
                <div className="font-medium">Unusual Spending Alerts</div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d03027]"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg border-gray-200">
                <div className="font-medium">Investment Opportunities</div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d03027]"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Settings 