import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);


  const login = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/login", { username, password });
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/register", { username, password });
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await apiRequest("POST", "/api/logout");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}