import axios from './axios';

export const categoriesApi = {
  getAll: async () => {
    const response = await axios.get('/api/categories/');
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await axios.get(`/api/categories/slug/${slug}/`);
    return response.data;
  },

  getArticles: async (categoryId: string, page: number = 1) => {
    const response = await axios.get(
      `/api/categories/${categoryId}/articles/`,
      {
        params: { page },
      }
    );
    return response.data;
  },

  create: async (data: { name: string; description: string }) => {
    const response = await axios.post('/api/categories/', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await axios.patch(`/api/categories/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await axios.delete(`/api/categories/${id}/`);
  },
};
