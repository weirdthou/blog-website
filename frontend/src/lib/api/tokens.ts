import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenService = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },

  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  refreshAccessToken: async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refresh) throw new Error('No refresh token available');

    try {
      const response = await axios.post(`${API_URL}/api/users/refresh/`, {
        refresh,
      });
      localStorage.setItem(TOKEN_KEY, response.data.access);
      return response.data.access;
    } catch (error) {
      tokenService.clearTokens();
      throw error;
    }
  },
};
