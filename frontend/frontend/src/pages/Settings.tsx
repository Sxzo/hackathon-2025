const Settings = () => {
  return (
    <div className="bg-gray-100 min-h-screen pt-20">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Account Settings */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Connected Accounts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Bank of America</div>
                  <div className="text-sm text-gray-500">Connected on May 15, 2023</div>
                </div>
                <button className="text-red-600 hover:text-red-800">Disconnect</button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Chase</div>
                  <div className="text-sm text-gray-500">Connected on June 2, 2023</div>
                </div>
                <button className="text-red-600 hover:text-red-800">Disconnect</button>
              </div>
              
              <button className="mt-2 text-blue-600 hover:text-blue-800 font-medium">
                + Connect New Account
              </button>
            </div>
          </section>

          {/* AI Preferences */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">AI Preferences</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">AI Model</label>
                <select className="p-2 border rounded-lg">
                  <option>GPT-4</option>
                  <option>Claude 3</option>
                  <option>Gemini Pro</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <input type="checkbox" id="notifications" className="w-4 h-4" />
                <label htmlFor="notifications" className="font-medium text-gray-700">
                  Enable AI-powered insights notifications
                </label>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="font-medium">Weekly Financial Summary</div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="font-medium">Unusual Spending Alerts</div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="font-medium">Investment Opportunities</div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600"></div>
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