import axios from './axios';

export const tagsApi = {
  getAll: async () => {
    const response = await axios.get('/api/tags/');
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await axios.get(`/api/tags/slug/${slug}/`);
    return response.data;
  },

  getArticles: async (tagId: string, page: number = 1) => {
    const response = await axios.get(`/api/tags/${tagId}/articles/`, {
      params: { page },
    });
    return response.data;
  },

  create: async (data: { name: string; description: string }) => {
    const response = await axios.post('/api/tags/', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string }) => {
    const response = await axios.patch(`/api/tags/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await axios.delete(`/api/tags/${id}/`);
  },
};
