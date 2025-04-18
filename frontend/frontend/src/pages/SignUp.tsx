import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiPhone, FiLock, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import PlaidLinkModal from '../components/PlaidLinkModal';
import { exchangePublicTokenSignup } from '../services/plaidService';
import CustomDropdown from '../components/CustomDropdown';

const API_URL = 'http://localhost:5001/api';

const SignUp = () => {
  const [step, setStep] = useState<'details' | 'verification' | 'plaid'>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPlaidModal, setShowPlaidModal] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Timezone options
  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' }
  ];

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !lastName) {
      setError('Please enter your full name');
      return;
    }
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/\D/g, '')}`,
          first_name: firstName,
          last_name: lastName,
          timezone: timezone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('verification');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/\D/g, '')}`,
          code: verificationCode,
          first_name: firstName,
          last_name: lastName,
          timezone: timezone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      if (data.authenticated && data.tokens) {
        login(
          data.tokens.access_token, 
          data.phone_number,
          data.first_name,
          data.last_name
        );
        setIsLoading(false);
        
        // Show Plaid modal immediately after successful verification
        setShowPlaidModal(true);
        // Set step to 'plaid' to indicate we're in the Plaid linking step
        setStep('plaid');
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    }
  };

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      console.log('SignUp: Plaid success callback received', publicToken, metadata);
      setIsLoading(true);
      
      // Exchange the public token for an access token
      const response = await exchangePublicTokenSignup(publicToken, phoneNumber);
      console.log('SignUp: Exchange public token response', response);
      
      // Close the modal and navigate to dashboard
      setShowPlaidModal(false);
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('SignUp: Error exchanging public token', err);
      setError('Failed to link your bank account. You can try again later from your dashboard.');
      setIsLoading(false);
      setTimeout(() => {
        setShowPlaidModal(false);
        navigate('/dashboard');
      }, 3000);
    }
  };

  const handleSkipPlaid = () => {
    // Show a confirmation dialog before skipping
    if (window.confirm('Are you sure you want to skip linking your bank account? You can do this later from your dashboard.')) {
      console.log('SignUp: User chose to skip Plaid');
      setShowPlaidModal(false);
      navigate('/dashboard');
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
  };

  const renderVerificationForm = () => (
    <form onSubmit={handleVerificationSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Verification Code
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock className="text-gray-400" />
          </div>
          <input
            id="code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977]"
            maxLength={6}
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter the 6-digit code sent to {phoneNumber}
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setStep('details')}
          className="text-[#004977] hover:text-[#003d66] text-sm font-medium"
        >
          Change details
        </button>
        
        <button
          type="button"
          onClick={() => {
            setError('');
            alert('Code resent!');
          }}
          className="text-[#004977] hover:text-[#003d66] text-sm font-medium"
        >
          Resend code
        </button>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-[#d03027] hover:bg-[#b02a23] text-white p-3 rounded-lg transition-colors flex items-center justify-center ${
          isLoading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </span>
        ) : (
          <span className="flex items-center">
            Verify & Continue <FiArrowRight className="ml-2" />
          </span>
        )}
      </button>
    </form>
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-20">
      <div className="container mx-auto p-4 flex justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 w-full max-w-md relative overflow-hidden">
          <h1 className="text-2xl font-bold mb-6 text-[#004977]">
            {step === 'details' ? 'Create your account' : 'Verify your phone'}
          </h1>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          {step === 'details' ? (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="(555) 123-4567"
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004977] focus:border-[#004977]"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll send a verification code to this number
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Time Zone
                </label>
                <CustomDropdown
                  options={timezoneOptions}
                  value={timezone}
                  onChange={setTimezone}
                  className="bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select your local time zone for notifications
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#d03027] hover:bg-[#b02a23] text-white p-3 rounded-lg transition-colors flex items-center justify-center ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Code...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Continue <FiArrowRight className="ml-2" />
                  </span>
                )}
              </button>
            </form>
          ) : (
            renderVerificationForm()
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#004977] hover:text-[#003d66] font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-4">
              By signing up, you agree to our{' '}
              <a href="#" className="text-[#004977] hover:text-[#003d66] font-medium">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#004977] hover:text-[#003d66] font-medium">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Plaid Link Modal */}
      <PlaidLinkModal
        isOpen={showPlaidModal}
        onClose={handleSkipPlaid}
        onSuccess={handlePlaidSuccess}
        isSignup={true}
      />
    </div>
  );
};

export default SignUp; 