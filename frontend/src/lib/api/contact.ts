import axios from './axios';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  replied: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  newsletter?: boolean;
}

export const contactApi = {
  submit: async (data: ContactFormData) => {
    const response = await axios.post('/api/contact/submit/', data);
    return response.data;
  },

  subscribeNewsletter: async (email: string) => {
    const response = await axios.post('/api/contact/', {
      name: 'Newsletter Subscriber',
      email: email,
      subject: 'Newsletter Subscription',
      message: 'Newsletter subscription only',
      newsletter: true,
    });
    return response.data;
  },

  getAll: async () => {
    const response = await axios.get('/api/contact/');
    return response.data;
  },

  reply: async (id: string, replyMessage: string) => {
    const response = await axios.post(`/api/contact/${id}/reply/`, {
      message: replyMessage,
    });
    return response.data;
  },

  delete: async (id: string) => {
    await axios.delete(`/api/contact/${id}/`);
  },
};
