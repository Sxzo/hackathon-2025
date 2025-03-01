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
    token: localStorage.getItem('finn_auth_token'),
    phoneNumber: localStorage.getItem('finn_phone_number'),
    firstName: localStorage.getItem('finn_first_name'),
    lastName: localStorage.getItem('finn_last_name')
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = (token: string, phoneNumber: string, firstName: string, lastName: string) => {
    localStorage.setItem('finn_auth_token', token);
    localStorage.setItem('finn_phone_number', phoneNumber);
    localStorage.setItem('finn_first_name', firstName);
    localStorage.setItem('finn_last_name', lastName);
    setAuth({ token, phoneNumber, firstName, lastName });
  };

  const logout = () => {
    localStorage.removeItem('finn_auth_token');
    localStorage.removeItem('finn_phone_number');
    localStorage.removeItem('finn_first_name');
    localStorage.removeItem('finn_last_name');
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