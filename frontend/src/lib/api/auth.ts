import { LoginResponse, User } from '@/types/login';
import axios from './axios';
import { tokenService } from './tokens';

export interface RegisterResponse {
  user: User;
  access: string;
  refresh: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post('/api/users/login/', {
        email,
        password,
      });

      if (response.data && response.data.access && response.data.refresh) {
        const { access, refresh } = response.data;
        tokenService.setTokens(access, refresh);
      }
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);

      throw error;
    }
  },

  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> => {
    try {
      const response = await axios.post('/api/users/register/', {
        name,
        email,
        password,
      });

      if (response.data && response.data.access && response.data.refresh) {
        tokenService.setTokens(response.data.access, response.data.refresh);
      }

      return response.data;
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },

  logout: () => {
    tokenService.clearTokens();
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await axios.get('/api/users/profile/');
      return response.data;
    } catch (error) {
      console.error('Get profile API error:', error);
      throw error;
    }
  },

  updateProfile: async (formData: FormData) => {
    try {
      const response = await axios.patch('/api/users/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Update profile API error:', error);
      throw error;
    }
  },

  requestPasswordReset: async (email: string) => {
    try {
      const response = await axios.post('/api/users/request-password-reset/', {
        email,
      });
      return response.data;
    } catch (error) {
      console.error('Password reset request API error:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await axios.post('/api/users/reset-password/', {
        token,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Reset password API error:', error);
      throw error;
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      const response = await axios.post('/api/users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Change password API error:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await axios.get('/api/users/');
      return response.data.results;
    } catch (error) {
      console.error('Get all users API error:', error);
      throw error;
    }
  },

  updateUser: async (
    userId: string,
    data: { role?: string; is_active?: boolean }
  ) => {
    try {
      const response = await axios.patch(`/api/users/${userId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Update user API error:', error);
      throw error;
    }
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      const response = await axios.post('/api/users/create/', data);
      return response.data;
    } catch (error) {
      console.error('Create user API error:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    try {
      await axios.delete(`/api/users/${userId}/`);
    } catch (error) {
      console.error('Delete user API error:', error);
      throw error;
    }
  },
};
