import { FiCreditCard, FiBell, FiSliders, FiPlus, FiTrash2, FiClock } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import CustomDropdown from '../components/CustomDropdown';

const Settings = () => {
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [selectedModel, setSelectedModel] = useState('gpt4');
  const [temperature, setTemperature] = useState(0.7);
  
  // Store original values for reverting changes
  const [originalValues, setOriginalValues] = useState({
    notificationTime: '09:00',
    selectedModel: 'gpt4',
    temperature: 0.7
  });
  
  // Track if any changes were made
  const [hasChanges, setHasChanges] = useState(false);

  // Update change detection whenever a value changes
  useEffect(() => {
    const changed = 
      notificationTime !== originalValues.notificationTime ||
      selectedModel !== originalValues.selectedModel ||
      temperature !== originalValues.temperature;
    setHasChanges(changed);
  }, [notificationTime, selectedModel, temperature, originalValues]);

  const handleSave = () => {
    // Here you would typically save to backend
    setOriginalValues({
      notificationTime,
      selectedModel,
      temperature
    });
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setNotificationTime(originalValues.notificationTime);
    setSelectedModel(originalValues.selectedModel);
    setTemperature(originalValues.temperature);
    setHasChanges(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 text-[#004977]">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connected Accounts Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <FiCreditCard className="text-2xl text-[#004977]" />
                <h2 className="text-xl font-semibold text-[#004977]">Connected Accounts via Plaid</h2>
              </div>
            </div>

            <div className="space-y-4">
              {/* Account Items */}
              <div className="group p-4 border rounded-lg border-gray-200 hover:border-[#004977] transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Capital One</div>
                    <div className="text-sm text-gray-500">Connected on May 15, 2023</div>
                  </div>
                </div>
              </div>

              <div className="group p-4 border rounded-lg border-gray-200 hover:border-[#004977] transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Capital One Investing</div>
                    <div className="text-sm text-gray-500">Connected on June 2, 2023</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Preferences Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <FiSliders className="text-2xl text-[#004977]" />
              <h2 className="text-xl font-semibold text-[#004977]">AI Settings</h2>
            </div>

            <div className="space-y-6 mb-3">
              <CustomDropdown
                label="AI Model"
                options={[
                  { value: 'gpt4', label: 'GPT-4' },
                  { value: 'claude3', label: 'Claude 3' },
                  { value: 'gemini', label: 'Gemini Pro' }
                ]}
                value={selectedModel}
                onChange={setSelectedModel}
                className="bg-white"
              />

              <div className="space-y-2">
                <label className="font-medium text-gray-700">Temperature</label>
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004977]"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Precise</span>
                    <span>{temperature}</span>
                    <span>Creative</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Adjust how creative or precise the AI responses should be
                </p>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <FiBell className="text-2xl text-[#004977]" />
              <h2 className="text-xl font-semibold text-[#004977]">Notifications</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Weekly Summary Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 hover:border-[#004977] transition-all">
                <div>
                  <div className="font-medium text-gray-800">Weekly Financial Summary</div>
                  <div className="text-sm text-gray-500">Receive a summary of your weekly financial activity</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d03027]"></div>
                </div>
              </div>

              {/* Notification Time Setting */}
              <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 hover:border-[#004977] transition-all">
                <div>
                  <div className="font-medium text-gray-800">Daily Notification Time</div>
                  <div className="text-sm text-gray-500">Set your preferred notification time</div>
                </div>
                <div className="flex items-center space-x-6">
                  <FiClock className="text-gray-400" />
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977]"
                  />
                </div>
              </div>
              {/* Weekly Summary Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 hover:border-[#004977] transition-all">
                <div>
                  <div className="font-medium text-gray-800">Weekly Stock Summary</div>
                  <div className="text-sm text-gray-500">Receive a summary of your weekly stock performance & news</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d03027]"></div>
                </div>
              </div>

              {/* Notification Time Setting */}
              <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200 hover:border-[#004977] transition-all">
                <div>
                  <div className="font-medium text-gray-800">Daily Notification Time</div>
                  <div className="text-sm text-gray-500">Set your preferred notification time</div>
                </div>
                <div className="flex items-center space-x-6">
                  <FiClock className="text-gray-400" />
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save/Discard Floating Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg p-4 animate-fadeIn">
          <div className="max-w-7xl mx-auto flex justify-end space-x-4">
            <button
              onClick={handleDiscard}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#004977] hover:bg-[#003d66] text-white rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 