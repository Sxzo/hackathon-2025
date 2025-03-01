/**
 * Service for handling chatbot API interactions
 */

const API_URL = 'http://localhost:5001/api';

/**
 * Send a message to the chatbot
 * @param message The user's message
 * @param token JWT token for authentication
 * @returns The response from the chatbot
 */
export const sendMessage = async (message: string, token: string) => {
  try {
    console.log('Sending message to chatbot:', message);
    console.log('Using token:', token.substring(0, 10) + '...');
    
    const response = await fetch(`${API_URL}/chatbot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from chatbot API:', errorData);
      throw new Error(errorData.error || 'Failed to send message to chatbot');
    }

    const responseData = await response.json();
    console.log('Response from chatbot:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    throw error;
  }
}; 