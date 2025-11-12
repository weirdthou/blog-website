import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api/auth';
import { tokenService } from '@/lib/api/tokens';
import { User } from '@/types/login';
import { AxiosError } from 'axios';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { AuthContext } from './auth-context';

export interface AuthError {
  message: string;
  errors?: Record<string, string[]>;
}

interface ErrorResponse {
  detail?: string;
  errors?: Record<string, string[]>;
  non_field_errors?: string[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: AuthError }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: AuthError; user?: User }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadUser = useCallback(async () => {
    try {
      const token = tokenService.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      tokenService.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      if (error instanceof AxiosError) {
        const response = error.response?.data as ErrorResponse;

        const errorMessage =
          response?.detail ||
          (response?.non_field_errors && response.non_field_errors[0]) ||
          'Login failed';

        return {
          success: false,
          error: {
            message: errorMessage,
            errors: response?.errors,
          },
        };
      }
      return {
        success: false,
        error: { message: 'An unexpected error occurred' },
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.register(name, email, password);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      if (error instanceof AxiosError) {
        const response = error.response?.data as ErrorResponse;
        const errorMessage =
          response?.detail ||
          (response?.non_field_errors && response.non_field_errors[0]) ||
          'Registration failed';

        return {
          success: false,
          error: {
            message: errorMessage,
            errors: response?.errors,
          },
        };
      }
      return {
        success: false,
        error: { message: 'An unexpected error occurred' },
      };
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
