import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Get user settings
 * @param token JWT token for authentication
 * @returns User settings object
 */
export const getUserSettings = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/settings/get`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
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
    const response = await axios.post(`${API_BASE_URL}/settings/update`, settings, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}; 