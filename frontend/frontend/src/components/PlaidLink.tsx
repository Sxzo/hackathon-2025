import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../context/AuthContext';
import { createLinkToken } from '../services/plaidService';

// Create a global variable to track if Plaid Link has been initialized
// This helps prevent multiple initializations
let plaidLinkInitialized = false;

interface PlaidLinkProps {
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit?: () => void;
  isSignup?: boolean;
}

const PlaidLink = ({ onSuccess, onExit, isSignup = false }: PlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasOpened, setHasOpened] = useState<boolean>(false);
  const { token, phoneNumber } = useAuth();

  // Reset the initialization flag when the component mounts
  useEffect(() => {
    plaidLinkInitialized = false;
    return () => {
      plaidLinkInitialized = false;
    };
  }, []);

  const fetchLinkToken = useCallback(async () => {
    // If Plaid Link is already initialized, don't fetch a new token
    if (plaidLinkInitialized) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // For signup flow, we don't need JWT authentication
      if (isSignup) {
        // In a real app, you would call your backend API
        // For demo purposes, we're using a mock token
        try {
          // Try to get a real token from the backend
          if (token) {
            const data = await createLinkToken(token);
            setLinkToken(data.link_token);
          } else {
            throw new Error('No token available');
          }
        } catch (err) {
          console.log('Using mock token for demo purposes');
          // If that fails, use a mock token (for development only)
          setTimeout(() => {
            // This is a mock token for demo purposes
            // In a real app, you would get this from your backend
            setLinkToken('link-sandbox-mock-token');
            setIsLoading(false);
          }, 1000);
        }
        return;
      }

      // For authenticated users, use JWT token
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      // Call your backend API to get a link token
      const data = await createLinkToken(token);
      setLinkToken(data.link_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [token, phoneNumber, isSignup]);

  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  const handleSuccess = useCallback(
    (publicToken: string, metadata: any) => {
      console.log('Plaid Link success:', publicToken, metadata);
      // Mark as initialized when successfully used
      plaidLinkInitialized = true;
      onSuccess(publicToken, metadata);
    },
    [onSuccess]
  );

  const handleExit = useCallback(() => {
    console.log('Plaid Link exit');
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  const config = {
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
    // Add required Plaid configuration
    env: 'sandbox', // Change to 'development' or 'production' as needed
    product: ['auth', 'transactions'],
    countryCodes: ['US'],
    language: 'en',
  };

  // Only initialize Plaid Link if it hasn't been initialized yet
  const { open, ready } = usePlaidLink(config);

  const handleOpenPlaid = () => {
    console.log('Opening Plaid Link with token:', linkToken);
    console.log('Ready status:', ready);
    
    if (ready && linkToken) {
      setHasOpened(true);
      // This will open the Plaid Link interface
      open();
    } else {
      console.error('Plaid Link not ready or token missing');
    }
  };

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Error: {error}
        <button 
          onClick={fetchLinkToken}
          className="ml-4 text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpenPlaid}
      disabled={!ready || isLoading}
      className={`w-full bg-[#004977] hover:bg-[#003d66] text-white p-3 rounded-lg transition-colors flex items-center justify-center ${
        !ready || isLoading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <span>Link Bank Account</span>
      )}
    </button>
  );
};

export default PlaidLink; 