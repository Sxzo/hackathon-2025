import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAccountStatus } from '../services/plaidService';
import PlaidLinkModal from './PlaidLinkModal';
import { exchangePublicToken } from '../services/plaidService';
import { FiRefreshCw } from 'react-icons/fi';

const BankAccountStatus: React.FC = () => {
  const [isPlaidConnected, setIsPlaidConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlaidModal, setShowPlaidModal] = useState<boolean>(false);
  const { token } = useAuth();

  // Function to check account status
  const checkAccountStatus = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAccountStatus(token);
      setIsPlaidConnected(response.plaid_connected);
    } catch (err) {
      setError('Failed to check account status');
      console.error('Error checking account status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check account status when component mounts or token changes
  useEffect(() => {
    checkAccountStatus();
  }, [token]);

  // Handle successful Plaid connection
  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      if (!token) return;
      await exchangePublicToken(publicToken, token);
      // Refresh account status after connecting
      checkAccountStatus();
      setShowPlaidModal(false);
    } catch (err) {
      setError('Failed to link bank account');
      console.error('Error linking bank account:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004977]"></div>
        <span className="ml-2">Checking account status...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#004977]">Bank Account Status</h2>
        <button 
          onClick={checkAccountStatus}
          className="text-gray-500 hover:text-[#004977] p-2 rounded-full"
          title="Refresh status"
        >
          <FiRefreshCw size={18} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
          <button 
            onClick={checkAccountStatus}
            className="ml-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {isPlaidConnected ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg">
          <p className="font-medium">Your bank account is connected!</p>
          <p className="text-sm mt-1">You can view your transactions and financial insights.</p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">
            Connect your bank account to get personalized financial insights and track your spending.
          </p>
          <button
            onClick={() => setShowPlaidModal(true)}
            className="bg-[#004977] hover:bg-[#003d66] text-white p-3 rounded-lg transition-colors w-full"
          >
            Connect Bank Account
          </button>
        </div>
      )}

      {/* Plaid Link Modal */}
      <PlaidLinkModal
        isOpen={showPlaidModal}
        onClose={() => setShowPlaidModal(false)}
        onSuccess={handlePlaidSuccess}
      />
    </div>
  );
};

export default BankAccountStatus;
