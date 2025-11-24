import axios from './axios';

export interface Author {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  role: string;
  article_count: number;
  join_date?: string;
  articles?: any[];
}

interface AuthorListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Author[];
}

export const authorsApi = {
  getAll: async (page: number = 1) => {
    const response = await axios.get<AuthorListResponse>(
      '/api/users/authors/',
      {
        params: { page },
      }
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axios.get<Author>(`/api/users/authors/${id}/`);
    return response.data;
  },
};
