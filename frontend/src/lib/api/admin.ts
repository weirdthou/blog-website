import axios from './axios';

interface UserData {
  username: string;
  email: string;
  password?: string;
  role?: 'user' | 'admin';
  is_active?: boolean;
}

interface ArticleData {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'published';
  categories?: string[];
  tags?: string[];
  featured_image?: File;
  is_featured?: boolean;
}

interface MessageData {
  status?: 'new' | 'in-progress' | 'resolved' | 'archived';
  notes?: string;
  assigned_to?: string;
}

interface CategoryData {
  name: string;
  slug?: string;
  description?: string;
}

interface TagData {
  name: string;
  slug?: string;
  description?: string;
}

export const adminApi = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await axios.get('/api/admin/dashboard/');
    return response.data;
  },

  // Quick Actions
  quickArticleAction: async (
    articleId: number,
    action: 'approve' | 'reject'
  ) => {
    const response = await axios.post(
      `/api/admin/articles/${articleId}/quick-action/`,
      {
        action,
      }
    );
    return response.data;
  },

  bulkArticleAction: async (
    articleIds: number[],
    action: 'approve' | 'reject'
  ) => {
    const response = await axios.post('/api/admin/articles/bulk-action/', {
      article_ids: articleIds,
      action,
    });
    return response.data;
  },

  // Users
  getUsers: async () => {
    const response = await axios.get('/api/admin/users/');
    return response.data;
  },

  createUser: async (data: UserData) => {
    const response = await axios.post('/api/admin/users/', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<UserData>) => {
    const response = await axios.patch(`/api/admin/users/${id}/`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    await axios.delete(`/api/admin/users/${id}/`);
  },

  banUser: async (id: string) => {
    const response = await axios.post(`/api/admin/users/${id}/ban/`);
    return response.data;
  },

  promoteUser: async (id: string) => {
    const response = await axios.post(`/api/admin/users/${id}/promote/`);
    return response.data;
  },

  // Articles
  getArticles: async () => {
    const response = await axios.get('/api/admin/articles/');
    return response.data;
  },

  createArticle: async (data: FormData) => {
    const response = await axios.post('/api/admin/articles/', data);
    return response.data;
  },

  updateArticle: async (id: string, data: Partial<ArticleData>) => {
    const response = await axios.patch(`/api/admin/articles/${id}/`, data);
    return response.data;
  },

  deleteArticle: async (id: string) => {
    await axios.delete(`/api/admin/articles/${id}/`);
  },

  publishArticle: async (id: string) => {
    const response = await axios.post(`/api/admin/articles/${id}/publish/`);
    return response.data;
  },

  unpublishArticle: async (id: string) => {
    const response = await axios.post(`/api/admin/articles/${id}/unpublish/`);
    return response.data;
  },

  featureArticle: async (id: string) => {
    const response = await axios.post(`/api/admin/articles/${id}/feature/`);
    return response.data;
  },

  // Messages
  getMessages: async () => {
    const response = await axios.get('/api/admin/messages/');
    return response.data;
  },

  updateMessage: async (id: string, data: MessageData) => {
    const response = await axios.patch(`/api/admin/messages/${id}/`, data);
    return response.data;
  },

  deleteMessage: async (id: string) => {
    await axios.delete(`/api/admin/messages/${id}/`);
  },

  markMessageAsRead: async (id: string) => {
    const response = await axios.post(`/api/admin/messages/${id}/read/`);
    return response.data;
  },

  markMessageAsReplied: async (id: string) => {
    const response = await axios.post(`/api/admin/messages/${id}/replied/`);
    return response.data;
  },

  addMessageNote: async (id: string, note: string) => {
    const response = await axios.post(`/api/admin/messages/${id}/note/`, {
      note,
    });
    return response.data;
  },

  // Subscribers
  getSubscribers: async () => {
    const response = await axios.get('/api/admin/subscribers/');
    return response.data;
  },

  deleteSubscriber: async (id: string) => {
    await axios.delete(`/api/admin/subscribers/${id}/`);
  },

  exportSubscribers: async () => {
    const response = await axios.get('/api/admin/subscribers/export/', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await axios.get('/api/admin/categories/');
    return response.data;
  },

  createCategory: async (data: CategoryData) => {
    const response = await axios.post('/api/admin/categories/', data);
    return response.data;
  },

  updateCategory: async (id: string, data: Partial<CategoryData>) => {
    const response = await axios.patch(`/api/admin/categories/${id}/`, data);
    return response.data;
  },

  deleteCategory: async (id: string) => {
    await axios.delete(`/api/admin/categories/${id}/`);
  },

  // Tags
  getTags: async () => {
    const response = await axios.get('/api/admin/tags/');
    return response.data;
  },

  createTag: async (data: TagData) => {
    const response = await axios.post('/api/admin/tags/', data);
    return response.data;
  },

  updateTag: async (id: string, data: Partial<TagData>) => {
    const response = await axios.patch(`/api/admin/tags/${id}/`, data);
    return response.data;
  },

  deleteTag: async (id: string) => {
    await axios.delete(`/api/admin/tags/${id}/`);
  },
};
