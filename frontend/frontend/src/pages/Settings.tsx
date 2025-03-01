import React from 'react';
import { FiCreditCard, FiBell, FiSliders, FiUser, FiClock } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import CustomDropdown from '../components/CustomDropdown';
import BankAccountStatus from '../components/BankAccountStatus';
import { useAuth } from '../context/AuthContext';
import { getUserSettings, updateUserSettings } from '../services/settingsService';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const { firstName, lastName, token } = useAuth();
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [selectedModel, setSelectedModel] = useState('gpt4');
  const [temperature, setTemperature] = useState(0.7);
  const [timezone, setTimezone] = useState('America/New_York');
  const [weeklyNotifications, setWeeklyNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayTime, setDisplayTime] = useState('');
  
  // Store original values for reverting changes
  const [originalValues, setOriginalValues] = useState({
    notificationTime: '09:00',
    selectedModel: 'gpt4',
    temperature: 0.7,
    timezone: 'America/New_York',
    weeklyNotifications: true,
    displayTime: ''
  });
  
  // Timezone options
  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' }
  ];

  // Track if any changes were made
  const [hasChanges, setHasChanges] = useState(false);

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const formatTimeWithAMPM = (time24h: string): string => {
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching settings with token:', token ? 'Token exists' : 'No token');
        const response = await getUserSettings(token);
        console.log('Settings response:', response);
        const settings = response.settings;
        
        // Map backend settings to frontend state with defaults if values are missing
        const time = settings.notification_time || '09:00';
        const model = settings.model || 'gpt4';
        const temp = settings.temperature || 0.7;
        const tz = settings.timezone || 'America/New_York';
        const weeklySummary = settings.financial_weekly_summary !== undefined ? 
          settings.financial_weekly_summary : true;
        
        // Format time for display
        const formattedDisplayTime = formatTimeWithAMPM(time);
        
        // Set state values
        setNotificationTime(time);
        setSelectedModel(model);
        setTemperature(temp);
        setTimezone(tz);
        setWeeklyNotifications(weeklySummary);
        setDisplayTime(formattedDisplayTime);
        
        // Store original values
        setOriginalValues({
          notificationTime: time,
          selectedModel: model,
          temperature: temp,
          timezone: tz,
          weeklyNotifications: weeklySummary,
          displayTime: formattedDisplayTime
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [token]);

  useEffect(() => {
    const changed = 
      notificationTime !== originalValues.notificationTime ||
      selectedModel !== originalValues.selectedModel ||
      temperature !== originalValues.temperature ||
      timezone !== originalValues.timezone ||
      weeklyNotifications !== originalValues.weeklyNotifications;
    setHasChanges(changed);
    
    // Update display time whenever notification time changes
    if (notificationTime !== originalValues.notificationTime) {
      setDisplayTime(formatTimeWithAMPM(notificationTime));
    }
  }, [notificationTime, selectedModel, temperature, timezone, weeklyNotifications, originalValues]);

  const handleSave = async () => {
    if (!token) return;
    
    try {
      setIsSaving(true);
      
      // Format time to ensure it's in HH:MM format
      const formattedTime = notificationTime.length === 5 ? 
        notificationTime : // Already in HH:MM
        notificationTime.padStart(5, '0'); // Ensure proper formatting
      
      // Map frontend state to backend settings format
      const settingsToUpdate = {
        notification_time: formattedTime,
        model: selectedModel,
        temperature: temperature,
        timezone: timezone,
        financial_weekly_summary: weeklyNotifications,
        financial_weekly_summary_time: formattedTime // Using same time for weekly summary
      };
      
      console.log('Saving settings:', settingsToUpdate);
      await updateUserSettings(token, settingsToUpdate);
      
      // Update original values after successful save
      setOriginalValues({
        notificationTime: formattedTime,
        selectedModel,
        temperature,
        timezone,
        weeklyNotifications,
        displayTime: formatTimeWithAMPM(formattedTime)
      });
      
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setNotificationTime(originalValues.notificationTime);
    setSelectedModel(originalValues.selectedModel);
    setTemperature(originalValues.temperature);
    setTimezone(originalValues.timezone);
    setWeeklyNotifications(originalValues.weeklyNotifications);
    setHasChanges(false);
  };

  const handleWeeklyNotificationsToggle = () => {
    setWeeklyNotifications(!weeklyNotifications);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004977]"></div>
        <span className="ml-3 text-[#004977]">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 text-[#004977]">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <FiUser className="text-2xl text-[#004977]" />
              <h2 className="text-xl font-semibold text-[#004977]">Account Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-700">{firstName}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-700">{lastName}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-700">May 15, 2023</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                <CustomDropdown
                  options={timezoneOptions}
                  value={timezone}
                  onChange={setTimezone}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bank Account Status */}
          <div className="lg:col-span-1">
            <BankAccountStatus />
          </div>

          {/* AI Settings Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <FiSliders className="text-2xl text-[#004977]" />
              <h2 className="text-xl font-semibold text-[#004977]">AI Settings</h2>
            </div>

            <div className="space-y-6">
              <CustomDropdown
                label="AI Model"
                options={[
                  { value: 'gpt4', label: 'GPT-4' },
                  { value: 'gpt3.5', label: 'GPT-3.5' }
                ]}
                value={selectedModel}
                onChange={setSelectedModel}
                className="bg-white"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Temperature</label>
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
            </div>
          </div>

          {/* Notifications Card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <FiBell className="text-2xl text-[#004977]" />
              <h2 className="text-xl font-semibold text-[#004977]">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Weekly Summary</div>
                    <div className="text-sm text-gray-500">Receive weekly financial updates</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={weeklyNotifications}
                      onChange={handleWeeklyNotificationsToggle}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#d03027] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 border rounded-lg border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Daily Updates</div>
                    <div className="text-sm text-gray-500">Set notification time</div>
                  </div>
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