import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  phoneNumber: string | null;
  login: (token: string, phoneNumber: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists in localStorage on initial load
    const storedToken = localStorage.getItem('finn_auth_token');
    const storedPhone = localStorage.getItem('finn_phone_number');
    
    if (storedToken) {
      setToken(storedToken);
      setPhoneNumber(storedPhone);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newPhoneNumber: string) => {
    localStorage.setItem('finn_auth_token', newToken);
    localStorage.setItem('finn_phone_number', newPhoneNumber);
    setToken(newToken);
    setPhoneNumber(newPhoneNumber);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('finn_auth_token');
    localStorage.removeItem('finn_phone_number');
    setToken(null);
    setPhoneNumber(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, phoneNumber, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 