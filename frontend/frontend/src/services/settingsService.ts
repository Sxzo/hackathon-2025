const API_URL = 'http://localhost:5001/api';

/**
 * Get user settings
 * @param token JWT token for authentication
 * @returns User settings object
 */
export const getUserSettings = async (token: string) => {
  try {
    console.log('Fetching settings from:', `${API_URL}/settings/get`);
    
    const response = await fetch(`${API_URL}/settings/get`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Settings response status:', response.status);
    
    if (!response.ok) {
      // If we get a 404, it might mean the user doesn't have settings yet
      if (response.status === 404) {
        console.warn('User settings not found, using defaults');
        // Return default settings
        return {
          settings: {
            notification_time: '09:00',
            model: 'gpt4',
            temperature: 0.7,
            timezone: 'America/New_York',
            financial_weekly_summary: true,
            financial_weekly_summary_time: '09:00',
            stock_weekly_summary: true,
            stock_weekly_summary_time: '09:00',
          }
        };
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get user settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

/**
 * Update user settings
 * @param token JWT token for authentication
 * @param settings Settings object to update
 * @returns Updated settings object
 */
export const updateUserSettings = async (token: string, settings: any) => {
  try {
    console.log('Updating settings at:', `${API_URL}/settings/update`);
    console.log('Settings to update:', settings);
    console.log('Using token:', token ? 'Token exists' : 'No token');
    
    const response = await fetch(`${API_URL}/settings/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    console.log('Update response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}; 