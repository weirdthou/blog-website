import axiosInstance from './axios';

export interface CommentData {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  flags_count: number;
  is_edited: boolean;
  user_like_status: 'like' | 'dislike' | null;
  user_has_flagged: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  } | null;
  replies?: CommentData[];
}

export interface CreateCommentData {
  content: string;
  article: string;
  parent?: string;
  user_name?: string;
  user_email?: string;
}

export interface CommentLikeData {
  is_like: boolean;
}

export interface CommentFlagData {
  reason:
    | 'spam'
    | 'harassment'
    | 'hate_speech'
    | 'inappropriate'
    | 'misinformation'
    | 'other';
  description?: string;
}

export const commentsApi = {
  // Get comments for an article
  getComments: async (articleId: string): Promise<CommentData[]> => {
    const response = await axiosInstance.get(
      `/api/comments/article/${articleId}/`
    );
    return response.data;
  },

  // Create a new comment
  createComment: async (data: CreateCommentData): Promise<CommentData> => {
    const response = await axiosInstance.post('/api/comments/create/', data);
    return response.data;
  },

  // Update a comment
  updateComment: async (
    commentId: string,
    data: Partial<CreateCommentData>
  ): Promise<CommentData> => {
    const response = await axiosInstance.patch(
      `/api/comments/${commentId}/`,
      data
    );
    return response.data;
  },

  // Delete a comment
  deleteComment: async (commentId: string): Promise<void> => {
    await axiosInstance.delete(`/api/comments/${commentId}/`);
  },

  // Like or dislike a comment
  likeComment: async (
    commentId: string,
    data: CommentLikeData
  ): Promise<{ action: string; comment: CommentData }> => {
    const response = await axiosInstance.post(
      `/api/comments/${commentId}/like/`,
      data
    );
    return response.data;
  },

  // Flag a comment
  flagComment: async (
    commentId: string,
    data: CommentFlagData
  ): Promise<{ message: string; flag: CommentFlagData }> => {
    const response = await axiosInstance.post(
      `/api/comments/${commentId}/flag/`,
      data
    );
    return response.data;
  },

  // Remove flag from a comment
  removeFlagFromComment: async (
    commentId: string
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(
      `/api/comments/${commentId}/flag/`
    );
    return response.data;
  },

  // Admin endpoints
  getPendingComments: async (): Promise<CommentData[]> => {
    const response = await axiosInstance.get('/api/comments/pending/');
    return response.data;
  },

  getFlaggedComments: async (): Promise<CommentData[]> => {
    const response = await axiosInstance.get('/api/comments/flagged/');
    return response.data;
  },

  approveComment: async (commentId: string): Promise<CommentData> => {
    const response = await axiosInstance.post(
      `/api/comments/${commentId}/approve/`
    );
    return response.data;
  },

  rejectComment: async (commentId: string): Promise<CommentData> => {
    const response = await axiosInstance.post(
      `/api/comments/${commentId}/reject/`
    );
    return response.data;
  },

  getRecentComments: async (): Promise<CommentData[]> => {
    const response = await axiosInstance.get('/api/comments/recent/');
    return response.data;
  },
};
