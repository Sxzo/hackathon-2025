import { useState, useEffect } from 'react';
import PlaidLink from './PlaidLink';
import { FiX } from 'react-icons/fi';

interface PlaidLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (publicToken: string, metadata: any) => void;
  isSignup?: boolean;
}

const PlaidLinkModal = ({ isOpen, onClose, onSuccess, isSignup = false }: PlaidLinkModalProps) => {
  const [isLinking, setIsLinking] = useState(false);
  const [showPlaidLink, setShowPlaidLink] = useState(false);
  const [plaidOpened, setPlaidOpened] = useState(false);

  // Control when to render the PlaidLink component to prevent multiple initializations
  useEffect(() => {
    if (isOpen && !isLinking) {
      // Only show PlaidLink when modal is open and not currently linking
      setShowPlaidLink(true);
      // Reset the plaidOpened state when the modal opens
      setPlaidOpened(false);
    } else if (!isOpen) {
      // When modal closes, wait a bit before unmounting PlaidLink to allow for cleanup
      const timer = setTimeout(() => {
        setShowPlaidLink(false);
        setPlaidOpened(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isLinking]);

  // Prevent closing the modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only prevent default if this is the actual backdrop (not a child element)
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      
      // If Plaid has been opened, don't show confirmation dialog
      if (!plaidOpened) {
        handleExit();
      }
    }
  };

  if (!isOpen) return null;

  const handleSuccess = (publicToken: string, metadata: any) => {
    console.log('PlaidLinkModal: Success callback received', publicToken);
    setIsLinking(true);
    // Call the parent's onSuccess handler
    onSuccess(publicToken, metadata);
  };

  const handleExit = () => {
    if (!isLinking) {
      // If Plaid has been opened, don't show confirmation dialog
      if (plaidOpened) {
        onClose();
        return;
      }
      
      // Show a confirmation dialog before closing
      if (window.confirm('Are you sure you want to skip linking your bank account? You can do this later from your dashboard.')) {
        onClose();
      }
    }
  };
  
  // This function will be called when the PlaidLink button is clicked
  const handlePlaidButtonClick = () => {
    console.log('PlaidLink button clicked');
    setPlaidOpened(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button 
          onClick={handleExit}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={isLinking}
          aria-label="Close"
        >
          <FiX size={24} />
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#004977] mb-2">Connect Your Bank</h2>
          <p className="text-gray-600">
            Link your bank account to get started with personalized financial insights.
          </p>
        </div>
        
        {isLinking ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004977] mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Connecting your account...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
          </div>
        ) : (
          // Only render PlaidLink when showPlaidLink is true
          showPlaidLink && (
            <div>
              <div 
                onClick={handlePlaidButtonClick} 
                className="w-full"
              >
                <PlaidLink 
                  onSuccess={handleSuccess} 
                  onExit={handleExit}
                  isSignup={isSignup}
                />
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={handleExit}
                  className="text-gray-500 hover:text-gray-700 text-sm underline"
                  disabled={isLinking}
                >
                  Skip for now
                </button>
              </div>
            </div>
          )
        )}
        
        <div className="mt-6 text-xs text-gray-500">
          <p>By connecting your account, you agree to our terms and privacy policy.</p>
          <p className="mt-2">Your data is encrypted and secure. We use Plaid to securely connect to your bank.</p>
        </div>
      </div>
    </div>
  );
};

export default PlaidLinkModal; 