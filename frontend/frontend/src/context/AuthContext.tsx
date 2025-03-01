import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  login: (token: string, phoneNumber: string, firstName: string, lastName: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthState {
  token: string | null;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('token'),
    phoneNumber: localStorage.getItem('phoneNumber'),
    firstName: localStorage.getItem('firstName'),
    lastName: localStorage.getItem('lastName')
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists in localStorage on initial load
    const storedToken = localStorage.getItem('finn_auth_token');
    const storedPhone = localStorage.getItem('finn_phone_number');
    
    if (storedToken) {
      setAuth({
        token: storedToken,
        phoneNumber: storedPhone,
        firstName: localStorage.getItem('firstName'),
        lastName: localStorage.getItem('lastName')
      });
    }
    
    setIsLoading(false);
  }, []);

  const login = (token: string, phoneNumber: string, firstName: string, lastName: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('phoneNumber', phoneNumber);
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
    setAuth({ token, phoneNumber, firstName, lastName });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    setAuth({ token: null, phoneNumber: null, firstName: null, lastName: null });
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!auth.token,
      token: auth.token,
      phoneNumber: auth.phoneNumber,
      firstName: auth.firstName,
      lastName: auth.lastName,
      login,
      logout,
      isLoading
    }}>
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