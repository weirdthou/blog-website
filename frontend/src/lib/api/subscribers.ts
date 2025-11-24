import axios from 'axios';

export interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

import authenticatedAxios from './axios';

export const subscribersApi = {
  subscribe: async (email: string) => {
    const response = await publicAxios.post('/api/subscribers/', { email });
    return response.data;
  },

  getAll: async () => {
    const response = await authenticatedAxios.get('/api/subscribers/');
    return response.data;
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    const response = await authenticatedAxios.patch(`/api/subscribers/${id}/`, {
      is_active: isActive,
    });
    return response.data;
  },

  delete: async (id: string) => {
    await authenticatedAxios.delete(`/api/subscribers/${id}/`);
  },

  exportList: async () => {
    const response = await axios.get('/api/subscribers/export/', {
      responseType: 'blob',
    });
    return response.data;
  },
};
